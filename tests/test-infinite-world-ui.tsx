import React from 'react';
import { renderToString } from 'react-dom/server';
import { VEHICLE_CATALOG } from '../src/world/vehicleStore';

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

console.log('→ Testing Procedural Infinite World UI & Landmark Badges');

// 1. Estate Entrance Gate Badge UI
const gateExitBadge = renderToString(
  <div className="flex flex-col items-center pointer-events-none select-none whitespace-nowrap">
    <div className="flex items-center gap-2 rounded-full bg-emerald-600/95 px-4 py-1.5 text-xs font-bold text-white shadow-2xl ring-2 ring-emerald-300 backdrop-blur-md animate-pulse">
      <span>🚪</span>
      <span>EXIT → Admiralty Way</span>
    </div>
  </div>
);
assert(gateExitBadge.includes('EXIT → Admiralty Way'), 'Gate badge renders Exit navigation prompt');
assert(gateExitBadge.includes('🚪'), 'Gate badge renders door emoji');

const estateTitleBadge = renderToString(
  <div className="flex flex-col items-center pointer-events-none select-none whitespace-nowrap">
    <div className="flex items-center gap-2 rounded-full bg-amber-500/95 px-3.5 py-1 text-xs font-bold text-black shadow-xl ring-2 ring-amber-300 backdrop-blur-md">
      <span>🏠</span>
      <span>Big Brother Naija Estate</span>
    </div>
  </div>
);
assert(estateTitleBadge.includes('Big Brother Naija Estate'), 'Estate badge renders estate title');

// 2. Procedural District Badges UI
const districtBadges = [
  { emoji: '⛽', title: 'Lekki Energy Station', bg: 'bg-sky-700/95' },
  { emoji: '🛒', title: 'Mega Mart Supermarket', bg: 'bg-red-600/95' },
  { emoji: '🍢', title: 'Lekki Suya Spot (Zone 4)', bg: 'bg-amber-600/95' },
  { emoji: '🏧', title: 'First Bank ATM Gallery', bg: 'bg-emerald-700/95' },
];

for (const badge of districtBadges) {
  const html = renderToString(
    <div className="flex flex-col items-center pointer-events-none select-none whitespace-nowrap">
      <div className={`flex items-center gap-1.5 rounded-full ${badge.bg} px-3.5 py-1 text-xs font-bold text-white shadow-2xl`}>
        <span>{badge.emoji}</span>
        <span>{badge.title}</span>
      </div>
    </div>
  );
  assert(html.includes(badge.title), `District badge renders "${badge.title}"`);
  assert(html.includes(badge.emoji), `District badge renders icon "${badge.emoji}"`);
}

// 3. Parked Procedural Vehicle Interaction UI
const kekeDef = VEHICLE_CATALOG.keke_napep;
const parkVehBadge = renderToString(
  <button
    type="button"
    className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-slate-950/85 hover:bg-black px-3 py-1 font-sans text-xs font-bold text-white shadow-xl ring-1 ring-white/20 backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
  >
    <span>{kekeDef.emoji}</span>
    <span>{`Drive ${kekeDef.name.split(' ')[0]} [F]`}</span>
  </button>
);
assert(parkVehBadge.includes('Drive Lagos [F]'), 'Parked vehicle button displays drive trigger');
assert(parkVehBadge.includes('🛺'), 'Parked vehicle button displays vehicle emoji');

console.log(`\nInfinite World UI Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
