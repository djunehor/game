// Account signup / login / profile + progress persistence. Shared by the Node
// dev server and the Cloudflare Worker Durable Object.

import { hashPassword, randomSalt, verifyPassword, validateUsername, validatePassword, validateEmail } from './auth';
import { issueToken } from './session';
import type { Accounts, PlayerState, Tokens } from './types';

export function defaultPlayerState(): PlayerState {
  return {
    fanbaseClout: 12000,
    bbCoins: 2000,
    strikes: 0,
    energy: 90,
    sanity: 85,
    hunger: 70,
    houseStanding: 55,
    relationships: {},
  };
}

export async function signup(accounts: Accounts, tokens: Tokens, username: string, password: string, email?: string) {
  const u = String(username || '').trim().toLowerCase();
  if (!validateUsername(u)) return { error: 'Username must be 3–20 letters, numbers or underscores.' };
  if (!validatePassword(password)) return { error: 'Password must be at least 6 characters.' };
  if (!validateEmail(email)) return { error: 'Enter a valid email address.' };
  if (accounts[u]) return { error: 'That username is already taken.' };

  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  const playerId = 'p-' + issueToken();
  const token = issueToken();

  accounts[u] = {
    username: u,
    email: email ? String(email).trim() : null,
    salt,
    hash,
    playerId,
    profile: null,
    playerState: defaultPlayerState(),
    token,
    createdAt: Date.now(),
  };
  tokens[playerId] = token; // keep the JOIN session map in sync

  return { ok: true, token, playerId, username: u, profile: null, playerState: accounts[u].playerState };
}

export async function login(accounts: Accounts, tokens: Tokens, username: string, password: string) {
  const u = String(username || '').trim().toLowerCase();
  const acc = accounts[u];
  if (!acc) return { error: 'Invalid username or password.' };
  const ok = await verifyPassword(password, acc.salt, acc.hash);
  if (!ok) return { error: 'Invalid username or password.' };

  acc.token = issueToken(); // rotate the session token
  tokens[acc.playerId] = acc.token; // keep the JOIN session map in sync
  return { ok: true, token: acc.token, playerId: acc.playerId, username: u, profile: acc.profile, playerState: acc.playerState ?? defaultPlayerState() };
}

export function saveProfile(accounts: Accounts, token: string, playerId: string, profile: unknown) {
  for (const acc of Object.values(accounts)) {
    if (acc.playerId === playerId && acc.token === token) {
      acc.profile = profile;
      return { ok: true, profile };
    }
  }
  return { error: 'Not authenticated.' };
}

export function saveState(accounts: Accounts, token: string, playerId: string, state: Partial<PlayerState>) {
  for (const acc of Object.values(accounts)) {
    if (acc.playerId === playerId && acc.token === token) {
      const prev = acc.playerState ?? defaultPlayerState();
      acc.playerState = {
        fanbaseClout: Number(state?.fanbaseClout) || prev.fanbaseClout,
        bbCoins: Number(state?.bbCoins) || prev.bbCoins,
        strikes: Number(state?.strikes) || 0,
        energy: Math.max(0, Math.min(100, Number(state?.energy) ?? prev.energy)),
        sanity: Math.max(0, Math.min(100, Number(state?.sanity) ?? prev.sanity)),
        hunger: Math.max(0, Math.min(100, Number(state?.hunger) ?? prev.hunger)),
        houseStanding: Math.max(0, Math.min(100, Number(state?.houseStanding) ?? prev.houseStanding)),
        relationships: state?.relationships ?? prev.relationships,
      };
      return { ok: true, playerState: acc.playerState };
    }
  }
  return { error: 'Not authenticated.' };
}
