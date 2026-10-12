import { DRIVING_THEORY_SCENARIOS } from '../src/data/drivingTheoryScenarios';
import { useTheoryExamStore } from '../src/world/theoryExamStore';
import { useEconomyStore } from '../src/world/economyStore';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

console.log('→ Testing German Driving Theory Exam Logic & StVO Simulations');

// 1. Catalog Verification
assert(DRIVING_THEORY_SCENARIOS.length >= 3, 'Driving theory catalog contains at least 3 official video scenarios');

for (const sc of DRIVING_THEORY_SCENARIOS) {
  assert(Boolean(sc.id && sc.titleGerman && sc.titleEnglish), `Scenario ${sc.id} has valid German/English titles`);
  assert(sc.durationSeconds > 5 && sc.durationSeconds <= 15, `Scenario ${sc.id} duration (${sc.durationSeconds}s) matches official 10-15s exam length`);
  assert(sc.freezeAtSecond < sc.durationSeconds, `Scenario ${sc.id} freezes at ${sc.freezeAtSecond}s before duration ends`);
  assert(sc.points >= 2 && sc.points <= 5, `Scenario ${sc.id} specifies valid German error points (${sc.points} Fehlerpunkte)`);
  assert(Boolean(sc.stvoSection), `Scenario ${sc.id} cites legal traffic code (${sc.stvoSection})`);
  assert(sc.options.length >= 3, `Scenario ${sc.id} offers multiple choice options (${sc.options.length} options)`);
  assert(sc.options.some((o) => o.isCorrect), `Scenario ${sc.id} has at least one correct option`);
}

// 2. Theory Exam Store Initialization
const store = useTheoryExamStore.getState();
store.resetExam();

assert(useTheoryExamStore.getState().isOpen === false, 'Exam initially closed');
assert(useTheoryExamStore.getState().replaysRemaining === 5, 'Maximum replays initialized to official limit of 5');
assert(useTheoryExamStore.getState().playbackTime === 0, 'Playback starts at t=0');

// 3. Opening Exam & Starting Playback
store.openExam('rechts_vor_links');
assert(useTheoryExamStore.getState().isOpen === true, 'Exam opens successfully');
assert(useTheoryExamStore.getState().isPlaying === true, 'Playback automatically starts on open');
assert(useTheoryExamStore.getState().currentScenarioId === 'rechts_vor_links', 'Current scenario is set to rechts_vor_links');

// 4. Playback Tick & Critical Moment Freeze
store.tick(3.0);
assert(useTheoryExamStore.getState().playbackTime === 3.0, 'Playback ticks forward by 3.0 seconds');
assert(useTheoryExamStore.getState().isFrozen === false, 'Playback not frozen before freeze threshold');

// Advance past freeze point (8.5s for rechts_vor_links)
store.tick(6.0); // Total 9.0s -> should freeze at 8.5s
assert(useTheoryExamStore.getState().playbackTime === 8.5, 'Playback clamps precisely at freeze point (8.5s)');
assert(useTheoryExamStore.getState().isFrozen === true, 'Simulation freezes at critical hazard moment');
assert(useTheoryExamStore.getState().isPlaying === false, 'Playback halts automatically when frozen');

// 5. Official Replay Mechanics (Max 5 Views)
store.replay();
assert(useTheoryExamStore.getState().playbackTime === 0, 'Replay resets playback position to 0');
assert(useTheoryExamStore.getState().isPlaying === true, 'Replay restarts video animation');
assert(useTheoryExamStore.getState().isFrozen === false, 'Replay unfreezes simulation');
assert(useTheoryExamStore.getState().replaysRemaining === 4, 'Remaining replays decremented to 4');

// Exhaust replays
for (let i = 0; i < 4; i++) {
  store.replay();
}
assert(useTheoryExamStore.getState().replaysRemaining === 0, 'Replays reach 0 after 5 uses');
store.replay(); // Attempt 6th replay
assert(useTheoryExamStore.getState().replaysRemaining === 0, 'Replays cannot decrement below 0');

// 6. Option Selection and StVO Evaluation
store.openExam('rechts_vor_links');
// Options for rechts_vor_links:
// id 0: Yield to blue car (Correct)
// id 1: Drive first (Incorrect)
// id 2: Green car yields to me (Correct)

store.toggleOption(0);
assert(useTheoryExamStore.getState().selectedOptionIds.includes(0), 'Option 0 selected');
store.toggleOption(2);
assert(useTheoryExamStore.getState().selectedOptionIds.includes(2), 'Option 2 selected');

// Test submitting correct answers
const startingBalance = useEconomyStore.getState().walletBalance;
const passResult = store.submitAnswers();

assert(passResult.isPassed === true, 'Evaluation passes when all correct options are selected');
assert(passResult.faultPointsAwarded === 0, 'Passed exam incurs 0 fault points (Fehlerpunkte)');
assert(passResult.scorePercent === 100, 'Score is 100%');
assert(useEconomyStore.getState().walletBalance === startingBalance + 10000, 'Passing exam awards ₦10,000 cash bonus to player wallet');

// 7. Testing Incorrect Answers & Error Points
store.openExam('rechts_vor_links');
store.toggleOption(1); // Choose only the wrong option ("I may drive first")
const failResult = store.submitAnswers();

assert(failResult.isPassed === false, 'Evaluation correctly fails when choosing false option');
assert(failResult.faultPointsAwarded === 5, 'Failed exam incurs official 5 error points');
assert(failResult.rewardEarnedNaira === 0, 'Failed exam awards 0 cash reward');

// 8. Cyclist Scenario Turn Indicator Check
store.openExam('radfahrer_abwaerts');
assert(useTheoryExamStore.getState().currentScenarioId === 'radfahrer_abwaerts', 'Switches to cyclist blind spot scenario');
assert(useTheoryExamStore.getState().indicatorActive === 'right', 'Right turn indicator automatically activated for right turn test');

console.log(`\nGerman Driving Theory Logic Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
