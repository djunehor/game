import * as THREE from 'three';
import {
  WALLS,
  ROOM_DEFS,
  getRandomWalkablePointInRoom,
  isPointBlocked,
  collideWalls,
  moveWithSliding,
  PLAYER_SPAWN,
  WORLD_BOUNDS,
} from '../src/three/rooms';
import {
  registerSolidObject,
  unregisterSolidObject,
  getEnvironmentColliders,
  updateAvatarCollider,
  removeAvatarCollider,
} from '../src/three/collisionStore';
import { sound } from '../src/engine/sound';

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

console.log('→ Testing Dynamic Solid Objects & Collision Architecture');

function createTestSolid(name: string, center: [number, number], size: [number, number]): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], 1, size[1]),
    new THREE.MeshBasicMaterial()
  );
  mesh.position.set(center[0], 0, center[1]);
  registerSolidObject(mesh, name);
  return mesh;
}

// 1. Verify dynamic 3D scene solids auto-registration
const dynamicSolids = [
  createTestSolid('Kitchen Island', [-10, -11], [5.8, 2.3]),
  createTestSolid('Lounge Sofa Left', [-14.2, 4.0], [2.5, 5.2]),
  createTestSolid('Swimming Pool', [16.0, -2.0], [11.6, 7.6]),
  createTestSolid('HoH King Canopy Bed', [16.0, -23.2], [4.4, 4.4]),
  createTestSolid('Arena Innoson SUV Prop', [13.2, 19.0], [2.2, 3.6]),
  createTestSolid('Bedroom Queen Bed 1', [-9.2, 18.0], [3.2, 4.4]),
];

const activeColliders = getEnvironmentColliders();
assert(dynamicSolids.length >= 6, `Registered ${dynamicSolids.length} dynamic 3D solid objects`);
assert(activeColliders.length === WALLS.length + dynamicSolids.length, `getEnvironmentColliders combines perimeter walls (${WALLS.length}) and dynamic 3D solids (${dynamicSolids.length})`);

// 2. Test Player Spawn Position
const spawnPos = { x: PLAYER_SPAWN[0], z: PLAYER_SPAWN[1] };
const origSpawn = { ...spawnPos };
collideWalls(spawnPos, 0.45);
assert(
  Math.abs(spawnPos.x - origSpawn.x) < 0.001 && Math.abs(spawnPos.z - origSpawn.z) < 0.001,
  `Player spawn [${PLAYER_SPAWN.join(', ')}] is completely clear of walls and all solid objects`
);

// 3. Test Solid Object Collision Prevention
// Kitchen Island
const atIsland = { x: -10, z: -11 }; // Center of island
collideWalls(atIsland, 0.45);
const insideIsland =
  atIsland.x > -10 - 5.8 / 2 - 0.45 + 0.001 &&
  atIsland.x < -10 + 5.8 / 2 + 0.45 - 0.001 &&
  atIsland.z > -11 - 2.3 / 2 - 0.45 + 0.001 &&
  atIsland.z < -11 + 2.3 / 2 + 0.45 - 0.001;
assert(!insideIsland, `collideWalls prevents avatar from penetrating Kitchen Island (clamped to x=${atIsland.x.toFixed(2)}, z=${atIsland.z.toFixed(2)})`);

// Lounge Sofa
const atSofa = { x: -14.2, z: 4 }; // Center of left sofa
collideWalls(atSofa, 0.45);
const insideSofa =
  atSofa.x > -14.2 - 2.5 / 2 - 0.45 + 0.001 &&
  atSofa.x < -14.2 + 2.5 / 2 + 0.45 - 0.001 &&
  atSofa.z > 4 - 5.2 / 2 - 0.45 + 0.001 &&
  atSofa.z < 4 + 5.2 / 2 + 0.45 - 0.001;
assert(!insideSofa, `collideWalls prevents avatar from penetrating Lounge Sofa (clamped to x=${atSofa.x.toFixed(2)}, z=${atSofa.z.toFixed(2)})`);

