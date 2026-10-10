// Serialization helpers for persisting game state to Durable Object storage.
// Maps (members) and Sets (ready) are converted to plain JSON-safe structures
// and back, and live WebSocket references are stripped (they cannot persist).

import type { GameMember, House, HouseState } from './types';

export function stripWs(m: GameMember): GameMember {
  const { __ws, ...rest } = m;
  return rest as GameMember;
}

interface SerializedHouse {
  id: string;
  name: string;
  seed: number;
  members: Record<string, GameMember>;
  aiMembers: GameMember[];
  state: Omit<HouseState, 'ready'> & { ready: string[] };
}

export function serializeHouses(houses: House[]): SerializedHouse[] {
  return houses.map((h) => ({
    id: h.id,
    name: h.name,
    seed: h.seed,
    members: Object.fromEntries([...h.members.values()].map((m) => [m.id, stripWs(m)])),
    aiMembers: h.aiMembers.map(stripWs),
    state: { ...h.state, ready: [...(h.state.ready || [])] },
  }));
}

export function deserializeHouses(data: SerializedHouse[] | null | undefined): House[] {
  return (data || []).map((h) => ({
    id: h.id,
    name: h.name,
    seed: h.seed,
    members: new Map(Object.values(h.members || {}).map((m) => [m.id, m])),
    aiMembers: h.aiMembers || [],
    state: {
      ...h.state,
      ready: new Set(h.state.ready || []),
      scores: h.state.scores || {},
      votes: h.state.votes || {},
    } as HouseState,
  }));
}
