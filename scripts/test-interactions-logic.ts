import { DIALOGUE_OPTIONS } from '../src/data/dialogue';
import { DIARY_SESSIONS } from '../src/data/diaryRoom';
import { STATIONS } from '../src/three/InteractiveObjects';
import { useEmote } from '../src/three/emoteStore';
import { useGame } from '../src/store';
import { initializeGame, resolveNominations } from '../src/engine/game';
import type { CreationConfig, Housemate } from '../src/types';

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

console.log('→ Testing Dialogue Options Definitions');
assert(DIALOGUE_OPTIONS.length >= 6, `At least 6 dialogue options exist (found ${DIALOGUE_OPTIONS.length})`);
const schemeOpt = DIALOGUE_OPTIONS.find((o) => o.id === 'scheme');
const shareFoodOpt = DIALOGUE_OPTIONS.find((o) => o.id === 'share_food');
const allianceOpt = DIALOGUE_OPTIONS.find((o) => o.id === 'alliance');
const gistOpt = DIALOGUE_OPTIONS.find((o) => o.id === 'gist');

assert(!!schemeOpt, 'Conspire on Nominations option exists');
assert(!!shareFoodOpt, 'Cook & Share Food option exists');
assert(!!allianceOpt, 'Pitch Secret Alliance option exists');
assert(!!gistOpt, 'Gist option exists');

console.log('→ Testing Interaction Logic Execution');
const state = initializeGame(config);
const player = state.player;
const target = state.housemates[0];

// Test scheme option
if (schemeOpt) {
  const result = schemeOpt.effect(player, target);
  assert(typeof result.playerReply === 'string' && result.playerReply.length > 0, 'scheme provides playerReply');
  assert(typeof result.targetReply === 'string' && result.targetReply.length > 0, 'scheme provides targetReply');
  assert(typeof result.affinityChange === 'number', 'scheme modifies affinity');
  assert(result.cloutGain > 0, 'scheme awards clout');
}

// Test share_food option
if (shareFoodOpt) {
  const result = shareFoodOpt.effect(player, target);
  assert(result.affinityChange > 0, 'share_food increases affinity');
  assert(result.standingChange > 0, 'share_food boosts house standing');
  assert(!!result.tweet, 'share_food produces tweet');
}

console.log('→ Testing Alliance & Nomination Protection Logic');
// Create an ally scenario: player affinity with target > 40
const allyTarget: Housemate = {
  ...target,
  relationships: { [player.id]: 50 },
};
// Test AI voter behavior when voter has affinity > 40 with someone
const aiVoters = state.housemates.slice(1);
const customState = {
  ...state,
  player: {
    ...player,
    relationships: { [allyTarget.id]: 50 },
  },
  housemates: [allyTarget, ...aiVoters],
};

const nomState = resolveNominations(customState, [aiVoters[0].id, aiVoters[1].id]);
assert(nomState.nominees.length >= 2, 'Nominations resolved correctly');

console.log('→ Testing Interactive 3D Stations Definitions');
assert(STATIONS.length >= 8, `At least 8 3D interactive stations exist (found ${STATIONS.length})`);
const diaryStation = STATIONS.find((s) => s.isDiaryRoom);
assert(!!diaryStation, 'Diary Room confessional station exists');
const cookerStation = STATIONS.find((s) => s.actionKey === 'cook_jollof');
assert(!!cookerStation, 'Cooker station exists');

console.log('→ Testing Biggie Diary Sessions');
assert(DIARY_SESSIONS.length >= 3, `At least 3 diary confessional sessions exist (found ${DIARY_SESSIONS.length})`);
const session1 = DIARY_SESSIONS[0];
assert(session1.options.length >= 2, 'Diary session has multiple confessional choices');
assert(session1.options[0].effect.clout > 0, 'Confessional choice modifies clout');

console.log('→ Testing Movement and Input Safety');
import { input, resetInput, setTarget } from '../src/three/input';
input.keys['KeyW'] = true;
input.keys['ShiftLeft'] = true;
input.moveVector = { x: 0.5, y: -0.5 };
setTarget(10, 20);
assert(input.keys['KeyW'] === true, 'Key is recorded in input');
assert(input.target?.x === 10, 'Target is set');
resetInput();
assert(Object.keys(input.keys).length === 0, 'resetInput clears all held keys');
assert(input.target === null, 'resetInput clears active movement target');
assert(input.moveVector.x === 0 && input.moveVector.y === 0, 'resetInput resets virtual joystick moveVector');

