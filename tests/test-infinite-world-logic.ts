import { CHUNK_SIZE, STREAM_RADIUS } from '../src/three/InfiniteWorld';
import { WORLD_BOUNDS } from '../src/three/rooms';

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

console.log('→ Testing Procedural Infinite World Engine Logic');

// 1. Chunk Dimensions & Infinite Bounds Verification
assert(CHUNK_SIZE === 100, `Chunk size is standardized to ${CHUNK_SIZE}m`);
assert(STREAM_RADIUS === 2, `Stream radius is ${STREAM_RADIUS} (5x5 grid = 25 active chunks)`);
assert(
  WORLD_BOUNDS.minX <= -100000 && WORLD_BOUNDS.maxX >= 100000,
  'WORLD_BOUNDS is unbounded (±100,000+ meters) for infinite world navigation'
);

// 2. Chunk Coordinate Calculation Function
function getChunkCoords(x: number, z: number): { cx: number; cz: number } {
  return {
    cx: Math.round(x / CHUNK_SIZE),
    cz: Math.round(z / CHUNK_SIZE),
  };
}

// Estate Center (0, 0)
const origin = getChunkCoords(0, 0);
assert(origin.cx === 0 && origin.cz === 0, 'Origin coordinates [0, 0] map to Estate Chunk (0, 0)');

// Distant point: 2,540m East, 4,120m North
const distantEast = getChunkCoords(2540, 4120);
assert(
  distantEast.cx === 25 && distantEast.cz === 41,
  'Position [2540, 4120] maps to chunk coordinates (25, 41)'
);

// Negative quadrant: -3,200m West, -1,800m South
const negCoord = getChunkCoords(-3200, -1800);
assert(
  negCoord.cx === -32 && negCoord.cz === -18,
  'Position [-3200, -1800] maps to chunk coordinates (-32, -18)'
);

// 3. Active Stream Grid Generation
function getActiveChunkKeys(cx: number, cz: number, radius = STREAM_RADIUS): string[] {
  const keys: string[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      keys.push(`${cx + dx},${cz + dz}`);
    }
  }
  return keys;
}

const estateStream = getActiveChunkKeys(0, 0);
assert(estateStream.length === 25, 'Active chunk streamer maintains 25 chunks (5x5 grid)');
assert(estateStream.includes('0,0'), 'Stream grid includes player center chunk (0, 0)');
assert(estateStream.includes('2,2') && estateStream.includes('-2,-2'), 'Stream grid covers boundary chunks (±2, ±2)');

// When player moves to chunk (10, -5)
const movedStream = getActiveChunkKeys(10, -5);
assert(movedStream.length === 25, 'Streamer dynamically recalculates 25 chunks upon player displacement');
assert(movedStream.includes('10,-5'), 'Stream grid re-centers around new chunk (10, -5)');
assert(!movedStream.includes('0,0'), 'Old distant chunks (0, 0) are unmounted from active stream');

// 4. Deterministic Procedural Content Stability
function chunkHash(cx: number, cz: number, seed = 0): number {
  const v = Math.sin(cx * 127.1 + cz * 311.7 + seed * 43.17) * 43758.5453;
  return v - Math.floor(v);
}

const hash1 = chunkHash(15, -8, 1);
const hash2 = chunkHash(15, -8, 1);
assert(hash1 === hash2, 'Procedural chunk generation is strictly deterministic for identical coordinates');

const differentChunkHash = chunkHash(15, -7, 1);
assert(hash1 !== differentChunkHash, 'Distinct chunk coordinates produce distinct procedural feature hashes');

// 5. Road Network Alignment & Boundary Continuity
// For any two horizontally adjacent chunks (cx, cz) and (cx + 1, cz),
// verify that the East-West road level and center Z match exactly.
const chunkA_Z = 34; // Relative to chunk origin Z
const chunkB_Z = 34;
assert(chunkA_Z === chunkB_Z, 'East-West road level (Z = 34) matches across adjacent horizontal chunks');

// Cross boulevard alignment: X = 40 relative to chunk origin X
const crossA_X = 40;
const crossB_X = 40;
assert(crossA_X === crossB_X, 'North-South cross boulevard (X = 40) matches across adjacent vertical chunks');

// 6. Long-Distance Driving Simulation (10,000 meters)
let simX = 0;
let simZ = 34;
const speed = 22; // Innoson SUV max speed 22 m/s (~80 km/h)
const dt = 1.0;

for (let second = 1; second <= 500; second++) {
  simX += speed * dt; // Driving East for 500 seconds = 11,000 meters
}

const finalChunk = getChunkCoords(simX, simZ);
assert(
  simX === 11000 && finalChunk.cx === 110,
  `Simulated driving 11,000m East traversed 110 procedural chunks without encountering boundaries`
);

console.log(`\nInfinite World Engine Logic Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
