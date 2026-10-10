// WebSocket client for Biggie's House multiplayer.
// Handles account auth (signup/login), avatar profile persistence, and the
// live game (house sharding, presence, shared timeline, chat).

import { useNet } from './net';

const TOKEN_KEY = 'biggie-house-token';

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export interface JoinInfo {
  id: string;
  nickname: string;
  avatar: string;
  accentColor: string;
  skinTone?: string;
  hairstyle?: string;
  profession: string;
  trait: string;
  gender: string;
  age: number;
  stateOfOrigin: string;
  fanbaseClout: number;
  bbCoins: number;
}

export interface RosterMember {
  id: string;
  nickname: string;
  avatar: string;
  accentColor: string;
  skinTone?: string;
  hairstyle?: string;
  profession: string;
  trait: string;
  gender: string;
  age: number;
  stateOfOrigin: string;
  bio?: string;
  fanbaseClout: number;
  bbCoins: number;
  strikes: number;
  status: string;
  isHoH: boolean;
  isImmune: boolean;
  isNominated: boolean;
  isHuman: boolean;
  currentRoom: string;
}

interface PendingAuth {
  resolve: (v: any) => void;
  reject: (e: Error) => void;
}

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private onWelcome: ((roster: RosterMember[], houseName: string, selfId: string) => void) | null = null;
  private onState: ((state: any) => void) | null = null;
  private onDisconnect: (() => void) | undefined = undefined;
  private pendingAuth: PendingAuth | null = null;
  private pendingJoin: JoinInfo | null = null;
  private manualClose = false;

  public connect(opts: {
    onWelcome?: (roster: RosterMember[], houseName: string, selfId: string) => void;
    onState?: (state: any) => void;
    onDisconnect?: () => void;
    join?: JoinInfo;
  }) {
    this.onWelcome = opts.onWelcome ?? null;
    this.onState = opts.onState ?? null;
    this.onDisconnect = opts.onDisconnect;
    this.pendingJoin = opts.join ?? null;
    this.manualClose = false;
    this.open();
  }

  public join(joinInfo: JoinInfo) {
    this.pendingJoin = joinInfo;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'JOIN', player: joinInfo, token: getToken() });
      this.pendingJoin = null;
    }
  }

  private open() {
    // WebSocket endpoint resolution:
    //  1. VITE_WS_URL env override (e.g. wss://biggie-house.<sub>.workers.dev/ws)
    //  2. same-origin wss when served over https (Cloudflare Worker)
    //  3. local Node dev server on :3001/ws
    const envUrl = (import.meta as any).env?.VITE_WS_URL as string | undefined;
    let url: string;
    if (envUrl) {
      url = envUrl;
    } else if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      url = `wss://${window.location.host}/ws`;
    } else {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      url = `ws://${host}:3001/ws`;
    }

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      useNet.setState({ connected: true });
      if (this.pendingJoin) {
        this.send({ type: 'JOIN', player: this.pendingJoin, token: getToken() });
        this.pendingJoin = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        this.handle(JSON.parse(event.data));
      } catch {
        /* ignore malformed */
      }
    };

    this.ws.onclose = () => {
      useNet.setState({ connected: false });
      if (!this.manualClose) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      /* onclose will fire */
    };
  }

  // --- Auth (request/response) ---
  public signup(username: string, password: string, email?: string): Promise<any> {
    return this.authRequest({ type: 'SIGNUP', username, password, email });
  }

  public login(username: string, password: string): Promise<any> {
    return this.authRequest({ type: 'LOGIN', username, password });
  }

  public saveProfile(token: string, playerId: string, profile: any): Promise<any> {
    return this.authRequest({ type: 'SAVE_PROFILE', token, playerId, profile });
  }

  private authRequest(msg: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Ensure connected first
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.pendingAuth = { resolve, reject };
        this.connect({ join: undefined });
        const wait = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            clearInterval(wait);
            this.pendingAuth = { resolve, reject };
            this.send(msg);
            setTimeout(() => this.failPendingAuth(), 8000);
          }
        }, 100);
        return;
      }
      this.pendingAuth = { resolve, reject };
      this.send(msg);
      setTimeout(() => this.failPendingAuth(), 8000);
    });
  }

  private failPendingAuth() {
    if (this.pendingAuth) {
      this.pendingAuth.reject(new Error('auth request timed out'));
      this.pendingAuth = null;
    }
  }

  // --- Real-time game messages ---
  public sendMove(x: number, z: number, room: string) {
    const now = Date.now();
    if (now - this.lastMoveSent < 100) {
      this.moveBuffer = { x, z, room };
      return;
    }
    this.lastMoveSent = now;
    const payload = this.moveBuffer ?? { x, z, room };
    this.moveBuffer = null;
    this.send({ type: 'MOVE', ...payload });
  }

  public sendChat(text: string) {
    this.send({ type: 'CHAT', text });
  }

  public sendAction(description: string) {
    this.send({ type: 'ACTION', description });
  }

  public sendHoHScore(score: number) {
    this.send({ type: 'HOH_SCORE', score });
  }

  public sendNominations(picks: string[]) {
    this.send({ type: 'NOMINATE', picks });
  }

  public sendAdvance() {
    this.send({ type: 'ADVANCE' });
  }

  public sendStats(fanbaseClout: number, bbCoins: number, strikes: number) {
    this.send({ type: 'STATS', fanbaseClout, bbCoins, strikes });
  }

  public sendState(playerId: string, state: any) {
    this.send({ type: 'SAVE_STATE', token: getToken(), playerId, state });
  }

  public disconnect() {
    this.manualClose = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
    this.onDisconnect?.();
  }

  private send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.open(), 3000);
  }

  private lastMoveSent = 0;
  private moveBuffer: { x: number; z: number; room: string } | null = null;

  private handle(msg: any) {
    switch (msg.type) {
      case 'AUTH_OK': {
        if (msg.token) saveToken(msg.token);
        this.pendingAuth?.resolve(msg);
        this.pendingAuth = null;
        break;
      }
      case 'AUTH_ERROR': {
        this.pendingAuth?.reject(new Error(msg.reason || 'Authentication failed'));
        this.pendingAuth = null;
        break;
      }
      case 'PROFILE_SAVED': {
        this.pendingAuth?.resolve(msg);
        this.pendingAuth = null;
        break;
      }

      case 'WELCOME': {
        if (msg.token) saveToken(msg.token);
        useNet.setState({
          houseId: msg.house.id,
          houseName: msg.house.name,
          selfId: msg.selfId,
          liveCount: msg.house.liveCount,
          aiCount: msg.house.aiCount,
          houseState: msg.house.state ?? null,
        });
        const remote = (msg.house.roster as RosterMember[])
          .filter((m) => m.id !== msg.selfId)
          .filter((m) => m.isHuman)
          .reduce<Record<string, any>>((acc, m) => {
            acc[m.id] = {
              id: m.id,
              nickname: m.nickname,
              avatar: m.avatar,
              accentColor: m.accentColor,
              skinTone: m.skinTone ?? '#c98a5b',
              hairstyle: m.hairstyle ?? 'lowcut',
              profession: m.profession,
              trait: m.trait,
              x: -16,
              z: 4,
              room: m.currentRoom ?? 'Lounge',
            };
            return acc;
          }, {});
        useNet.setState({ remotePlayers: remote });
        this.onWelcome?.(msg.house.roster, msg.house.name, msg.selfId);
        break;
      }

      case 'MEMBER_JOINED': {
        const m = msg.member;
        useNet.setState((s) => ({
          liveCount: s.liveCount + 1,
          remotePlayers: {
            ...s.remotePlayers,
            [m.id]: {
              id: m.id,
              nickname: m.nickname,
              avatar: m.avatar,
              accentColor: m.accentColor,
              skinTone: m.skinTone ?? '#c98a5b',
              hairstyle: m.hairstyle ?? 'lowcut',
              profession: m.profession,
              trait: m.trait,
              x: m.x ?? -16,
              z: m.z ?? 4,
              room: m.currentRoom ?? 'Lounge',
            },
          },
        }));
        break;
      }

      case 'MEMBER_LEFT': {
        useNet.setState((s) => {
          const next = { ...s.remotePlayers };
          delete next[msg.memberId];
          return { remotePlayers: next, liveCount: Math.max(0, s.liveCount - 1) };
        });
        break;
      }

      case 'MOVE': {
        useNet.setState((s) => {
          const p = s.remotePlayers[msg.memberId];
          if (!p) return {};
          return {
            remotePlayers: {
              ...s.remotePlayers,
              [msg.memberId]: { ...p, x: msg.x, z: msg.z, room: msg.room },
            },
          };
        });
        break;
      }

      case 'CHAT': {
        useNet.setState((s) => ({
          chat: [
            ...s.chat,
            {
              id: `c-${msg.ts}-${Math.random().toString(36).slice(2, 6)}`,
              senderId: msg.senderId,
              senderName: msg.senderName,
              senderAvatar: msg.senderAvatar,
              text: msg.text,
            },
          ].slice(-60),
        }));
        break;
      }

      case 'STATE': {
        useNet.setState({ houseState: msg.state });
        this.onState?.(msg.state);
        break;
      }

      default:
        break;
    }
  }
}

export const multiplayer = new MultiplayerClient();
