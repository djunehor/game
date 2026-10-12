import { assignToHouse, backfillAi, roster, MAX_HOUSE_SIZE, createHouse } from '../server/houseManager';

let pass = 0;
let fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
}

function fakeMember(i) {
  return { id: `p-${i}`, nickname: `Player${i}`, avatar: '😎', accentColor: '#e63946' };
}

console.log('→ house sharding (max 20 per house)');
const houses = [];
for (let i = 0; i < 45; i++) assignToHouse(houses, fakeMember(i));
assert(houses.length === 3, '45 players spread across 3 houses (20+20+5)');
assert(houses[0].members.size === 20, 'house 1 has 20');
assert(houses[1].members.size === 20, 'house 2 has 20');
assert(houses[2].members.size === 5, 'house 3 has 5');

console.log('→ AI backfill to 20');
assert(houses[0].aiMembers.length === 0, 'full house has 0 AI');
assert(houses[2].aiMembers.length === 15, '5-player house backfilled with 15 AI');
assert(roster(houses[2]).length === 20, 'roster always totals 20');

console.log('→ backfill shrinks when a player joins a partial house');
const partial = houses[2];
assignToHouse(houses, fakeMember(999));
assert(partial.aiMembers.length === 14, 'AI count drops when live player count grows');
assert(partial.members.size === 6, 'live members now 6');

console.log('→ AI housemates are unique and well-formed');
const ai = houses[2].aiMembers;
const ids = new Set(ai.map((a) => a.id));
assert(ids.size === ai.length, 'AI ids are unique');
assert(
  ai.every((a, i) => a.id === `ai-${i + 1}`),
  'AI ids use the stable seed-independent ai-<n> scheme (matches the client local AI ids)',
);
assert(ai.every((a) => a.nickname && a.profession && a.trait && a.isHuman === false), 'AI have full profiles');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
