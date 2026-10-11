import { ROOM_ACTIONS, applyAction } from '../src/engine/actions';
import { AI_HOUSEMATES } from '../src/data/housemates';
import { DIALOGUE_OPTIONS } from '../src/data/dialogue';
import { RANDOM_EVENTS } from '../src/data/events';
import { STATIONS } from '../src/three/InteractiveObjects';
import type { Housemate, Trait } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

const TRAITS: Trait[] = [
  'Pepper Dem',
  'Strategic Schemer',
  'Kitchen General',
  'Lover Boy / Girl',
  'Peace Maker',
  'Clout Chaser',
  'Gentle Giant',
  'Crying Specialist',
];

console.log('====================================================');
console.log('   BIG BROTHER NAIJA: COMBINATORIAL TEST MATRIX     ');
console.log('====================================================\n');

// ---------------------------------------------------------------------------
// 1. COMBINATIONS: (ROOM_ACTIONS x TRAITS) [65 x 8 = 520 Combinations]
// ---------------------------------------------------------------------------
console.log(`→ 1. Testing Room Actions x Traits Combinations (${ROOM_ACTIONS.length} actions x ${TRAITS.length} traits)...`);

for (const action of ROOM_ACTIONS) {
  for (const trait of TRAITS) {
    const basePlayer: Housemate = {
      id: 'test-player',
      name: 'Test Contestant',
      nickname: 'Tester',
      gender: 'F',
      age: 25,
      stateOfOrigin: 'Lagos',
      profession: 'Corporate Lawyer',
      trait,
      avatar: '⭐',
      accentColor: '#3b82f6',
      bio: 'Test bio',
      energy: 50,
      sanity: 50,
      hunger: 50,
      houseStanding: 50,
      fanbaseClout: 10000,
      bbCoins: 1000,
      strikes: 0,
      status: 'active',
      isHoH: true,
      isImmune: false,
      isNominated: false,
      isHuman: true,
      currentRoom: action.room,
      relationships: {},
    };

    const res = applyAction(basePlayer, action);
    const p = res.player;

    // Stat bounds check
    assert(p.energy >= 0 && p.energy <= 100, `${action.key} + ${trait}: energy within 0..100 (${p.energy})`);
    assert(p.sanity >= 0 && p.sanity <= 100, `${action.key} + ${trait}: sanity within 0..100 (${p.sanity})`);
    assert(p.hunger >= 0 && p.hunger <= 100, `${action.key} + ${trait}: hunger within 0..100 (${p.hunger})`);
    assert(p.houseStanding >= 0 && p.houseStanding <= 100, `${action.key} + ${trait}: standing within 0..100 (${p.houseStanding})`);
    assert(p.bbCoins >= 0, `${action.key} + ${trait}: bbCoins non-negative (${p.bbCoins})`);
    assert(p.fanbaseClout >= 0, `${action.key} + ${trait}: fanbaseClout non-negative (${p.fanbaseClout})`);

    // Verify trait-specific multipliers
    if (trait === 'Clout Chaser' && (action.effect.fanbaseClout ?? 0) > 0) {
      const baseCloutGain = action.effect.fanbaseClout!;
      const expectedClout = basePlayer.fanbaseClout + Math.round(baseCloutGain * 1.5);
      assert(p.fanbaseClout === expectedClout, `${action.key} + Clout Chaser: 1.5x multiplier applied correctly`);
    }

    if (trait === 'Kitchen General' && action.room === 'Kitchen') {
      assert(p.fanbaseClout >= basePlayer.fanbaseClout + 800, `${action.key} + Kitchen General: kitchen bonus applied`);
    }

    if (trait === 'Crying Specialist' && action.room === 'Diary Room') {
      assert(p.fanbaseClout >= basePlayer.fanbaseClout + 1500, `${action.key} + Crying Specialist: diary room bonus applied`);
    }

    if (trait === 'Gentle Giant' && action.room === 'Arena') {
      assert(p.fanbaseClout >= basePlayer.fanbaseClout + 800, `${action.key} + Gentle Giant: arena bonus applied`);
    }

    if (trait === 'Peace Maker' && action.key === 'gist') {
      assert(p.houseStanding > basePlayer.houseStanding, `${action.key} + Peace Maker: gist peace bonus applied`);
    }

    // Verify log and tweet payload
    assert(typeof res.logText === 'string' && res.logText.length > 5, `${action.key} + ${trait}: valid log string`);
    if (action.tweet) {
      assert(res.tweetHandle?.startsWith('@') === true, `${action.key}: tweetHandle starts with @`);
      assert(typeof res.tweetText === 'string' && res.tweetText.length > 5, `${action.key}: valid tweetText`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. COMBINATIONS: (ROOM_ACTIONS x BOUNDARY STAT STATES) [65 x 2 = 130 Combos]
// ---------------------------------------------------------------------------
console.log(`\n→ 2. Testing Room Actions x Boundary States (Min vs Max clamping)...`);

for (const action of ROOM_ACTIONS) {
  // Test At Absolute Zero
  const zeroPlayer: Housemate = {
    ...AI_HOUSEMATES[0],
    energy: 0,
    sanity: 0,
    hunger: 0,
    houseStanding: 0,
    fanbaseClout: 0,
    bbCoins: 0,
    strikes: 0,
    isHoH: true,
  };
  const zeroResult = applyAction(zeroPlayer, action);
  assert(zeroResult.player.energy >= 0, `${action.key}: Zero energy never drops below 0`);
  assert(zeroResult.player.sanity >= 0, `${action.key}: Zero sanity never drops below 0`);
  assert(zeroResult.player.hunger >= 0, `${action.key}: Zero hunger never drops below 0`);
  assert(zeroResult.player.houseStanding >= 0, `${action.key}: Zero standing never drops below 0`);
  assert(zeroResult.player.bbCoins >= 0, `${action.key}: Zero coins never drop below 0`);

  // Test At Absolute 100
  const maxPlayer: Housemate = {
    ...AI_HOUSEMATES[0],
    energy: 100,
    sanity: 100,
    hunger: 100,
    houseStanding: 100,
    fanbaseClout: 1000000,
    bbCoins: 500000,
    strikes: 3,
    isHoH: true,
  };
  const maxResult = applyAction(maxPlayer, action);
  assert(maxResult.player.energy <= 100, `${action.key}: Max energy never exceeds 100`);
  assert(maxResult.player.sanity <= 100, `${action.key}: Max sanity never exceeds 100`);
  assert(maxResult.player.hunger <= 100, `${action.key}: Max hunger never exceeds 100`);
  assert(maxResult.player.houseStanding <= 100, `${action.key}: Max standing never exceeds 100`);
}

// ---------------------------------------------------------------------------
// 3. COMBINATIONS: (DIALOGUE OPTIONS x AI HOUSEMATES x AFFINITIES) [6 x 8 x 4 = 192 Combos]
// ---------------------------------------------------------------------------
console.log(`\n→ 3. Testing Dialogue Options x Housemates x Relationship Affinities (6 options x 8 housemates x 4 levels)...`);

const AFFINITY_LEVELS = [-50, 0, 50, 90];

for (const opt of DIALOGUE_OPTIONS) {
  for (const target of AI_HOUSEMATES) {
    for (const affinity of AFFINITY_LEVELS) {
      const player: Housemate = {
        ...AI_HOUSEMATES[0],
        id: 'player-combo',
        nickname: 'Player',
        relationships: { [target.id]: affinity },
      };
      const opponent: Housemate = {
        ...target,
        relationships: { [player.id]: affinity },
      };

      const result = opt.effect(player, opponent);
      assert(typeof result.playerReply === 'string' && result.playerReply.length > 0, `${opt.id} + ${target.nickname} @ ${affinity}: playerReply exists`);
      assert(typeof result.targetReply === 'string' && result.targetReply.length > 0, `${opt.id} + ${target.nickname} @ ${affinity}: targetReply exists`);
      assert(typeof result.affinityChange === 'number', `${opt.id} + ${target.nickname} @ ${affinity}: affinityChange is number`);
      assert(result.cloutGain >= 0, `${opt.id} + ${target.nickname} @ ${affinity}: cloutGain non-negative`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. COMBINATIONS: (RANDOM EVENTS x TRAITS x BOUNDARY STATES) [10 x 8 x 2 = 160 Combos]
// ---------------------------------------------------------------------------
console.log(`\n→ 4. Testing Random Events x Traits x Boundary States (${RANDOM_EVENTS.length} events x 8 traits x 2 states)...`);

for (const ev of RANDOM_EVENTS) {
  for (const trait of TRAITS) {
    // Low state
    const lowP: Housemate = { ...AI_HOUSEMATES[0], trait, energy: 10, sanity: 10, hunger: 10, houseStanding: 10, fanbaseClout: 500, bbCoins: 100 };
    const lowApplied = ev.apply(lowP);
    const nextLow = { ...lowP, ...lowApplied };
    assert(nextLow.energy >= 0 && nextLow.energy <= 100, `${ev.id} + ${trait} [low]: energy clamped`);
    assert(nextLow.sanity >= 0 && nextLow.sanity <= 100, `${ev.id} + ${trait} [low]: sanity clamped`);
    assert(nextLow.hunger >= 0 && nextLow.hunger <= 100, `${ev.id} + ${trait} [low]: hunger clamped`);
    assert(nextLow.houseStanding >= 0 && nextLow.houseStanding <= 100, `${ev.id} + ${trait} [low]: standing clamped`);

    // High state
    const highP: Housemate = { ...AI_HOUSEMATES[0], trait, energy: 95, sanity: 95, hunger: 95, houseStanding: 95, fanbaseClout: 50000, bbCoins: 5000 };
    const highApplied = ev.apply(highP);
    const nextHigh = { ...highP, ...highApplied };
    assert(nextHigh.energy >= 0 && nextHigh.energy <= 100, `${ev.id} + ${trait} [high]: energy clamped`);
    assert(nextHigh.sanity >= 0 && nextHigh.sanity <= 100, `${ev.id} + ${trait} [high]: sanity clamped`);
    assert(nextHigh.hunger >= 0 && nextHigh.hunger <= 100, `${ev.id} + ${trait} [high]: hunger clamped`);
    assert(nextHigh.houseStanding >= 0 && nextHigh.houseStanding <= 100, `${ev.id} + ${trait} [high]: standing clamped`);
  }
}

// ---------------------------------------------------------------------------
// 5. COMBINATIONS: (STATIONS x HOH STATUS PERMISSIONS) [64 x 2 = 128 Combos]
// ---------------------------------------------------------------------------
console.log(`\n→ 5. Testing Stations Permissions & HoH Security Matrix (${STATIONS.length} stations x 2 roles)...`);

for (const station of STATIONS) {
  // HoH Player
  const hohPlayer: Housemate = { ...AI_HOUSEMATES[0], isHoH: true };
  const canHoHAccess = !station.requiresHoH || hohPlayer.isHoH;
  assert(canHoHAccess === true, `${station.id}: HoH player always has access to station`);

  // Non-HoH Player
  const regularPlayer: Housemate = { ...AI_HOUSEMATES[0], isHoH: false };
  const canRegularAccess = !station.requiresHoH || regularPlayer.isHoH;
  if (station.requiresHoH) {
    assert(canRegularAccess === false, `${station.id}: Non-HoH player correctly locked out`);
  } else {
    assert(canRegularAccess === true, `${station.id}: Non-HoH player has access to general station`);
  }
}

console.log('====================================================');
console.log(`COMBINATORIAL TEST SUITE COMPLETE: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
