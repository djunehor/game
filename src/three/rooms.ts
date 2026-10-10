import type { Room } from '../types';

// 3D room layout. The world sits on the XZ plane (Y is up).
// `center` is [x, z]; `size` is [widthX, depthZ].
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
  { id: 'Kitchen', label: 'Kitchen', emoji: '🍳', center: [-16, -12], size: [14, 12], floor: '#e8b98f' },
  { id: 'Lounge', label: 'Lounge', emoji: '🛋️', center: [-16, 4], size: [14, 14], floor: '#dfc79e' },
  { id: 'Bedroom', label: 'Bedroom', emoji: '🛏️', center: [-16, 20], size: [14, 12], floor: '#bccbe8' },
  { id: 'HoH Suite', label: 'HoH Suite', emoji: '👑', center: [2, -12], size: [14, 12], floor: '#eccf7c' },
  { id: 'Diary Room', label: 'Diary Room', emoji: '🎙️', center: [2, 4], size: [14, 10], floor: '#cbbcdf' },
  { id: 'Arena', label: 'Arena', emoji: '🏟️', center: [2, 18], size: [14, 12], floor: '#b9d9b2' },
  { id: 'Garden', label: 'Garden', emoji: '🌴', center: [24, 4], size: [16, 30], floor: '#8fc98f', outdoor: true },
];

// Player movement bounds (keeps you inside the house + garden).
export const WORLD_BOUNDS = { minX: -25, maxX: 34, minZ: -20, maxZ: 28 };

export const PLAYER_SPAWN: [number, number] = [-16, 4]; // Lounge

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

// Simple furniture placed in rooms. Boxes sized in [w, h, d] at [x, z].
export interface FurnitureDef {
  room: Room;
  pos: [number, number, number]; // x, y, z
  size: [number, number, number]; // w, h, d
  color: string;
  name: string;
}

// Perimeter walls (with door gaps) as center/size/height, used for both
// rendering and simple axis-aligned collision.
export interface WallDef {
  center: [number, number]; // x, z
  size: [number, number]; // widthX, depthZ
  height: number;
  color?: string;
  kind?: 'compound' | 'interior' | 'perimeter';
}

export const WALLS: WallDef[] = [
  // ==========================================
  // 1. TALL OUTER COMPOUND SECURITY WALLS
  // Fully encloses the studio estate & garden courtyard
  // ==========================================
  // North compound wall (Z = -18.5, full width across house & garden)
  { center: [5, -18.5], size: [58, 1], height: 5.5, color: '#cbd5e1', kind: 'compound' },
  // South compound wall (Z = 26.5, full width across house & garden)
  { center: [5, 26.5], size: [58, 1], height: 5.5, color: '#cbd5e1', kind: 'compound' },
  // West compound perimeter wall (X = -23.5)
  { center: [-23.5, 4], size: [1, 46], height: 5.5, color: '#cbd5e1', kind: 'compound' },
  // East compound perimeter wall behind garden (X = 33.5)
  { center: [33.5, 4], size: [1, 46], height: 5.5, color: '#cbd5e1', kind: 'compound' },

  // ==========================================
  // 2. SOUNDSTAGE / HOUSE INTERIOR DIVIDER WALLS
  // Separates rooms with authentic doors and archways
  // ==========================================

  // --- West Wing (Kitchen, Lounge, Bedroom) ---
  // Kitchen-to-Lounge dividing wall (Z = -5, door gap X ∈ [-17.5, -14.5])
  { center: [-20.5, -5], size: [5, 0.8], height: 4.2, color: '#e2e8f0', kind: 'interior' },
  { center: [-11.5, -5], size: [5, 0.8], height: 4.2, color: '#e2e8f0', kind: 'interior' },

  // Lounge-to-Bedroom dividing wall (Z = 12.5, door gap X ∈ [-17.5, -14.5])
  { center: [-20.5, 12.5], size: [5, 0.8], height: 4.2, color: '#e2e8f0', kind: 'interior' },
  { center: [-11.5, 12.5], size: [5, 0.8], height: 4.2, color: '#e2e8f0', kind: 'interior' },

  // --- Corridor Partition Walls (along X = -9) ---
  // Separates West Wing from Central Corridor with wide entryways
  { center: [-9, -16.5], size: [0.8, 3], height: 4.2, color: '#e2e8f0', kind: 'interior' },
  { center: [-9, -7.5], size: [0.8, 3], height: 4.2, color: '#e2e8f0', kind: 'interior' },
  // Lounge open archway is at Z ∈ [-3, 10] connecting Lounge to Central Hallway
  { center: [-9, 14.5], size: [0.8, 3], height: 4.2, color: '#e2e8f0', kind: 'interior' },
  { center: [-9, 23.5], size: [0.8, 4], height: 4.2, color: '#e2e8f0', kind: 'interior' },

  // --- Center Wing (HoH Suite, Diary Room, Arena) ---
  // Corridor-to-Center Wing wall (along X = -5)
  // HoH Suite door opening at Z ∈ [-14, -10]
  { center: [-5, -16.5], size: [0.8, 3], height: 4.2, color: '#cbd5e1', kind: 'interior' },
  { center: [-5, -7.5], size: [0.8, 3], height: 4.2, color: '#cbd5e1', kind: 'interior' },

  // Diary Room soundproof walls:
  // North wall (Z = -4.5, between HoH Suite and Diary Room)
  { center: [2, -4.5], size: [14, 0.8], height: 4.2, color: '#a855f7', kind: 'interior' },
  // South wall (Z = 10.5, between Diary Room and Arena)
  { center: [2, 10.5], size: [14, 0.8], height: 4.2, color: '#a855f7', kind: 'interior' },
  // West wall (along X = -5, iconic Diary Room door gap at Z ∈ [3, 5])
  { center: [-5, 0], size: [0.8, 6], height: 4.2, color: '#a855f7', kind: 'interior' },
  { center: [-5, 7.5], size: [0.8, 4], height: 4.2, color: '#a855f7', kind: 'interior' },

  // Arena sliding challenge entrance (gap at Z ∈ [15.5, 19.5])
  { center: [-5, 13], size: [0.8, 4], height: 4.2, color: '#cbd5e1', kind: 'interior' },
  { center: [-5, 23], size: [0.8, 5], height: 4.2, color: '#cbd5e1', kind: 'interior' },

  // --- House to Garden Boundary Wall (along X = 9) ---
  // Solid acoustic soundstage wall behind HoH Suite & Arena, glass patio opening to Garden
  { center: [9, -11], size: [0.8, 14], height: 4.2, color: '#e2e8f0', kind: 'perimeter' },
  { center: [9, 18.5], size: [0.8, 14], height: 4.2, color: '#e2e8f0', kind: 'perimeter' },
];

