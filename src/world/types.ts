import type { RoomAction } from '../engine/actions';
import type { InteractiveStation } from '../three/InteractiveObjects';

/**
 * 3D World Coordinate:
 * x: Longitude (East/West in meters)
 * y: Latitude (North/South in meters)
 * z: Elevation (Height above ground in meters)
 */
export type Coordinate3D = [number, number, number];

/**
 * Axis-Aligned 3D Bounding Box in world coordinate space.
 */
export interface BoundingBox3D {
  min: Coordinate3D; // [minX, minY, minZ]
  max: Coordinate3D; // [maxX, maxY, maxZ]
}

/**
 * Computes an axis-aligned 3D bounding box from center and dimensions.
 */
export function computeBoundingBox3D(center: Coordinate3D, size: Coordinate3D): BoundingBox3D {
  const halfX = size[0] / 2;
  const halfY = size[1] / 2;
  const halfZ = size[2] / 2;
  return {
    min: [center[0] - halfX, center[1] - halfY, center[2] - halfZ],
    max: [center[0] + halfX, center[1] + halfY, center[2] + halfZ],
  };
}

/**
 * Tests if two 3D bounding boxes intersect in Euclidean space.
 * Overlap requires intersection along ALL three dimensions (x, y, and z) simultaneously.
 * @param tolerance Optional buffer (in meters) to account for floating-point boundaries.
 */
export function check3DOverlap(
  boxA: BoundingBox3D,
  boxB: BoundingBox3D,
  tolerance = 0.001
): boolean {
  const overlapX = boxA.min[0] < boxB.max[0] - tolerance && boxA.max[0] > boxB.min[0] + tolerance;
  const overlapY = boxA.min[1] < boxB.max[1] - tolerance && boxA.max[1] > boxB.min[1] + tolerance;
  const overlapZ = boxA.min[2] < boxB.max[2] - tolerance && boxA.max[2] > boxB.min[2] + tolerance;

  return overlapX && overlapY && overlapZ;
}

/**
 * Tier 1: Street or Roadway Definition (Outdoor transit network)
 */
export interface StreetDef {
  id: string;
  name: string;
  // Waypoint polyline for road corridor
  path: [number, number][]; // [[x, y], [x, y], ...]
  width: number; // Width of street (road + sidewalk) in meters
  elevation: number; // z elevation of street surface (meters)
  height: number; // Vertical clearance envelope (e.g. 4.5m for vehicles)
  bounds: BoundingBox3D;
  speedLimit?: number; // km/h
  connectedBuildingIds?: string[];
}

/**
 * Tier 2: Building or Outdoor Space Definition (Compounds & Landmark plots)
 */
export interface BuildingDef {
  id: string;
  name: string;
  streetId: string; // Fronting street connector
  origin: Coordinate3D; // Center [x, y, z] in world coordinates
  dimensions: Coordinate3D; // [width (X), depth (Y), height (Z)]
  bounds: BoundingBox3D;
  rooms?: RoomDef[];
}

/**
 * Tier 3: Room or Sub-Area Definition (Interior units inside a building)
 */
export interface RoomDef {
  id: string;
  buildingId: string;
  name: string;
  floorLevel: number; // 0 = Ground, 1 = 1st Floor, 2 = Penthouse/Rooftop, -1 = Basement
  origin: Coordinate3D; // World center [x, y, z]
  dimensions: Coordinate3D; // [width (X), depth (Y), height (Z)]
  bounds: BoundingBox3D;
  spawns?: Coordinate3D[];
  stations?: InteractiveStation[];
  actions?: RoomAction[];
  ambientChatter?: string[];
}
