import { create } from 'zustand';
import type { Coordinate3D } from './types';

export type VehicleType = 'bike' | 'keke_napep' | 'danfo_bus' | 'car';

export interface VehicleDef {
  type: VehicleType;
  name: string;
  emoji: string;
  maxSpeed: number; // m/s (pedestrian speed is 9 m/s)
  acceleration: number; // m/s^2
  reverseSpeed: number; // m/s
  capacity: number; // Driver + passengers
  dimensions: [number, number, number]; // [width, depth, height] in meters
  modelColor: string;
}

export const VEHICLE_CATALOG: Record<VehicleType, VehicleDef> = {
  bike: {
    type: 'bike',
    name: 'Okada Express Motorcycle',
    emoji: '🏍️',
    maxSpeed: 15.0,
    acceleration: 18.0,
    reverseSpeed: 4.0,
    capacity: 2,
    dimensions: [0.8, 2.0, 1.2],
    modelColor: '#ef4444',
  },
  keke_napep: {
    type: 'keke_napep',
    name: 'Lagos Yellow Keke Napep',
    emoji: '🛺',
    maxSpeed: 12.5,
    acceleration: 12.0,
    reverseSpeed: 3.5,
    capacity: 4,
    dimensions: [1.6, 2.8, 1.8],
    modelColor: '#eab308',
  },
  danfo_bus: {
    type: 'danfo_bus',
    name: 'Danfo Commercial Minibus',
    emoji: '🚐',
    maxSpeed: 16.5,
    acceleration: 8.5,
    reverseSpeed: 4.0,
    capacity: 14,
    dimensions: [2.2, 5.4, 2.4],
    modelColor: '#facc15',
  },
  car: {
    type: 'car',
    name: 'Innoson IVM Luxury SUV',
    emoji: '🚗',
    maxSpeed: 22.0,
    acceleration: 16.0,
    reverseSpeed: 6.0,
    capacity: 5,
    dimensions: [2.1, 4.8, 1.7],
    modelColor: '#0284c7',
  },
};

export interface ActiveVehicleInstance {
  id: string;
  type: VehicleType;
  name: string;
  position: Coordinate3D; // [x, y, z]
  rotation: number; // Yaw heading in radians
  speed: number; // Current velocity
  driverId: string | null;
  passengerIds: string[];
}

interface VehicleStoreState {
  vehicles: Record<string, ActiveVehicleInstance>;
  mountedVehicleId: string | null; // Currently boarded vehicle by local player

  // Actions
  spawnVehicle: (id: string, type: VehicleType, position: Coordinate3D, rotation?: number) => void;
  removeVehicle: (id: string) => void;
  boardVehicle: (vehicleId: string, avatarId: string) => boolean;
  dismountVehicle: (avatarId: string) => Coordinate3D | null;
  updateVehicleTransform: (
    vehicleId: string,
    position: Coordinate3D,
    rotation: number,
    speed: number
  ) => void;
  getNearbyVehicle: (
    pos: Coordinate3D,
    maxDistance?: number
  ) => ActiveVehicleInstance | null;
  getMountedVehicle: (avatarId: string) => ActiveVehicleInstance | null;
  resetVehicles: () => void;
}

export const useVehicleStore = create<VehicleStoreState>((set, get) => ({
  vehicles: {},
  mountedVehicleId: null,

  spawnVehicle: (id, type, position, rotation = 0) => {
    const def = VEHICLE_CATALOG[type];
    const newInstance: ActiveVehicleInstance = {
      id,
      type,
      name: def.name,
      position,
      rotation,
      speed: 0,
      driverId: null,
      passengerIds: [],
    };

    set((state) => ({
      vehicles: { ...state.vehicles, [id]: newInstance },
    }));
  },

  removeVehicle: (id) => {
    set((state) => {
      const copy = { ...state.vehicles };
      delete copy[id];
      return {
        vehicles: copy,
        mountedVehicleId: state.mountedVehicleId === id ? null : state.mountedVehicleId,
      };
    });
  },

  boardVehicle: (vehicleId, avatarId) => {
    const v = get().vehicles[vehicleId];
    if (!v) return false;

    const def = VEHICLE_CATALOG[v.type];

    // If no driver, avatar becomes driver
    if (v.driverId === null) {
      set((state) => ({
        vehicles: {
          ...state.vehicles,
          [vehicleId]: { ...v, driverId: avatarId },
        },
        mountedVehicleId: vehicleId,
      }));
      return true;
    }

    // If driver already exists, check passenger capacity
    if (v.passengerIds.length < def.capacity - 1 && !v.passengerIds.includes(avatarId)) {
      set((state) => ({
        vehicles: {
          ...state.vehicles,
          [vehicleId]: {
            ...v,
            passengerIds: [...v.passengerIds, avatarId],
          },
        },
        mountedVehicleId: vehicleId,
      }));
      return true;
    }

    return false; // Vehicle is at full capacity
  },

  dismountVehicle: (avatarId) => {
    const state = get();
    let foundVehicle: ActiveVehicleInstance | null = null;

    for (const v of Object.values(state.vehicles)) {
      if (v.driverId === avatarId || v.passengerIds.includes(avatarId)) {
        foundVehicle = v;
        break;
      }
    }

    if (!foundVehicle) return null;

    const vId = foundVehicle.id;
    const isDriver = foundVehicle.driverId === avatarId;
    const nextPassengers = foundVehicle.passengerIds.filter((id) => id !== avatarId);

    // Compute safe exit landing point (1.5m to the right side of the vehicle)
    const exitX = foundVehicle.position[0] + Math.cos(foundVehicle.rotation) * 1.5;
    const exitY = foundVehicle.position[1] + Math.sin(foundVehicle.rotation) * 1.5;
    const exitZ = foundVehicle.position[2];
    const exitPoint: Coordinate3D = [exitX, exitY, exitZ];

    set((s) => ({
      vehicles: {
        ...s.vehicles,
        [vId]: {
          ...foundVehicle!,
          driverId: isDriver ? null : foundVehicle!.driverId,
          passengerIds: nextPassengers,
          speed: isDriver ? 0 : foundVehicle!.speed,
        },
      },
      mountedVehicleId: s.mountedVehicleId === vId ? null : s.mountedVehicleId,
    }));

    return exitPoint;
  },

  updateVehicleTransform: (vehicleId, position, rotation, speed) => {
    const v = get().vehicles[vehicleId];
    if (!v) return;
    v.position = position;
    v.rotation = rotation;
    v.speed = speed;
  },

  getNearbyVehicle: (pos, maxDistance = 3.5) => {
    const all = Object.values(get().vehicles);
    let closest: ActiveVehicleInstance | null = null;
    let closestDistSq = maxDistance * maxDistance;

    for (const v of all) {
      const dx = v.position[0] - pos[0];
      const dy = v.position[1] - pos[1];
      const dz = v.position[2] - pos[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq <= closestDistSq) {
        closest = v;
        closestDistSq = distSq;
      }
    }

    return closest;
  },

  getMountedVehicle: (avatarId) => {
    for (const v of Object.values(get().vehicles)) {
      if (v.driverId === avatarId || v.passengerIds.includes(avatarId)) {
        return v;
      }
    }
    return null;
  },

  resetVehicles: () => {
    set({ vehicles: {}, mountedVehicleId: null });
  },
}));
