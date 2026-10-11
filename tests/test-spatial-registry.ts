import {
  computeBoundingBox3D,
  check3DOverlap,
} from '../src/world/types';
import { SpatialRegistry, spatialRegistry } from '../src/world/registry';
import { initializeDefaultWorld } from '../src/world/initialWorld';

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

console.log('→ Testing 3D Spatial Registry (Streets, Buildings, Rooms & Elevation)');

// 1. Test 3D Bounding Box Computation & Overlap Logic
const boxA = computeBoundingBox3D([10, 20, 5], [4, 6, 2]); // X: [8, 12], Y: [17, 23], Z: [4, 6]
const boxB = computeBoundingBox3D([11, 21, 5], [4, 6, 2]); // Intersects boxA
const boxDiffElevation = computeBoundingBox3D([10, 20, 15], [4, 6, 2]); // Same X & Y, but Z: [14, 16] (elevation difference)
const boxSeparate = computeBoundingBox3D([30, 40, 5], [4, 6, 2]); // Far away

assert(check3DOverlap(boxA, boxB) === true, 'check3DOverlap detects 3D intersection between overlapping volumes');
assert(check3DOverlap(boxA, boxDiffElevation) === false, 'check3DOverlap allows structures at different elevations (different z) with identical x,y');
assert(check3DOverlap(boxA, boxSeparate) === false, 'check3DOverlap confirms non-intersecting distant boxes do not overlap');

// 2. Test Registration of Default World (Streets, Compounds, Rooms)
initializeDefaultWorld();

const streets = spatialRegistry.listStreets();
const buildings = spatialRegistry.listBuildings();
const rooms = spatialRegistry.listRooms();

assert(streets.length === 1 && streets[0].id === 'admiralty_way', 'Default world registers Admiralty Way street corridor');
assert(buildings.length === 1 && buildings[0].id === 'bbnaija_studio', 'Default world registers Big Brother Naija Studio Estate building');
assert(rooms.length === 7, `Default world registers all 7 interior rooms (${rooms.length} registered)`);

// 3. Test Spatial Containment Queries
const inLounge = spatialRegistry.findAtPosition([-10, 3.5, 1.5]);
assert(inLounge.room?.id === 'lounge', 'findAtPosition identifies player in Main Lounge');
assert(inLounge.building?.id === 'bbnaija_studio', 'findAtPosition identifies player inside BBNaija Studio Estate');

const onStreet = spatialRegistry.findAtPosition([0, 33.5, 1.0]);
assert(onStreet.street?.id === 'admiralty_way', 'findAtPosition identifies avatar on Admiralty Way');
assert(!onStreet.building, 'Avatar on street is outside all buildings');

const inEmptySky = spatialRegistry.findAtPosition([500, 500, 100]);
assert(!inEmptySky.street && !inEmptySky.building && !inEmptySky.room, 'findAtPosition returns null for empty unallocated coordinates');

// 4. Test Strict Conflict Prevention (Overlap Rejection)
const testRegistry = new SpatialRegistry();

// Register a primary street and building
testRegistry.registerStreet({
  id: 'test_street',
  name: 'Test Boulevard',
  path: [[0, 0], [100, 0]],
  width: 10,
  elevation: 0,
  height: 4.5,
  bounds: computeBoundingBox3D([50, 0, 2.25], [100, 10, 4.5]),
});

testRegistry.registerBuilding({
  id: 'test_mall',
  name: 'Test Shopping Mall',
  streetId: 'test_street',
  origin: [50, 30, 5],
  dimensions: [40, 30, 10],
  bounds: computeBoundingBox3D([50, 30, 5], [40, 30, 10]),
});

// Attempt to register a conflicting building overlapping the street
let streetOverlapError = false;
try {
  testRegistry.registerBuilding({
    id: 'conflicting_building',
    name: 'Illegal Encroaching Shop',
    streetId: 'test_street',
    origin: [50, 2, 2.25], // Overlaps with test_street bounds [Y: -5 to 5]
    dimensions: [20, 10, 4.5],
    bounds: computeBoundingBox3D([50, 2, 2.25], [20, 10, 4.5]),
  });
} catch (err) {
  streetOverlapError = true;
}
assert(streetOverlapError, 'SpatialRegistry rejects building that overlaps an existing street');

// Attempt to register a conflicting building overlapping another building
let buildingOverlapError = false;
try {
  testRegistry.registerBuilding({
    id: 'conflicting_mall',
    name: 'Duplicate Mall',
    streetId: 'test_street',
    origin: [50, 35, 5], // Overlaps with test_mall
    dimensions: [20, 20, 10],
    bounds: computeBoundingBox3D([50, 35, 5], [20, 20, 10]),
  });
} catch (err) {
  buildingOverlapError = true;
}
assert(buildingOverlapError, 'SpatialRegistry rejects building that overlaps another building');

// 5. Elevation Independence Test (Multi-level spaces sharing x,y)
let flyoverRegistered = false;
try {
  // Overhead Flyover Road directly above test_street at elevation z = 15m (clearance 4.5m)
  testRegistry.registerStreet({
    id: 'overhead_flyover',
    name: 'Lekki Elevated Expressway',
    path: [[0, 0], [100, 0]],
    width: 10,
    elevation: 15,
    height: 4.5,
    bounds: computeBoundingBox3D([50, 0, 15], [100, 10, 4.5]),
  });
  flyoverRegistered = true;
} catch (err) {
  flyoverRegistered = false;
}
assert(flyoverRegistered, 'SpatialRegistry allows elevated flyover roadway directly above surface street without collision');

// 6. Test Room Overlap Inside Same Building
testRegistry.registerRoom({
  id: 'mall_shop_1',
  buildingId: 'test_mall',
  name: 'Fashion Boutique',
  floorLevel: 0,
  origin: [40, 25, 2.5],
  dimensions: [10, 10, 4],
  bounds: computeBoundingBox3D([40, 25, 2.5], [10, 10, 4]),
});

let roomOverlapError = false;
try {
  testRegistry.registerRoom({
    id: 'mall_shop_2',
    buildingId: 'test_mall',
    name: 'Conflicting Boutique',
    floorLevel: 0,
    origin: [42, 26, 2.5], // Overlaps shop 1
    dimensions: [10, 10, 4],
    bounds: computeBoundingBox3D([42, 26, 2.5], [10, 10, 4]),
  });
} catch (err) {
  roomOverlapError = true;
}
assert(roomOverlapError, 'SpatialRegistry rejects room that overlaps sibling room on same floor');

// Rooftop space directly above shop 1 on floor 1 (elevation z = 7m) should succeed
let rooftopRoomRegistered = false;
try {
  testRegistry.registerRoom({
    id: 'rooftop_lounge',
    buildingId: 'test_mall',
    name: 'Rooftop Cafe',
    floorLevel: 1,
    origin: [40, 25, 7.5], // Same X and Y, but higher elevation Z
    dimensions: [10, 10, 4],
    bounds: computeBoundingBox3D([40, 25, 7.5], [10, 10, 4]),
  });
  rooftopRoomRegistered = true;
} catch (err) {
  rooftopRoomRegistered = false;
}
assert(rooftopRoomRegistered, 'SpatialRegistry allows multi-story room directly above lower floor room without overlap');

console.log(`\nSpatial Registry Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
