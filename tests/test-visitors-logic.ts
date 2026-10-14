import { useLifeStore, registerLotInteractions } from '../src/life/lifeStore';
import { useSimStore } from '../src/sim/simStore';
import { evaluateVisitors, syncLifeSims } from '../src/life/bridge';
import { LIFE_TRAITS } from '../src/life/content';
import type { NewSimConfig } from '../src/life/types';

// ---------------------------------------------------------------------------
// Visitors: neighbours who come over, socialise, and go home.
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
  aspiration: 'popularity',
  avatar: '😎',
  accentColor: '#e63946',
  career: 'tech',
  ...over,
});

console.log('→ Testing Visitors');

useLifeStore.getState().reset();
useSimStore.getState().reset();
useLifeStore.getState().createHousehold({ name: 'Hosts', sims: [cfg()] });
registerLotInteractions(useLifeStore.getState().household!.lot);

// ------------------------------ Arriving ----------------------------------
{
  const before = useLifeStore.getState().household!.sims.length;
  useLifeStore.getState().inviteVisitor();
  const home = useLifeStore.getState().household!;
  assert(home.sims.length === before + 1, 'A neighbour can be invited over');

  const visitor = home.sims.at(-1)!;
  assert(visitor.visiting === true, 'They are marked as visiting rather than living here');
  assert(visitor.firstName.length > 0 && visitor.lastName.length > 0, 'A visitor has a name');
  assert(visitor.traits.length >= 1, 'A visitor has a personality');
  assert(
    visitor.traits.every((t) => LIFE_TRAITS.some((meta) => meta.id === t)),
    'A visitor\u2019s traits are real traits',
  );
  assert(visitor.career === null, 'A visitor has no job here');
  assert(
    home.sims[0].relationships[visitor.id] !== undefined,
    'The host is introduced to the visitor',
  );
  assert(
    visitor.relationships[home.sims[0].id] !== undefined,
    'The visitor knows the host back',
  );
  assert(typeof visitor.visitUntilMinute === 'number', 'The visit has an end time');
}

// --------------------------- They can socialise ---------------------------
{
  syncLifeSims();
  const home = useLifeStore.getState().household!;
  const visitor = home.sims.find((s) => s.visiting)!;
  assert(useSimStore.getState().avatars[visitor.id] !== undefined, 'A visitor is part of the simulation');

  useSimStore.getState().order(home.sims[0].id, 'social_chat', visitor.id);
  const active = useSimStore.getState().avatars[home.sims[0].id].active;
  assert(active?.targetSimId === visitor.id, 'You can have a conversation with a visitor');
}

// --------------------- They do not become residents -----------------------
{
  const home = useLifeStore.getState().household!;
  const residents = home.sims.filter((s) => !s.visiting).length;
  const visitors = home.sims.filter((s) => s.visiting).length;

  useLifeStore.getState().advanceLifeDay(1, 2);
  const after = useLifeStore.getState().household!;
  assert(residents === 1, 'Only the host actually lives here');
  assert(visitors === 1, 'One visitor is present');

  const resident = after.sims.find((s) => !s.visiting)!;
  const visitor = after.sims.find((s) => s.visiting)!;
  assert(resident.daysInStage === 1, 'Residents age a day');
  assert(visitor.daysInStage === 0, 'Visitors do not age while visiting');
}

// ----------------------------- Going home ---------------------------------
{
  const home = useLifeStore.getState().household!;
  const visitor = home.sims.find((s) => s.visiting)!;
  const count = home.sims.length;

  useLifeStore.getState().sendVisitorHome(visitor.id);
  const after = useLifeStore.getState().household!;
  assert(after.sims.length === count - 1, 'A visitor can be sent home');
  assert(
    after.sims.every((s) => s.relationships[visitor.id] === undefined),
    'Their relationship entries are cleaned up',
  );
  assert(
    useSimStore.getState().avatars[visitor.id] === undefined,
    'They leave the simulation entirely',
  );
}

// --------------------------- Leaving on their own -------------------------
{
  useLifeStore.getState().inviteVisitor();
  const visitor = useLifeStore.getState().household!.sims.find((s) => s.visiting)!;

  // Not due yet.
  evaluateVisitors();
  assert(
    useLifeStore.getState().household!.sims.some((s) => s.id === visitor.id),
    'A visitor stays while their visit is still going',
  );

  // Fast-forward past the end of the visit.
  useSimStore.setState((s) => ({
    clock: { ...s.clock, totalMinutes: (visitor.visitUntilMinute ?? 0) + 1 },
  }));
  evaluateVisitors();
  assert(
    !useLifeStore.getState().household!.sims.some((s) => s.id === visitor.id),
    'A visitor goes home when their visit is up',
  );
}

// ------------------------------ Capacity ----------------------------------
{
  for (let i = 0; i < 4; i++) useLifeStore.getState().inviteVisitor();
  const visitors = useLifeStore.getState().household!.sims.filter((s) => s.visiting).length;
  assert(visitors <= 3, `The house does not fill up with visitors (${visitors})`);
}

// ------------------------ Visitors do not pay bills -----------------------
{
  const home = useLifeStore.getState().household!;
  const residents = home.sims.filter((s) => !s.visiting).length;
  const visitors = home.sims.filter((s) => s.visiting).length;
  assert(visitors > 0, 'There are visitors present for the bill check');

  const fundsBefore = home.funds;
  useLifeStore.getState().advanceLifeDay(9, 1); // Monday: bills
  const after = useLifeStore.getState().household!;
  const expected = Math.round(after.lot.length * 12 + residents * 40);
  assert(
    after.funds === fundsBefore - expected,
    `Bills only count residents, not visitors (charged ₦${expected} for ${residents} resident)`,
  );
}

console.log(`\nVisitor Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
