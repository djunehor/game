import {
  MOTIVE_META,
  applyMotiveDeltas,
  averageMotive,
  createInitialMotives,
  decayMotives,
  lowestMotive,
  motiveUrgency,
  motivesInCrisis,
} from '../src/sim/motives';
import { addMoodlet, computeMood, computeConditionMoodlets, createMoodlet, deriveMood, pruneMoodlets } from '../src/sim/moodlets';
import { MAX_SKILL_LEVEL, addSkillXp, cumulativeXpForLevel, getSkillLevel, meetsSkillRequirement, skillProgress, xpToNextLevel } from '../src/sim/skills';
import { MOTIVE_IDS, type Motives } from '../src/sim/types';

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

function full(value = 70): Motives {
  const m = {} as Motives;
  for (const id of MOTIVE_IDS) m[id] = value;
  return m;
}

console.log('→ Testing Sim Motives, Moodlets & Skills');

// ------------------------------- Motives ----------------------------------
{
  const initial = createInitialMotives(0.3);
  assert(
    MOTIVE_IDS.every((id) => initial[id] >= 0 && initial[id] <= 100),
    'Initial motives are all within 0..100',
  );
  assert(
    createInitialMotives(0.3).hunger === initial.hunger,
    'Initial motives are deterministic for a given seed',
  );

  const after1h = decayMotives(full(70), 60, 'Peace Maker');
  assert(
    after1h.hunger < 70 && after1h.bladder < after1h.hunger,
    'Motives drain over time and bladder drains fastest',
  );

  const general = decayMotives(full(70), 60, 'Kitchen General');
  const pepper = decayMotives(full(70), 60, 'Pepper Dem');
  assert(general.hunger > pepper.hunger, 'Kitchen General gets hungry slower than Pepper Dem');
  assert(pepper.social < general.social, 'Pepper Dem drains social faster (needs an audience)');

  const drained = decayMotives(full(1), 600, 'Clout Chaser');
  assert(MOTIVE_IDS.every((id) => drained[id] >= 0), 'Motive decay clamps at zero, never negative');

  assert(applyMotiveDeltas(full(20), { hunger: 50 }).hunger === 70, 'Interaction deltas restore motives');
  assert(applyMotiveDeltas(full(95), { hunger: 50 }).hunger === 100, 'Motive restore clamps at 100');

  assert(motiveUrgency(100) === 0 && motiveUrgency(0) === 1, 'Urgency is 0 when satisfied and 1 when empty');
  const worst = lowestMotive({ ...full(80), hygiene: 12 });
  assert(worst.id === 'hygiene', 'lowestMotive finds the emptiest need');
  assert(Math.abs(averageMotive(full(50)) - 50) < 0.001, 'averageMotive averages every motive');
  assert(motivesInCrisis({ ...full(80), hunger: 5 }).includes('hunger'), 'motivesInCrisis flags critical needs');
  assert(motivesInCrisis(full(80)).length === 0, 'motivesInCrisis is empty when everything is fine');
  assert(Object.keys(MOTIVE_META).length === 8, 'All eight motives have metadata');
}

// ------------------------------- Moodlets ---------------------------------
{
  const starving = computeConditionMoodlets({ ...full(80), hunger: 5 });
  assert(starving.some((m) => m.id === 'cond:starving'), 'Low hunger produces a Starving moodlet');

  const allGood = computeConditionMoodlets(full(90));
  assert(
    allGood.some((m) => m.id === 'cond:in_the_zone'),
    'All motives high grants the In The Zone bonus moodlet',
  );

  const moodBad = deriveMood(starving);
  assert(moodBad.score < 0, 'Negative moodlets produce a negative mood score');
  assert(['sad', 'uncomfortable', 'stressed'].includes(moodBad.emotion), `Starving Sim reads as ${moodBad.emotion}`);
  assert(moodBad.grade < 50, 'A starving Sim has a low mood grade');

  const moodGood = deriveMood(computeConditionMoodlets(full(95)));
  assert(moodGood.score > 0, 'A well-cared-for Sim has a positive mood score');
  assert(moodGood.grade > 50, 'A well-cared-for Sim has a high mood grade');

  const flat = deriveMood([]);
  assert(flat.emotion === 'neutral' && flat.grade === 50, 'No moodlets reads as neutral at grade 50');

  // Transient moodlet lifecycle
  const m = createMoodlet('workout_high', 100, 60, 'workout')!;
  assert(m.expiresAt === 160, 'Moodlets expire at now + duration');
  let list = addMoodlet([], m);
  list = addMoodlet(list, createMoodlet('workout_high', 100, 30, 'workout')!);
  assert(list.length === 1, 'Re-granting a moodlet replaces rather than stacks');
  assert(list[0].expiresAt === 160, 'Re-granting keeps the longer remaining duration');
  assert(pruneMoodlets(list, 170).length === 0, 'Expired moodlets are pruned');
  assert(pruneMoodlets(list, 150).length === 1, 'Unexpired moodlets are kept');

  const withMoodlet = computeMood({ motives: full(80), moodlets: list }, 150);
  assert(withMoodlet.score > 0, 'Transient moodlets feed into the computed mood');
}

// -------------------------------- Skills ----------------------------------
{
  assert(xpToNextLevel(0) < xpToNextLevel(1), 'Each skill level costs more XP than the last');
  assert(xpToNextLevel(MAX_SKILL_LEVEL) === Infinity, 'Max level has no further XP requirement');
  assert(cumulativeXpForLevel(0) === 0, 'Reaching level 0 needs no XP');
  assert(getSkillLevel({}, 'cooking') === 0, 'Skills start at level 0');

  const one = addSkillXp({}, 'cooking', cumulativeXpForLevel(1));
  assert(getSkillLevel(one.skills, 'cooking') === 1, 'Awarding enough XP reaches level 1');
  assert(one.levelsGained === 1, 'Level-up is reported');

  const huge = addSkillXp({}, 'fitness', 999999);
  assert(getSkillLevel(huge.skills, 'fitness') === MAX_SKILL_LEVEL, `Skill caps at level ${MAX_SKILL_LEVEL}`);
  assert(addSkillXp({}, 'logic', 0).levelsGained === 0, 'Awarding zero XP changes nothing');

  const p = skillProgress({ cooking: { xp: cumulativeXpForLevel(3) } }, 'cooking');
  assert(p.level === 3 && p.ratio === 0, 'Progress view reports the level and zero progress at a fresh level');
  assert(skillProgress({ cooking: { xp: 999999 } }, 'cooking').maxed, 'Progress view reports maxed skills');

  assert(!meetsSkillRequirement({}, { id: 'cooking', level: 2 }), 'Skill requirement fails when unmet');
  assert(meetsSkillRequirement({ cooking: { xp: 999999 } }, { id: 'cooking', level: 2 }), 'Skill requirement passes when met');
  assert(meetsSkillRequirement({}, undefined), 'No requirement always passes');
}

console.log(`\nSim Needs & Skills Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
