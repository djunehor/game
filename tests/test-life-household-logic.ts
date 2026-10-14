import { useLifeStore, STARTING_FUNDS, BILLS_PER_SIM } from '../src/life/lifeStore';
import { advanceAge, adjustRelationship, relationKindFor, stageProgress, canUseInteraction } from '../src/life/aging';
import { completeShift, isWorkDay, missShift, shiftFor, shiftPay, levelTitle, canBePromoted, PROMOTION_THRESHOLD } from '../src/life/careers';
import { CAREERS, LIFE_STAGES, LIFE_TRAITS, MAX_TRAITS, nextStage, STAGE_ORDER } from '../src/life/content';
import { CATALOG_BY_ID } from '../src/life/catalog';
import { useSimStore } from '../src/sim/simStore';
import { cumulativeXpForLevel } from '../src/sim/skills';
import type { NewSimConfig, Sim } from '../src/life/types';

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

const simConfig = (over: Partial<NewSimConfig> = {}): NewSimConfig => ({
  firstName: 'Ada',
  lastName: 'Okafor',
  gender: 'F',
  stage: 'youngAdult',
  traits: ['cheerful', 'active'],
  aspiration: 'popularity',
  avatar: '😎',
  accentColor: '#e63946',
  career: 'tech',
  ...over,
});

console.log('→ Testing Household, Careers, Ageing & Relationships');

// --------------------------------- Setup ----------------------------------
useLifeStore.getState().reset();
useSimStore.getState().reset();

assert(LIFE_TRAITS.length >= 12, `There are plenty of traits to choose from (${LIFE_TRAITS.length})`);
assert(MAX_TRAITS === 3, 'Sims are limited to three traits');
assert(STAGE_ORDER.length === 6, 'Six life stages exist');
assert(nextStage('youngAdult') === 'adult' && nextStage('elder') === null, 'Stage progression terminates at elder');

// ------------------------------ Household --------------------------------
{
  useLifeStore.getState().createHousehold({
    name: 'The Okafor Family',
    sims: [simConfig(), simConfig({ firstName: 'Chidi', gender: 'M', stage: 'teen', career: null })],
  });
  const h = useLifeStore.getState().household!;
  assert(h.sims.length === 2, 'Household created with both Sims');
  assert(h.funds === STARTING_FUNDS, `Household starts with ₦${STARTING_FUNDS.toLocaleString()}`);
  assert(h.lot.length > 0, 'Household starts with a furnished lot');
  assert(
    h.sims[0].relationships[h.sims[1].id] !== undefined,
    'Household members start knowing each other',
  );
  assert(useLifeStore.getState().selectedSimId === h.sims[0].id, 'The first Sim is selected by default');
}

// ------------------------------ Buy / sell --------------------------------
{
  const before = useLifeStore.getState().household!.funds;
  useLifeStore.getState().startPlacing('plant');
  const plot = useLifeStore.getState().household!.plot;
  useLifeStore.getState().setGhost(plot.originX + 2, plot.originZ + 2);
  useLifeStore.getState().confirmPlace();
  const after = useLifeStore.getState().household!;
  assert(after.lot.some((o) => o.catalogId === 'plant' && o.x === plot.originX + 2), 'Buying places the object');
  assert(after.funds === before - CATALOG_BY_ID['plant'].price, 'Buying deducts the price');

  const uid = after.lot.find((o) => o.catalogId === 'plant' && o.x === plot.originX + 2)!.uid;
  useLifeStore.getState().sellObject(uid);
  const sold = useLifeStore.getState().household!;
  assert(!sold.lot.some((o) => o.uid === uid), 'Selling removes the object');
  assert(sold.funds > after.funds, 'Selling refunds money');

  // Illegal placement is refused and costs nothing.
  const fundsNow = useLifeStore.getState().household!.funds;
  useLifeStore.getState().startPlacing('camp_bed');
  const sofa = useLifeStore.getState().household!.lot.find((o) => o.catalogId === 'sofa')!;
  useLifeStore.getState().setGhost(sofa.x, sofa.z); // on top of the sofa
  useLifeStore.getState().confirmPlace();
  assert(
    useLifeStore.getState().household!.funds === fundsNow &&
      useLifeStore.getState().household!.lot.filter((o) => o.catalogId === 'camp_bed').length === 0,
    'Illegal placement is refused without charging the household',
  );

  // Can't buy what you can't afford.
  useLifeStore.setState((s) => ({ household: s.household ? { ...s.household, funds: 100 } : s.household }));
  const poor = useLifeStore.getState().household!;
  useLifeStore.getState().startPlacing('hot_tub');
  useLifeStore.getState().setGhost(plot.originX + 4, plot.originZ + 6);
  useLifeStore.getState().confirmPlace();
  assert(
    useLifeStore.getState().household!.funds === poor.funds,
    'An unaffordable purchase is refused',
  );
  useLifeStore.setState((s) => ({ household: s.household ? { ...s.household, funds: 50000 } : s.household }));
}

