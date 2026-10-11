import type { Room } from '../types';

// 3D room layout: Authentic BBN Open-Concept Mansion Architecture
// Features:
// 1. Grand Open-Plan Lounge & Kitchen Atrium with unobstructed flow
// 2. Panoramic glass patio doors opening directly to the Garden & Swimming Pool
// 3. Dedicated Bedroom Wing with generous spacing
// 4. Secret Diary Room corridor with private soundproof entrance
// 5. Elevated HoH Penthouse Suite overlooking the garden
// 6. Giant South Soundstage Games Arena

export interface RoomDef {
  id: Room;
  label: string;
  emoji: string;
  center: [number, number];
  size: [number, number];
  floor: string;
  outdoor?: boolean;
}

export const ROOM_DEFS: RoomDef[] = [
  { id: 'Kitchen', label: 'Kitchen & Dining', emoji: '🍳', center: [-10, -11], size: [18, 14], floor: '#f8fafc' },
  { id: 'Lounge', label: 'Grand Lounge', emoji: '🛋️', center: [-10, 4], size: [18, 16], floor: '#b88652' },
  { id: 'Bedroom', label: 'Housemate Bedrooms', emoji: '🛏️', center: [-6, 18], size: [16, 12], floor: '#334155' },
  { id: 'HoH Suite', label: 'HoH Penthouse Suite', emoji: '👑', center: [16, -21], size: [20, 12], floor: '#eccf7c' },
  { id: 'Diary Room', label: 'Diary Room', emoji: '🎙️', center: [-20, 18], size: [10, 10], floor: '#09090b' },
  { id: 'Arena', label: 'Games Arena', emoji: '🏟️', center: [16, 20], size: [20, 12], floor: '#991b1b' },
  { id: 'Garden', label: 'Resort Garden & Pool', emoji: '🌴', center: [16, -2], size: [24, 26], floor: '#5ea853', outdoor: true },
];

export const WORLD_BOUNDS = { minX: -26, maxX: 27, minZ: -28, maxZ: 27 };

export const PLAYER_SPAWN: [number, number] = [-10, 8]; // Open floor space in Grand Lounge

export function roomAt(x: number, z: number): Room {
  for (const r of ROOM_DEFS) {
    const hw = r.size[0] / 2;
    const hd = r.size[1] / 2;
    if (x >= r.center[0] - hw && x <= r.center[0] + hw && z >= r.center[1] - hd && z <= r.center[1] + hd) {
      return r.id;
    }
  }
  return 'Garden';
}

export interface FurnitureDef {
  room: Room;
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  name: string;
}

export interface WallDef {
  center: [number, number];
  size: [number, number];
  height: number;
  color?: string;
  kind?: 'compound' | 'interior' | 'perimeter';
}

