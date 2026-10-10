// Session token issue + authentication.
import type { Tokens } from './types';

export function issueToken(): string {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function authenticate(
  tokens: Tokens,
  playerId: string,
  token?: string,
): { status: 'new' | 'resume' | 'reject'; token?: string } {
  const existing = tokens[playerId];
  if (existing) {
    if (existing === token) return { status: 'resume' };
    return { status: 'reject' };
  }
  const fresh = issueToken();
  tokens[playerId] = fresh;
  return { status: 'new', token: fresh };
}