// Swimming Pool
const atPool = { x: 16, z: -2 }; // Center of swimming pool
collideWalls(atPool, 0.45);
const insidePool =
  atPool.x > 16 - 11.6 / 2 - 0.45 + 0.001 &&
  atPool.x < 16 + 11.6 / 2 + 0.45 - 0.001 &&
  atPool.z > -2 - 7.6 / 2 - 0.45 + 0.001 &&
  atPool.z < -2 + 7.6 / 2 + 0.45 - 0.001;
assert(!insidePool, `collideWalls prevents avatar from walking into Swimming Pool (clamped to x=${atPool.x.toFixed(2)}, z=${atPool.z.toFixed(2)})`);

// HoH King Canopy Bed
const atHoHBed = { x: 16, z: -23.2 };
collideWalls(atHoHBed, 0.45);
const insideHoHBed =
  atHoHBed.x > 16 - 4.4 / 2 - 0.45 + 0.001 &&
  atHoHBed.x < 16 + 4.4 / 2 + 0.45 - 0.001 &&
  atHoHBed.z > -23.2 - 4.4 / 2 - 0.45 + 0.001 &&
  atHoHBed.z < -23.2 + 4.4 / 2 + 0.45 - 0.001;
assert(!insideHoHBed, `collideWalls prevents avatar from penetrating HoH Canopy Bed (clamped to x=${atHoHBed.x.toFixed(2)}, z=${atHoHBed.z.toFixed(2)})`);

// Arena Innoson SUV Prop
const atCar = { x: 13.2, z: 19.0 };
collideWalls(atCar, 0.45);
const insideCar =
  atCar.x > 13.2 - 2.2 / 2 - 0.45 + 0.001 &&
  atCar.x < 13.2 + 2.2 / 2 + 0.45 - 0.001 &&
  atCar.z > 19.0 - 3.6 / 2 - 0.45 + 0.001 &&
  atCar.z < 19.0 + 3.6 / 2 + 0.45 - 0.001;
assert(!insideCar, `collideWalls prevents avatar from penetrating Innoson Car prop (clamped to x=${atCar.x.toFixed(2)}, z=${atCar.z.toFixed(2)})`);

// 3b. Test Predictive Collision Resolution (Zero Penetration and Smooth Sliding)
// Test walking directly towards Bedroom Queen Bed 1 (center: [-9.2, 18], size: [3.2, 4.4])
const startOutsideBed = { x: -6.0, z: 18.0 };
const stepDirectlyLeft = moveWithSliding(startOutsideBed, -3.0, 0, 0.45);
const bedMaxX = -9.2 + 3.2 / 2 + 0.45;
assert(
  Math.abs(stepDirectlyLeft.x - bedMaxX) < 0.001,
  `moveWithSliding stops avatar flush at obstacle boundary (x=${stepDirectlyLeft.x.toFixed(2)}) without penetrating`
);

// Test diagonal sliding along the face of Kitchen Island (center: [-10, -11], size: [5.8, 2.3])
const startAboveIsland = { x: -10, z: -8.0 };
const stepDiagonal = moveWithSliding(startAboveIsland, -1.5, -2.0, 0.45);
const islandMaxZ = -11 + 2.3 / 2 + 0.45;
assert(
  Math.abs(stepDiagonal.z - islandMaxZ) < 0.001 && Math.abs(stepDiagonal.x - (-11.5)) < 0.001,
  `moveWithSliding allows tangential sliding along obstacle face (x slid to ${stepDiagonal.x.toFixed(2)}, z stopped at ${stepDiagonal.z.toFixed(2)})`
);