export const WALLS: WallDef[] = [
  // ==========================================
  // 1. TALL OUTER COMPOUND SECURITY WALLS
  // Fully encloses the studio estate & garden courtyard
  // ==========================================
  // North compound wall (Z = -27.5)
  { center: [0.5, -27.5], size: [53, 1], height: 5.5, color: '#cbd5e1', kind: 'compound' },
  // South compound wall (Z = 26.5)
  { center: [0.5, 26.5], size: [53, 1], height: 5.5, color: '#cbd5e1', kind: 'compound' },
  // West compound perimeter wall (X = -25.5)
  { center: [-25.5, -0.5], size: [1, 53], height: 5.5, color: '#cbd5e1', kind: 'compound' },
  // East compound perimeter wall (X = 26.5)
  { center: [26.5, -0.5], size: [1, 53], height: 5.5, color: '#cbd5e1', kind: 'compound' },

  // ==========================================
  // 2. OPEN-CONCEPT ATRIUM PILLARS & PARTITIONS
  // ==========================================
  // Kitchen-to-Lounge architectural columns (wide 12m open atrium between -16.5 and -3.5)
  { center: [-17, -4], size: [1, 1], height: 4.2, color: '#e2e8f0', kind: 'interior' },
  { center: [-3, -4], size: [1, 1], height: 4.2, color: '#e2e8f0', kind: 'interior' },

  // House-to-Garden Glass Patio Wall (along X = -1)
  // North solid corner wall
  { center: [-1, -16.5], size: [0.8, 3], height: 4.2, color: '#e2e8f0', kind: 'interior' },
  // South solid corner wall
  { center: [-1, 10.5], size: [0.8, 3], height: 4.2, color: '#e2e8f0', kind: 'interior' },

  // Lounge-to-Bedroom Dividing Wall (along Z = 12)
  // Door gap X ∈ [-13, -3] (10m wide entryway into Bedroom Wing)
  { center: [-16.5, 12], size: [5, 0.8], height: 4.2, color: '#e2e8f0', kind: 'interior' },
  { center: [-0.5, 12], size: [3, 0.8], height: 4.2, color: '#e2e8f0', kind: 'interior' },

  // Diary Room Secret Corridor & Privacy Walls
  // East privacy wall (along X = -15, door gap at Z ∈ [16, 20])
  { center: [-15, 14.5], size: [0.8, 3], height: 4.2, color: '#a855f7', kind: 'interior' },
  { center: [-15, 21.5], size: [0.8, 3], height: 4.2, color: '#a855f7', kind: 'interior' },
  // North soundproof wall
  { center: [-20, 13], size: [10, 0.8], height: 4.2, color: '#a855f7', kind: 'interior' },

  // HoH Penthouse Entrance Wall (along Z = -15)
  // Grand 8m entrance at X ∈ [12, 20]
  { center: [9, -15], size: [6, 0.8], height: 4.2, color: '#cbd5e1', kind: 'interior' },
  { center: [23, -15], size: [6, 0.8], height: 4.2, color: '#cbd5e1', kind: 'interior' },

  // Arena Sliding Gate Wall (along Z = 13.5)
  // Challenge sliding gate opening at X ∈ [12, 20]
  { center: [9, 13.5], size: [6, 0.8], height: 4.2, color: '#cbd5e1', kind: 'interior' },
  { center: [23, 13.5], size: [6, 0.8], height: 4.2, color: '#cbd5e1', kind: 'interior' },
];

import { getEnvironmentColliders, getOtherAvatars } from './collisionStore';

/**
 * Test and resolve circle vs unexpanded AABB box collision.
 * Computes exact Euclidean distance from circle to box surface,
 * pushing the circle out flush and projecting velocity tangentially (zero bounce, zero penetration).
 */
function resolveCircleBox(
  p: { x: number; z: number },
  v: { dx: number; dz: number },
  center: [number, number],
  size: [number, number],
  radius: number
): boolean {
  const halfW = size[0] / 2;
  const halfD = size[1] / 2;
  const minX = center[0] - halfW;
  const maxX = center[0] + halfW;
  const minZ = center[1] - halfD;
  const maxZ = center[1] + halfD;

  const cpX = Math.max(minX, Math.min(maxX, p.x));
  const cpZ = Math.max(minZ, Math.min(maxZ, p.z));

  const distX = p.x - cpX;
  const distZ = p.z - cpZ;
  const distSq = distX * distX + distZ * distZ;

  if (distSq < radius * radius) {
    const dist = Math.sqrt(distSq);
    let nx = 0;
    let nz = 0;
    let overlap = 0;

    if (dist > 1e-6) {
      nx = distX / dist;
      nz = distZ / dist;
      overlap = radius - dist;
    } else {
      // Circle center is inside obstacle box: push out to nearest face
      const dLeft = p.x - minX;
      const dRight = maxX - p.x;
      const dTop = p.z - minZ;
      const dBottom = maxZ - p.z;
      const minD = Math.min(dLeft, dRight, dTop, dBottom);

      if (minD === dLeft) { nx = -1; overlap = dLeft + radius; }
      else if (minD === dRight) { nx = 1; overlap = dRight + radius; }
      else if (minD === dTop) { nz = -1; overlap = dTop + radius; }
      else { nz = 1; overlap = dBottom + radius; }
    }

    p.x += nx * overlap;
    p.z += nz * overlap;

    // Deflect velocity: project remaining velocity along contact tangent (zero bounce)
    const dot = v.dx * nx + v.dz * nz;
    if (dot < 0) {
      v.dx -= dot * nx;
      v.dz -= dot * nz;
    }
    return true;
  }
  return false;
}

