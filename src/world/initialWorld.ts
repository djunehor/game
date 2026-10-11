import { computeBoundingBox3D } from './types';
import { spatialRegistry } from './registry';

/**
 * Initializes the default Big Brother Naija virtual world district.
 */
export function initializeDefaultWorld(): void {
  spatialRegistry.clear();

  // ---------------------------------------------------------------------------
  // Tier 1: Street Network
  // ---------------------------------------------------------------------------
  const streetCenter: [number, number, number] = [0.5, 33.5, 0];
  const streetDimensions: [number, number, number] = [120, 12, 4.5]; // 120m long, 12m wide, 4.5m clearance
  spatialRegistry.registerStreet({
    id: 'admiralty_way',
    name: 'Admiralty Way, Lekki',
    path: [
      [-60, 33.5],
      [60, 33.5],
    ],
    width: 12,
    elevation: 0,
    height: 4.5,
    bounds: computeBoundingBox3D(streetCenter, streetDimensions),
    speedLimit: 50,
    connectedBuildingIds: ['bbnaija_studio'],
  });

  // ---------------------------------------------------------------------------
  // Tier 2: Building / Compound Space
  // ---------------------------------------------------------------------------
  // The studio estate compound (X: -26 to 27, Y: -28 to 27, Z: 0 to 6)
  const compoundCenter: [number, number, number] = [0.5, -0.5, 3.0];
  const compoundDimensions: [number, number, number] = [53, 55, 6.0];
  spatialRegistry.registerBuilding({
    id: 'bbnaija_studio',
    name: 'Big Brother Naija Studio Estate',
    streetId: 'admiralty_way',
    origin: compoundCenter,
    dimensions: compoundDimensions,
    bounds: computeBoundingBox3D(compoundCenter, compoundDimensions),
  });

  // ---------------------------------------------------------------------------
  // Tier 3: Interior Rooms
  // ---------------------------------------------------------------------------
  const roomsConfig = [
    {
      id: 'lounge',
      name: 'Main Lounge',
      center: [-10, 3.5, 2.25] as [number, number, number],
      size: [16, 17, 4.5] as [number, number, number],
      floorLevel: 0,
    },
    {
      id: 'kitchen',
      name: 'Studio Kitchen',
      center: [-10, -11.5, 2.25] as [number, number, number],
      size: [16, 13, 4.5] as [number, number, number],
      floorLevel: 0,
    },
    {
      id: 'garden',
      name: 'Garden & Pool Courtyard',
      center: [16.5, -2, 2.5] as [number, number, number],
      size: [17, 28, 5.0] as [number, number, number],
      floorLevel: 0,
    },
    {
      id: 'bedroom',
      name: 'Housemates Bedroom',
      center: [-6.5, 18.5, 2.25] as [number, number, number],
      size: [17, 13, 4.5] as [number, number, number],
      floorLevel: 0,
    },
    {
      id: 'diary_room',
      name: 'Diary Room',
      center: [-19.5, 18.5, 2.25] as [number, number, number],
      size: [9, 12, 4.5] as [number, number, number],
      floorLevel: 0,
    },
    {
      id: 'arena',
      name: 'Friday Games Arena',
      center: [15.5, 19, 2.75] as [number, number, number],
      size: [19, 14, 5.5] as [number, number, number],
      floorLevel: 0,
    },
    {
      id: 'hoh_suite',
      name: 'Head of House Penthouse',
      center: [15.5, -21, 2.75] as [number, number, number],
      size: [19, 10, 5.5] as [number, number, number],
      floorLevel: 0,
    },
  ];

  for (const r of roomsConfig) {
    spatialRegistry.registerRoom({
      id: r.id,
      buildingId: 'bbnaija_studio',
      name: r.name,
      floorLevel: r.floorLevel,
      origin: r.center,
      dimensions: r.size,
      bounds: computeBoundingBox3D(r.center, r.size),
    });
  }
}