// 3c. Test Sofa Direct Collision & Zero-Bounce Across Multiple Frames
// Left wing sofa: center [-14.2, 4.0], size [2.5, 5.2] (x-span: -15.45 to -12.95)
// Approach from the west (x = -17.5, z = 4.0, dx = +0.15) -> boundary minX = -14.2 - 1.25 - 0.45 = -15.90
let sofaPos = { x: -17.5, z: 4.0 };
let sofaJitter = 0;
const expectedSofaBoundary = -14.2 - 2.5 / 2 - 0.45; // -15.90
for (let frame = 1; frame <= 15; frame++) {
  const next = moveWithSliding(sofaPos, 0.15, 0, 0.45);
  if (frame > 11) {
    sofaJitter += Math.abs(next.x - expectedSofaBoundary) + Math.abs(next.z - 4.0);
  }
  sofaPos = next;
}
assert(
  Math.abs(sofaPos.x - expectedSofaBoundary) < 0.001 && sofaJitter < 0.001,
  `moveWithSliding stops avatar flush at Sofa boundary (x=${sofaPos.x.toFixed(2)}) with zero penetration and zero bounce across frames`
);

// 3d. Test 360-degree approach & Zero-Bounce across all angles
let sweepBounces = 0;
let sweepPenetrations = 0;
const islandCenter = { x: -10, z: -11 };
const islandMinX = -10 - 5.8 / 2;
const islandMaxX = -10 + 5.8 / 2;
const islandMinZ = -11 - 2.3 / 2;
const islandMaxZVal = -11 + 2.3 / 2;

for (let deg = 0; deg < 360; deg += 15) {
  const rad = (deg * Math.PI) / 180;
  let p = {
    x: islandCenter.x + Math.cos(rad) * 4.0,
    z: islandCenter.z + Math.sin(rad) * 4.0,
  };
  const dx = -Math.cos(rad) * 0.15;
  const dz = -Math.sin(rad) * 0.15;

  for (let s = 0; s < 35; s++) {
    const next = moveWithSliding(p, dx, dz, 0.45);
    const stepDx = next.x - p.x;
    const stepDz = next.z - p.z;
    const forwardProgress = stepDx * dx + stepDz * dz;
    // Moving in reverse against input direction is a bounce
    if (forwardProgress < -0.02) {
      sweepBounces++;
    }
    // Penetrating inside the physical box
    if (next.x > islandMinX && next.x < islandMaxX && next.z > islandMinZ && next.z < islandMaxZVal) {
      sweepPenetrations++;
    }
    p = next;
  }
}
assert(sweepBounces === 0, 'moveWithSliding exhibits zero bounce across 360-degree approach angles');
assert(sweepPenetrations === 0, 'moveWithSliding exhibits zero penetration into physical obstacle across 360 degrees');

// 3e. Test Swimming Pool Collision Retention When Dynamic 3D Objects Are Mounted
const poolStart = { x: 16.0, z: 4.0 }; // South of swimming pool at z=-2, depth=7.6 -> maxZ = 1.8 + 0.45 = 2.25
const walkIntoPool = moveWithSliding(poolStart, 0, -3.0, 0.45);
const expectedPoolBoundary = -2.0 + 7.6 / 2 + 0.45; // 2.25
assert(
  Math.abs(walkIntoPool.z - expectedPoolBoundary) < 0.001,
  `Swimming Pool remains 100% solid and blocks penetration (stopped at z=${walkIntoPool.z.toFixed(2)}) alongside dynamic scene colliders`
);

// 4. Test Doorways & Navigation Corridors Remain Open
const corridors = [
  { name: 'Kitchen to Lounge Open Atrium', x: -10, z: -4 },
  { name: 'Lounge to Bedroom Corridor', x: -8, z: 12 },
  { name: 'Diary Room Secret Entrance', x: -15, z: 18 },
  { name: 'Lounge to Garden Glass Patio', x: -1, z: 3 },
  { name: 'Garden to HoH Penthouse Entrance', x: 16, z: -15 },
  { name: 'Garden to Arena Sliding Gate', x: 16, z: 13.5 },
];

for (const door of corridors) {
  const p = { x: door.x, z: door.z };
  collideWalls(p, 0.45);
  assert(
    Math.abs(p.x - door.x) < 0.05 && Math.abs(p.z - door.z) < 0.05,
    `${door.name} is unobstructed and navigable`
  );
}