export function collideWalls(pos: { x: number; z: number }, radius = 0.5): void {
  for (const w of WALLS) {
    const minX = w.center[0] - w.size[0] / 2 - radius;
    const maxX = w.center[0] + w.size[0] / 2 + radius;
    const minZ = w.center[1] - w.size[1] / 2 - radius;
    const maxZ = w.center[1] + w.size[1] / 2 + radius;
    if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
      const left = pos.x - minX;
      const right = maxX - pos.x;
      const top = pos.z - minZ;
      const bottom = maxZ - pos.z;
      const m = Math.min(left, right, top, bottom);
      if (m === left) pos.x = minX;
      else if (m === right) pos.x = maxX;
      else if (m === top) pos.z = minZ;
      else pos.z = bottom;
    }
  }
}

export const FURNITURE: FurnitureDef[] = [
  // Lounge
  { room: 'Lounge', pos: [-20, 0.4, 4], size: [3.5, 0.8, 1.4], color: '#c0392b', name: 'sofa' },
  { room: 'Lounge', pos: [-12, 0.4, 4], size: [3.5, 0.8, 1.4], color: '#c0392b', name: 'sofa' },
  { room: 'Lounge', pos: [-16, 0.25, 7.5], size: [6, 0.5, 3], color: '#8b5a2b', name: 'table' },
  // Kitchen
  { room: 'Kitchen', pos: [-20, 0.5, -12], size: [2.4, 1, 1.4], color: '#b0b0b0', name: 'stove' },
  { room: 'Kitchen', pos: [-12, 0.5, -12], size: [3, 1, 1.2], color: '#9b8a6b', name: 'counter' },
  { room: 'Kitchen', pos: [-16, 0.25, -9], size: [5, 0.5, 2.5], color: '#7a5c3b', name: 'dining' },
  // Bedroom
  { room: 'Bedroom', pos: [-20, 0.45, 20], size: [3.5, 0.9, 5], color: '#f5f5f5', name: 'bed' },
  { room: 'Bedroom', pos: [-12, 0.45, 20], size: [3.5, 0.9, 5], color: '#e8e8e8', name: 'bed' },
  // HoH Suite
  { room: 'HoH Suite', pos: [2, 0.45, -14], size: [4, 0.9, 5], color: '#d4af37', name: 'king bed' },
  { room: 'HoH Suite', pos: [6, 0.3, -10], size: [2, 0.6, 2], color: '#b8860b', name: 'throne' },
  // Diary Room
  { room: 'Diary Room', pos: [0, 0.5, 4], size: [1.4, 1, 1.4], color: '#6a5acd', name: 'diary chair' },
  { room: 'Diary Room', pos: [4, 0.3, 6], size: [2, 0.6, 1.5], color: '#555', name: 'desk' },
  // Arena
  { room: 'Arena', pos: [0, 0.3, 18], size: [2, 0.6, 2], color: '#777', name: 'obstacle' },
  { room: 'Arena', pos: [5, 0.3, 20], size: [2, 0.6, 2], color: '#888', name: 'obstacle' },
  { room: 'Arena', pos: [-1, 0.3, 16], size: [2, 0.6, 2], color: '#999', name: 'obstacle' },
  // Garden
  { room: 'Garden', pos: [24, 0.2, 6], size: [10, 0.4, 16], color: '#3fa7d6', name: 'pool' },
  { room: 'Garden', pos: [18, 0.4, -4], size: [1.2, 0.8, 1.2], color: '#2e8b57', name: 'plant' },
  { room: 'Garden', pos: [30, 0.4, 14], size: [1.2, 0.8, 1.2], color: '#2e8b57', name: 'plant' },
];
