import { getEnvironmentColliders, getOtherAvatars } from './collisionStore';

// ---------------------------------------------------------------------------
// Movement resolution: circle-vs-box and circle-vs-circle with tangential
// sliding. No knowledge of the world's contents — colliders come from the
// collision store, which is populated by whatever the player built.
// ---------------------------------------------------------------------------

/** A generous play area; the lot itself is the real constraint. */
export const WORLD_BOUNDS = { minX: -200, maxX: 200, minZ: -200, maxZ: 200 };

export const PLAYER_RADIUS = 0.45;

function resolveCircleBox(
  p: { x: number; z: number },
  v: { dx: number; dz: number },
  center: [number, number],
  size: [number, number],
  radius: number,
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

  if (distSq >= radius * radius) return false;

  const dist = Math.sqrt(distSq);
  let nx = 0;
  let nz = 0;
  let overlap = 0;

  if (dist > 1e-6) {
    nx = distX / dist;
    nz = distZ / dist;
    overlap = radius - dist;
  } else {
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

  // Project velocity along the contact tangent: slides, never bounces.
  const dot = v.dx * nx + v.dz * nz;
  if (dot < 0) {
    v.dx -= dot * nx;
    v.dz -= dot * nz;
  }
  return true;
}

function resolveCircleCircle(
  p: { x: number; z: number },
  v: { dx: number; dz: number },
  ox: number,
  oz: number,
  oRadius: number,
  radius: number,
): boolean {
  const minDist = radius + oRadius;
  const distX = p.x - ox;
  const distZ = p.z - oz;
  const distSq = distX * distX + distZ * distZ;
  if (distSq >= minDist * minDist) return false;

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

/** Push a point out of anything it is currently overlapping. */
export function collideWalls(pos: { x: number; z: number }, radius = PLAYER_RADIUS): void {
  const colliders = getEnvironmentColliders();
  const dummyV = { dx: 0, dz: 0 };
  for (let pass = 0; pass < 2; pass++) {
    for (const c of colliders) resolveCircleBox(pos, dummyV, c.center, c.size, radius);
  }
}

export function isPointBlocked(x: number, z: number, radius = PLAYER_RADIUS): boolean {
  const colliders = getEnvironmentColliders();
  for (const c of colliders) {
    const minX = c.center[0] - c.size[0] / 2;
    const maxX = c.center[0] + c.size[0] / 2;
    const minZ = c.center[1] - c.size[1] / 2;
    const maxZ = c.center[1] + c.size[1] / 2;
    const cpX = Math.max(minX, Math.min(maxX, x));
    const cpZ = Math.max(minZ, Math.min(maxZ, z));
    const distX = x - cpX;
    const distZ = z - cpZ;
    if (distX * distX + distZ * distZ < radius * radius) return true;
  }
  return false;
}

/**
 * Continuous sliding movement: sub-stepped, then resolved against the
 * environment and any other avatars.
 */
/** Positions must stay finite no matter what is in the world. */
function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function moveWithSliding(
  currentPos: { x: number; z: number },
  dx: number,
  dz: number,
  radius = PLAYER_RADIUS,
  selfId?: string,
): { x: number; z: number } {
  const p = { x: currentPos.x, z: currentPos.z };
  const v = { dx, dz };
  const colliders = getEnvironmentColliders();
  const others = selfId !== undefined ? getOtherAvatars(selfId) : [];

  const SUBSTEPS = 2;
  const subDx = dx / SUBSTEPS;
  const subDz = dz / SUBSTEPS;

  for (let s = 0; s < SUBSTEPS; s++) {
    p.x += subDx;
    p.z += subDz;

    for (let iter = 0; iter < 4; iter++) {
      let hit = false;
      for (const c of colliders) {
        if (resolveCircleBox(p, v, c.center, c.size, radius)) hit = true;
      }
      for (const other of others) {
        if (resolveCircleCircle(p, v, other.x, other.z, other.radius, radius)) hit = true;
      }
      if (!hit) break;
    }
  }

  return { x: finite(p.x, currentPos.x), z: finite(p.z, currentPos.z) };
}
