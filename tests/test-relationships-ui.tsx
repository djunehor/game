import React from 'react';
import { renderToString } from 'react-dom/server';
import { RelationshipsPanel } from '../src/components/RelationshipsPanel';

// RelationshipsPanel is store-connected, and renderToString sees the initial
// store snapshot (a fresh install has no household), so this verifies it is
// safe to render before any household exists.
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

console.log('→ Testing Relationships Panel UI');

let threw = false;
let html = '';
try {
  html = renderToString(<RelationshipsPanel />);
} catch {
  threw = true;
}
assert(!threw, 'The panel renders safely before a household exists');
assert(html === '', 'It renders nothing at all when there is no household');

console.log(`\nRelationships Panel UI Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