// -------------------------------- Careers ---------------------------------
{
  const tech = { id: 'tech' as const, level: 0, performance: 0, shiftsWorked: 0 };
  assert(isWorkDay(tech, 1), 'Tech works on Monday');
  assert(!isWorkDay(tech, 7), 'Tech does not work on Sunday');
  assert(shiftFor(tech, 7) === null, 'No shift on a day off');
  assert(shiftPay(tech) === CAREERS.tech.levels[0].pay, 'Pay comes from the current level');
  assert(levelTitle({ ...tech, level: 2 }) === CAREERS.tech.levels[2].title, 'Job title tracks the level');

  const sim: Sim = {
    ...useLifeStore.getState().household!.sims[0],
    career: { ...tech },
  };
  const noSkill = completeShift(sim, {});
  assert(noSkill.paid === CAREERS.tech.levels[0].pay, 'A completed shift pays the level rate');
  assert(noSkill.career.performance > 0, 'Working builds performance');
  assert(!noSkill.promoted, 'No promotion without the required skill');

  // With the skill and near-max performance, the next shift promotes.
  const ready = {
    ...sim,
    career: { ...tech, performance: PROMOTION_THRESHOLD - 1 },
  };
  const skills = { logic: { xp: cumulativeXpForLevel(4) } };
  assert(canBePromoted(ready.career, skills), 'Sim is promotable with the right skill');
  const promoted = completeShift(ready, skills);
  assert(promoted.promoted && promoted.career.level === 1, 'Promotion fires and bumps the level');
  assert(promoted.career.performance === 0, 'Promotion resets performance');

  assert(missShift(tech).performance === 0, 'Performance floors at zero when a shift is missed');
  const penalised = missShift({ ...tech, performance: 50 });
  assert(penalised.performance === 25, 'Missing a shift costs performance');

  // Top of the ladder cannot be promoted further.
  const top = { id: 'tech' as const, level: CAREERS.tech.levels.length - 1, performance: 99, shiftsWorked: 0 };
  assert(!canBePromoted(top, { logic: { xp: 999999 } }), 'The top of the ladder is capped');
}

// ------------------------------ Go to work --------------------------------
{
  const sims = useLifeStore.getState().household!.sims;
  const worker = sims.find((s) => s.career)!;
  const fundsBefore = useLifeStore.getState().household!.funds;
  useLifeStore.getState().goToWork(worker.id);
  const after = useLifeStore.getState().household!;
  assert(after.funds > fundsBefore, 'Going to work pays the household');
  assert(useLifeStore.getState().workedToday[worker.id] === true, 'The shift is marked as worked');

  const fundsAfter = after.funds;
  useLifeStore.getState().goToWork(worker.id);
  assert(useLifeStore.getState().household!.funds === fundsAfter, 'A second shift the same day pays nothing');

  const teen = sims.find((s) => !s.career)!;
  useLifeStore.getState().startCareer(teen.id, 'artist');
  assert(
    useLifeStore.getState().household!.sims.find((s) => s.id === teen.id)?.career === null,
    'Teens cannot take an adult job',
  );
}

// ------------------------------- Ageing -----------------------------------
{
  const baby: Sim = { ...useLifeStore.getState().household!.sims[0], stage: 'baby', daysInStage: 0 };
  const notYet = advanceAge(baby, 1);
  assert(!notYet.agedUp && notYet.sim.stage === 'baby', 'A baby does not age up after one day');

  const birthday = advanceAge(baby, LIFE_STAGES.baby.days);
  assert(birthday.agedUp && birthday.sim.stage === 'child', 'A baby becomes a child at the end of the stage');

  const jump = advanceAge(baby, LIFE_STAGES.baby.days + LIFE_STAGES.child.days);
  assert(jump.sim.stage === 'teen', 'A long time skip can cross multiple stages');

  const elder: Sim = { ...baby, stage: 'elder', daysInStage: LIFE_STAGES.elder.days - 1 };
  const last = advanceAge(elder, 5);
  assert(last.sim.stage === 'elder', 'Elders do not age past the final stage');

  assert(stageProgress({ ...baby, daysInStage: LIFE_STAGES.baby.days / 2 }) === 0.5, 'Stage progress is a 0–1 fraction');

  assert(LIFE_STAGES.baby.skillCap === 0, 'Babies cannot hold skills');
  assert(Object.values(LIFE_STAGES).every((m) => m.days > 0), 'Every life stage has a duration');
  assert(LIFE_STAGES.teen.skillCap < LIFE_STAGES.adult.skillCap, 'Skill cap grows with age');

  assert(
    !canUseInteraction({ stage: 'child' }, { stages: ['child', 'teen'] }) === false,
    'Stage-gated interactions are available to a matching stage',
  );
  assert(
    canUseInteraction({ stage: 'adult' }, { stages: ['child', 'teen'] }) === false,
    'Stage-gated interactions are hidden from the wrong stage',
  );
  assert(canUseInteraction({ stage: 'adult' }, {}), 'Ungated interactions are open to everyone');
}

