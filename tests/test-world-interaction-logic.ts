import {
  getChunkType,
  getChunkBrand,
  getChunkShopPoi,
  getChunkShopWorldPos,
  parseChunkVehicleId,
  shouldRemoveOrphanedVehicle,
  registerShopPoi,
  unregisterShopPoi,
  getNearestShopPoi,
  clearShopPois,
  CHUNK_SIZE,
  type ShopPoi,
} from '../src/three/InfiniteWorld';
import { useVehicleStore } from '../src/world/vehicleStore';

// ---------------------------------------------------------------------------
// Regression tests for the streamed-world interaction layer:
//  1. Shop POIs are derived deterministically and resolvable by proximity ([E]).
//  2. Streamed chunk vehicles are garbage-collected when their chunk unloads.
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

console.log('→ Testing Streamed World Shop POIs & Vehicle Lifecycle');

// --- Chunk district derivation -------------------------------------------
assert(getChunkType(0, 0) === 'estate_hq', 'Origin chunk is the BBNaija estate HQ');
const districtTypes = new Set<string>();
for (let cx = 1; cx <= 12; cx++) districtTypes.add(getChunkType(cx, 7));
assert(districtTypes.size >= 3, `District types vary across chunks (${[...districtTypes].join(', ')})`);
assert(
  getChunkType(5, 7) === getChunkType(5, 7),
  'Chunk district type is deterministic for the same coordinates',
);

// --- Shop POI derivation --------------------------------------------------
const estatePoi = getChunkShopPoi(0, 0);
assert(estatePoi.shopId === 'bar', 'Estate chunk publishes the poolside bar shop');
assert(
  estatePoi.x === 16 && estatePoi.z === 0,
  `Estate bar POI sits at the rendered badge position (${estatePoi.x}, ${estatePoi.z})`,
);

const districtPoi = getChunkShopPoi(2, 3);
const [expectedX, expectedZ] = getChunkShopWorldPos(2, 3, getChunkType(2, 3));
assert(
  districtPoi.x === expectedX && districtPoi.z === expectedZ,
  `District POI matches rendered shop position (${districtPoi.x}, ${districtPoi.z})`,
);
assert(
  districtPoi.x === 2 * CHUNK_SIZE - 15,
  'District POI X is offset from the chunk origin by the rendered -15m',
);
assert(
  districtPoi.name === getChunkBrand(2, 3),
  `POI name matches the district brand (${districtPoi.name})`,
);

const validShopIds = new Set(['gas_station', 'supermarket', 'restaurant', 'bar', 'activity']);
let allShopIdsValid = true;
for (let cx = -3; cx <= 3; cx++) {
  for (let cz = -3; cz <= 3; cz++) {
    if (!validShopIds.has(getChunkShopPoi(cx, cz).shopId)) allShopIdsValid = false;
  }
}
assert(allShopIdsValid, 'Every chunk resolves to a real commerce ShopId');

// --- Proximity lookup (backs the [E] interact key) ------------------------
clearShopPois();
registerShopPoi({ key: 'a', shopId: 'gas_station', name: 'A', x: 0, z: 0 });
registerShopPoi({ key: 'b', shopId: 'supermarket', name: 'B', x: 20, z: 0 });
assert(getNearestShopPoi(0, 0)?.shopId === 'gas_station', 'Nearest POI resolves when standing on it');
assert(getNearestShopPoi(18, 0)?.shopId === 'supermarket', 'Nearest POI picks the closest in range');
assert(getNearestShopPoi(10, 0) === null, 'No POI resolves beyond the interaction radius');
assert(getNearestShopPoi(0, 0, 40)?.shopId === 'gas_station', 'Custom radius widens the search');

unregisterShopPoi('a');
assert(getNearestShopPoi(0, 0) === null, 'Unregistering a chunk POI removes it from reach');
registerShopPoi({ key: 'a', shopId: 'gas_station', name: 'A', x: 0, z: 0 });
clearShopPois();
assert(getNearestShopPoi(0, 0) === null, 'clearShopPois empties the registry');

// --- Streamed vehicle id parsing / orphan detection -----------------------
assert(
  JSON.stringify(parseChunkVehicleId('chunk_veh_-4_7')) === JSON.stringify({ cx: -4, cz: 7 }),
  'parseChunkVehicleId reads negative chunk coordinates',
);
assert(parseChunkVehicleId('okada_01') === null, 'Non-chunk vehicles (estate spawns) are not parsed as streamed');

assert(
  shouldRemoveOrphanedVehicle('chunk_veh_5_5', () => false),
  'Streamed vehicle is orphaned once its home chunk is unloaded',
);
assert(
  !shouldRemoveOrphanedVehicle('chunk_veh_5_5', () => true),
  'Streamed vehicle is retained while its home chunk is still mounted',
);
assert(
  !shouldRemoveOrphanedVehicle('innoson_01', () => false),
  'Estate starter vehicles are never treated as orphaned chunk props',
);

// --- Vehicle store despawn actually frees the entry ----------------------
const store = useVehicleStore.getState();
store.resetVehicles();
store.spawnVehicle('chunk_veh_1_1', 'bike', [0, 0, 0]);
store.spawnVehicle('chunk_veh_1_2', 'car', [0, 0, 0]);
assert(
  Object.keys(useVehicleStore.getState().vehicles).length === 2,
  'Two streamed vehicles registered',
);
useVehicleStore.getState().removeVehicle('chunk_veh_1_1');
assert(
  Object.keys(useVehicleStore.getState().vehicles).length === 1 &&
    !useVehicleStore.getState().vehicles['chunk_veh_1_1'],
  'Despawning a chunk vehicle removes it from the store (no leak)',
);
// Removing the vehicle the player is driving clears the mounted pointer too.
useVehicleStore.getState().boardVehicle('chunk_veh_1_2', 'player');
assert(useVehicleStore.getState().mountedVehicleId === 'chunk_veh_1_2', 'Player boarded a streamed vehicle');
useVehicleStore.getState().removeVehicle('chunk_veh_1_2');
assert(
  useVehicleStore.getState().mountedVehicleId === null,
  'Despawning a driven vehicle cannot leave a dangling mountedVehicleId',
);
useVehicleStore.getState().resetVehicles();

console.log(`\nStreamed World Interaction Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
