import { ELDER_GRACE_DAYS, LIFE_STAGES } from '../src/life/content';
import { isAtEndOfLife, lifespanProgress, advanceAge } from '../src/life/aging';
import { useLifeStore } from '../src/life/lifeStore';
import { useSimStore } from '../src/sim/simStore';
import { MOODLET_CATALOG } from '../src/sim/moodlets';
import type { NewSimConfig, Sim } from '../src/life/types';

// ---------------------------------------------------------------------------
// Mortality: elders live out their span, then pass away.
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
  aspiration: 'family',
  avatar: '😎',
  accentColor: '#e63946',
  career: null,
  ...over,
});

console.log('→ Testing Mortality & Generations');

// ------------------------------ Thresholds --------------------------------
{
  const fresh: Pick<Sim, 'stage' | 'daysInStage'> = { stage: 'elder', daysInStage: 0 };
  const full: Pick<Sim, 'stage' | 'daysInStage'> = {
    stage: 'elder',
    daysInStage: LIFE_STAGES.elder.days,
  };
  const gone: Pick<Sim, 'stage' | 'daysInStage'> = {
    stage: 'elder',
    daysInStage: LIFE_STAGES.elder.days + ELDER_GRACE_DAYS,
  };

  assert(!isAtEndOfLife(fresh), 'A fresh elder is not at the end of their life');
  assert(!isAtEndOfLife(full), 'An elder survives to the end of their stage');
  assert(isAtEndOfLife(gone), 'An elder passes once their grace days are up');
  assert(!isAtEndOfLife({ stage: 'adult', daysInStage: 9999 }), 'Only elders can pass of old age');

  assert(lifespanProgress(fresh) === 0, 'Lifespan progress starts at zero');
  assert(lifespanProgress(gone) === 1, 'Lifespan progress reaches one at the end');
  assert(
    lifespanProgress({ stage: 'adult', daysInStage: 20 }) === 0,
    'Adults have no lifespan progress to show',
  );
  assert(ELDER_GRACE_DAYS > 0, 'There is a grace period to say goodbye');
  assert(
    MOODLET_CATALOG.grieving !== undefined && MOODLET_CATALOG.grieving.intensity < 0,
    'Bereavement is a real, negative mood',
  );
}

// ------------------------ Ageing never skips past it ----------------------
{
  const ancient: Sim = {
    id: 'e', firstName: 'Old', lastName: 'Timer', gender: 'F', stage: 'elder',
    daysInStage: LIFE_STAGES.elder.days + ELDER_GRACE_DAYS + 5,
    traits: [], aspiration: 'family', avatar: 'x', accentColor: '#fff',
    career: null, atWork: false, relationships: {}, generation: 0, playable: true,
  };
  const aged = advanceAge(ancient, 1);
  assert(aged.sim.stage === 'elder', 'Ageing cannot push an elder past the final stage');
  assert(!aged.agedUp, 'No further ageing up happens after elder');
}

// --------------------------- Passing in play ------------------------------
{
  useLifeStore.getState().reset();
  useSimStore.getState().reset();
  useLifeStore.getState().createHousehold({
    name: 'Generations',
    sims: [
      cfg({ firstName: 'Grandma', stage: 'elder' }),
      cfg({ firstName: 'Mum', gender: 'F', stage: 'adult', traits: ['neat'] }),
      cfg({ firstName: 'Kid', gender: 'M', stage: 'child', traits: ['goofball'] }),
    ],
  });

  let home = useLifeStore.getState().household!;
  assert(home.sims.length === 3, 'Three generations live together');

  // Push the elder to the very end of their life.
  useLifeStore.setState((s) => ({
    household: s.household
      ? {
          ...s.household,
          sims: s.household.sims.map((m) =>
            m.id === home.sims[0].id
              ? { ...m, daysInStage: LIFE_STAGES.elder.days + ELDER_GRACE_DAYS }
              : m,
          ),
        }
      : s.household,
  }));

  // Make sure everybody is in the simulation so we can check their mood.
  useSimStore.getState().upsertAvatar(home.sims[1].id, 'Mum', ['neat']);
  useSimStore.getState().upsertAvatar(home.sims[2].id, 'Kid', ['goofball']);
  useSimStore.getState().upsertAvatar(home.sims[0].id, 'Grandma', []);

  const elderId = home.sims[0].id;
  useLifeStore.getState().advanceLifeDay(1, 2);
  home = useLifeStore.getState().household!;

  assert(!home.sims.some((s) => s.id === elderId), 'An elder at the end of their life passes away');
  assert(home.sims.length === 2, 'The rest of the family carries on');
  assert(
    home.sims.every((s) => s.relationships[elderId] === undefined),
    'The departed are removed from everyone\u2019s relationships',
  );
  assert(
    useSimStore.getState().avatars[elderId] === undefined,
    'They leave the simulation entirely',
  );
  assert(
    useLifeStore.getState().notifications.some((n) => n.text.includes('Grandma')),
    'Their passing is announced',
  );
  const grieving = home.sims.some(
    (s) => (useSimStore.getState().avatars[s.id]?.moodlets ?? []).some((m) => m.id === 'grieving'),
  );
  assert(grieving, 'The household grieves');
}

// --------------------- The last Sim cannot leave us -----------------------
{
  useLifeStore.getState().reset();
  useSimStore.getState().reset();
  useLifeStore.getState().createHousehold({
    name: 'Last One',
    sims: [cfg({ firstName: 'Solo', stage: 'elder' })],
  });
  useLifeStore.setState((s) => ({
    household: s.household
      ? {
          ...s.household,
          sims: s.household.sims.map((m) => ({
            ...m,
            daysInStage: LIFE_STAGES.elder.days + ELDER_GRACE_DAYS + 3,
          })),
        }
      : s.household,
  }));
  useLifeStore.getState().advanceLifeDay(1, 2);
  assert(
    useLifeStore.getState().household!.sims.length === 1,
    'A household of one is never emptied, so the game can always continue',
  );
}

console.log(`\nMortality Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
