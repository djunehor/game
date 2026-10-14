import { createStarterLot, detectRegions, hKey, roofSlabs, vKey } from '../src/lot/grid';
import { DOOR_COST, WALL_COST } from '../src/lot/types';
import { useLifeStore } from '../src/life/lifeStore';
import { useSimStore } from '../src/sim/simStore';
import { createSimAvatar, enqueueInteraction, tickAvatar } from '../src/sim/engine';
import { getInteraction } from '../src/sim/interactions';
import { cumulativeXpForLevel, getSkillLevel } from '../src/sim/skills';
import { MOTIVE_IDS, type Motives } from '../src/sim/types';
import type { NewSimConfig } from '../src/life/types';

// ---------------------------------------------------------------------------
// Build completeness: doors you can fit, roofs over rooms, and skills that
// change what an action gives you.
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

const cfg = (over: Partial<NewSimConfig> = {}): NewSimConfig => ({
  firstName: 'Ada',
  lastName: 'Okafor',
  gender: 'F',
  stage: 'adult',
  traits: ['cheerful'],
  aspiration: 'knowledge',
  avatar: '😎',
  accentColor: '#e63946',
  career: null,
  ...over,
});

function full(value = 40): Motives {
  const m = {} as Motives;
  for (const id of MOTIVE_IDS) m[id] = value;
  return m;
}

console.log('→ Testing Build Completeness & Skill Payoff');

// -------------------------------- Doors -----------------------------------
{
  useLifeStore.getState().reset();
  useSimStore.getState().reset();
  useLifeStore.getState().createHousehold({ name: 'Doors', sims: [cfg()] });
  const home = useLifeStore.getState().household!;
  const plot = home.plot;

  // Find a wall segment that exists in the starter shell.
  const wallKey = plot.walls[0];
  const fundsBefore = home.funds;

  useLifeStore.getState().toggleDoor(wallKey);
  const afterDoor = useLifeStore.getState().household!;
  assert(afterDoor.plot.doors?.includes(wallKey) === true, 'A door can be fitted into a wall');
  assert(!afterDoor.plot.walls.includes(wallKey), 'Fitting a door removes the wall it replaces');
  assert(afterDoor.funds === fundsBefore - DOOR_COST, `A door costs ₦${DOOR_COST}`);

  // The door separates rooms for space detection.
  const withDoor = detectRegions(afterDoor.plot);
  assert(withDoor.length > 0, 'The floor plan is still valid with a door in it');

  useLifeStore.getState().toggleDoor(wallKey);
  const removed = useLifeStore.getState().household!;
  assert((removed.plot.doors ?? []).includes(wallKey) === false, 'A door can be removed again');
  assert(removed.funds > afterDoor.funds, 'Removing a door refunds part of the cost');

  // Wall over a doorway seals it again.
  useLifeStore.getState().toggleDoor(wallKey);
  useLifeStore.getState().toggleWall(wallKey);
  const sealed = useLifeStore.getState().household!;
  assert(sealed.plot.walls.includes(wallKey), 'Building a wall over a doorway closes it');
  assert((sealed.plot.doors ?? []).includes(wallKey) === false, 'The doorway is gone once walled over');
}

// -------------------------------- Roofs -----------------------------------
{
  const plot = createStarterLot();
  const regions = detectRegions(plot);
  const slabs = roofSlabs(plot, regions);
  const indoor = regions.filter((r) => !r.outdoors);

  assert(slabs.length === indoor.length, `Every enclosed room gets a roof (${slabs.length})`);
  assert(slabs.every((s) => s.width > 0 && s.depth > 0), 'Roofs cover some area');
  assert(
    slabs.every((s) => Number.isFinite(s.x) && Number.isFinite(s.z)),
    'Roofs are positioned in the world',
  );
  assert(
    regions.filter((r) => r.outdoors).length > 0,
    'The garden does not get a roof',
  );

  // An unwalled lot has no enclosed space, so no roofs.
  const open: typeof plot = { ...plot, walls: [], doors: [] };
  assert(roofSlabs(open, detectRegions(open)).length === 0, 'Nothing is roofed on open land');

  // Draw a sealed box and it gets one.
  const boxed = createStarterLot();
  const sealed: typeof boxed = {
    ...boxed,
    walls: [hKey(1, 1), hKey(2, 1), hKey(1, 2), hKey(2, 2), vKey(1, 1), vKey(1, 2), vKey(3, 1), vKey(3, 2)],
    doors: [],
    tiles: boxed.tiles,
  };
  assert(roofSlabs(sealed, detectRegions(sealed)).length === 1, 'A newly enclosed room is roofed');
}

// ---------------------------- Skill payoff --------------------------------
{
  const def = getInteraction('cook_gourmet') ?? getInteraction('cook_meal')!;
  const base = () => ({ ...createSimAvatar('cook', 'Ada', ['foodie']), motives: full(20) });

  const novice = tickAvatar(
    enqueueInteraction(base(), def.id),
    def.minutes,
    { now: 0, autonomyEnabled: false },
  );
  const expert = tickAvatar(
    enqueueInteraction(
      { ...base(), skills: { cooking: { xp: cumulativeXpForLevel(10) } } },
      def.id,
    ),
    def.minutes,
    { now: 0, autonomyEnabled: false },
  );

  assert(
    expert.avatar.motives.hunger > novice.avatar.motives.hunger,
    `A skilled cook gets more from the same meal (${novice.avatar.motives.hunger} → ${expert.avatar.motives.hunger})`,
  );
  assert(
    expert.avatar.motives.fun >= novice.avatar.motives.fun,
    'Proficiency never makes an action worse',
  );
  assert(
    getSkillLevel(expert.avatar.skills, 'cooking') >= 10,
    'The expert is actually levelled',
  );

  // A Sim with no skill in the relevant area gets no bonus.
  const unrelated = tickAvatar(
    enqueueInteraction({ ...base(), skills: { gaming: { xp: cumulativeXpForLevel(10) } } }, def.id),
    def.minutes,
    { now: 0, autonomyEnabled: false },
  );
  assert(
    unrelated.avatar.motives.hunger === novice.avatar.motives.hunger,
    'Being good at something unrelated does not help',
  );
}

// -------------------- Costs are consistent across tools -------------------
{
  useLifeStore.getState().reset();
  useSimStore.getState().reset();
  useLifeStore.getState().createHousehold({ name: 'Costs', sims: [cfg()] });
  const home = useLifeStore.getState().household!;

  const before = home.funds;
  // Pick a free segment well away from the starter shell.
  const freeWall = hKey(2, 18);
  useLifeStore.getState().toggleWall(freeWall);
  assert(
    useLifeStore.getState().household!.funds === before - WALL_COST,
    `A wall costs ₦${WALL_COST}`,
  );
  assert(DOOR_COST > WALL_COST, 'Doors cost more than plain walls');
}

console.log(`\nBuild Completeness Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
