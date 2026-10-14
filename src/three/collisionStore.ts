import * as THREE from 'three';

// ---------------------------------------------------------------------------
// The single source of truth for what is solid in the world.
//
// Everything the player builds (walls, furniture) registers here, and movement
// consults it. There is no baked-in floor plan.
// ---------------------------------------------------------------------------

export interface AvatarCollider {
  id: string;
  x: number;
  z: number;
  radius: number;
  yaw?: number;
}

export interface SolidBoxCollider {
  name: string;
  center: [number, number];
  size: [number, number];
}

/** Boxes measured from real scene geometry (SolidObject wrappers). */
const sceneSolids = new Map<string, SolidBoxCollider>();

/** Axis-aligned boxes registered directly (player-built walls). */
const staticBoxes = new Map<string, SolidBoxCollider>();

/** Real-time avatar positions for avatar-to-avatar collision. */
const activeAvatars = new Map<string, AvatarCollider>();

function toCollider(object: THREE.Object3D, name: string): SolidBoxCollider | null {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  return {
    name,
    center: [(box.min.x + box.max.x) / 2, (box.min.z + box.max.z) / 2],
    size: [
      Math.max(0.2, box.max.x - box.min.x),
      Math.max(0.2, box.max.z - box.min.z),
    ],
  };
}

/** Register a Three.js object as solid, measuring its world AABB. */
export function registerSolidObject(object: THREE.Object3D, name: string): void {
  const collider = toCollider(object, name);
  if (collider) sceneSolids.set(name, collider);
}

export function unregisterSolidObject(name: string): void {
  sceneSolids.delete(name);
}

export function registerStaticBox(
  name: string,
  center: [number, number],
  size: [number, number],
): void {
  staticBoxes.set(name, { name, center, size });
}

export function unregisterStaticBox(name: string): void {
  staticBoxes.delete(name);
}

export function updateAvatarCollider(
  id: string,
  x: number,
  z: number,
  radius = 0.45,
  yaw?: number,
): void {
  const existing = activeAvatars.get(id);
  activeAvatars.set(id, { id, x, z, radius, yaw: yaw ?? existing?.yaw });
}

// --- Player control --------------------------------------------------------
// The player can grab a Sim and walk them. While a Sim is being driven, their
// own movement logic stands down for that frame.

const drivenAt = new Map<string, number>();

export function markAvatarDriven(id: string): void {
  drivenAt.set(id, performance.now());
}

export function wasAvatarDrivenRecently(id: string, withinMs = 150): boolean {
  const at = drivenAt.get(id);
  if (at === undefined) return false;
  return performance.now() - at < withinMs;
}

export function removeAvatarCollider(id: string): void {
  activeAvatars.delete(id);
}

export function getEnvironmentColliders(): { center: [number, number]; size: [number, number] }[] {
  const colliders: { center: [number, number]; size: [number, number] }[] = [];
  for (const box of staticBoxes.values()) colliders.push({ center: box.center, size: box.size });
  for (const solid of sceneSolids.values()) colliders.push({ center: solid.center, size: solid.size });
  return colliders;
}

export function getAvatarCollider(id: string): AvatarCollider | undefined {
  return activeAvatars.get(id);
}

export function getOtherAvatars(excludeId?: string): AvatarCollider[] {
  const list: AvatarCollider[] = [];
  for (const [id, avatar] of activeAvatars.entries()) {
    if (id !== excludeId) list.push(avatar);
  }
  return list;
}
