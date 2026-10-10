// Biggie's House — multiplayer game server (Node dev server).
// Implements house sharding (max 20 live players per house, overflow to a new
// house) with AI backfill, plus real-time presence, movement, chat and the
// shared weekly timeline.

import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';
import { assignToHouse, roster, removeMember, MAX_HOUSE_SIZE } from './houseManager';
import { advanceHouse, publicState } from './gameState';
import { authenticate } from './session';
import { signup, login, saveProfile, saveState } from './accounts';
import type { Accounts, GameMember, House, Tokens } from './types';

const PORT = Number(process.env.PORT) || 3001;

const houses: House[] = [];
// ws -> { memberId, houseId }
const sessions = new Map<WebSocket, { memberId: string; houseId: string }>();
// playerId -> token (in-memory for local dev; persisted in the Worker DO)
const tokens: Tokens = {};
// username -> account (in-memory for local dev; persisted in the Worker DO)
const accounts: Accounts = {};

function totalPlayers() {
  return houses.reduce((n, h) => n + h.members.size, 0);
}

function findHouse(houseId: string) {
  return houses.find((h) => h.id === houseId);
}

function findMember(id: string): GameMember | null {
  for (const h of houses) {
    const m = h.members.get(id);
    if (m) return m;
  }
  return null;
}

function findHouseByMember(id: string): House | null {
  return houses.find((h) => h.members.has(id)) ?? null;
}

function findAccountByPlayerId(playerId: string) {
  return Object.values(accounts).find((a) => a.playerId === playerId);
}

function send(ws: WebSocket, msg: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(house: House, msg: unknown, exceptWs?: WebSocket) {
  for (const member of house.members.values()) {
    const sock = member.__ws as WebSocket | undefined;
    if (sock && sock !== exceptWs && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify(msg));
    }
  }
}

function publicMember(m: GameMember): GameMember {
  const { __ws, ...rest } = m;
  return rest as GameMember;
}

function houseInfo(house: House) {
  return {
    id: house.id,
    name: house.name,
    maxSize: MAX_HOUSE_SIZE,
    liveCount: house.members.size,
    aiCount: house.aiMembers.length,
    roster: roster(house).map((m) => ({ ...m, relationships: undefined, __ws: undefined })),
    state: publicState(house),
  };
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, houses: houses.length, players: totalPlayers() }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

const wss = new WebSocketServer({ server });