console.log('→ Testing Guided Tour Definitions & Flow');
import { GUIDED_TOUR_STEPS } from '../src/data/guidedTour';
assert(GUIDED_TOUR_STEPS.length >= 6, `Guided tour has at least 6 comprehensive steps (found ${GUIDED_TOUR_STEPS.length})`);
assert(GUIDED_TOUR_STEPS[0].id === 'welcome', 'Step 1 is Welcome');
assert(GUIDED_TOUR_STEPS[1].id === 'controls', 'Step 2 is Controls');
assert(GUIDED_TOUR_STEPS[2].id === 'social', 'Step 3 is Social Alliances');
assert(GUIDED_TOUR_STEPS[3].id === 'stations', 'Step 4 is Interactive Stations');
assert(GUIDED_TOUR_STEPS[4].id === 'diary', 'Step 5 is Biggie Diary Room');
assert(GUIDED_TOUR_STEPS[5].id === 'week_cycle', 'Step 6 is Weekly Eviction Loop');

for (const s of GUIDED_TOUR_STEPS) {
  assert(!!s.title && s.title.length > 3, `Step ${s.stepNumber} has valid title: ${s.title}`);
  assert(s.features.length >= 3, `Step ${s.stepNumber} has at least 3 feature highlights`);
  assert(!!s.tip && s.tip.length > 5, `Step ${s.stepNumber} has a pro tip`);
}

// Test completeOnboarding state transition
useGame.setState({
  state: {
    ...state,
    onboardingDone: false,
  },
});
assert(useGame.getState().state?.onboardingDone === false, 'State onboardingDone is initially false');
useGame.getState().completeOnboarding();
assert(useGame.getState().state?.onboardingDone === true, 'completeOnboarding sets onboardingDone to true');

console.log('→ Testing 3D Camera Tour Stops & Store');
import { useTour, TOUR_STOPS } from '../src/three/tourStore';
assert(TOUR_STOPS.length === 7, `3D tour covers all 7 rooms (found ${TOUR_STOPS.length})`);
assert(TOUR_STOPS[0].id === 'lounge', 'First stop is Lounge');
assert(TOUR_STOPS[1].id === 'kitchen', 'Second stop is Kitchen');
assert(TOUR_STOPS[2].id === 'diary', 'Third stop is Diary Room');
assert(TOUR_STOPS[3].id === 'bedroom', 'Fourth stop is Bedroom');
assert(TOUR_STOPS[4].id === 'hoh_suite', 'Fifth stop is HoH Suite');
assert(TOUR_STOPS[5].id === 'garden', 'Sixth stop is Garden');
assert(TOUR_STOPS[6].id === 'arena', 'Seventh stop is Arena');

for (const s of TOUR_STOPS) {
  assert(s.cameraPos.length === 3, `${s.name} has 3D cameraPos coordinates`);
  assert(s.lookAt.length === 3, `${s.name} has 3D lookAt coordinates`);
  assert(!!s.narration && s.narration.length > 10, `${s.name} has Biggie narration`);
}

// Test useTour store state transitions
useTour.getState().startTour();
assert(useTour.getState().isActive === true, 'startTour sets isActive to true');
assert(useTour.getState().currentStopIndex === 0, 'startTour initializes at stop 0');
useTour.getState().nextStop();
assert(useTour.getState().currentStopIndex === 1, 'nextStop advances to stop 1');
useTour.getState().prevStop();
assert(useTour.getState().currentStopIndex === 0, 'prevStop goes back to stop 0');
useTour.getState().jumpToStop(4);
assert(useTour.getState().currentStopIndex === 4, 'jumpToStop navigates directly to stop 4');
useTour.getState().endTour();
assert(useTour.getState().isActive === false, 'endTour sets isActive to false');

console.log('→ Testing Authentic BBNaija Compound & Interior Walls Architecture');
import { WALLS, collideWalls, PLAYER_SPAWN } from '../src/three/rooms';
assert(WALLS.length >= 15, `WALLS has comprehensive compound and room dividing walls (found ${WALLS.length})`);

const compoundWalls = WALLS.filter((w) => w.kind === 'compound');
assert(compoundWalls.length === 4, 'Four high security compound perimeter walls enclose North, South, West, and East');

const interiorWalls = WALLS.filter((w) => w.kind === 'interior');
assert(interiorWalls.length >= 8, 'Interior partition walls separate individual rooms with real doors');

// Test Player Spawn safety: spawn position must NOT intersect with any wall
const spawnPos = { x: PLAYER_SPAWN[0], z: PLAYER_SPAWN[1] };
collideWalls(spawnPos, 0.5);
assert(spawnPos.x === PLAYER_SPAWN[0] && spawnPos.z === PLAYER_SPAWN[1], 'Player spawn position is completely clear of walls');

// Test Doorway Clearances: doorway centers should allow passage
const kitchenDoorway = { x: -16, z: -5 };
collideWalls(kitchenDoorway, 0.5);
assert(Math.abs(kitchenDoorway.x - (-16)) < 0.01 && Math.abs(kitchenDoorway.z - (-5)) < 0.01, 'Kitchen to Lounge doorway is open and navigable');

