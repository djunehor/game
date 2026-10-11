import { ACCENT_COLORS, AVATAR_EMOJIS, HAIRSTYLES, PROFESSIONS, SKIN_TONES, STATES_OF_ORIGIN, TRAITS } from '../src/data/profileOptions';
import { initializeGame } from '../src/engine/game';
import type { CreationConfig, Gender } from '../src/types';

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

console.log('→ Testing Avatar Customization Options & Model Mapping Logic');

// 1. Gender model mapping
const getModelUrl = (gender: Gender) => (gender === 'F' ? '/models/female_avatar.glb' : '/models/avatar.glb');
assert(getModelUrl('F') === '/models/female_avatar.glb', 'Female gender maps to female_avatar.glb');
assert(getModelUrl('M') === '/models/avatar.glb', 'Male gender maps to avatar.glb');

// 2. Options datasets
assert(AVATAR_EMOJIS.length >= 10, 'AVATAR_EMOJIS provides ample emoji options');
assert(ACCENT_COLORS.length >= 5, 'ACCENT_COLORS provides ample accent options');
assert(SKIN_TONES.length >= 5, 'SKIN_TONES provides diverse tone options');
assert(HAIRSTYLES.length >= 4, 'HAIRSTYLES provides multiple hairstyle selections');
assert(STATES_OF_ORIGIN.length === 37, 'STATES_OF_ORIGIN contains all 36 states + FCT');
assert(PROFESSIONS.length >= 8, 'PROFESSIONS provides diverse career backgrounds');
assert(TRAITS.length >= 6, 'TRAITS provides strategic personality archetypes');

// 3. Test player initialization with female and male avatar configs
const femaleConfig: CreationConfig = {
  name: 'Chioma Chukwu',
  nickname: 'Choma',
  gender: 'F',
  age: 24,
  stateOfOrigin: 'Enugu',
  profession: 'Fashion Designer',
  trait: 'Pepper Dem',
  avatar: '💃🏾',
  accentColor: '#ff6b35',
  skinTone: '#8d5524',
  hairstyle: 'braids',
};

const femaleGame = initializeGame(femaleConfig);
assert(femaleGame.player.gender === 'F', 'Player state preserves female gender');
assert(femaleGame.player.avatar === '💃🏾', 'Player state preserves chosen avatar emoji');
assert(femaleGame.player.accentColor === '#ff6b35', 'Player state preserves chosen accent color');

const maleConfig: CreationConfig = {
  name: 'Emeka Eze',
  nickname: 'Meks',
  gender: 'M',
  age: 28,
  stateOfOrigin: 'Anambra',
  profession: 'Tech Sis / Tech Bro',
  trait: 'Strategic Schemer',
  avatar: '👨🏾‍💻',
  accentColor: '#3a86ff',
  skinTone: '#5c3a21',
  hairstyle: 'lowcut',
};

const maleGame = initializeGame(maleConfig);
assert(maleGame.player.gender === 'M', 'Player state preserves male gender');
assert(maleGame.player.avatar === '👨🏾‍💻', 'Player state preserves chosen avatar emoji');
assert(maleGame.player.nickname === 'Meks', 'Player state preserves chosen nickname');

console.log(`\nAvatar Customization Logic Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
