import { Html } from '@react-three/drei';
import { ROOM_DEFS, WALLS } from './rooms';
import { setTarget } from './input';
import { LivingNPC } from './LivingNPC';
import { RemotePlayer } from './RemotePlayer';
import { Lighting } from './Lighting';
import { HohChallenge } from './HohChallenge';
import {
  LoungeFurniture,
  KitchenFurniture,
  DiaryRoomFurniture,
  HohSuiteFurniture,
  GardenFurniture,
  ArenaFurniture,
  BedroomFurniture,
} from './Furniture';
import { useGame } from '../store';
import type { Housemate } from '../types';

const NO_RAY: () => null = () => null;

export function Scene({ onTalk }: { onTalk: (h: Housemate) => void }) {
  const state = useGame((s) => s.state);
  const active = (state?.housemates ?? []).filter((h) => h.status === 'active');
  const aiNpcs = active.filter((h) => !h.isHuman);
  const humanNpcs = active.filter((h) => h.isHuman);

  return (
    <>
      {/* Dynamic studio lighting (day / night / party / eviction) */}
      <Lighting />
      <fog attach="fog" args={['#bcd9ec', 40, 150]} />

      {/* Main Ground Floor / Yard */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          setTarget(e.point.x, e.point.z);
        }}
      >
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#5ea853" roughness={0.9} />
      </mesh>

      {/* Room Floor Base Slabs with Polished Colors */}
      {ROOM_DEFS.map((r) => (
        <mesh
          key={r.id}
          position={[r.center[0], 0.03, r.center[1]]}
          receiveShadow
          raycast={NO_RAY}
        >
          <boxGeometry args={[r.size[0], 0.06, r.size[1]]} />
          <meshStandardMaterial color={r.floor} roughness={0.75} />
        </mesh>
      ))}

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

      {/* Outer Studio Perimeter Walls */}
      {WALLS.map((w, i) => (
        <mesh
          key={`wall-${i}`}
          position={[w.center[0], w.height / 2, w.center[1]]}
          castShadow
          receiveShadow
          raycast={NO_RAY}
        >
          <boxGeometry args={[w.size[0], w.height, w.size[1]]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>
      ))}

      {/* High-Fidelity Room Sets & Custom Furniture */}
      <LoungeFurniture />
      <KitchenFurniture />
      <DiaryRoomFurniture />
      <HohSuiteFurniture />
      <GardenFurniture />
      <ArenaFurniture />
      <BedroomFurniture />

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
    </>
  );
}