const bedroomDoorway = { x: -16, z: 12.5 };
collideWalls(bedroomDoorway, 0.5);
assert(Math.abs(bedroomDoorway.x - (-16)) < 0.01 && Math.abs(bedroomDoorway.z - 12.5) < 0.01, 'Lounge to Bedroom doorway is open and navigable');

const diaryDoorway = { x: -5, z: 4 };
collideWalls(diaryDoorway, 0.5);
assert(Math.abs(diaryDoorway.x - (-5)) < 0.01 && Math.abs(diaryDoorway.z - 4) < 0.01, 'Diary Room soundproof entrance is open and navigable');

const gardenDoorway = { x: 9, z: 4 };
collideWalls(gardenDoorway, 0.5);
assert(Math.abs(gardenDoorway.x - 9) < 0.01 && Math.abs(gardenDoorway.z - 4) < 0.01, 'Garden patio sliding glass entrance is open and navigable');

console.log('→ Testing Ayo Olopon Room Action & Station');
import { ROOM_ACTIONS, applyAction } from '../src/engine/actions';

const ayoAction = ROOM_ACTIONS.find((a) => a.key === 'play_ayo');
assert(!!ayoAction, 'play_ayo action exists in ROOM_ACTIONS');
assert(ayoAction?.room === 'Lounge', 'play_ayo is located in Lounge');
assert(ayoAction?.effect.bbCoins === 200, 'play_ayo awards 200 BB coins');

const ayoStation = STATIONS.find((s) => s.id === 'lounge_ayo');
assert(!!ayoStation, 'lounge_ayo interactive station exists in STATIONS');
assert(ayoStation?.actionKey === 'play_ayo', 'lounge_ayo triggers play_ayo action');

const testPlayer = { ...state.player, bbCoins: 100, sanity: 50, energy: 60 };
const result = applyAction(testPlayer, ayoAction!);
assert(result.player.bbCoins === 300, 'play_ayo correctly increments player BB coins to 300');
assert(result.player.sanity === 65, 'play_ayo correctly boosts sanity by 15');
assert(result.player.energy === 55, 'play_ayo uses 5 energy');
assert(Boolean(result.tweetText && result.tweetText.includes('Ayo Olopon')), 'play_ayo generates viral Ayo Olopon tweet');

console.log('→ Testing Truth or Dare (Spin the Bottle) Room Action & Station');
const spinAction = ROOM_ACTIONS.find((a) => a.key === 'spin_bottle');
assert(!!spinAction, 'spin_bottle action exists in ROOM_ACTIONS');
assert(spinAction?.room === 'Lounge', 'spin_bottle is located in Lounge');
assert(spinAction?.effect.fanbaseClout === 2200, 'spin_bottle awards 2200 fanbase clout');

const spinStation = STATIONS.find((s) => s.id === 'lounge_spin_bottle');
assert(!!spinStation, 'lounge_spin_bottle interactive station exists in STATIONS');
assert(spinStation?.actionKey === 'spin_bottle', 'lounge_spin_bottle triggers spin_bottle action');

const spinPlayer = { ...state.player, fanbaseClout: 5000, sanity: 40, energy: 50 };
const spinResult = applyAction(spinPlayer, spinAction!);
assert(spinResult.player.fanbaseClout >= 7200, 'spin_bottle boosts fanbase clout');
assert(spinResult.player.sanity === 50, 'spin_bottle boosts sanity by 10');
assert(spinResult.player.energy === 40, 'spin_bottle uses 10 energy');
assert(Boolean(spinResult.tweetText && spinResult.tweetText.includes('DARE')), 'spin_bottle generates viral AfterDark tweet');

console.log('→ Testing Full Stations Coverage & Integrity Across All House Rooms');
import { roomAt } from '../src/three/rooms';

assert(STATIONS.length >= 50, `All planned interactive stations are configured in STATIONS (found ${STATIONS.length})`);

for (const station of STATIONS) {
  assert(station.pos.length === 3, `Station ${station.id} has 3D coordinates`);
  if (!station.isDiaryRoom) {
    assert(Boolean(station.actionKey), `Station ${station.id} defines an actionKey`);
    const action = ROOM_ACTIONS.find((a) => a.key === station.actionKey);
    assert(Boolean(action), `Station ${station.id} binds to existing ROOM_ACTION: ${station.actionKey}`);
    if (action) {
      assert(action.room === station.room, `Station ${station.id} room matches action.room (${station.room})`);
    }
  } else {
    assert(station.room === 'Diary Room', `Station ${station.id} is in Diary Room`);
  }
}

console.log('→ Testing Engine Action Application Across All Actions');
for (const action of ROOM_ACTIONS) {
  const p = { ...state.player, energy: 50, sanity: 50, hunger: 50, houseStanding: 50, fanbaseClout: 5000, bbCoins: 500, strikes: 0 };
  const res = applyAction(p, action);
  assert(typeof res.logText === 'string' && res.logText.length > 5, `Action ${action.key} produces valid log message`);
}

console.log(`\nLogic Tests Summary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}



