import {
  VEHICLE_CATALOG,
  useVehicleStore,
  type VehicleType,
} from '../src/world/vehicleStore';

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

console.log('→ Testing Outdoor Vehicle Engine & Transit Modes');

// 1. Verify Vehicle Catalog Specifications
const types: VehicleType[] = ['bike', 'keke_napep', 'danfo_bus', 'car'];
for (const t of types) {
  const def = VEHICLE_CATALOG[t];
  assert(Boolean(def.name && def.emoji), `Catalog specifies metadata for ${t} (${def.name} ${def.emoji})`);
  assert(def.maxSpeed > 9.0, `${def.name} max speed (${def.maxSpeed}m/s) exceeds pedestrian walking speed (9m/s)`);
  assert(def.capacity >= 1, `${def.name} has valid passenger capacity (${def.capacity})`);
}

// Speed Hierarchy validation
assert(
  VEHICLE_CATALOG.car.maxSpeed > VEHICLE_CATALOG.danfo_bus.maxSpeed &&
  VEHICLE_CATALOG.danfo_bus.maxSpeed > VEHICLE_CATALOG.bike.maxSpeed &&
  VEHICLE_CATALOG.bike.maxSpeed > VEHICLE_CATALOG.keke_napep.maxSpeed,
  'Speed hierarchy validates: Car (22m/s) > Bus (16.5m/s) > Bike (15m/s) > Keke (12.5m/s)'
);

// Capacity Hierarchy validation
assert(
  VEHICLE_CATALOG.danfo_bus.capacity === 14 &&
  VEHICLE_CATALOG.car.capacity === 5 &&
  VEHICLE_CATALOG.keke_napep.capacity === 4 &&
  VEHICLE_CATALOG.bike.capacity === 2,
  'Capacity matches vehicle dimensions: Bus (14) > Car (5) > Keke (4) > Bike (2)'
);

// 2. Test Spawning Vehicles in World Space
const store = useVehicleStore.getState();
store.resetVehicles();

store.spawnVehicle('keke_01', 'keke_napep', [0, 33.5, 0], 0);
store.spawnVehicle('car_01', 'car', [15, 33.5, 0], Math.PI / 2);
store.spawnVehicle('bike_01', 'bike', [-20, 33.5, 0], 0);

assert(Object.keys(useVehicleStore.getState().vehicles).length === 3, 'Spawned 3 outdoor transit vehicles along Admiralty Way');

// 3. Test Proximity Detection (Boarding Trigger)
// Avatar standing 1.5m away from keke_01 [0, 33.5, 0]
const nearKeke = useVehicleStore.getState().getNearbyVehicle([1.0, 33.5, 0], 3.0);
assert(nearKeke?.id === 'keke_01', 'getNearbyVehicle detects Keke Napep within boarding radius (1.0m away)');

// Avatar standing far away (50m)
const distant = useVehicleStore.getState().getNearbyVehicle([50, 0, 0], 3.0);
assert(distant === null, 'getNearbyVehicle returns null when player is too far away from vehicles');

// 4. Test Boarding & Driving State
const boardSuccess = useVehicleStore.getState().boardVehicle('keke_01', 'player_1');
assert(boardSuccess === true, 'Player successfully boards Keke Napep as driver');

const mounted = useVehicleStore.getState().getMountedVehicle('player_1');
assert(mounted?.id === 'keke_01' && mounted.driverId === 'player_1', 'Vehicle driverId maps to player');
assert(useVehicleStore.getState().mountedVehicleId === 'keke_01', 'Store tracks local player mounted vehicle id');

// Passenger boarding
const passenger1 = useVehicleStore.getState().boardVehicle('keke_01', 'chommy');
const passenger2 = useVehicleStore.getState().boardVehicle('keke_01', 'pere');
const passenger3 = useVehicleStore.getState().boardVehicle('keke_01', 'mercy');
assert(passenger1 && passenger2 && passenger3, '3 passengers board Keke Napep reaching maximum capacity (4 total)');

