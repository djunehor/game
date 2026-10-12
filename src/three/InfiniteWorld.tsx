import { useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SolidObject } from './SolidObject';
import { playerWorldPos } from './input';
import { useVehicleStore, VEHICLE_CATALOG, type VehicleType } from '../world/vehicleStore';
import { useEconomyStore } from '../world/economyStore';
import { type ShopId } from '../data/commerceCatalog';
import { VehicleVisualModel } from './VehicleModels';

export const CHUNK_SIZE = 100;
export const STREAM_RADIUS = 2; // 5x5 grid = 25 active chunks (500m x 500m)

// ---------------------------------------------------------------------------
// Shop POI Registry
// Streamed chunks publish the world position of their shop entrance so the
// player can open the nearest one with the [E] interact key (matching the
// shortcut advertised on the on-screen badges).
// ---------------------------------------------------------------------------
export interface ShopPoi {
  key: string;
  shopId: ShopId;
  name: string;
  x: number;
  z: number;
}

const shopPois = new Map<string, ShopPoi>();

export function registerShopPoi(poi: ShopPoi): void {
  shopPois.set(poi.key, poi);
}

export function unregisterShopPoi(key: string): void {
  shopPois.delete(key);
}

export function getNearestShopPoi(x: number, z: number, maxDistance = 5.5): ShopPoi | null {
  let nearest: ShopPoi | null = null;
  let best = maxDistance * maxDistance;
  for (const poi of shopPois.values()) {
    const dx = poi.x - x;
    const dz = poi.z - z;
    const distSq = dx * dx + dz * dz;
    if (distSq <= best) {
      best = distSq;
      nearest = poi;
    }
  }
  return nearest;
}

/** Clears the registry (used by tests and on world teardown). */
export function clearShopPois(): void {
  shopPois.clear();
}

// ---------------------------------------------------------------------------
// Active Chunk Registry
// Tracks which streamed chunks are currently mounted so orphaned vehicles can
// be garbage-collected after the player drives one away from its home chunk.
// ---------------------------------------------------------------------------
const activeChunkKeys = new Set<string>();

export function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function isChunkActive(cx: number, cz: number): boolean {
  return activeChunkKeys.has(chunkKey(cx, cz));
}

// Deterministic pseudo-random number generator for chunk content
function chunkHash(cx: number, cz: number, seed = 0): number {
  const v = Math.sin(cx * 127.1 + cz * 311.7 + seed * 43.17) * 43758.5453;
  return v - Math.floor(v);
}

const PETROL_BRANDS = ['Lekki Energy', 'Oando Express', 'Conoil Hub', 'TotalEnergies'];
const SUPERMARKET_NAMES = ['Mega Mart', 'Shoprite', 'Spar Express', 'Prince Ebeano'];
const BANK_NAMES = ['First Bank', 'GTBank', 'Zenith Bank', 'Access Bank'];

export type ChunkType = 'estate_hq' | 'petrol' | 'supermarket' | 'suya' | 'bank';

/** Deterministic district type for a chunk (pure — shared by rendering and POIs). */
export function getChunkType(cx: number, cz: number): ChunkType {
  if (cx === 0 && cz === 0) return 'estate_hq';
  const h = chunkHash(cx, cz, 1);
  if (h < 0.28) return 'petrol';
  if (h < 0.56) return 'supermarket';
  if (h < 0.80) return 'suya';
  return 'bank';
}

/** Deterministic display name for a chunk's district business. */
export function getChunkBrand(cx: number, cz: number, type: ChunkType = getChunkType(cx, cz)): string {
  const idx = Math.floor(chunkHash(cx, cz, 2) * 4);
  if (type === 'petrol') return PETROL_BRANDS[idx] ?? 'Lekki Energy';
  if (type === 'supermarket') return SUPERMARKET_NAMES[idx] ?? 'Mega Mart';
  if (type === 'bank') return BANK_NAMES[idx] ?? 'First Bank';
  if (type === 'estate_hq') return 'Poolside Bar & Drinks';
  return `Zone ${(Math.abs(cx + cz) % 12) + 1}`;
}

