import { createSimAvatar, enqueueInteraction, cancelActive, clearQueue, tickAvatar } from '../src/sim/engine';
import { getInteraction } from '../src/sim/interactions';
import { MOTIVE_IDS, type Motives } from '../src/sim/types';
import { getSkillLevel, cumulativeXpForLevel } from '../src/sim/skills';
import { SPEED_MULTIPLIER, clockParts, createClock, isNightHour, simMinutesFor } from '../src/sim/time';
import { useSimStore } from '../src/sim/simStore';

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

const now = 0;
const noAutonomy = { now, autonomyEnabled: false };

console.log('→ Testing Sim Engine, Clock & Speed Control');

// --------------------------------- Clock ----------------------------------
{
  const clock = createClock(1, 8);
  assert(clockParts(clock).time === '08:00', 'Clock starts at the configured hour');
  assert(clockParts(clock).dayName === 'Monday', 'Clock starts on the configured weekday');

  const later = clockParts({ ...clock, totalMinutes: 90 });
  assert(later.time === '09:30', 'Clock advances minutes correctly');

  const midnight = clockParts({ ...clock, totalMinutes: 16 * 60 });
  assert(midnight.time === '00:00', 'Clock rolls over midnight');
  assert(midnight.dayName === 'Tuesday', 'Clock rolls over to the next day');

  assert(clockParts({ ...clock, totalMinutes: 7 * 24 * 60 }).dayName === 'Monday', 'Clock wraps the week');
  assert(isNightHour(23) && isNightHour(3) && !isNightHour(12), 'Night detection works');

  assert(simMinutesFor(10, 0, clock) === 0, 'Paused time advances zero sim minutes');
  assert(simMinutesFor(10, 1, clock) === 10, 'Speed 1 advances 1 minute per second');
  assert(simMinutesFor(10, 2, clock) === 10 * SPEED_MULTIPLIER[2], 'Speed 2 uses the fast multiplier');
  assert(simMinutesFor(10, 3, clock) === 10 * SPEED_MULTIPLIER[3], 'Speed 3 uses the ultra multiplier');
}

// ------------------------------ Interaction --------------------------------
{
  const sim = createSimAvatar('ai-1', 'Ada', 'Peace Maker');
  const started = tickAvatar(sim, 0, { ...noAutonomy, autonomyEnabled: false });
  assert(started.avatar.active === null, 'An idle Sim with autonomy off does nothing');

  // Order a shower and run it to completion.
  const ordered = enqueueInteraction({ ...sim, motives: full(30) }, 'shower');
  assert(ordered.active?.defId === 'shower', 'Ordering while idle starts the interaction immediately');
  assert(ordered.active?.startedBy === 'player', 'Player orders are marked as player-issued');

  const shower = getInteraction('shower')!;
  const before = ordered.motives.hygiene;
  const midway = tickAvatar(ordered, shower.minutes / 2, noAutonomy);
  assert(midway.completed === null, 'A half-finished interaction does not complete');
  assert((midway.avatar.active?.elapsed ?? 0) > 0, 'Interaction progress accumulates across ticks');

  const done = tickAvatar(midway.avatar, shower.minutes, noAutonomy);
  assert(done.completed?.id === 'shower', 'Interaction completes once the duration elapses');
  assert(done.avatar.active === null, 'Sim is idle again after completing');
  // Hygiene was topped up from ~30 and then drained a little during the run.
  assert(done.avatar.motives.hygiene > before, 'Completing an interaction restores the target motive');
  assert(
    done.avatar.moodlets.some((m) => m.id === 'squeaky_clean'),
    'Completion grants the interaction moodlet',
  );
  assert(
    getSkillLevel(done.avatar.skills, 'cooking') === 0,
    'Interactions without skill XP do not award any',
  );
}

// -------------------------------- Skills ----------------------------------
{
  const base = createSimAvatar('ai-2', 'Bola', 'Clout Chaser');
  const cooking = getInteraction('cook_meal')!;
  const result = tickAvatar(enqueueInteraction(base, 'cook_meal'), cooking.minutes, noAutonomy);
  assert(
    (result.avatar.skills.cooking?.xp ?? 0) === (cooking.skillXp?.cooking ?? 0),
    'Completion awards the interaction skill XP',
  );
  const leveled = tickAvatar(
    enqueueInteraction(
      { ...base, skills: { cooking: { xp: cumulativeXpForLevel(1) - 1 } } },
      'cook_meal',
    ),
    cooking.minutes,
    noAutonomy,
  );
  assert(leveled.levelUps.some((l) => l.skill === 'cooking'), 'Crossing an XP threshold reports a level-up');
}