// ---------------------------- Relationships -------------------------------
{
  const rel = adjustRelationship({ friendship: 0, romance: 0, kind: 'stranger' }, { friendship: 45 });
  assert(rel.friendship === 45 && rel.kind === 'friend', 'Friendship builds and relabels');
  const best = adjustRelationship({ friendship: 70, romance: 0, kind: 'friend' }, { friendship: 10 });
  assert(best.kind === 'bestFriend', 'High friendship becomes best friend');
  const enemy = adjustRelationship({ friendship: -40, romance: 0, kind: 'acquaintance' }, { friendship: -20 });
  assert(enemy.kind === 'enemy', 'Very negative friendship becomes enemy');
  const partner = adjustRelationship({ friendship: 70, romance: 35, kind: 'friend' }, { romance: 10 });
  assert(partner.kind === 'partner', 'Romance crosses into partner');
  const spouse = adjustRelationship({ friendship: 70, romance: 55, kind: 'partner' }, { romance: 10 });
  assert(spouse.kind === 'spouse', 'Deep romance and friendship becomes spouse');
  const clamped = adjustRelationship({ friendship: 95, romance: 95, kind: 'friend' }, { friendship: 50, romance: 50 });
  assert(clamped.friendship === 100 && clamped.romance === 100, 'Relationship meters clamp at 100');
  assert(relationKindFor({ friendship: 0, romance: 0 }) === 'stranger', 'Zero meters read as strangers');
}

// ------------------------------ Day rollover ------------------------------
{
  useLifeStore.getState().reset();
  useSimStore.getState().reset();
  useLifeStore.getState().createHousehold({
    name: 'Test House',
    sims: [simConfig(), simConfig({ firstName: 'Chidi', gender: 'M', career: 'culinary' })],
  });

  const start = useLifeStore.getState().household!;
  const startingFunds = start.funds;
  const daysBefore = start.sims[0].daysInStage;

  // Tuesday rollover: no bills, everyone ages a day.
  useLifeStore.getState().advanceLifeDay(1, 2);
  const afterOne = useLifeStore.getState().household!;
  assert(afterOne.sims.every((s) => s.daysInStage === daysBefore + 1), 'Sims age one day on rollover');
  assert(afterOne.funds <= startingFunds, 'A normal day does not add money');

  // Monday rollover charges bills.
  const beforeBills = useLifeStore.getState().household!.funds;
  useLifeStore.getState().advanceLifeDay(2, 1);
  const billed = useLifeStore.getState().household!;
  const expectedBill = Math.round(billed.lot.length * 12 + billed.sims.length * BILLS_PER_SIM);
  assert(billed.funds === beforeBills - expectedBill, `Monday charges bills (₦${expectedBill})`);
  assert(
    useLifeStore.getState().notifications.some((n) => n.kind === 'money'),
    'Bills raise a notification',
  );

  // Re-processing the same day is a no-op.
  const fundsNow = useLifeStore.getState().household!.funds;
  useLifeStore.getState().advanceLifeDay(2, 1);
  assert(useLifeStore.getState().household!.funds === fundsNow, 'The same day offset is only processed once');

  // A career Sim who did not work loses performance.
  const worker = useLifeStore.getState().household!.sims.find((s) => s.career)!;
  useLifeStore.setState((s) => ({
    household: s.household
      ? { ...s.household, sims: s.household.sims.map((x) => (x.id === worker.id && x.career ? { ...x, career: { ...x.career, performance: 60 } } : x)) }
      : s.household,
    workedToday: {},
  }));
  useLifeStore.getState().advanceLifeDay(3, 2); // Tuesday — a work day
  const missed = useLifeStore.getState().household!.sims.find((s) => s.id === worker.id)!;
  assert(missed.career!.performance < 60, 'Missing a shift costs performance on rollover');
}

// -------------------------- Household management --------------------------
{
  const before = useLifeStore.getState().household!.sims.length;
  useLifeStore.getState().addSim(simConfig({ firstName: 'Ngozi', stage: 'adult' }));
  assert(useLifeStore.getState().household!.sims.length === before + 1, 'New Sims can move in');

  const added = useLifeStore.getState().household!.sims.at(-1)!;
  assert(
    added.relationships[useLifeStore.getState().household!.sims[0].id] !== undefined,
    'A new Sim is introduced to the household',
  );

  useLifeStore.getState().removeSim(added.id);
  assert(useLifeStore.getState().household!.sims.length === before, 'Sims can move out');
  assert(
    useLifeStore.getState().household!.sims.every((s) => s.relationships[added.id] === undefined),
    'Relationship entries are cleaned up when a Sim leaves',
  );
}

console.log(`\nLife Household Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
