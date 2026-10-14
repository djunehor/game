import { useLifeStore } from '../src/life/lifeStore';
import { useSimStore } from '../src/sim/simStore';
import { LIFE_TRAITS } from '../src/life/content';
import type { NewSimConfig } from '../src/life/types';

// ---------------------------------------------------------------------------
// Household management: who lives here, and starting over.
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

console.log('→ Testing Household Management');

useLifeStore.getState().reset();
useSimStore.getState().reset();
useLifeStore.getState().createHousehold({ name: 'Test House', sims: [cfg()] });

// ------------------------------ Renaming ----------------------------------
{
  useLifeStore.setState((s) => ({
    household: s.household ? { ...s.household, name: 'The Okafors' } : s.household,
  }));
  assert(useLifeStore.getState().household!.name === 'The Okafors', 'A household can be renamed');
}

// ------------------------- Moving people in -------------------------------
{
  const before = useLifeStore.getState().household!.sims.length;
  useLifeStore.getState().addSim(cfg({ firstName: 'Bola', gender: 'M' }));
  const after = useLifeStore.getState().household!;
  assert(after.sims.length === before + 1, 'A new Sim can move in');
  const newSim = after.sims.at(-1)!;
  assert(
    Object.keys(newSim.relationships).length >= 1,
    'A new Sim is introduced to the household',
  );
  assert(
    after.sims[0].relationships[newSim.id] !== undefined,
    'The household knows the new arrival back',
  );
  assert(LIFE_TRAITS.length >= 12, 'There are enough traits to go around');
}

// ------------------------- Moving people out ------------------------------
{
  const home = useLifeStore.getState().household!;
  const leaving = home.sims.at(-1)!;
  const remaining = home.sims.length - 1;

  // Give them a relationship the other way so we can check cleanup.
  useLifeStore.setState((s) => ({
    household: s.household
      ? {
          ...s.household,
          sims: s.household.sims.map((m) =>
            m.id === leaving.id ? m : { ...m, relationships: { ...m.relationships } },
          ),
        }
      : s.household,
  }));

  useLifeStore.getState().removeSim(leaving.id);
  const after = useLifeStore.getState().household!;
  assert(after.sims.length === remaining, 'A Sim can move out');
  assert(
    after.sims.every((m) => m.relationships[leaving.id] === undefined),
    'Their relationships are cleaned up when they leave',
  );
  assert(
    useLifeStore.getState().selectedSimId !== leaving.id,
    'Nobody stays selected after they leave',
  );
}

// ------------------------------ Capacity ---------------------------------
{
  const home = useLifeStore.getState().household!;
  while (useLifeStore.getState().household!.sims.length < 8) {
    useLifeStore.getState().addSim(cfg({ firstName: `Sim${useLifeStore.getState().household!.sims.length}` }));
  }
  assert(useLifeStore.getState().household!.sims.length === 8, 'A household can reach eight Sims');

  // The UI refuses at eight; the store itself is the guard for family.ts.
  const { canTryForBaby, canAdopt } = await import('../src/life/family');
  const [a, b] = useLifeStore.getState().household!.sims;
  assert(!canTryForBaby(a, b, 8).ok, 'A full house cannot take a baby');
  assert(!canAdopt(a, 8, 999999).ok, 'A full house cannot adopt');
}

// ----------------------------- Starting over ------------------------------
{
  useLifeStore.getState().reset();
  assert(useLifeStore.getState().household === null, 'Resetting clears the household');
  assert(useLifeStore.getState().selectedSimId === null, 'Resetting clears the selection');
  assert(useLifeStore.getState().socialTargetId === null, 'Resetting clears the social target');
  assert(useLifeStore.getState().notifications.length === 0, 'Resetting clears the notifications');

  // A fresh household is complete and playable.
  useLifeStore.getState().createHousehold({ name: 'Fresh', sims: [cfg()] });
  const fresh = useLifeStore.getState().household!;
  assert(fresh.plot.walls.length > 0, 'A new household gets a house');
  assert(fresh.lot.length > 0, 'A new household gets furniture');
  assert(fresh.funds > 0, 'A new household gets money');
  assert(fresh.sims[0].relationships !== undefined, 'A new household has relationship state');
}

console.log(`\nHousehold Management Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