function resolveCircleCircle(
  p: { x: number; z: number },
  v: { dx: number; dz: number },
  ox: number,
  oz: number,
  oRadius: number,
  radius: number
): boolean {
  const minDist = radius + oRadius;
  const distX = p.x - ox;
  const distZ = p.z - oz;
  const distSq = distX * distX + distZ * distZ;

  if (distSq < minDist * minDist) {
    const dist = Math.sqrt(distSq);
    let nx = 1;
    let nz = 0;
    let overlap = minDist;

    if (dist > 1e-6) {
      nx = distX / dist;
      nz = distZ / dist;
      overlap = minDist - dist;
    }

    p.x += nx * overlap;
    p.z += nz * overlap;

    const dot = v.dx * nx + v.dz * nz;
    if (dot < 0) {
      v.dx -= dot * nx;
      v.dz -= dot * nz;
    }
    return true;
  }
  return false;
}

export function collideWalls(pos: { x: number; z: number }, radius = 0.45): void {
  const colliders = getEnvironmentColliders();
  const dummyV = { dx: 0, dz: 0 };
  for (let pass = 0; pass < 2; pass++) {
    for (const c of colliders) {
      resolveCircleBox(pos, dummyV, c.center, c.size, radius);
    }
  }
}

export function isPointBlocked(x: number, z: number, radius = 0.45): boolean {
  const colliders = getEnvironmentColliders();
  for (const c of colliders) {
    const halfW = c.size[0] / 2;
    const halfD = c.size[1] / 2;
    const minX = c.center[0] - halfW;
    const maxX = c.center[0] + halfW;
    const minZ = c.center[1] - halfD;
    const maxZ = c.center[1] + halfD;

    const cpX = Math.max(minX, Math.min(maxX, x));
    const cpZ = Math.max(minZ, Math.min(maxZ, z));
    const distX = x - cpX;
    const distZ = z - cpZ;
    if (distX * distX + distZ * distZ < radius * radius) {
      return true;
    }
  }
  return false;
}

export function getRandomWalkablePointInRoom(roomDef: RoomDef, radius = 0.45): { x: number; z: number } {
  const hw = Math.max(1.5, roomDef.size[0] / 2 - 1.5);
  const hd = Math.max(1.5, roomDef.size[1] / 2 - 1.5);

  for (let attempt = 0; attempt < 30; attempt++) {
    const x = roomDef.center[0] + (Math.random() * 2 - 1) * hw;
    const z = roomDef.center[1] + (Math.random() * 2 - 1) * hd;
    if (!isPointBlocked(x, z, radius)) {
      return { x, z };
    }
  }

  const fallback = { x: roomDef.center[0], z: roomDef.center[1] };
  collideWalls(fallback, radius);
  return fallback;
}

/**
 * Continuous circle-box & circle-circle sliding movement resolution.
 * Substeps movement and projects velocity tangentially along solid obstacles,
 * guaranteeing zero penetration, zero bounce, and smooth corner gliding.
 */
export function moveWithSliding(
  currentPos: { x: number; z: number },
  dx: number,
  dz: number,
  radius = 0.45,
  selfId?: string
): { x: number; z: number } {
  const p = { x: currentPos.x, z: currentPos.z };
  const v = { dx, dz };
  const colliders = getEnvironmentColliders();
  const otherAvatars = selfId !== undefined ? getOtherAvatars(selfId) : [];

  const SUBSTEPS = 2;
  const subDx = dx / SUBSTEPS;
  const subDz = dz / SUBSTEPS;

  for (let s = 0; s < SUBSTEPS; s++) {
    p.x += subDx;
    p.z += subDz;

    for (let iter = 0; iter < 4; iter++) {
      let anyHit = false;

      // 1. Resolve environment obstacles (walls, solid furniture, props)
      for (const c of colliders) {
        if (resolveCircleBox(p, v, c.center, c.size, radius)) {
          anyHit = true;
        }
      }

      // 2. Resolve dynamic Avatar-to-Avatar deflection
      for (const other of otherAvatars) {
        if (resolveCircleCircle(p, v, other.x, other.z, other.radius, radius)) {
          anyHit = true;
        }
      }

      if (!anyHit) break;
    }
  }

  return { x: p.x, z: p.z };
}

