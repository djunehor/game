import { chooseAutonomousInteraction, rankInteractions, scoreInteraction, seedFromId } from '../src/sim/autonomy';
import { INTERACTIONS, getInteraction } from '../src/sim/interactions';
import { MOTIVE_IDS, type Motives, type Skills } from '../src/sim/types';

// ---------------------------------------------------------------------------
// Autonomy: the utility AI that decides what a Sim does when left alone.
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

function motives(overrides: Partial<Motives> = {}): Motives {
  const base = {} as Motives;
  for (const id of MOTIVE_IDS) base[id] = 70;
  return { ...base, ...overrides };
}

function ctx(over: Partial<{ motives: Motives; skills: Skills; traits: string[]; now: number; seed: number; recent: string[] }> = {}) {
  return {
    motives: over.motives ?? motives(),
    skills: over.skills ?? {},
    traits: over.traits ?? ['Peace Maker'],
    now: over.now ?? 0,
    seed: over.seed ?? 0.42,
    recent: over.recent,
  };
}

console.log('→ Testing Sim Autonomy (utility AI)');

assert(seedFromId('ai-1') === seedFromId('ai-1'), 'seedFromId is deterministic');
assert(seedFromId('ai-1') !== seedFromId('ai-2'), 'seedFromId differs per avatar');

// 1. A starving Sim should choose something that feeds them.
{
  const hungry = motives({ hunger: 3 });
  const choice = chooseAutonomousInteraction(ctx({ motives: hungry }));
  assert(choice !== null, 'A Sim with unmet needs chooses an interaction');
  const feeds = (choice?.motiveDeltas.hunger ?? 0) > 0;
  assert(feeds, `Starving Sim chooses a hunger-relieving interaction (picked ${choice?.label})`);
}

// 2. An exhausted Sim should choose sleep.
{
  const tired = motives({ energy: 2 });
  const choice = chooseAutonomousInteraction(ctx({ motives: tired }));
  assert(
    choice?.id === 'sleep' || choice?.id === 'hoh_sleep' || choice?.id === 'power_nap',
    `Exhausted Sim heads for a bed (picked ${choice?.label})`,
  );
}

// 3. A desperate Sim prioritises the toilet over fun.
{
  const desperate = motives({ bladder: 1, fun: 30 });
  const choice = chooseAutonomousInteraction(ctx({ motives: desperate }));
  assert(choice?.id === 'use_toilet', `Bladder emergency wins over other needs (picked ${choice?.label})`);
}

// 4. A lonely Sim seeks company.
{
  const lonely = motives({ social: 4 });
  const choice = chooseAutonomousInteraction(ctx({ motives: lonely }));
  assert((choice?.motiveDeltas.social ?? 0) > 0, `Lonely Sim seeks social contact (picked ${choice?.label})`);
}

// 5. Everything satisfied → the Sim idles instead of acting pointlessly.
{
  const full = motives(Object.fromEntries(MOTIVE_IDS.map((id) => [id, 98])) as Partial<Motives>);
  const choice = chooseAutonomousInteraction(ctx({ motives: full }));
  assert(choice === null, `A fully satisfied Sim has no urgent action (picked ${choice?.label ?? 'nothing'})`);
}

// 6. HoH-gated objects require the gate to allow them.
{
  const tired = motives({ energy: 1 });
  const hohBed = getInteraction('hoh_sleep')!;
  const locked = scoreInteraction(hohBed, { ...ctx({ motives: tired }), allowed: () => false });
  const unlocked = scoreInteraction(hohBed, { ...ctx({ motives: tired }), allowed: () => true });
  assert(locked === null, 'Gated interaction scores null when not allowed');
  assert((unlocked ?? 0) > 0, 'Gated interaction scores normally when allowed');
}

// 7. Skill requirements lock interactions.
{
  const gourmet = getInteraction('cook_gourmet')!;
  const noSkill = scoreInteraction(gourmet, ctx({ motives: motives({ hunger: 5 }) }));
  const skilled = scoreInteraction(gourmet, ctx({ motives: motives({ hunger: 5 }), skills: { cooking: { xp: 5000 } } }));
  assert(noSkill === null, 'Skill-gated interaction hidden below the required level');
  assert((skilled ?? 0) > 0, 'Skill-gated interaction available once the level is reached');
}

// 8. Recent repetition is discouraged.
{
  const hungry = motives({ hunger: 2 });
  const first = chooseAutonomousInteraction(ctx({ motives: hungry, recent: [] }));
  const repeated = rankInteractions(ctx({ motives: hungry, recent: first ? [first.id] : [] }));
  const repeatedScore = first ? repeated.find((r) => r.def.id === first.id)?.score ?? 0 : 0;
  const freshScore = first
    ? scoreInteraction(first, ctx({ motives: hungry, recent: [] })) ?? 0
    : 0;
  assert(repeatedScore < freshScore, 'Repeating the same action scores lower than doing it fresh');
}

// 9. Deterministic given the same seed, varied across seeds.
{
  const m = motives({ fun: 8 });
  const a = chooseAutonomousInteraction(ctx({ motives: m, seed: 0.1, now: 100 }))?.id;
  const b = chooseAutonomousInteraction(ctx({ motives: m, seed: 0.1, now: 100 }))?.id;
  assert(a === b, 'Autonomy choice is deterministic for the same seed and time');
}

// 10. Every catalog entry is well-formed.
{
  const ids = new Set(INTERACTIONS.map((i) => i.id));
  assert(ids.size === INTERACTIONS.length, 'Interaction ids are unique');
  const valid = INTERACTIONS.every(
    (i) =>
      i.minutes > 0 &&
      Object.keys(i.autonomy).length > 0 &&
      Object.values(i.motiveDeltas).every((v) => typeof v === 'number'),
  );
  assert(valid, `All ${INTERACTIONS.length} interactions have a duration, deltas and autonomy weights`);
  const everyMotiveCovered = MOTIVE_IDS.every((id) =>
    INTERACTIONS.some((i) => (i.motiveDeltas[id] ?? 0) > 0),
  );
  assert(everyMotiveCovered, 'Every motive can be restored by at least one interaction');
}

console.log(`\nSim Autonomy Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
