// Cloudflare Durable Object: the authoritative game server.
// - Persists all houses, accounts and tokens to storage (survives hibernation).
// - Token + username/password auth with reconnect resume and full progress restore.

import { assignToHouse, removeMember, roster, MAX_HOUSE_SIZE } from '../server/houseManager';
import { advanceHouse, publicState } from '../server/gameState';
import { authenticate } from '../server/session';
import { signup, login, saveProfile, saveState } from '../server/accounts';
import { serializeHouses, deserializeHouses, stripWs } from '../server/persist';
import type { Accounts, GameMember, House, Tokens } from '../server/types';

export class GameServer {
  ctx: any;
  env: any;
  houses: House[] = [];
  tokens: Tokens = {};
  accounts: Accounts = {};
  sessions = new Map<any, { memberId: string; houseId: string }>();
  loaded = false;

  constructor(state: any, env: any) {
    this.ctx = state;
    this.env = env;

    state.blockConcurrencyWhile(async () => {
      this.houses = deserializeHouses(await state.storage.get('houses'));
      this.tokens = (await state.storage.get('tokens')) || {};
      this.accounts = (await state.storage.get('accounts')) || {};
      this.loaded = true;
    });
  }

  async persist() {
    if (!this.loaded) return;
    await this.ctx.storage.put('houses', serializeHouses(this.houses));
    await this.ctx.storage.put('tokens', this.tokens);
    await this.ctx.storage.put('accounts', this.accounts);
  }

