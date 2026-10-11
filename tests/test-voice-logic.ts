import { cleanSpeechText, getHousemateVoiceParams, voice } from '../src/engine/voice';
import { sound } from '../src/engine/sound';
import { AI_HOUSEMATES } from '../src/data/housemates';

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

console.log('→ Testing Speech Synthesis Voice Engine Logic');

// 1. Text Sanitization
const rawTextWithEmojis = 'Welcome to Biggie’s House! 🛋️ Please take a seat 🥰 and chill 🍜!';
const cleaned = cleanSpeechText(rawTextWithEmojis);
assert(!cleaned.includes('🛋️') && !cleaned.includes('🥰') && !cleaned.includes('🍜'), 'cleanSpeechText strips all emojis from speech payload');
assert(cleaned.includes('Welcome to Biggie’s House!') && cleaned.includes('chill'), 'cleanSpeechText preserves readable spoken words');

const markdownText = 'Welcome to **Biggie’s House** with _style_!';
const cleanedMarkdown = cleanSpeechText(markdownText);
assert(!cleanedMarkdown.includes('**') && !cleanedMarkdown.includes('_'), 'cleanSpeechText removes markdown asterisks and underscores');

// 2. Character Voice Parameter Mapping (Female vs Male Pitch & Rate)
const femaleHousemate = AI_HOUSEMATES.find((h) => h.gender === 'F')!;
const maleHousemate = AI_HOUSEMATES.find((h) => h.gender === 'M')!;

const femaleParams = getHousemateVoiceParams(femaleHousemate);
const maleParams = getHousemateVoiceParams(maleHousemate);

assert(femaleParams.pitch >= 1.15 && femaleParams.pitch <= 1.45, `Female voice pitch (${femaleParams.pitch.toFixed(2)}) is in higher vocal frequency range [1.15, 1.45]`);
assert(maleParams.pitch >= 0.85 && maleParams.pitch <= 1.10, `Male voice pitch (${maleParams.pitch.toFixed(2)}) is in baritone vocal frequency range [0.85, 1.10]`);
assert(femaleParams.pitch > maleParams.pitch, 'Female housemate voice pitch is higher than male housemate voice pitch');

// Deterministic voice parameter consistency
const femaleParamsRepeat = getHousemateVoiceParams(femaleHousemate);
assert(femaleParams.pitch === femaleParamsRepeat.pitch && femaleParams.rate === femaleParamsRepeat.rate, 'Voice parameters are deterministic per housemate id');

// 3. Voice Engine Method Safety (Node.js & SSR resilience)
let voiceThrown = false;
try {
  voice.speak('Hello Big Brother');
  voice.speakBiggie('Housemates, assemble in the lounge immediately.');
  voice.speakHousemate(femaleHousemate, 'No vex for me abeg!');
  voice.speakHousemate(maleHousemate, 'General Pere reporting for duty.');
  voice.stop();
} catch (err) {
  voiceThrown = true;
}
assert(!voiceThrown, 'VoiceEngine methods execute safely without throwing in headless environments');

// 4. Mute Synchronization
sound.muted = true;
assert(voice.enabled === false, 'Setting sound.muted = true disables voice synthesis');
sound.muted = false;
assert(voice.enabled === true, 'Setting sound.muted = false re-enables voice synthesis');

console.log(`\nVoice Engine Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