const CHUNK_SHOP_BY_TYPE: Record<ChunkType, ShopId> = {
  estate_hq: 'bar',
  petrol: 'gas_station',
  supermarket: 'supermarket',
  suya: 'restaurant',
  bank: 'activity',
};

/** World position of a chunk's shop entrance (matches the rendered badge). */
export function getChunkShopWorldPos(cx: number, cz: number, type: ChunkType = getChunkType(cx, cz)): [number, number] {
  if (type === 'estate_hq') return [cx * CHUNK_SIZE + 16, cz * CHUNK_SIZE];
  // District props sit under a group at local [-15, 0, (50|52)].
  const localZ = type === 'petrol' || type === 'supermarket' ? 52 : 50;
  return [cx * CHUNK_SIZE - 15, cz * CHUNK_SIZE + localZ];
}

/** Pure shop POI descriptor for a chunk. */
export function getChunkShopPoi(cx: number, cz: number): ShopPoi {
  const type = getChunkType(cx, cz);
  const [x, z] = getChunkShopWorldPos(cx, cz, type);
  return {
    key: `poi_${cx}_${cz}`,
    shopId: CHUNK_SHOP_BY_TYPE[type],
    name: getChunkBrand(cx, cz, type),
    x,
    z,
  };
}

/** Parse the home chunk out of a streamed vehicle id (`chunk_veh_<cx>_<cz>`). */
export function parseChunkVehicleId(id: string): { cx: number; cz: number } | null {
  const match = /^chunk_veh_(-?\d+)_(-?\d+)$/.exec(id);
  if (!match) return null;
  return { cx: Number(match[1]), cz: Number(match[2]) };
}

/**
 * A streamed vehicle should be dropped once its home chunk is no longer
 * mounted (e.g. the player drove it away and then dismounted).
 */
export function shouldRemoveOrphanedVehicle(
  id: string,
  isActive: (cx: number, cz: number) => boolean = isChunkActive,
): boolean {
  const home = parseChunkVehicleId(id);
  return home !== null && !isActive(home.cx, home.cz);
}

