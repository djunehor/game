import { ASPIRATIONS } from '../src/life/content';
import {
  ASPIRATION_MILESTONES,
  FULFILMENT_REWARD,
  aspirationStatus,
  newlyCompletedMilestones,
  type AspirationContext,
} from '../src/life/aspirations';
import { createSimAvatar } from '../src/sim/engine';
import { cumulativeXpForLevel } from '../src/sim/skills';
import type { AspirationId, Sim } from '../src/life/types';

// ---------------------------------------------------------------------------
// Aspirations: long-term goals that pay out when you reach them.
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

const sim = (over: Partial<Sim> = {}): Sim => ({
  id: 's1',
  firstName: 'Ada',
  lastName: 'Okafor',
  gender: 'F',
  stage: 'youngAdult',
  daysInStage: 0,
  traits: ['cheerful'],
  aspiration: 'knowledge',
  avatar: '😎',
  accentColor: '#e63946',
  career: null,
  atWork: false,
  relationships: {},
  generation: 0,
  playable: true,
  ...over,
});

function ctx(over: Partial<AspirationContext> = {}): AspirationContext {
  return {
    sim: sim(),
    skills: {},
    career: null,
    counters: {},
    relationships: [],
    ownedCatalogIds: [],
    lot: [],
    ...over,
  };
}

console.log('→ Testing Aspirations');

// ------------------------------ Definitions -------------------------------
{
  const ids = Object.keys(ASPIRATION_MILESTONES) as AspirationId[];
  assert(ids.length === Object.keys(ASPIRATIONS).length, `Every aspiration has milestones (${ids.length})`);
  assert(
    ids.every((id) => ASPIRATION_MILESTONES[id].length >= 3),
    'Each aspiration has at least three milestones',
  );
  const allIds = ids.flatMap((id) => ASPIRATION_MILESTONES[id].map((m) => m.id));
  assert(new Set(allIds).size === allIds.length, 'Milestone ids are unique across tracks');
  assert(
    ids.every((id) => ASPIRATION_MILESTONES[id].every((m) => m.check(ctx({ sim: sim({ aspiration: id }) })) === false)),
    'No aspiration starts out already complete',
  );
  assert(
    ids.every((id) => ASPIRATION_MILESTONES[id].every((m) => Boolean(m.label) && Boolean(m.emoji))),
    'Every milestone is labelled',
  );
  assert(
    ids.every((id) => ASPIRATION_MILESTONES[id].every((m) => Boolean(m.check))),
    'Every milestone has a check function',
  );
}

// ------------------------------ Progress ----------------------------------
{
  const status = aspirationStatus('knowledge', ctx());
  assert(status.completed === 0 && !status.fulfilled, 'A fresh Sim has made no progress');
  assert(status.milestones.length === ASPIRATION_MILESTONES.knowledge.length, 'Status lists every milestone');
  assert(
    status.milestones.every((m) => m.current === 0 && m.target >= 1),
    'Progress meters start at zero with a target',
  );

  const partial = aspirationStatus(
    'knowledge',
    ctx({ sim: sim({ aspirationProgress: { knowledge_any3: true } }) }),
  );
  assert(partial.completed === 1, 'Recorded milestones count as complete');
  assert(partial.milestones.find((m) => m.milestone.id === 'knowledge_any3')?.done === true, 'The right one is ticked');
}

