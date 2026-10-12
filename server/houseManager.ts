// House sharding + AI backfill — the core multiplayer rule:
//   • Each house holds a maximum of 20 live players.
//   • When a house reaches 20, the next player starts filling a new house.
//   • Houses below 20 are backfilled with AI-controlled housemates.

import { generateAiHousemate } from './aiProfiles';
import type { GameMember, House, HouseState } from './types';

export const MAX_HOUSE_SIZE = 20;

let houseCounter = 0;

export function createHouse(name?: string): House {
  houseCounter += 1;
  return {
    id: `house-${houseCounter}`,
    name: name || `Biggie's House ${houseCounter}`,
    members: new Map(),
    aiMembers: [],
    seed: Math.floor(Math.random() * 1e9),
    state: {
      week: 1,
      day: 1,
      phase: 'hoh',
      phaseDone: false,
      nominees: [],
      evictedId: null,
      hohId: null,
      finaleWinnerId: null,
      finalRanks: {},
      gameOver: false,
      scores: {},
      votes: {},
      ready: new Set(),
      log: [],
      tweets: [],
    } as HouseState,
  };
}

// Assign a member to the first house with room, creating a new house if all are full.
export function assignToHouse(houses: House[], member: GameMember): House {
  let house = houses.find((h) => h.members.size < MAX_HOUSE_SIZE);
  if (!house) {
    house = createHouse();
    houses.push(house);
  }
  house.members.set(member.id, member);
  backfillAi(house);
  return house;
}

// Fill remaining slots (20 - live players) with AI-controlled housemates.
export function backfillAi(house: House): GameMember[] {
  const live = house.members.size;
  const needed = Math.max(0, MAX_HOUSE_SIZE - live);
  if (house.aiMembers.length < needed) {
    for (let i = house.aiMembers.length; i < needed; i++) {
      house.aiMembers.push(generateAiHousemate(house.seed, i));
    }
  } else if (house.aiMembers.length > needed) {
    house.aiMembers.length = needed; // trim if a player leaves
  }
  return house.aiMembers;
}

// Full roster for a house: live players + AI backfill.
export function roster(house: House): GameMember[] {
  return [...house.members.values(), ...house.aiMembers];
}

export function removeMember(house: House, memberId: string): void {
  house.members.delete(memberId);
  backfillAi(house);
}