// ---------------------------------------------------------------------------
// Single Town Chunk Component (100m x 100m)
// ---------------------------------------------------------------------------
export function TownChunk({ cx, cz, isNearby = true }: { cx: number; cz: number; isNearby?: boolean }) {
  const isEstateChunk = cx === 0 && cz === 0;
  const originX = cx * CHUNK_SIZE;
  const originZ = cz * CHUNK_SIZE;

  const isModalOpen = useEconomyStore((s) => Boolean(s.activeShopId || s.isTransferModalOpen));
  const showBadges = isNearby && !isModalOpen;

  // Deterministic chunk metadata
  const chunkType = useMemo(() => getChunkType(cx, cz), [cx, cz]);
  const brandName = useMemo(() => getChunkBrand(cx, cz, chunkType), [cx, cz, chunkType]);

  const chunkVehicle = useMemo(() => {
    if (isEstateChunk) return null;
    const vTypes: VehicleType[] = ['bike', 'keke_napep', 'danfo_bus', 'car'];
    const vIdx = Math.floor(chunkHash(cx, cz, 3) * 4);
    const id = `chunk_veh_${cx}_${cz}`;
    const type = vTypes[vIdx] ?? 'keke_napep';
    const posX = originX - 10;
    const posZ = originZ + 41.5;
    return { id, type, posX, posZ };
  }, [cx, cz, isEstateChunk, originX, originZ]);

  const shopPoi = useMemo<ShopPoi>(() => getChunkShopPoi(cx, cz), [cx, cz]);

  const spawnVehicle = useVehicleStore((s) => s.spawnVehicle);
  const boardVehicle = useVehicleStore((s) => s.boardVehicle);
  const mountedId = useVehicleStore((s) => s.mountedVehicleId);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const openShop = useEconomyStore((s) => s.openShop);

  useEffect(() => {
    if (!chunkVehicle) return;
    // Only seed the parked vehicle once; a vehicle the player drove elsewhere
    // keeps its live transform instead of snapping back to the parking spot.
    if (!useVehicleStore.getState().vehicles[chunkVehicle.id]) {
      spawnVehicle(chunkVehicle.id, chunkVehicle.type, [chunkVehicle.posX, chunkVehicle.posZ, 0], 0);
    }
    return () => {
      // Despawn on chunk unload — unless the player is currently driving it.
      const store = useVehicleStore.getState();
      if (store.mountedVehicleId !== chunkVehicle.id) {
        store.removeVehicle(chunkVehicle.id);
      }
    };
  }, [chunkVehicle, spawnVehicle]);

  useEffect(() => {
    if (!shopPoi) return;
    registerShopPoi(shopPoi);
    return () => unregisterShopPoi(shopPoi.key);
  }, [shopPoi]);

  const registeredVeh = chunkVehicle ? vehicles[chunkVehicle.id] : null;

  return (
    <group position={[originX, 0, originZ]}>
      {/* 1. Seamless Grass Terrain Base for this Chunk */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CHUNK_SIZE + 0.5, CHUNK_SIZE + 0.5]} />
        <meshStandardMaterial color="#5ea853" roughness={0.9} />
      </mesh>

      {/* 2. East-West Main Boulevard (Admiralty Way Continuum, Z = 34) */}
      <mesh position={[0, 0.02, 34]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CHUNK_SIZE + 0.2, 11]} />
        <meshStandardMaterial color="#1e293b" roughness={0.88} />
      </mesh>
      {/* Double Solid Yellow Center Lines */}
      {[-0.12, 0.12].map((dz, idx) => (
        <mesh key={`ew-yellow-${idx}`} position={[0, 0.03, 34 + dz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CHUNK_SIZE + 0.2, 0.1]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}
      {/* White Road Edge Lines */}
      {[-5.2, 5.2].map((dz, idx) => (
        <mesh key={`ew-edge-${idx}`} position={[0, 0.03, 34 + dz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CHUNK_SIZE + 0.2, 0.12]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}
      {/* North Sidewalk */}
      <mesh position={[0, 0.08, 27.5]} receiveShadow>
        <boxGeometry args={[CHUNK_SIZE + 0.2, 0.16, 2.0]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.65} />
      </mesh>
      {/* South Sidewalk */}
      <mesh position={[0, 0.08, 40.5]} receiveShadow>
        <boxGeometry args={[CHUNK_SIZE + 0.2, 0.16, 2.0]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.65} />
      </mesh>

      {/* 3. North-South Cross Boulevard (Marina Avenue Continuum, X = 40) */}
      <mesh position={[40, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, CHUNK_SIZE + 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.88} />
      </mesh>
      {/* Cross Boulevard Double Yellow Lines */}
      {[-0.12, 0.12].map((dx, idx) => (
        <mesh key={`ns-yellow-${idx}`} position={[40 + dx, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, CHUNK_SIZE + 0.2]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}
      {/* Cross Boulevard White Edge Lines */}
      {[-5.2, 5.2].map((dx, idx) => (
        <mesh key={`ns-edge-${idx}`} position={[40 + dx, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, CHUNK_SIZE + 0.2]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}

      {/* 4. Intersection Slab at [40, 34] */}
      <mesh position={[40, 0.022, 34]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.2, 11.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.88} />
      </mesh>

      {/* 5. Street Lamps (Every 25m along East-West Boulevard) */}
      {[-35, -10, 15].map((lx, idx) => (
        <group key={`chunk-lamp-${idx}`} position={[lx, 0, 41.5]}>
          <mesh position={[0, 3.0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 6.0, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          <mesh position={[0, 5.8, -0.6]} rotation={[0.4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.4, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          <mesh position={[0, 5.9, -1.2]}>
            <boxGeometry args={[0.3, 0.1, 0.6]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Boulevard Tropical Palm Trees */}
      {[-40, -18, 5, 25].map((px, idx) => (
        <group key={`chunk-palm-${idx}`} position={[px, 0, 43.5]}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 5.0, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 5.2, 0]} castShadow>
            <sphereGeometry args={[1.6, 8, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 6. Procedural Chunk District Content */}
      {isEstateChunk && (
        <>
          {/* Driveway connector linking BBNaija South Gate (Z=26.5) to Admiralty Way (Z=28.5) */}
          <mesh position={[0.5, 0.02, 29.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[8, 6]} />
            <meshStandardMaterial color="#1e293b" roughness={0.88} />
          </mesh>
          {/* Zebra crossing at Gate */}
          {[-3, -2, -1, 0, 1, 2, 3].map((zx, idx) => (
            <mesh key={`gate-zebra-${idx}`} position={[zx + 0.5, 0.035, 32]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.5, 5.0]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          ))}
          {/* Gate Exit Sign */}
          {showBadges && (
            <Html position={[0.5, 4.4, 26.3]} center distanceFactor={18} zIndexRange={[10, 0]}>
              <div className="flex flex-col items-center pointer-events-none select-none whitespace-nowrap">
                <div className="flex items-center gap-2 rounded-full bg-emerald-600/95 px-4 py-1.5 text-xs font-bold text-white shadow-2xl ring-2 ring-emerald-300 backdrop-blur-md animate-pulse">
                  <span>🚪</span>
                  <span>EXIT → Admiralty Way</span>
                </div>
              </div>
            </Html>
          )}
          {/* Gate Estate Title */}
          {showBadges && (
            <Html position={[0.5, 4.0, 27.5]} center distanceFactor={18} zIndexRange={[10, 0]}>
              <div className="flex flex-col items-center pointer-events-none select-none whitespace-nowrap">
                <div className="flex items-center gap-2 rounded-full bg-amber-500/95 px-3.5 py-1 text-xs font-bold text-black shadow-xl ring-2 ring-amber-300 backdrop-blur-md">
                  <span>🏠</span>
                  <span>Big Brother Naija Estate</span>
                </div>
              </div>
            </Html>
          )}
          {/* Security Guard Booth */}
          <SolidObject name="Security Guard Booth" position={[5.8, 1.5, 26.5]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.0, 3.0, 2.0]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
            </mesh>
            <mesh position={[-0.4, 1.6, 0]}>
              <boxGeometry args={[3.0, 0.15, 2.4]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>
          </SolidObject>
          {/* Left Gate Pillar */}
          <SolidObject name="Gate Pillar West" position={[-4.0, 1.8, 26.5]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.8, 3.6, 0.8]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
          </SolidObject>
          {/* Boom Barrier */}
          <mesh position={[4.6, 0.55, 26.5]} castShadow>
            <boxGeometry args={[0.5, 1.1, 0.5]} />
            <meshStandardMaterial color="#f97316" metalness={0.4} />
          </mesh>
          <mesh position={[4.2, 2.5, 26.5]} rotation={[0, 0, -Math.PI / 3]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 5.0, 12]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>

          {/* Garden Poolside Bar & Lounge Button */}
          {showBadges && (
            <Html position={[16, 2.5, 0]} center distanceFactor={18} zIndexRange={[10, 0]}>
              <button
                type="button"
                onClick={() => openShop('bar')}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-purple-700/95 hover:bg-purple-600 px-3.5 py-1 text-xs font-bold text-white shadow-2xl ring-2 ring-purple-300 backdrop-blur-md cursor-pointer transition hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <span>🍸</span>
                <span>Poolside Bar & Drinks [E]</span>
              </button>
            </Html>
          )}
        </>
      )}

      {/* Procedural District Type: Petrol Station */}
      {chunkType === 'petrol' && (
        <group position={[-15, 0, 52]}>
          <SolidObject name={`Canopy_${cx}_${cz}`} position={[0, 2.2, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[12, 0.4, 14]} />
              <meshStandardMaterial color="#0284c7" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[12.2, 0.15, 14.2]} />
              <meshStandardMaterial color="#facc15" />
            </mesh>
            {[-4, 4].map((px, i) => (
              <mesh key={`pump-col-${i}`} position={[px, -1.8, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 3.8, 12]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
              </mesh>
            ))}
          </SolidObject>
          <SolidObject name={`Pump1_${cx}_${cz}`} position={[-2, 0.8, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.8, 1.6, 0.8]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 0.3, 0.41]}>
              <boxGeometry args={[0.5, 0.4, 0.04]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
            </mesh>
          </SolidObject>
          <SolidObject name={`Pump2_${cx}_${cz}`} position={[2, 0.8, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.8, 1.6, 0.8]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 0.3, 0.41]}>
              <boxGeometry args={[0.5, 0.4, 0.04]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
            </mesh>
          </SolidObject>
          {showBadges && (
            <Html position={[0, 4.8, 0]} center distanceFactor={22} zIndexRange={[10, 0]}>
              <button
                type="button"
                onClick={() => openShop('gas_station')}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-sky-700/95 hover:bg-sky-600 px-3.5 py-1 text-xs font-bold text-white shadow-2xl ring-2 ring-sky-300 backdrop-blur-md cursor-pointer transition hover:scale-105 active:scale-95"
              >
                <span>⛽</span>
                <span>{brandName} [E] Shop Fuel</span>
              </button>
            </Html>
          )}
        </group>
      )}

      {/* Procedural District Type: Supermarket */}
      {chunkType === 'supermarket' && (
        <group position={[-15, 0, 52]}>
          <SolidObject name={`Supermarket_${cx}_${cz}`} position={[0, 2.5, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[14.0, 5.0, 16.0]} />
              <meshStandardMaterial color="#334155" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.6, -8.01]}>
              <boxGeometry args={[10.0, 2.8, 0.04]} />
              <meshPhysicalMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.6} />
            </mesh>
            <mesh position={[0, 1.2, -8.6]} castShadow>
              <boxGeometry args={[12.0, 0.2, 2.0]} />
              <meshStandardMaterial color="#ef4444" roughness={0.3} />
            </mesh>
          </SolidObject>
          {showBadges && (
            <Html position={[0, 5.6, 0]} center distanceFactor={22} zIndexRange={[10, 0]}>
              <button
                type="button"
                onClick={() => openShop('supermarket')}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-red-600/95 hover:bg-red-500 px-3.5 py-1 text-xs font-bold text-white shadow-2xl ring-2 ring-red-300 backdrop-blur-md cursor-pointer transition hover:scale-105 active:scale-95"
              >
                <span>🛒</span>
                <span>{brandName} [E] Enter Mart</span>
              </button>
            </Html>
          )}
        </group>
      )}

      {/* Procedural District Type: Suya Spot */}
      {chunkType === 'suya' && (
        <group position={[-15, 0, 50]}>
          <SolidObject name={`SuyaGazebo_${cx}_${cz}`} position={[0, 1.5, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[6.0, 0.3, 6.0]} />
              <meshStandardMaterial color="#78350f" roughness={0.9} />
            </mesh>
            {[-2.6, 2.6].map((gx, i) => (
              <mesh key={`suya-col-${i}`} position={[gx, -1.3, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 2.6, 8]} />
                <meshStandardMaterial color="#451a03" />
              </mesh>
            ))}
            <mesh position={[0, -1.0, 0]} castShadow>
              <boxGeometry args={[2.0, 0.8, 1.2]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
            <mesh position={[0, -0.55, 0]}>
              <boxGeometry args={[1.8, 0.1, 1.0]} />
              <meshStandardMaterial color="#ef4444" emissive="#f97316" emissiveIntensity={0.8} />
            </mesh>
          </SolidObject>
          {showBadges && (
            <Html position={[0, 3.4, 0]} center distanceFactor={20} zIndexRange={[10, 0]}>
              <button
                type="button"
                onClick={() => openShop('restaurant')}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-amber-600/95 hover:bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-xl ring-2 ring-amber-300 backdrop-blur-md cursor-pointer transition hover:scale-105 active:scale-95"
              >
                <span>🍢</span>
                <span>Lekki Suya Spot [E] Order Food</span>
              </button>
            </Html>
          )}
        </group>
      )}

      {/* Procedural District Type: Bank / ATM Gallery */}
      {chunkType === 'bank' && (
        <group position={[-15, 0, 50]}>
          <SolidObject name={`BankKiosk_${cx}_${cz}`} position={[0, 1.6, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[6.0, 3.2, 5.0]} />
              <meshStandardMaterial color="#0f766e" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, -2.51]}>
              <boxGeometry args={[4.6, 2.4, 0.04]} />
              <meshPhysicalMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.6} />
            </mesh>
            {[-1.2, 1.2].map((ax, aidx) => (
              <mesh key={`atm-dispenser-${aidx}`} position={[ax, 0.1, -2.48]}>
                <boxGeometry args={[0.8, 1.0, 0.05]} />
                <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.7} />
              </mesh>
            ))}
          </SolidObject>
          {showBadges && (
            <Html position={[0, 3.6, 0]} center distanceFactor={20} zIndexRange={[10, 0]}>
              <button
                type="button"
                onClick={() => openShop('activity')}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-emerald-700/95 hover:bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xl ring-2 ring-emerald-300 backdrop-blur-md cursor-pointer transition hover:scale-105 active:scale-95"
              >
                <span>🏧</span>
                <span>{brandName} [E] Activities & ATM</span>
              </button>
            </Html>
          )}
        </group>
      )}

      {/* 7. Parked Procedural Vehicle in this Chunk */}
      {registeredVeh && registeredVeh.id !== mountedId && (
        <group position={[-10, 0, 41.5]}>
          <VehicleVisualModel type={registeredVeh.type} />
          {showBadges && (
            <Html
              position={[0, registeredVeh.type === 'danfo_bus' ? 2.6 : (registeredVeh.type === 'keke_napep' ? 2.1 : 1.8), 0]}
              center
              distanceFactor={14}
              zIndexRange={[10, 0]}
            >
              <button
                type="button"
                onClick={() => boardVehicle(registeredVeh.id, 'player')}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-slate-950/85 hover:bg-black px-3 py-1 font-sans text-xs font-bold text-white shadow-xl ring-1 ring-white/20 backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <span>{VEHICLE_CATALOG[registeredVeh.type].emoji}</span>
                <span>Drive {VEHICLE_CATALOG[registeredVeh.type].name.split(' ')[0]} [F]</span>
              </button>
            </Html>
          )}
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Dynamic Infinite World Chunk Streamer
// ---------------------------------------------------------------------------
export function InfiniteWorld() {
  const [centerChunk, setCenterChunk] = useState<{ cx: number; cz: number }>({ cx: 0, cz: 0 });

  useFrame(() => {
    const pcx = Math.round(playerWorldPos.x / CHUNK_SIZE);
    const pcz = Math.round(playerWorldPos.z / CHUNK_SIZE);
    if (pcx !== centerChunk.cx || pcz !== centerChunk.cz) {
      setCenterChunk({ cx: pcx, cz: pcz });
    }
  });

  // Calculate active chunk grid around player
  const activeChunks = useMemo(() => {
    const chunks: { cx: number; cz: number; key: string }[] = [];
    for (let dx = -STREAM_RADIUS; dx <= STREAM_RADIUS; dx++) {
      for (let dz = -STREAM_RADIUS; dz <= STREAM_RADIUS; dz++) {
        const cx = centerChunk.cx + dx;
        const cz = centerChunk.cz + dz;
        chunks.push({ cx, cz, key: chunkKey(cx, cz) });
      }
    }
    return chunks;
  }, [centerChunk.cx, centerChunk.cz]);

  // Publish the mounted chunk set so orphaned streamed vehicles can be GC'd.
  useEffect(() => {
    activeChunkKeys.clear();
    for (const c of activeChunks) activeChunkKeys.add(c.key);
    return () => {
      activeChunkKeys.clear();
    };
  }, [activeChunks]);

  return (
    <group position={[0, 0, 0]}>
      {/* Dynamic follower horizon ground (ensures landscape extends to infinity) */}
      <mesh
        position={[centerChunk.cx * CHUNK_SIZE, -0.06, centerChunk.cz * CHUNK_SIZE]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#5ea853" roughness={0.9} />
      </mesh>

      {/* Streamed dynamic town chunks */}
      {activeChunks.map((c) => (
        <TownChunk
          key={c.key}
          cx={c.cx}
          cz={c.cz}
          isNearby={c.cx === centerChunk.cx && c.cz === centerChunk.cz}
        />
      ))}
    </group>
  );
}
