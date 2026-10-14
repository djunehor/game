import { sound } from '../src/engine/sound';

// ---------------------------------------------------------------------------
// Sound: a tiny synthesiser, silent-safe.
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

console.log('→ Testing Sound Engine');

// Headless Node has no AudioContext at all: every cue must be a safe no-op.
let threw = false;
try {
  sound.play('click');
  sound.play('deny');
  sound.play('purchase');
  sound.play('complete');
  sound.play('levelUp');
  sound.play('milestone');
  sound.play('birthday');
  sound.play('warning');
} catch {
  threw = true;
}
assert(!threw, 'Every cue is silent when there is no audio device');
assert(typeof sound.muted === 'boolean', 'The engine exposes a mute state');

const before = sound.muted;
const after = sound.toggleMute();
assert(after === !before, 'Toggling flips the mute state');
assert(sound.toggleMute() === before, 'Toggling again restores it');

// Muted playback must stay a no-op.
sound.muted = true;
let mutedThrew = false;
try {
  sound.play('milestone');
} catch {
  mutedThrew = true;
}
assert(!mutedThrew, 'Muted playback is a no-op');
sound.muted = false;

console.log(`\nSound Engine Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