  async fetch(request: Request) {
    const pair = new (globalThis as any).WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client } as any);
  }

  send(ws: any, msg: unknown) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* ignore closed socket */
    }
  }

  broadcast(house: House, msg: unknown, exceptWs?: any) {
    for (const member of house.members.values()) {
      if (member.__ws && member.__ws !== exceptWs) {
        this.send(member.__ws, msg);
      }
    }
  }

  findHouse(houseId: string) {
    return this.houses.find((h) => h.id === houseId);
  }

  findMember(id: string): GameMember | null {
    for (const h of this.houses) {
      const m = h.members.get(id);
      if (m) return m;
    }
    return null;
  }

  findHouseByMember(id: string): House | null {
    return this.houses.find((h) => h.members.has(id)) ?? null;
  }

  findAccountByPlayerId(playerId: string) {
    return Object.values(this.accounts).find((a) => a.playerId === playerId);
  }

  houseInfo(house: House) {
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

  async webSocketMessage(ws: any, raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const session = this.sessions.get(ws);

    switch (msg.type) {
      case 'SIGNUP': {
        const res = await signup(this.accounts, this.tokens, msg.username, msg.password, msg.email);
        if ('error' in res && res.error) this.send(ws, { type: 'AUTH_ERROR', reason: res.error });
        else {
          this.send(ws, { type: 'AUTH_OK', ...res });
          await this.persist();
        }
        return;
      }

      case 'LOGIN': {
        const res = await login(this.accounts, this.tokens, msg.username, msg.password);
        if ('error' in res && res.error) this.send(ws, { type: 'AUTH_ERROR', reason: res.error });
        else {
          this.send(ws, { type: 'AUTH_OK', ...res });
          await this.persist();
        }
        return;
      }

      case 'SAVE_PROFILE': {
        const res = saveProfile(this.accounts, msg.token, msg.playerId, msg.profile);
        if ('error' in res && res.error) this.send(ws, { type: 'AUTH_ERROR', reason: res.error });
        else {
          this.send(ws, { type: 'PROFILE_SAVED', profile: (res as any).profile });
          await this.persist();
        }
        return;
      }

      case 'SAVE_STATE': {
        const res = saveState(this.accounts, msg.token, msg.playerId, msg.state);
        if ('error' in res && res.error) this.send(ws, { type: 'AUTH_ERROR', reason: res.error });
        else {
          if (session) {
            const house = this.findHouse(session.houseId);
            const member = house?.members.get(session.memberId);
            if (member) this.applyStateToMember(member, msg.state);
          }
          this.send(ws, { type: 'STATE_SAVED' });
          await this.persist();
        }
        return;
      }

      case 'JOIN': {
        const playerId = String(msg.player?.id || `p-${Math.random().toString(36).slice(2, 9)}`);
        const auth = authenticate(this.tokens, playerId, msg.token);

        if (auth.status === 'reject') {
          this.send(ws, { type: 'AUTH_ERROR', reason: 'identity token mismatch' });
          return;
        }

        if (auth.status === 'resume') {
          const existing = this.findMember(playerId);
          if (existing) {
            Object.assign(existing, this.playerFields(msg.player), { __ws: ws });
            const house = this.findHouseByMember(playerId);
            if (house) {
              this.sessions.set(ws, { memberId: playerId, houseId: house.id });
              this.send(ws, { type: 'WELCOME', house: this.houseInfo(house), selfId: playerId, token: auth.token });
              this.broadcast(house, { type: 'MEMBER_JOINED', member: stripWs(existing) }, ws);
              return;
            }
          }
        }

        const member: GameMember = {
          id: playerId,
          ...this.playerFields(msg.player),
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

        const acc = this.findAccountByPlayerId(playerId);
        if (acc?.playerState) this.applyStateToMember(member, acc.playerState);

        const house = assignToHouse(this.houses, member);
        this.sessions.set(ws, { memberId: playerId, houseId: house.id });
        this.send(ws, { type: 'WELCOME', house: this.houseInfo(house), selfId: playerId, token: auth.token });
        this.broadcast(house, { type: 'MEMBER_JOINED', member: stripWs(member) }, ws);
        await this.persist();
        return;
      }

      case 'MOVE': {
        if (!session) return;
        const house = this.findHouse(session.houseId);
        const member = house?.members.get(session.memberId);
        if (!house || !member) return;
        member.x = msg.x ?? member.x;
        member.z = msg.z ?? member.z;
        member.currentRoom = msg.room ?? member.currentRoom;
        this.broadcast(house, { type: 'MOVE', memberId: member.id, x: member.x, z: member.z, room: member.currentRoom }, ws);
        return;
      }

      case 'CHAT': {
        if (!session) return;
        const house = this.findHouse(session.houseId);
        const member = house?.members.get(session.memberId);
        if (!house || !member) return;
        this.broadcast(house, {
          type: 'CHAT',
          senderId: member.id,
          senderName: member.nickname,
          senderAvatar: member.avatar,
          text: String(msg.text || '').slice(0, 280),
          ts: Date.now(),
        });
        return;
      }

      case 'ACTION': {
        if (!session) return;
        const house = this.findHouse(session.houseId);
        const member = house?.members.get(session.memberId);
        if (!house || !member) return;
        this.broadcast(house, {
          type: 'ACTION',
          memberId: member.id,
          memberName: member.nickname,
          description: String(msg.description || '').slice(0, 280),
        });
        return;
      }

      case 'HOH_SCORE': {
        if (!session) return;
        const house = this.findHouse(session.houseId);
        if (!house) return;
        house.state.scores[session.memberId] = Math.max(0, Math.min(6, Number(msg.score) || 0));
        await this.persist();
        return;
      }

      case 'NOMINATE': {
        if (!session) return;
        const house = this.findHouse(session.houseId);
        if (!house) return;
        const picks = Array.isArray(msg.picks) ? msg.picks.slice(0, 2) : [];
        house.state.votes[session.memberId] = picks;
        await this.persist();
        return;
      }

      case 'STATS': {
        if (!session) return;
        const house = this.findHouse(session.houseId);
        const member = house?.members.get(session.memberId);
        if (!house || !member) return;
        this.applyStateToMember(member, msg);
        return;
      }

      case 'ADVANCE': {
        if (!session) return;
        const house = this.findHouse(session.houseId);
        if (!house) return;
        advanceHouse(house);
        this.broadcast(house, { type: 'STATE', state: publicState(house) });
        await this.persist();
        return;
      }

      default:
        return;
    }
  }

  playerFields(p: any) {
    return {
      nickname: p?.nickname || 'Housemate',
      avatar: p?.avatar || '😎',
      accentColor: p?.accentColor || '#e63946',
      skinTone: p?.skinTone || '#c98a5b',
      hairstyle: p?.hairstyle || 'lowcut',
      profession: p?.profession || 'Musician & Vibe Machine',
      trait: p?.trait || 'Strategic Schemer',
      gender: p?.gender || 'F',
      age: p?.age || 25,
      stateOfOrigin: p?.stateOfOrigin || 'Lagos',
      fanbaseClout: p?.fanbaseClout || 12000,
      bbCoins: p?.bbCoins || 2000,
      strikes: p?.strikes || 0,
    };
  }

  applyStateToMember(member: GameMember, s: any) {
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

  async webSocketClose(ws: any) {
    const session = this.sessions.get(ws);
    if (!session) return;
    const house = this.findHouse(session.houseId);
    if (house) {
      removeMember(house, session.memberId);
      this.broadcast(house, { type: 'MEMBER_LEFT', memberId: session.memberId });
      if (house.members.size === 0) {
        const idx = this.houses.indexOf(house);
        if (idx >= 0) this.houses.splice(idx, 1);
      }
      await this.persist();
    }
    this.sessions.delete(ws);
  }
}
