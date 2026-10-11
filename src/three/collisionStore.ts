import * as THREE from 'three';
import { WALLS } from './rooms';

export interface AvatarCollider {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface SolidBoxCollider {
  name: string;
  center: [number, number];
  size: [number, number];
}

// Map of dynamic 3D scene solid objects (extracted automatically from Three.js scene hierarchy)
const dynamicSceneSolids = new Map<string, SolidBoxCollider>();

// Map of real-time avatar positions (player, AI housemates, remote peers)
const activeAvatars = new Map<string, AvatarCollider>();

/**
 * Register or update a Three.js Object3D as a solid environment collider.
 * Automatically computes world AABB without requiring manual coordinate tracking.
 */
export function registerSolidObject(object: THREE.Object3D, name: string): void {
  try {
    object.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(object);

    if (box.isEmpty()) {
      console.warn(`[Collision] Box for "${name}" is empty, skipping registration`);
      return;
    }

    const sizeX = Math.max(0.2, box.max.x - box.min.x);
    const sizeZ = Math.max(0.2, box.max.z - box.min.z);
    const centerX = (box.min.x + box.max.x) / 2;
    const centerZ = (box.min.z + box.max.z) / 2;

    dynamicSceneSolids.set(name, {
      name,
      center: [centerX, centerZ],
      size: [sizeX, sizeZ],
    });

    console.log(`[Collision] Auto-registered solid 3D object "${name}" at [${centerX.toFixed(2)}, ${centerZ.toFixed(2)}], size [${sizeX.toFixed(2)}, ${sizeZ.toFixed(2)}]`);
  } catch (err) {
    console.error(`[Collision] Failed to compute bounding box for "${name}":`, err);
  }
}

/**
 * Unregister a 3D scene solid object (e.g. when unmounted).
 */
export function unregisterSolidObject(name: string): void {
  dynamicSceneSolids.delete(name);
}

/**
 * Update real-time position of an avatar (player, NPC, remote).
 */
export function updateAvatarCollider(id: string, x: number, z: number, radius = 0.45): void {
  activeAvatars.set(id, { id, x, z, radius });
}

/**
 * Remove an avatar collider when unmounted or evicted.
 */
export function removeAvatarCollider(id: string): void {
  activeAvatars.delete(id);
}

/**
 * Get active environment colliders.
 * Combines compound perimeter walls with dynamically registered 3D scene solids.
 */
export function getEnvironmentColliders(): { center: [number, number]; size: [number, number] }[] {
  const colliders: { center: [number, number]; size: [number, number] }[] = [
    ...WALLS.map((w) => ({ center: w.center, size: w.size })),
  ];

  for (const solid of dynamicSceneSolids.values()) {
    colliders.push({ center: solid.center, size: solid.size });
  }

  return colliders;
}

/**
 * Get all other active avatars (excluding selfId).
 */
export function getOtherAvatars(excludeId?: string): AvatarCollider[] {
  const list: AvatarCollider[] = [];
  for (const [id, av] of activeAvatars.entries()) {
    if (id !== excludeId) {
      list.push(av);
    }
  }
  return list;
}