// Attempt 5th passenger (exceeds capacity of 4)
const passengerOverCapacity = useVehicleStore.getState().boardVehicle('keke_01', 'seeyi');
assert(passengerOverCapacity === false, 'boardVehicle rejects boarding when vehicle is full');

// 5. Test Vehicle Motion & Coordinate Updates
useVehicleStore.getState().updateVehicleTransform('keke_01', [25.0, 33.5, 0], 0, 12.0);
const updatedKeke = useVehicleStore.getState().vehicles['keke_01'];
assert(
  updatedKeke.position[0] === 25.0 && updatedKeke.speed === 12.0,
  'updateVehicleTransform updates real-time position and velocity along street corridor'
);

// 6. Test Dismounting Vehicle
const exitPoint = useVehicleStore.getState().dismountVehicle('player_1');
assert(Boolean(exitPoint), 'dismountVehicle returns safe sidewalk dismount coordinates');
assert(
  useVehicleStore.getState().vehicles['keke_01'].driverId === null,
  'Driver seat is vacant after dismounting'
);
assert(
  useVehicleStore.getState().mountedVehicleId === null,
  'Mounted vehicle state is cleared after dismounting'
);

// Passenger dismount
useVehicleStore.getState().dismountVehicle('chommy');
assert(
  useVehicleStore.getState().vehicles['keke_01'].passengerIds.length === 2,
  'Passenger count decrements upon individual passenger dismount'
);

// 7. Test Town Ring Road Continuous Navigation & Bounds
import { WORLD_BOUNDS } from '../src/three/rooms';
assert(
  WORLD_BOUNDS.minX <= -85 && WORLD_BOUNDS.maxX >= 85 && WORLD_BOUNDS.minZ <= -82 && WORLD_BOUNDS.maxZ >= 82,
  'WORLD_BOUNDS accommodates the full Town Ring Road and outer arterial spokes'
);

// Verify Ring Road loop waypoints: South -> East -> North -> West -> South
const ringWaypoints = [
  { name: 'South Boulevard (Admiralty Way)', x: 0, z: 37 },
  { name: 'South-East Junction', x: 45, z: 37 },
  { name: 'East Boulevard (Ozumba Ave)', x: 45, z: 0 },
  { name: 'North-East Junction', x: 45, z: -38 },
  { name: 'North Boulevard (Marina Expy)', x: 0, z: -38 },
  { name: 'North-West Junction', x: -45, z: -38 },
  { name: 'West Boulevard (Ahmadu Bello)', x: -45, z: 0 },
  { name: 'South-West Junction', x: -45, z: 37 },
];

for (const wp of ringWaypoints) {
  const inBounds =
    wp.x >= WORLD_BOUNDS.minX &&
    wp.x <= WORLD_BOUNDS.maxX &&
    wp.z >= WORLD_BOUNDS.minZ &&
    wp.z <= WORLD_BOUNDS.maxZ;
  assert(inBounds, `Ring road waypoint "${wp.name}" [${wp.x}, ${wp.z}] is traversable within bounds`);
}

// Verify Outbound Arterial Spokes
const outboundSpokes = [
  { name: 'South Outbound Roundabout', x: 0.5, z: 75 },
  { name: 'North Outbound Roundabout', x: 0.5, z: -75 },
  { name: 'East Outbound Roundabout', x: 80, z: 0 },
  { name: 'West Outbound Roundabout', x: -80, z: 0 },
];

for (const sp of outboundSpokes) {
  const inBounds =
    sp.x >= WORLD_BOUNDS.minX &&
    sp.x <= WORLD_BOUNDS.maxX &&
    sp.z >= WORLD_BOUNDS.minZ &&
    sp.z <= WORLD_BOUNDS.maxZ;
  assert(inBounds, `Arterial spoke "${sp.name}" [${sp.x}, ${sp.z}] is traversable within bounds`);
}

console.log(`\nVehicle Engine Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