// --------------------------- Milestone checks -----------------------------
{
  // Skills
  const skilled = ctx({ skills: { cooking: { xp: cumulativeXpForLevel(3) } } });
  assert(
    newlyCompletedMilestones('knowledge', skilled).some((m) => m.id === 'knowledge_any3'),
    'Reaching level 3 in a skill completes "Reach level 3 in any skill"',
  );
  const twoSkills = ctx({
    skills: { cooking: { xp: cumulativeXpForLevel(5) }, logic: { xp: cumulativeXpForLevel(5) } },
  });
  assert(
    newlyCompletedMilestones('knowledge', twoSkills).some((m) => m.id === 'knowledge_two5'),
    'Two level-5 skills completes the two-skill milestone',
  );

  // Career
  const worker = ctx({ career: { id: 'tech', level: 3, performance: 0, shiftsWorked: 6 } });
  assert(
    newlyCompletedMilestones('fortune', worker).some((m) => m.id === 'fortune_shifts'),
    'Working shifts completes the shifts milestone',
  );
  assert(
    newlyCompletedMilestones('fortune', worker).some((m) => m.id === 'fortune_level'),
    'Reaching career level 3 completes the promotion milestone',
  );

  // Counters
  const painter = ctx({ counters: { easel: 3 } });
  assert(
    newlyCompletedMilestones('creativity', painter).some((m) => m.id === 'creativity_paint'),
    'A counter-backed milestone completes after enough repetitions',
  );
  const talker = ctx({ counters: { sim: 10 } });
  assert(
    newlyCompletedMilestones('popularity', talker).some((m) => m.id === 'popularity_socialise'),
    'Socialising counts toward the popularity track',
  );

  // Relationships
  const loved = ctx({
    relationships: [
      { friendship: 50, romance: 45, kind: 'friend' },
      { friendship: 60, romance: 0, kind: 'friend' },
    ],
  });
  assert(
    newlyCompletedMilestones('family', loved).filter((m) => m.id === 'family_friends').length === 1,
    'Making friends completes the friendship milestone',
  );
  assert(
    newlyCompletedMilestones('romance', loved).some((m) => m.id === 'romance_fall'),
    'Falling for someone completes the romance milestone',
  );

  // Ownership
  const furnished = ctx({ ownedCatalogIds: ['easel', 'plant', 'plant', 'plant'] });
  assert(
    newlyCompletedMilestones('creativity', furnished).some((m) => m.id === 'creativity_easel'),
    'Buying the right object completes an ownership milestone',
  );
  assert(
    newlyCompletedMilestones('nature', furnished).some((m) => m.id === 'nature_plants'),
    'Owning three plants completes the plant milestone',
  );

  // Already-recorded milestones are not re-awarded.
  const repeat = ctx({
    skills: { cooking: { xp: cumulativeXpForLevel(3) } },
    sim: sim({ aspirationProgress: { knowledge_any3: true } }),
  });
  assert(
    !newlyCompletedMilestones('knowledge', repeat).some((m) => m.id === 'knowledge_any3'),
    'A completed milestone is never awarded twice',
  );
}

// ---------------------------- Fulfilment ----------------------------------
{
  const done = sim({
    aspiration: 'nature',
    aspirationProgress: {
      nature_garden: true,
      nature_skill: true,
      nature_plants: true,
    },
  });
  const status = aspirationStatus('nature', ctx({ sim: done, ownedCatalogIds: ['plant'] }));
  assert(status.fulfilled, 'Completing every milestone fulfils the aspiration');
  assert(status.completed === status.total, 'Fulfilment reports full progress');
  assert(FULFILMENT_REWARD.funds > 0, 'Fulfilment pays a bonus');
}

// ------------------------------ Rewards -----------------------------------
{
  const allIds = (Object.keys(ASPIRATION_MILESTONES) as AspirationId[]).flatMap((id) =>
    ASPIRATION_MILESTONES[id],
  );
  assert(
    allIds.every((m) => (m.reward.funds ?? 0) > 0 || Boolean(m.reward.moodlet)),
    'Every milestone pays money or lifts the mood',
  );
  assert(
    allIds.filter((m) => Boolean(m.reward.moodlet)).length >= 5,
    'Several milestones grant a moodlet',
  );
}

// --------------------- Counters come from real play -----------------------
{
  const avatar = createSimAvatar('s1', 'Ada', ['cheerful']);
  assert(avatar.counters === undefined || typeof avatar.counters === 'object', 'Counters start empty');
  assert(
    aspirationStatus('fortune', ctx({ counters: avatar.counters ?? {} })).completed === 0,
    'A brand new Sim has no completed milestones',
  );
}

console.log(`\nAspiration Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
