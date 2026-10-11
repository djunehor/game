import { Html } from '@react-three/drei';
import { ROOM_DEFS, WALLS } from './rooms';
import { LivingNPC } from './LivingNPC';
import { RemotePlayer } from './RemotePlayer';
import { Lighting } from './Lighting';
import { HohChallenge } from './HohChallenge';
import { StudioTruss } from './StudioTruss';
import {
  LoungeFurniture,
  KitchenFurniture,
  DiaryRoomFurniture,
  HohSuiteFurniture,
  GardenFurniture,
  ArenaFurniture,
  BedroomFurniture,
} from './Furniture';
import { InteractiveObjects } from './InteractiveObjects';
import { TourSpotlight } from './TourSpotlight';
import { useGame } from '../store';
import type { Housemate } from '../types';

import {
  getParquetTexture,
  getMarbleTexture,
  getAcousticSlatTexture,
} from './textures';

const NO_RAY: () => null = () => null;

export function Scene({
  onTalk,
  onOpenDiaryRoom,
}: {
  onTalk: (h: Housemate) => void;
  onOpenDiaryRoom: () => void;
}) {
  const state = useGame((s) => s.state);
  const active = (state?.housemates ?? []).filter((h) => h.status === 'active');
  const aiNpcs = active.filter((h) => !h.isHuman);
  const humanNpcs = active.filter((h) => h.isHuman);

  return (
    <>
      {/* Dynamic studio lighting (day / night / party / eviction) */}
      <Lighting />
      <fog attach="fog" args={['#bcd9ec', 60, 200]} />

      {/* Exterior Landscape (Outside Compound Walls) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial color="#5ea853" roughness={0.9} />
      </mesh>

      {/* Enclosed Compound Courtyard Ground Base Slab */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[5, 0.01, 4]}
        receiveShadow
      >
        <planeGeometry args={[57, 45]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* Room Floor Base Slabs with Procedural Textures */}
      {ROOM_DEFS.map((r) => {
        let floorMap = null;
        let roughness = 0.7;
        let metalness = 0.05;
        if (r.id === 'Lounge' || r.id === 'HoH Suite') {
          floorMap = getParquetTexture(4, 4);
          roughness = 0.35;
        } else if (r.id === 'Kitchen') {
          floorMap = getMarbleTexture(3, 3);
          roughness = 0.15;
          metalness = 0.1;
        } else if (r.id === 'Diary Room') {
          floorMap = getAcousticSlatTexture(4, 3);
          roughness = 0.85;
        }

        return (
          <mesh
            key={r.id}
            position={[r.center[0], 0.03, r.center[1]]}
            receiveShadow
            raycast={NO_RAY}
          >
            <boxGeometry args={[r.size[0], 0.06, r.size[1]]} />
            <meshStandardMaterial
              color={floorMap ? '#ffffff' : r.floor}
              map={floorMap ?? undefined}
              roughness={roughness}
              metalness={metalness}
            />
          </mesh>
        );
      })}

      {/* Floating Room Identity Badges */}
      {ROOM_DEFS.map((r) => (
        <Html
          key={`label-${r.id}`}
          position={[r.center[0], 4.6, r.center[1]]}
          center
          distanceFactor={22}
          zIndexRange={[5, 0]}
        >
          <div className="pointer-events-none flex flex-col items-center whitespace-nowrap">
            <span className="rounded-full bg-ink/75 px-3.5 py-1 text-xs font-bold text-white shadow-xl ring-1 ring-white/20 backdrop-blur-md">
              {r.emoji} {r.label}
            </span>
          </div>
        </Html>
      ))}

      {/* Soundstage & Compound Walls with Architectural Skirting */}
      {WALLS.map((w, i) => (
        <group key={`wall-${i}`}>
          <mesh
            position={[w.center[0], w.height / 2, w.center[1]]}
            castShadow
            receiveShadow
            raycast={NO_RAY}
          >
            <boxGeometry args={[w.size[0], w.height, w.size[1]]} />
            <meshStandardMaterial
              color={w.color ?? (w.kind === 'compound' ? '#cbd5e1' : '#e2e8f0')}
              roughness={w.kind === 'interior' ? 0.5 : 0.8}
            />
          </mesh>

          {/* Architectural Skirting / Baseboard along Interior Wall Bases */}
          {w.kind === 'interior' && (
            <mesh
              position={[w.center[0], 0.08, w.center[1]]}
              receiveShadow
              raycast={NO_RAY}
            >
              <boxGeometry args={[w.size[0] + 0.04, 0.16, w.size[1] + 0.04]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
          )}

          {/* Decorative Coping for Outer Compound Walls */}
          {w.kind === 'compound' && (
            <mesh
              position={[w.center[0], w.height + 0.1, w.center[1]]}
              castShadow
              raycast={NO_RAY}
            >
              <boxGeometry args={[w.size[0] + 0.2, 0.2, w.size[1] + 0.2]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}

      {/* Overhead TV Lighting Truss & Doorway Lintels */}
      <StudioTruss />

      {/* High-Fidelity Room Sets & Custom Furniture */}
      <LoungeFurniture />
      <KitchenFurniture />
      <DiaryRoomFurniture />
      <HohSuiteFurniture />
      <GardenFurniture />
      <ArenaFurniture />
      <BedroomFurniture />

      {/* 3D Clickable Objects and Stations */}
      <InteractiveObjects onOpenDiaryRoom={onOpenDiaryRoom} />

      {/* Autonomous Animated Living AI Housemates */}
      {aiNpcs.map((h, i) => (
        <LivingNPC key={h.id} housemate={h} index={i} onTalk={onTalk} />
      ))}

      {/* Live human housemates (synced by the multiplayer server) */}
      {humanNpcs.map((h) => (
        <RemotePlayer key={h.id} housemate={h} />
      ))}

      {/* 3D Head-of-House arena challenge (Monday) */}
      <HohChallenge />

      {/* 3D Guided Tour Room Spotlight Beacon */}
      <TourSpotlight />
    </>
  );
}
