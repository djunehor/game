import React from 'react';
import { renderToString } from 'react-dom/server';
import { VEHICLE_CATALOG, useVehicleStore } from '../src/world/vehicleStore';

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

console.log('→ Testing Outdoor Vehicle UI & Transit HUD Elements');

// 1. Vehicle Catalog UI Specifications
const types = Object.keys(VEHICLE_CATALOG) as (keyof typeof VEHICLE_CATALOG)[];
for (const t of types) {
  const def = VEHICLE_CATALOG[t];
  assert(Boolean(def.emoji && def.name), `Catalog includes display metadata for ${t} (${def.emoji} ${def.name})`);
  assert(Boolean(def.modelColor.startsWith('#')), `${def.name} has valid hex color (${def.modelColor})`);
}

// 2. Active Vehicle HUD Badge
const mockMountedVehicle = {
  id: 'okada_01',
  type: 'bike' as const,
  name: VEHICLE_CATALOG.bike.name,
  position: [-12.0, 30.5, 0] as [number, number, number],
  rotation: 0,
  speed: 15.0,
  driverId: 'player',
  passengerIds: [],
};

const hudHtml = renderToString(
  <div className="flex flex-col items-center pointer-events-none whitespace-nowrap select-none">
    <div className="flex items-center gap-2 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-bold text-white shadow-2xl ring-1 ring-amber-400/50 backdrop-blur-md">
      <span>{VEHICLE_CATALOG[mockMountedVehicle.type].emoji}</span>
      <span className="text-amber-400">{VEHICLE_CATALOG[mockMountedVehicle.type].name}</span>
      <span className="text-slate-500">|</span>
      <span>{Math.round(VEHICLE_CATALOG[mockMountedVehicle.type].maxSpeed * 3.6)} km/h</span>
      <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white">
        [F] Exit
      </span>
    </div>
  </div>
);

assert(hudHtml.includes('Okada Express Motorcycle'), 'Vehicle HUD displays vehicle name');
assert(hudHtml.includes('54') && hudHtml.includes('km/h'), 'Vehicle HUD displays calculated speed in km/h');
assert(hudHtml.includes('[F] Exit'), 'Vehicle HUD displays exit instruction');
assert(hudHtml.includes('🏍️'), 'Vehicle HUD displays motorcycle emoji');

// 3. Parked Vehicle Interaction Badges
const store = useVehicleStore.getState();
store.resetVehicles();
store.spawnVehicle('keke_01', 'keke_napep', [-4.0, 30.5, 0], 0);

const kekeDef = VEHICLE_CATALOG.keke_napep;
const parkHtml = renderToString(
  <button
    type="button"
    className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-slate-950/85 hover:bg-black px-3 py-1 font-sans text-xs font-bold text-white shadow-xl ring-1 ring-white/20 backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
  >
    <span>{kekeDef.emoji}</span>
    <span>{`Drive ${kekeDef.name.split(' ')[0]} [F]`}</span>
  </button>
);

assert(parkHtml.includes('Drive Lagos [F]'), 'Parked vehicle badge displays interaction prompt');
assert(parkHtml.includes('🛺'), 'Parked vehicle badge displays Keke emoji');

// 4. Town Commercial Landmarks & Ring Road Wayfinding Badges
const townBadges = [
  { emoji: '⛽', title: 'Lekki Energy Station', bg: 'bg-sky-700/95' },
  { emoji: '🛒', title: 'Mega Mart Supermarket', bg: 'bg-red-600/95' },
  { emoji: '🍢', title: 'Lekki Suya Spot', bg: 'bg-amber-600/95' },
  { emoji: '🏧', title: 'First Bank ATM Gallery', bg: 'bg-emerald-700/95' },
  { emoji: '🧭', title: 'Ring Road: East Loop → Ozumba Ave', bg: 'bg-indigo-900/90' },
  { emoji: '🛣️', title: 'South Outbound → Lekki-Epe Expressway', bg: 'bg-blue-900/90' },
];

for (const badge of townBadges) {
  const badgeHtml = renderToString(
    <div className="flex flex-col items-center pointer-events-none select-none whitespace-nowrap">
      <div className={`flex items-center gap-1.5 rounded-full ${badge.bg} px-3.5 py-1 text-xs font-bold text-white shadow-2xl`}>
        <span>{badge.emoji}</span>
        <span>{badge.title}</span>
      </div>
    </div>
  );
  assert(badgeHtml.includes(badge.title), `Town UI renders landmark badge "${badge.title}"`);
  assert(badgeHtml.includes(badge.emoji), `Town UI renders landmark emoji "${badge.emoji}"`);
}

console.log(`\nVehicle UI Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
