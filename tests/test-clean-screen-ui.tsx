import React from 'react';
import { renderToString } from 'react-dom/server';
import { Hud } from '../src/components/Hud';
import { StoreModal } from '../src/components/StoreModal';
import { EmoteBar } from '../src/components/EmoteBar';
import { useGame } from '../src/store';

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

console.log('→ Testing Clean Screen & Removed BB Coins UI Components');

// Mock Game State with Clout and Strikes
const mockState = {
  phase: 'daily',
  day: 1,
  week: 1,
  gameOver: false,
  onboardingDone: true,
  phaseDone: false,
  player: {
    id: 'player_1',
    name: 'Ebuka Obi',
    nickname: 'Ebuka',
    gender: 'male',
    age: 28,
    avatar: '👑',
    accentColor: '#3b82f6',
    energy: 90,
    sanity: 85,
    hunger: 60,
    fanbaseClout: 25000,
    bbCoins: 50000,
    strikes: 1,
    relationships: {},
  },
  housemates: [],
} as any;

useGame.setState({ state: mockState });

// 1. Verify Hud UI
const hudHtml = renderToString(<Hud state={mockState} />);
assert(hudHtml.includes('Clout'), 'HUD renders Clout label');
assert(hudHtml.includes('25,000'), 'HUD renders Clout fanbase count');
assert(!hudHtml.includes('BB Coins'), 'HUD does NOT render BB Coins (successfully removed duplicate currency)');
assert(hudHtml.includes('Strikes'), 'HUD renders Strikes metric');

// 2. Verify StoreModal UI
const storeHtml = renderToString(<StoreModal state={mockState} onClose={() => {}} />);
assert(storeHtml.includes('Spend your Naira'), 'StoreModal subtitle references unified Naira currency');
assert(!storeHtml.includes('BB Coins'), 'StoreModal does NOT reference BB Coins');
console.log('storeHtml balance snippet:', storeHtml.slice(0, 500));
// 3. Verify EmoteBar UI
const emoteHtml = renderToString(<EmoteBar defaultOpen={false} />);
assert(emoteHtml.includes('Emotes'), 'EmoteBar renders compact collapsible toggle button');

console.log(`\nClean Screen UI Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