// Heartbeat: detect and clean up dead connections (mobile players drop often).
const heartbeat = setInterval(() => {
  for (const ws of wss.clients as Set<WebSocket & { isAlive?: boolean }>) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

wss.on('connection', (ws: WebSocket & { isAlive?: boolean }) => {
  let session: { memberId: string; houseId: string } | null = null;
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'SIGNUP': {
        const res = await signup(accounts, tokens, msg.username, msg.password, msg.email);
        if ('error' in res && res.error) send(ws, { type: 'AUTH_ERROR', reason: res.error });
        else send(ws, { type: 'AUTH_OK', ...res });
        break;
      }

      case 'LOGIN': {
        const res = await login(accounts, tokens, msg.username, msg.password);
        if ('error' in res && res.error) send(ws, { type: 'AUTH_ERROR', reason: res.error });
        else send(ws, { type: 'AUTH_OK', ...res });
        break;
      }

      case 'SAVE_PROFILE': {
        const res = saveProfile(accounts, msg.token, msg.playerId, msg.profile);
        if ('error' in res && res.error) send(ws, { type: 'AUTH_ERROR', reason: res.error });
        else send(ws, { type: 'PROFILE_SAVED', profile: (res as any).profile });
        break;
      }

      case 'SAVE_STATE': {
        const res = saveState(accounts, msg.token, msg.playerId, msg.state);
        if ('error' in res && res.error) send(ws, { type: 'AUTH_ERROR', reason: res.error });
        else {
          // Also update the live member so shared evictions use current stats.
          if (session) {
            const house = findHouse(session.houseId);
            const member = house?.members.get(session.memberId);
            if (member) applyStateToMember(member, msg.state);
          }
          send(ws, { type: 'STATE_SAVED' });
        }
        break;
      }

      case 'JOIN': {
        const playerId = String(msg.player?.id || `p-${Math.random().toString(36).slice(2, 9)}`);
        const auth = authenticate(tokens, playerId, msg.token);

        if (auth.status === 'reject') {
          send(ws, { type: 'AUTH_ERROR', reason: 'identity token mismatch' });
          return;
        }

        if (auth.status === 'resume') {
          const existing = findMember(playerId);
          if (existing) {
            Object.assign(existing, {
              nickname: msg.player.nickname ?? existing.nickname,
              avatar: msg.player.avatar ?? existing.avatar,
              accentColor: msg.player.accentColor ?? existing.accentColor,
              skinTone: msg.player.skinTone ?? existing.skinTone,
              hairstyle: msg.player.hairstyle ?? existing.hairstyle,
              profession: msg.player.profession ?? existing.profession,
              trait: msg.player.trait ?? existing.trait,
              fanbaseClout: msg.player.fanbaseClout ?? existing.fanbaseClout,
              bbCoins: msg.player.bbCoins ?? existing.bbCoins,
              __ws: ws,
            });
            const house = findHouseByMember(playerId);
            if (house) {
              session = { memberId: playerId, houseId: house.id };
              sessions.set(ws, session);
              send(ws, { type: 'WELCOME', house: houseInfo(house), selfId: playerId, token: auth.token });
              broadcast(house, { type: 'MEMBER_JOINED', member: publicMember(existing) }, ws);
              return;
            }
          }
        }

        const member: GameMember = {
          id: playerId,
          nickname: msg.player.nickname || 'Housemate',
          avatar: msg.player.avatar || '😎',
          accentColor: msg.player.accentColor || '#e63946',
          skinTone: msg.player.skinTone || '#c98a5b',
          hairstyle: msg.player.hairstyle || 'lowcut',
          profession: msg.player.profession || 'Musician & Vibe Machine',
          trait: msg.player.trait || 'Strategic Schemer',
          gender: msg.player.gender || 'F',
          age: msg.player.age || 25,
          stateOfOrigin: msg.player.stateOfOrigin || 'Lagos',
          fanbaseClout: msg.player.fanbaseClout || 12000,
          bbCoins: msg.player.bbCoins || 2000,
          strikes: 0,
          status: 'active',
          isHoH: false,
          isImmune: false,
          isNominated: false,
          isHuman: true,
          currentRoom: 'Lounge',
          x: -16,
          z: 4,
          __ws: ws,
        };

        // Restore saved progress (clout, needs, relationships) from the account.
        const acc = findAccountByPlayerId(playerId);
        if (acc?.playerState) applyStateToMember(member, acc.playerState);

        const house = assignToHouse(houses, member);
        session = { memberId: member.id, houseId: house.id };
        sessions.set(ws, session);

        send(ws, { type: 'WELCOME', house: houseInfo(house), selfId: member.id, token: auth.token });
        broadcast(house, { type: 'MEMBER_JOINED', member: publicMember(member) }, ws);
        break;
      }

      case 'MOVE': {
        if (!session) return;
        const house = findHouse(session.houseId);
        const member = house?.members.get(session.memberId);
        if (!house || !member) return;
        member.x = msg.x ?? member.x;
        member.z = msg.z ?? member.z;
        member.currentRoom = msg.room ?? member.currentRoom;
        broadcast(house, { type: 'MOVE', memberId: member.id, x: member.x, z: member.z, room: member.currentRoom }, ws);
        break;
      }

      case 'CHAT': {
        if (!session) return;
        const house = findHouse(session.houseId);
        const member = house?.members.get(session.memberId);
        if (!house || !member) return;
        broadcast(house, {
          type: 'CHAT',
          senderId: member.id,
          senderName: member.nickname,
          senderAvatar: member.avatar,
          text: String(msg.text || '').slice(0, 280),
          ts: Date.now(),
        });
        break;
      }

      case 'ACTION': {
        if (!session) return;
        const house = findHouse(session.houseId);
        const member = house?.members.get(session.memberId);
        if (!house || !member) return;
        broadcast(house, {
          type: 'ACTION',
          memberId: member.id,
          memberName: member.nickname,
          description: String(msg.description || '').slice(0, 280),
        });
        break;
      }

      case 'HOH_SCORE': {
        if (!session) return;
        const house = findHouse(session.houseId);
        if (!house) return;
        house.state.scores[session.memberId] = Number(msg.score) || 0;
        break;
      }

      case 'NOMINATE': {
        if (!session) return;
        const house = findHouse(session.houseId);
        if (!house) return;
        const picks = Array.isArray(msg.picks) ? msg.picks.slice(0, 2) : [];
        house.state.votes[session.memberId] = picks;
        break;
      }

      case 'STATS': {
        if (!session) return;
        const house = findHouse(session.houseId);
        const member = house?.members.get(session.memberId);
        if (!house || !member) return;
        applyStateToMember(member, msg);
        break;
      }

      case 'ADVANCE': {
        if (!session) return;
        const house = findHouse(session.houseId);
        if (!house) return;
        advanceHouse(house);
        broadcast(house, { type: 'STATE', state: publicState(house) });
        break;
      }

      case 'PING':
        send(ws, { type: 'PONG' });
        break;
    }
  });

  ws.on('close', () => {
    if (!session) return;
    const house = findHouse(session.houseId);
    if (house) {
      removeMember(house, session.memberId);
      broadcast(house, { type: 'MEMBER_LEFT', memberId: session.memberId });
      if (house.members.size === 0) {
        const idx = houses.indexOf(house);
        if (idx >= 0) houses.splice(idx, 1);
      }
    }
    sessions.delete(ws);
  });
});

function applyStateToMember(member: GameMember, s: any) {
  if (typeof s.fanbaseClout === 'number') {
    const prev = member.fanbaseClout;
    const next = Math.max(0, Math.min(10_000_000, s.fanbaseClout));
    member.fanbaseClout = Math.abs(next - prev) > 5000 ? prev + Math.sign(next - prev) * 5000 : next;
  }
  if (typeof s.bbCoins === 'number') member.bbCoins = Math.max(0, Math.min(10_000_000, s.bbCoins));
  if (typeof s.strikes === 'number') member.strikes = Math.max(0, Math.min(3, s.strikes));
  if (typeof s.energy === 'number') member.energy = Math.max(0, Math.min(100, s.energy));
  if (typeof s.sanity === 'number') member.sanity = Math.max(0, Math.min(100, s.sanity));
  if (typeof s.hunger === 'number') member.hunger = Math.max(0, Math.min(100, s.hunger));
  if (typeof s.houseStanding === 'number') member.houseStanding = Math.max(0, Math.min(100, s.houseStanding));
  if (s.relationships && typeof s.relationships === 'object') member.relationships = s.relationships;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏠 Biggie's House server listening on http://0.0.0.0:${PORT}`);
});
