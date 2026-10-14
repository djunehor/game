import {
  ADOPTION_COST,
  BABY_MIN_ROMANCE,
  PREGNANCY_DAYS,
  blendColors,
  canAdopt,
  canTryForBaby,
  createBaby,
  dueBirths,
  familyRelationshipKinds,
  inheritAppearance,
  inheritTraits,
} from '../src/life/family';
import { LIFE_TRAITS, LIFE_STAGES } from '../src/life/content';
import { useLifeStore } from '../src/life/lifeStore';
import { useSimStore } from '../src/sim/simStore';
import type { NewSimConfig, Sim } from '../src/life/types';

// ---------------------------------------------------------------------------
// Family: children, inheritance, and the family tree.
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
  traits: ['cheerful', 'creative'],
  aspiration: 'family',
  avatar: '😎',
  accentColor: '#e63946',
  skinTone: '#c98a5b',
  hairstyle: 'afro',
  career: null,
  ...over,
});

const TRAIT_IDS = LIFE_TRAITS.map((t) => t.id);

console.log('→ Testing Family & Genetics');

// ------------------------------- Colour -----------------------------------
{
  assert(blendColors('#000000', '#ffffff') === '#808080', 'Mixing black and white gives grey');
  assert(blendColors('#ff0000', '#ff0000') === '#ff0000', 'Mixing a colour with itself is a no-op');
  assert(blendColors('#000000', '#ffffff', 1) === '#000000', 'Weighting fully to one parent keeps their colour');
  const mid = blendColors('#123456', '#654321', 0.5);
  assert(/^#[0-9a-f]{6}$/.test(mid), `Blended colours are valid hex (${mid})`);
}

// ------------------------------ Traits ------------------------------------
{
  const mother = { id: 'm', traits: ['neat', 'cheerful'] } as Sim;
  const father = { id: 'f', traits: ['creative', 'foodie'] } as Sim;

  const traits = inheritTraits([mother, father], TRAIT_IDS);
  assert(traits.length <= 3, `A child never has more than three traits (${traits.join(', ')})`);
  assert(new Set(traits).size === traits.length, 'A child never inherits the same trait twice');
  assert(
    traits.every((t) => TRAIT_IDS.includes(t)),
    'Every inherited trait is a real trait',
  );
  assert(
    traits.some((t) => ['neat', 'cheerful', 'creative', 'foodie'].includes(t)),
    'A child takes after at least one parent',
  );

  const again = inheritTraits([mother, father], TRAIT_IDS);
  assert(JSON.stringify(traits) === JSON.stringify(again), 'Inheritance is deterministic for the same parents');

  const other = inheritTraits([{ id: 'x', traits: ['lazy', 'gloomy'] } as Sim], TRAIT_IDS);
  assert(JSON.stringify(other) !== JSON.stringify(traits), 'Different parents give a different child');

  const loner = inheritTraits([{ id: 'z', traits: [] } as Sim], TRAIT_IDS);
  assert(loner.length >= 1 && loner.every((t) => TRAIT_IDS.includes(t)), 'A parent with no traits still yields a valid child');
}

// ---------------------------- Appearance ----------------------------------
{
  const a = { avatar: 'A', accentColor: '#000000', hairstyle: 'afro', skinTone: '#000000' } as Sim;
  const b = { avatar: 'B', accentColor: '#ffffff', hairstyle: 'locs', skinTone: '#ffffff' } as Sim;
  const look = inheritAppearance([a, b], 0.3);
  assert(['A', 'B'].includes(look.avatar), 'A child takes one parent\u2019s face');
  assert(['#000000', '#ffffff'].includes(look.accentColor ?? ''), 'A child takes one parent\u2019s outfit colour');
  assert(['afro', 'locs'].includes(look.hairstyle ?? ''), 'A child takes one parent\u2019s hair');
  assert(look.skinTone === '#808080', 'A child\u2019s skin is blended from both parents');

  const oneParent = inheritAppearance([a], 0.5);
  assert(oneParent.skinTone === '#000000', 'A single parent passes their own skin tone through');
}

// ------------------------------- Babies -----------------------------------
{
  const parents = [
    { id: 'mum', lastName: 'Okafor', avatar: '😎', accentColor: '#e63946', skinTone: '#c98a5b', hairstyle: 'afro', traits: ['neat'] } as Sim,
    { id: 'dad', lastName: 'Okafor', avatar: '🤓', accentColor: '#22b573', skinTone: '#8d5524', hairstyle: 'lowcut', traits: ['foodie'] } as Sim,
  ];
  const baby = createBaby({ parents, availableTraits: TRAIT_IDS, roll: 0.4 });
  assert(baby.stage === 'baby', 'A newborn starts as a baby');
  assert(baby.lastName === 'Okafor', 'A child takes the family name');
  assert(baby.parentIds.length === 2, 'Both parents are recorded');
  assert(baby.firstName.length > 0, 'A newborn is given a name');
  assert(baby.traits.length >= 1 && baby.traits.length <= 3, 'A newborn has a personality');
  assert(['M', 'F'].includes(baby.gender), 'A newborn has a gender');
}

// --------------------------- Eligibility ----------------------------------
{
  const rel = (romance: number) => ({ friendship: 70, romance, kind: 'partner' as const });
  const mother = { id: 'a', gender: 'F', stage: 'adult', relationships: { b: rel(80) } } as unknown as Sim;
  const father = { id: 'b', gender: 'M', stage: 'adult', relationships: { a: rel(80) } } as unknown as Sim;
  const kid = { id: 'k', gender: 'F', stage: 'child', relationships: { b: rel(80) } } as unknown as Sim;

  assert(canTryForBaby(mother, father, 2).ok, 'A close adult couple can try for a baby');
  assert(!canTryForBaby(mother, mother, 2).ok, 'A Sim cannot have a baby alone');
  assert(!canTryForBaby(mother, kid, 2).ok, 'Children cannot have babies');
  assert(!canTryForBaby(mother, father, 8).ok, 'A full house cannot take another baby');

  const cold = { ...father, relationships: { a: rel(10) } } as unknown as Sim;
  const check = canTryForBaby(mother, cold, 2);
  assert(!check.ok, `A couple who barely know each other cannot conceive (needs romance ${BABY_MIN_ROMANCE})`);
  assert(Boolean(check.reason), 'The refusal explains itself');

  const expecting = { ...mother, pregnantUntilDayOffset: 5 } as unknown as Sim;
  assert(!canTryForBaby(expecting, father, 2).ok, 'Nobody conceives twice at once');

  assert(canAdopt(father, 2, 10000).ok, 'An adult with money can adopt');
  assert(!canAdopt(father, 2, ADOPTION_COST - 1).ok, 'Adoption is refused without the fee');
  assert(!canAdopt(kid, 2, 10000).ok, 'A child cannot adopt');
  assert(!canAdopt(father, 8, 10000).ok, 'A full house cannot adopt');
}

// ------------------------------ Births ------------------------------------
{
  const soon = { id: 'a', pregnantUntilDayOffset: 3 } as Sim;
  const later = { id: 'b', pregnantUntilDayOffset: 9 } as Sim;
  assert(dueBirths([soon, later], 2).length === 0, 'Nobody is due before their time');
  assert(dueBirths([soon, later], 3).length === 1, 'The baby arrives on the due day');
  assert(dueBirths([soon, later], 10).length === 2, 'Overdue births still arrive');
  assert(PREGNANCY_DAYS > 0, 'Pregnancy takes time');
}

// --------------------------- Family tree ----------------------------------
{
  const mum = { id: 'mum' } as Sim;
  const dad = { id: 'dad' } as Sim;
  const first = { id: 'c1', parentIds: ['mum', 'dad'] } as Sim;
  const second = { id: 'c2', parentIds: ['mum', 'dad'] } as Sim;

  const links = familyRelationshipKinds([mum, dad], second, [first]);
  const kinds = links.map((l) => `${l.simId}:${l.otherId}:${l.kind}`);
  assert(kinds.includes('mum:c2:parent'), 'A parent is linked to their child');
  assert(kinds.includes('c2:mum:child'), 'A child is linked to their parent');
  assert(kinds.includes('c2:c1:sibling'), 'Siblings are linked to each other');
  assert(kinds.includes('c1:c2:sibling'), 'Sibling links go both ways');
}

// --------------------- Birth happens in the household ---------------------
{
  useLifeStore.getState().reset();
  useSimStore.getState().reset();
  useLifeStore.getState().createHousehold({
    name: 'Family Test',
    sims: [
      cfg({ firstName: 'Mum', gender: 'F', traits: ['neat'] }),
      cfg({ firstName: 'Dad', gender: 'M', traits: ['foodie'], skinTone: '#8d5524' }),
    ],
  });
  let home = useLifeStore.getState().household!;
  const [mum, dad] = home.sims;

  // Not close enough yet.
  const before = home.sims.length;
  useLifeStore.getState().tryForBaby(mum.id, dad.id);
  assert(useLifeStore.getState().household!.sims.length === before, 'A distant couple cannot conceive');
  assert(
    useLifeStore.getState().household!.sims.every((s) => s.pregnantUntilDayOffset === undefined),
    'No pregnancy is started without the romance',
  );

  // Become a couple, then try again.
  useLifeStore.setState((s) => ({
    household: s.household
      ? {
          ...s.household,
          sims: s.household.sims.map((m) => ({
            ...m,
            relationships: Object.fromEntries(
              Object.entries(m.relationships).map(([id, rel]) => [id, { ...rel, friendship: 80, romance: 80 }]),
            ),
          })),
        }
      : s.household,
  }));
  useLifeStore.getState().tryForBaby(mum.id, dad.id);
  const expecting = useLifeStore.getState().household!.sims.find((s) => s.id === mum.id)!;
  assert(expecting.pregnantUntilDayOffset !== undefined, 'A close couple can conceive');

  // Day rollover brings the baby.
  const due = expecting.pregnantUntilDayOffset!;
  for (let day = 1; day <= due; day++) useLifeStore.getState().advanceLifeDay(day, 2);
  const afterBirth = useLifeStore.getState().household!;
  assert(afterBirth.sims.length === before + 1, `A baby is born (${before} → ${afterBirth.sims.length})`);

  const baby = afterBirth.sims.at(-1)!;
  assert(baby.stage === 'baby', 'The newborn is a baby');
  assert(baby.generation === 1, 'The next generation is recorded');
  assert(baby.parentIds?.length === 2, 'The baby knows both parents');
  assert(baby.skinTone !== undefined, 'The baby inherited a skin tone');
  assert(
    afterBirth.sims.find((s) => s.id === mum.id)!.pregnantUntilDayOffset === undefined,
    'The parent is no longer expecting',
  );
  assert(
    afterBirth.sims.find((s) => s.id === mum.id)!.relationships[baby.id].kind === 'parent',
    'The parent is linked as a parent',
  );
  assert(baby.relationships[mum.id].kind === 'child', 'The baby is linked as a child');

  // Adoption.
  const fundsBefore = useLifeStore.getState().household!.funds;
  const countBefore = useLifeStore.getState().household!.sims.length;
  useLifeStore.getState().adoptChild(dad.id);
  const adopted = useLifeStore.getState().household!;
  assert(adopted.sims.length === countBefore + 1, 'Adoption adds a child');
  assert(adopted.funds === fundsBefore - ADOPTION_COST, `Adoption costs ₦${ADOPTION_COST.toLocaleString()}`);
  assert(LIFE_STAGES.baby.canBeAlone === false, 'Babies cannot be left alone');
}

// ------------------- Life stages gate how good you can get ---------------
{
  const { createSimAvatar, enqueueInteraction, tickAvatar } = await import('../src/sim/engine');
  const { getInteraction } = await import('../src/sim/interactions');
  const { getSkillLevel } = await import('../src/sim/skills');
  const { MOTIVE_IDS } = await import('../src/sim/types');

  const base = () => {
    const avatar = createSimAvatar('kid', 'Kemi', ['goofball']);
    const motives = Object.fromEntries(MOTIVE_IDS.map((id) => [id, 70]));
    return { ...avatar, motives: motives as never };
  };

  const child = tickAvatar(
    enqueueInteraction({ ...base(), skillCap: LIFE_STAGES.child.skillCap }, 'cook_meal'),
    getInteraction('cook_meal')!.minutes,
    { now: 0, autonomyEnabled: false },
  );
  assert(
    getSkillLevel(child.avatar.skills, 'cooking') <= LIFE_STAGES.child.skillCap,
    `A child cannot out-skill their stage (${getSkillLevel(child.avatar.skills, 'cooking')} / cap ${LIFE_STAGES.child.skillCap})`,
  );

  const adult = tickAvatar(
    enqueueInteraction({ ...base(), skillCap: LIFE_STAGES.adult.skillCap }, 'cook_meal'),
    getInteraction('cook_meal')!.minutes,
    { now: 0, autonomyEnabled: false },
  );
  assert(
    (adult.avatar.skills.cooking?.xp ?? 0) > (child.avatar.skills.cooking?.xp ?? 0) ||
      getSkillLevel(adult.avatar.skills, 'cooking') >= getSkillLevel(child.avatar.skills, 'cooking'),
    'An adult keeps gaining where a child is capped',
  );
  assert(
    (adult.avatar.skills.cooking?.xp ?? 0) > 0,
    'Cooking awards experience',
  );
  assert(
    LIFE_STAGES.child.skillCap < LIFE_STAGES.adult.skillCap,
    'Children have a lower ceiling than adults',
  );
}

console.log(`\nFamily & Genetics Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
