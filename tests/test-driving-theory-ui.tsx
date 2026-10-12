import React from 'react';
import { renderToString } from 'react-dom/server';
import { DrivingTheoryModal } from '../src/components/DrivingTheoryModal';
import { WalletHUD } from '../src/components/WalletHUD';
import { useTheoryExamStore } from '../src/world/theoryExamStore';
import { DRIVING_THEORY_SCENARIOS } from '../src/data/drivingTheoryScenarios';

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

console.log('→ Testing German Driving Theory UI Components & Exam Viewport');

// 1. Initial State: Closed Modal
const exam = useTheoryExamStore.getState();
exam.resetExam();

const closedHtml = renderToString(<DrivingTheoryModal />);
assert(closedHtml === '', 'DrivingTheoryModal renders null when closed');

// 2. Open Modal with Primary Scenario
exam.openExam('rechts_vor_links');
const openHtml = renderToString(<DrivingTheoryModal />);

assert(openHtml.includes('Fahrschule Theorieprüfung'), 'Modal renders official header title');
assert(openHtml.includes('Klasse B'), 'Modal designates license class (Klasse B)');
assert(openHtml.includes('Offizielle Videofrage'), 'Modal displays official video question badge');
assert(openHtml.includes('Tacho'), 'Modal renders dashboard speedometer indicator');
assert(openHtml.includes('Film wiederholen'), 'Modal renders replay button');
assert(openHtml.includes('von 5 verbleibend'), 'Modal renders remaining replays counter');
assert(openHtml.includes('Fehlerpunkte'), 'Modal renders fault points indicator');
assert(openHtml.includes('§ 8 Abs. 1 StVO'), 'Modal renders cited traffic law (§ 8 Abs. 1 StVO)');
assert(
  openHtml.includes('Wie verhalten Sie sich in dieser Situation richtig?') ||
  openHtml.includes('Wie verhalten Sie sich'),
  'Modal renders question text prompt'
);
assert(openHtml.includes('blau'), 'Modal lists blue car right-of-way option');
assert(openHtml.includes('Cockpit') && openHtml.includes('Draufsicht'), 'Modal renders camera perspective selectors');

// 3. Testing Question Options Interaction
exam.toggleOption(0);
const selectedHtml = renderToString(<DrivingTheoryModal />);
assert(selectedHtml.includes('Antwort abgeben'), 'Modal renders submit answer button');

// 4. Testing Post-Submission Feedback Banner
exam.submitAnswers();
const submittedHtml = renderToString(<DrivingTheoryModal />);
assert(
  submittedHtml.includes('Richtig beantwortet') ||
  submittedHtml.includes('Bestanden') ||
  submittedHtml.includes('Falsch beantwortet'),
  'Modal renders evaluation outcome after submitting'
);
assert(submittedHtml.includes('Nächste Videofrage'), 'Modal displays next question action button');

// 5. Switching to Cyclist Scenario
exam.openExam('radfahrer_abwaerts');
const cyclistHtml = renderToString(<DrivingTheoryModal />);
assert(cyclistHtml.includes('Außenspiegel'), 'Cyclist scenario displays exterior mirror warning');
assert(cyclistHtml.includes('Radfahrer'), 'Cyclist scenario renders cyclist prompt');

// 6. WalletHUD Integration
const hudHtml = renderToString(<WalletHUD />);
assert(hudHtml.includes('Fahrschule [T]'), 'WalletHUD renders Fahrschule quick launch button with [T] shortcut');

console.log(`\nGerman Driving Theory UI Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