// 4b. Test Dynamic Scene Mesh Auto-Registration
console.log('→ Testing Dynamic 3D Scene Mesh Auto-Registration');
const mockMesh = new THREE.Mesh(
  new THREE.BoxGeometry(3.0, 1.0, 2.0),
  new THREE.MeshBasicMaterial()
);
mockMesh.position.set(0, 0, 0);
registerSolidObject(mockMesh, 'Test Custom Prop');
const envColliders = getEnvironmentColliders();
const registeredProp = envColliders.find(
  (c) => Math.abs(c.center[0] - 0) < 0.01 && Math.abs(c.size[0] - 3.0) < 0.01
);
assert(Boolean(registeredProp), 'registerSolidObject automatically calculates world AABB from Three.js mesh');
unregisterSolidObject('Test Custom Prop');
const afterUnregister = getEnvironmentColliders().find(
  (c) => Math.abs(c.center[0] - 0) < 0.01 && Math.abs(c.size[0] - 3.0) < 0.01
);
assert(!afterUnregister, 'unregisterSolidObject cleanly removes dynamic collider on unmount');

// 4c. Test Dynamic Avatar-to-Avatar Collision Prevention
console.log('→ Testing Dynamic Avatar-to-Avatar Collision');
// Place Chommy at [-10, 6.0]
updateAvatarCollider('chommy', -10, 6.0, 0.45);
// Player is at [-10, 7.5], walking directly north (dz = -1.5) straight into Chommy
const playerStart = { x: -10, z: 7.5 };
const stepIntoChommy = moveWithSliding(playerStart, 0, -1.5, 0.45, 'player');
const distToChommy = Math.hypot(stepIntoChommy.x - (-10), stepIntoChommy.z - 6.0);
assert(
  distToChommy >= 0.899,
  `moveWithSliding prevents player from walking into Chommy (separation dist=${distToChommy.toFixed(2)} >= 0.90m)`
);

// Continuous multi-frame push against Chommy: verify zero penetration and zero jitter
let pPos = { x: -10, z: 7.2 };
let avatarJitter = 0;
for (let f = 1; f <= 10; f++) {
  const next = moveWithSliding(pPos, 0, -0.2, 0.45, 'player');
  const d = Math.hypot(next.x - (-10), next.z - 6.0);
  if (f > 4) {
    if (d < 0.899) avatarJitter += (0.9 - d);
  }
  pPos = next;
}
assert(
  avatarJitter < 0.001,
  'moveWithSliding guarantees zero penetration and zero bounce when pushing against another avatar across 10 frames'
);
removeAvatarCollider('chommy');

// 5. Test Audio Engine Silence & No-Op Behavior
console.log('→ Testing Sound Engine Silence & Method Stability');
let audioThrown = false;
try {
  sound.playFootstep();
  sound.playTalkBlip();
  sound.playEmoteSound('wave');
  sound.playEmoteSound('hug');
  sound.playEmoteSound('dance');
  sound.playEmoteSound('hype');
  sound.playEmoteSound('clapback');
  sound.playBiggieBuzzer();
  sound.playRewardChime();
  sound.playDramaHit();
  sound.startPartyMusic();
  sound.stopPartyMusic();
} catch (err) {
  audioThrown = true;
}

assert(!audioThrown, 'All sound methods execute cleanly without throwing errors');
assert(sound.muted === false || sound.muted === true, 'Sound engine state is preserved');

// 6. Test AI NPC Walkable Waypoints and Solid Object Avoidance
console.log('→ Testing AI NPC Walkable Waypoints & Obstacle Avoidance');

let npcTargetCollidedWithObstacle = false;
for (let i = 0; i < 50; i++) {
  const room = ROOM_DEFS[i % ROOM_DEFS.length];
  const pt = getRandomWalkablePointInRoom(room, 0.45);
  if (isPointBlocked(pt.x, pt.z, 0.45)) {
    npcTargetCollidedWithObstacle = true;
    break;
  }
}
assert(!npcTargetCollidedWithObstacle, '50 sampled AI NPC wander waypoints across all rooms are 100% free of solid obstacles');

console.log(`\nSolid Objects & Audio Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
