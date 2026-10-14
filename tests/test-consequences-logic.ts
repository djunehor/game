import { CONSEQUENCES, applyConsequenceEffects, pendingConsequence } from '../src/life/consequences';
import { MOTIVE_IDS, type Motives } from '../src/sim/types';
import { applyMotiveDeltas } from '../src/sim/motives';

// ---------------------------------------------------------------------------
// Consequences: what happens when a need is left at zero.
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

function full(value = 70): Motives {
  const m = {} as Motives;
  for (const id of MOTIVE_IDS) m[id] = value;
  return m;
}

console.log('→ Testing Consequences & Stakes');

// ------------------------------- Definitions ------------------------------
{
  const ids = new Set(CONSEQUENCES.map((c) => c.id));
  assert(ids.size === CONSEQUENCES.length, `Consequence ids are unique (${CONSEQUENCES.length})`);
  assert(
    CONSEQUENCES.every((c) => c.cooldownMinutes > 0),
    'Every consequence has a cooldown so it cannot loop',
  );
  assert(
    CONSEQUENCES.every((c) => MOTIVE_IDS.includes(c.motive)),
    'Every consequence is tied to a real motive',
  );
  assert(
    CONSEQUENCES.every((c) => c.moodlet.minutes > 0 && c.message('Ada').includes('Ada')),
    'Every consequence has a mood and a message naming the Sim',
  );
  const covered = new Set(CONSEQUENCES.map((c) => c.motive));
  assert(
    ['hunger', 'bladder', 'energy', 'fun', 'social'].every((m) => covered.has(m as never)),
    `The motives a Sim can die of are all covered (${[...covered].join(', ')})`,
  );
}

// ------------------------------ Triggering --------------------------------
{
  assert(pendingConsequence(full(80), {}, 0) === null, 'A comfortable Sim suffers nothing');
  assert(
    pendingConsequence({ ...full(80), energy: 40 }, {}, 0) === null,
    'A merely tired Sim suffers nothing',
  );

  const tired = pendingConsequence({ ...full(80), energy: 0 }, {}, 0);
  assert(tired?.id === 'collapse', 'Running out of energy makes a Sim collapse');

  const desperate = pendingConsequence({ ...full(80), bladder: 0 }, {}, 0);
  assert(desperate?.id === 'accident', 'Running out of bladder causes an accident');

  const starving = pendingConsequence({ ...full(80), hunger: 0 }, {}, 0);
  assert(starving?.id === 'faint', 'Starving makes a Sim faint');

  const bored = pendingConsequence({ ...full(80), fun: 0 }, {}, 0);
  assert(bored?.id === 'meltdown', 'Zero fun causes a meltdown');

  const lonely = pendingConsequence({ ...full(80), social: 0 }, {}, 0);
  assert(lonely?.id === 'lonely_spiral', 'Total isolation causes withdrawal');
}

// ------------------------------ Cooldowns ---------------------------------
{
  const prone = { ...full(80), energy: 0 };
  const first = pendingConsequence(prone, {}, 0);
  assert(first !== null, 'The first collapse fires');

  const collapse = CONSEQUENCES.find((c) => c.id === 'collapse')!;
  const during = pendingConsequence(prone, { collapse: 0 }, collapse.cooldownMinutes - 1);
  assert(during === null, 'It cannot fire again inside the cooldown');

  const after = pendingConsequence(prone, { collapse: 0 }, collapse.cooldownMinutes + 1);
  assert(after?.id === 'collapse', 'It can fire again once the cooldown lapses');
}

// ------------------------------- Severity ---------------------------------
{
  // A Sim in total crisis should collapse, not merely sulk.
  const wrecked = { ...full(0) };
  const worst = pendingConsequence(wrecked, {}, 0);
  assert(worst !== null && worst.interrupts, `The worst state picks an interrupting consequence (${worst?.id})`);
}

// ------------------------------- Effects ---------------------------------
{
  const accident = CONSEQUENCES.find((c) => c.id === 'accident')!;
  const before = { ...full(50), bladder: 0 };
  const after = applyConsequenceEffects(before, accident, applyMotiveDeltas);
  assert(after.bladder > before.bladder, 'The accident relieves the bladder');
  assert(after.hygiene < before.hygiene, 'The accident costs hygiene');
  assert(after.environment < before.environment, 'The accident makes the room worse');
  assert(
    MOTIVE_IDS.every((id) => after[id] >= 0 && after[id] <= 100),
    'Effects stay within bounds',
  );

  const collapse = CONSEQUENCES.find((c) => c.id === 'collapse')!;
  const afterCollapse = applyConsequenceEffects({ ...full(50), energy: 0 }, collapse, applyMotiveDeltas);
  assert(afterCollapse.energy > 0, 'A collapsed Sim is put to bed rather than left at zero');
  assert(collapse.interrupts, 'Collapsing interrupts whatever they were doing');
  assert(!CONSEQUENCES.find((c) => c.id === 'meltdown')!.interrupts, 'A meltdown does not interrupt');
}

console.log(`\nConsequence Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