// -------------------------------- Queue -----------------------------------
{
  const base = { ...createSimAvatar('ai-3', 'Chidi', 'Strategic Schemer'), motives: full(40) };
  let sim = enqueueInteraction(base, 'eat_leftovers');
  sim = enqueueInteraction(sim, 'use_toilet');
  sim = enqueueInteraction(sim, 'shower');
  assert(sim.queue.length === 2, 'Ordering while busy queues the extra interactions');

  const eat = tickAvatar(sim, getInteraction('eat_leftovers')!.minutes, noAutonomy);
  assert(eat.completed?.id === 'eat_leftovers', 'The first order completes first');
  assert(eat.started?.id === 'use_toilet', 'The next queued order starts automatically');
  assert(eat.avatar.queue.length === 1, 'The queue drains in order');

  const cancelled = cancelActive(eat.avatar);
  assert(cancelled.active === null, 'Cancel stops the active interaction');
  const cleared = clearQueue(cancelled);
  assert(cleared.queue.length === 0, 'Clear empties the queue');

  const bogus = enqueueInteraction(base, 'not_a_real_interaction');
  assert(bogus.active === null && bogus.queue.length === 0, 'Unknown interaction ids are rejected');
}

// ------------------------------- Autonomy ---------------------------------
{
  const starving = { ...createSimAvatar('ai-4', 'Dami', 'Gentle Giant'), motives: { ...full(80), hunger: 2 } };
  const ticked = tickAvatar(starving, 1, { now, autonomyEnabled: true });
  assert(ticked.started !== null, 'With autonomy on, an empty Sim starts acting on its own');
  assert(
    (ticked.started?.motiveDeltas.hunger ?? 0) > 0,
    `Autonomous choice addresses the critical need (picked ${ticked.started?.label})`,
  );
  assert(ticked.avatar.active?.startedBy === 'autonomy', 'Autonomous actions are marked as such');

  const content = { ...createSimAvatar('ai-5', 'Efe', 'Peace Maker'), motives: full(97) };
  const idle = tickAvatar(content, 1, { now, autonomyEnabled: true });
  assert(idle.started === null, 'A fully satisfied Sim stays idle even with autonomy on');

  // The HoH gate is respected by the engine.
  const tired = { ...createSimAvatar('ai-6', 'Femi', 'Gentle Giant'), motives: { ...full(60), energy: 1 } };
  const gated = tickAvatar(tired, 1, { now, autonomyEnabled: true, allowed: (d) => d.room !== 'HoH Suite' });
  assert(gated.started?.room !== 'HoH Suite', 'Engine respects the allowed() gate when choosing autonomously');
}

// --------------------------- Live store ticking ----------------------------
{
  useSimStore.getState().reset();
  useSimStore.getState().upsertAvatar('player', 'Me', 'Peace Maker');
  useSimStore.getState().upsertAvatar('ai-9', 'Tunde', 'Pepper Dem');
  assert(Object.keys(useSimStore.getState().avatars).length === 2, 'Store seeds multiple Sims');

  const before = useSimStore.getState().clock.totalMinutes;
  useSimStore.getState().setSpeed(1);
  useSimStore.getState().tick(10);
  const after = useSimStore.getState().clock.totalMinutes;
  assert(after > before, 'Store tick advances the world clock');

  const pausedBefore = useSimStore.getState().clock.totalMinutes;
  useSimStore.getState().setSpeed(0);
  useSimStore.getState().tick(10);
  assert(
    useSimStore.getState().clock.totalMinutes === pausedBefore,
    'Paused clock does not advance while ticking',
  );

  useSimStore.getState().setSpeed(1);
  const av = useSimStore.getState().avatars['ai-9'];
  const beforeHunger = av.motives.hunger;
  useSimStore.getState().tick(600); // 10 sim hours
  assert(
    useSimStore.getState().avatars['ai-9'].motives.hunger < beforeHunger,
    'Long ticks drain motives for every Sim in the store',
  );
  assert(useSimStore.getState().events.length > 0, 'Store records sim events (completions / level-ups)');

  // Player ordering through the store (clear whatever autonomy started first).
  useSimStore.getState().cancel('player');
  useSimStore.getState().order('player', 'play_ludo');
  assert(useSimStore.getState().avatars['player'].active?.defId === 'play_ludo', 'Store accepts player orders');
  useSimStore.getState().cancel('player');
  assert(useSimStore.getState().avatars['player'].active === null, 'Store can cancel the active interaction');

  useSimStore.getState().reset();
  assert(Object.keys(useSimStore.getState().avatars).length === 0, 'Store reset clears all Sims');
}

console.log(`\nSim Engine Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
