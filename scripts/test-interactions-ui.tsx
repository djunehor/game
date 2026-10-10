import React from 'react';
import { renderToString } from 'react-dom/server';
import { initializeGame } from '../src/engine/game';
import { HousemateList } from '../src/components/HousemateList';
import { DialogueModal } from '../src/components/DialogueModal';
import { DiaryRoomModal } from '../src/components/DiaryRoomModal';
import { EmoteBar } from '../src/components/EmoteBar';
import { GuidedTourModal } from '../src/components/GuidedTourModal';
import { OnboardingModal } from '../src/components/OnboardingModal';
import { useGame } from '../src/store';
import { useTour } from '../src/three/tourStore';
import type { CreationConfig } from '../src/types';

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

const config: CreationConfig = {
  name: 'Tola Adeleke',
  nickname: 'Tola',
  gender: 'F',
  age: 26,
  stateOfOrigin: 'Oyo',
  profession: 'Corporate Lawyer',
  trait: 'Strategic Schemer',
  avatar: '👑',
  accentColor: '#9333ea',
  skinTone: '#c98a5b',
  hairstyle: 'lowcut',
};

const state = initializeGame(config);
useGame.setState({ state });

console.log('→ Testing HousemateList Component UI');
const htmlList = renderToString(<HousemateList state={state} onTalk={() => {}} />);
assert(htmlList.includes('💬 Talk'), 'HousemateList renders "💬 Talk" action button');
assert(htmlList.includes(state.housemates[0].nickname), 'HousemateList renders housemate nickname');
assert(htmlList.includes('cursor-pointer'), 'Talk button has interactive cursor-pointer style');

console.log('→ Testing DialogueModal Component UI');
const target = state.housemates[0];
const htmlModal = renderToString(<DialogueModal housemate={target} player={state.player} onClose={() => {}} />);
assert(htmlModal.includes(`Talk with ${target.nickname}`), 'DialogueModal renders target housemate header');
assert(htmlModal.includes('Relationship Standing'), 'DialogueModal renders relationship standing bar');
assert(htmlModal.includes('Conspire on Nominations'), 'DialogueModal renders Conspire option');
assert(htmlModal.includes('Cook &amp; Share Food') || htmlModal.includes('Cook & Share Food'), 'DialogueModal renders Cook & Share Food option');
assert(htmlModal.includes('Pitch Secret Alliance'), 'DialogueModal renders Alliance option');
assert(htmlModal.includes('Gist &amp; Spill Tea') || htmlModal.includes('Gist & Spill Tea'), 'DialogueModal renders Gist option');
assert(htmlModal.includes('Choose your move:'), 'DialogueModal displays action prompt');

console.log('→ Testing DiaryRoomModal Component UI');
const htmlDiary = renderToString(<DiaryRoomModal player={state.player} onClose={() => {}} />);
assert(htmlDiary.includes('Big Brother Diary Room'), 'DiaryRoomModal renders title');
assert(htmlDiary.includes('Biggie Speaks:'), 'DiaryRoomModal renders Biggie Speaks callout');
assert(htmlDiary.includes('Select your confessional response:'), 'DiaryRoomModal prompts for response');
assert(htmlDiary.includes('Expose the Schemers with Full Chest'), 'DiaryRoomModal renders first confessional option');

console.log('→ Testing EmoteBar Component UI');
const htmlEmote = renderToString(<EmoteBar />);
assert(htmlEmote.includes('Wave'), 'EmoteBar renders Wave button');
assert(htmlEmote.includes('Dance'), 'EmoteBar renders Dance button');
assert(htmlEmote.includes('Hype'), 'EmoteBar renders Hype button');
assert(htmlEmote.includes('Clapback'), 'EmoteBar renders Clapback button');
assert(htmlEmote.includes('Hug'), 'EmoteBar renders Hug button');

console.log('→ Testing 3D Tour Broadcast Overlay & Onboarding UI');
useTour.getState().startTour();

const htmlTour = renderToString(<GuidedTourModal onClose={() => {}} />);
assert(htmlTour.includes('LIVE 3D TOUR'), 'GuidedTourModal renders live 3D tour indicator');
assert(htmlTour.includes('ROOM 1/7'), 'GuidedTourModal renders ROOM 1/7 counter');
assert(htmlTour.includes('Skip Tour'), 'GuidedTourModal renders Skip Tour action');
assert(htmlTour.includes('Next Room →'), 'GuidedTourModal renders Next Room button');
assert(htmlTour.includes('Big Brother:'), 'GuidedTourModal renders Big Brother broadcast speech');
assert(!htmlTour.includes('bg-ink/94'), 'GuidedTourModal has zero modal dialog card containers');
assert(htmlTour.includes('pointer-events-none'), 'GuidedTourModal wrapper has pointer-events-none to leave 3D scene fully visible');

const htmlOnboarding = renderToString(<OnboardingModal />);
assert(htmlOnboarding.includes('LIVE 3D TOUR'), 'OnboardingModal embeds 3D tour broadcast');

console.log(`\nUI Tests Summary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}

