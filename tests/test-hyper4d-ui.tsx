import React from 'react';
import { renderToString } from 'react-dom/server';
import { Hyper4DModal } from '../src/components/Hyper4DModal';
import { WalletHUD } from '../src/components/WalletHUD';
import { useHyper4DStore } from '../src/world/hyper4DStore';

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

console.log('→ Testing 4D Hyper-Dimensional UI Components & Observatory Viewport');

// 1. Initial State: Closed Modal
const hStore = useHyper4DStore.getState();
hStore.reset4D();

const closedHtml = renderToString(<Hyper4DModal />);
assert(closedHtml === '', 'Hyper4DModal renders null when closed');

// 2. Open Modal with Tesseract
hStore.open4D();
const openHtml = renderToString(<Hyper4DModal />);

assert(openHtml.includes('4D Hyper-Space Observatory'), 'Modal renders observatory header title');
assert(openHtml.includes('Real-time 4D Projection'), 'Modal renders 4D projection badge');
assert(openHtml.includes('Tesseract'), 'Modal renders Tesseract selector card');
assert(openHtml.includes('16-Cell'), 'Modal renders 16-Cell selector card');
assert(openHtml.includes('24-Cell'), 'Modal renders 24-Cell selector card');
assert(openHtml.includes('Clifford Torus'), 'Modal renders Clifford Torus selector card');
assert(openHtml.includes('XW Plane'), 'Modal renders XW hyper-plane slider');
assert(openHtml.includes('YW Plane'), 'Modal renders YW hyper-plane slider');
assert(openHtml.includes('ZW Plane'), 'Modal renders ZW hyper-plane slider');
assert(openHtml.includes('4D Perspective Distance'), 'Modal renders 4D projection camera distance slider');
assert(openHtml.includes('Cyber Cyan'), 'Modal renders Cyber Cyan color theme');
assert(openHtml.includes('Imperial Gold'), 'Modal renders Imperial Gold color theme');
assert(openHtml.includes('4D Hyper-Crown'), 'Modal renders avatar 4D crown toggle button');
assert(openHtml.includes('Fire Cash Cannon'), 'Modal renders Cash Cannon trigger button');
assert(openHtml.includes('P_3D = P_4D / (d - W)'), 'Modal displays mathematical projection formula');

// 3. WalletHUD Integration
const hudHtml = renderToString(<WalletHUD />);
assert(hudHtml.includes('4D Space [H]'), 'WalletHUD renders 4D Space quick launcher with [H] shortcut');
assert(hudHtml.includes('Spray ₦ [K]'), 'WalletHUD renders Saturday night spray cash button with [K] shortcut');

console.log(`\n4D Hyper-Dimensional UI Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
