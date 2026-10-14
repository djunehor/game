import { Html } from '@react-three/drei';
import { SolidObject } from './SolidObject';
import { CATALOG_BY_ID } from '../life/catalog';
import { useLifeStore } from '../life/lifeStore';
import { useSimStore } from '../sim/simStore';
import { interactionIdFor } from '../life/objects';
import type { PlacedObject } from '../life/types';

// ---------------------------------------------------------------------------
// Renders everything the player has actually bought. Before this existed the
// lot was data-only, so buying furniture changed numbers but not the world.
// Each placed object is built procedurally from its catalog entry, is solid,
// and can be clicked to open its interactions.
// ---------------------------------------------------------------------------

interface Part {
  g: 'box' | 'cyl' | 'sph';
  s: [number, number, number];
  p: [number, number, number];
  c: string;
  r?: [number, number, number];
}

const box = (w: number, h: number, d: number, x: number, y: number, z: number, c: string): Part => ({ g: 'box', s: [w, h, d], p: [x, y, z], c });
const cyl = (rt: number, rb: number, h: number, x: number, y: number, z: number, c: string): Part => ({ g: 'cyl', s: [rt, rb, h], p: [x, y, z], c });
const sph = (r: number, x: number, y: number, z: number, c: string): Part => ({ g: 'sph', s: [r, r, r], p: [x, y, z], c });

const WOOD = '#78350f';
const DARK_WOOD = '#451a03';
const METAL = '#94a3b8';
const WHITE = '#f8fafc';
const FABRIC = '#7f1d1d';
const FABRIC_LIGHT = '#dc2626';
const TEAK = '#8b5a2b';

/** Procedural geometry for each catalog object. */
function shapeFor(id: string): Part[] {
  switch (id) {
    // --- Beds ---
    case 'camp_bed':
      return [box(2, 0.35, 3, 0, 0.35, 0, METAL), box(1.8, 0.2, 2.8, 0, 0.6, 0, '#cbd5e1'), box(2, 0.7, 0.2, 0, 0.75, -1.4, DARK_WOOD)];
    case 'double_bed':
      return [box(2, 0.4, 3, 0, 0.4, 0, DARK_WOOD), box(1.9, 0.3, 2.8, 0, 0.72, 0, WHITE), box(2, 1, 0.22, 0, 0.95, -1.4, '#1e3a8a'), box(0.8, 0.2, 0.5, -0.5, 0.95, -1.05, WHITE), box(0.8, 0.2, 0.5, 0.5, 0.95, -1.05, WHITE)];
    case 'canopy_bed':
      return [box(3, 0.45, 3, 0, 0.45, 0, DARK_WOOD), box(2.9, 0.3, 2.9, 0, 0.8, 0, WHITE), box(3, 1.1, 0.22, 0, 1.15, -1.4, '#064e3b'), cyl(0.06, 0.06, 3, -1.4, 2, -1.4, '#d4af37'), cyl(0.06, 0.06, 3, 1.4, 2, -1.4, '#d4af37'), cyl(0.06, 0.06, 3, -1.4, 2, 1.4, '#d4af37'), cyl(0.06, 0.06, 3, 1.4, 2, 1.4, '#d4af37'), box(3.1, 0.06, 3.1, 0, 3.5, 0, '#d4af37')];
    // --- Seating ---
    case 'dining_chair':
      return [box(0.5, 0.08, 0.5, 0, 0.45, 0, TEAK), box(0.5, 0.6, 0.08, 0, 0.75, -0.21, TEAK), cyl(0.03, 0.03, 0.45, -0.2, 0.22, -0.2, DARK_WOOD), cyl(0.03, 0.03, 0.45, 0.2, 0.22, -0.2, DARK_WOOD), cyl(0.03, 0.03, 0.45, -0.2, 0.22, 0.2, DARK_WOOD), cyl(0.03, 0.03, 0.45, 0.2, 0.22, 0.2, DARK_WOOD)];
    case 'sofa':
      return [box(3, 0.4, 1, 0, 0.35, 0, FABRIC), box(3, 0.35, 0.35, 0, 0.7, -0.35, FABRIC), box(0.3, 0.6, 1, -1.35, 0.7, 0, FABRIC), box(0.3, 0.6, 1, 1.35, 0.7, 0, FABRIC), box(1.2, 0.16, 0.85, -0.65, 0.62, 0.05, FABRIC_LIGHT), box(1.2, 0.16, 0.85, 0.65, 0.62, 0.05, FABRIC_LIGHT)];
    case 'armchair':
      return [box(1, 0.4, 1, 0, 0.35, 0, '#1e40af'), box(1, 0.5, 0.3, 0, 0.75, -0.35, '#1e40af'), box(0.25, 0.45, 1, -0.4, 0.7, 0, '#1e40af'), box(0.25, 0.45, 1, 0.4, 0.7, 0, '#1e40af')];
    case 'loveseat':
      return [box(2, 0.4, 1, 0, 0.35, 0, '#be123c'), box(2, 0.4, 0.3, 0, 0.75, -0.35, '#be123c'), box(0.25, 0.5, 1, -0.87, 0.65, 0, '#be123c'), box(0.25, 0.5, 1, 0.87, 0.65, 0, '#be123c'), box(1.4, 0.14, 0.8, 0, 0.6, 0.05, '#fb7185')];
    // --- Surfaces ---
    case 'dining_table':
      return [box(3, 0.1, 2, 0, 0.75, 0, TEAK), cyl(0.06, 0.06, 0.75, -1.35, 0.37, -0.85, DARK_WOOD), cyl(0.06, 0.06, 0.75, 1.35, 0.37, -0.85, DARK_WOOD), cyl(0.06, 0.06, 0.75, -1.35, 0.37, 0.85, DARK_WOOD), cyl(0.06, 0.06, 0.75, 1.35, 0.37, 0.85, DARK_WOOD)];
    case 'coffee_table':
      return [box(2, 0.06, 1, 0, 0.44, 0, '#0f172a'), box(2, 0.35, 0.06, 0, 0.24, -0.45, '#d4af37'), box(2, 0.35, 0.06, 0, 0.24, 0.45, '#d4af37')];
    case 'desk':
      return [box(2, 0.08, 1, 0, 0.74, 0, DARK_WOOD), box(0.1, 0.74, 0.9, -0.9, 0.37, 0, '#1e293b'), box(0.1, 0.74, 0.9, 0.9, 0.37, 0, '#1e293b'), box(0.6, 0.4, 0.1, 0, 0.95, -0.35, '#334155')];
    case 'bookshelf':
      return [box(2, 1.9, 0.5, 0, 0.95, 0, '#3f1a07'), box(1.85, 0.05, 0.45, 0, 0.5, 0.05, WOOD), box(1.85, 0.05, 0.45, 0, 0.95, 0.05, WOOD), box(1.85, 0.05, 0.45, 0, 1.4, 0.05, WOOD), box(0.8, 0.3, 0.25, -0.4, 0.68, 0.1, '#dc2626'), box(0.7, 0.3, 0.25, 0.35, 1.13, 0.1, '#059669')];
    // --- Appliances ---
    case 'fridge':
      return [box(2, 1.9, 1, 0, 0.95, 0, '#cbd5e1'), box(1.7, 0.05, 0.1, 0, 1.3, 0.52, METAL), box(0.4, 0.5, 0.06, -0.4, 1.5, 0.53, '#0f172a')];
    case 'stove':
      return [box(2, 0.9, 1, 0, 0.45, 0, '#1e293b'), box(2.05, 0.06, 1.05, 0, 0.93, 0, '#0f172a'), cyl(0.18, 0.18, 0.02, -0.45, 0.97, -0.22, '#38bdf8'), cyl(0.18, 0.18, 0.02, 0.45, 0.97, -0.22, '#38bdf8'), cyl(0.18, 0.18, 0.02, -0.45, 0.97, 0.22, '#38bdf8'), cyl(0.18, 0.18, 0.02, 0.45, 0.97, 0.22, '#38bdf8')];
    case 'microwave':
      return [box(1, 0.5, 0.7, 0, 0.9, 0, '#334155'), box(0.7, 0.3, 0.04, -0.05, 0.9, 0.36, '#0f172a'), box(0.4, 0.4, 0.6, 0, 0.2, 0, WHITE)];
    case 'coffee_machine':
      return [box(0.7, 0.5, 0.6, 0, 0.85, 0, '#1f2937'), box(0.8, 0.1, 0.7, 0, 1.12, 0, METAL), box(0.2, 0.25, 0.2, -0.22, 0.68, 0.2, WHITE), box(0.4, 0.4, 0.5, 0, 0.2, 0, '#334155')];
    case 'barbecue':
      return [cyl(0.6, 0.55, 0.5, 0, 0.85, 0, '#111827'), cyl(0.65, 0.65, 0.12, 0, 1.12, 0, '#374151'), box(1.2, 0.06, 1.2, 0, 0.58, 0, '#374151'), cyl(0.05, 0.05, 0.55, -0.5, 0.3, -0.5, METAL), cyl(0.05, 0.05, 0.55, 0.5, 0.3, -0.5, METAL), cyl(0.05, 0.05, 0.55, -0.5, 0.3, 0.5, METAL), cyl(0.05, 0.05, 0.55, 0.5, 0.3, 0.5, METAL)];
    // --- Plumbing ---
    case 'toilet':
      return [box(0.55, 0.45, 0.65, 0, 0.25, 0.05, WHITE), box(0.5, 0.5, 0.25, 0, 0.65, -0.3, WHITE), box(0.6, 0.06, 0.7, 0, 0.5, 0.05, '#e2e8f0')];
    case 'shower':
      return [box(1, 0.08, 1, 0, 0.04, 0, '#cbd5e1'), box(1, 2, 0.06, 0, 1, -0.47, '#7dd3fc'), box(0.06, 2, 1, -0.47, 1, 0, '#7dd3fc'), cyl(0.05, 0.05, 0.35, 0, 1.9, -0.25, METAL), sph(0.12, 0, 1.78, -0.25, METAL)];
    case 'bathtub':
      return [box(2, 0.6, 1, 0, 0.3, 0, WHITE), box(1.75, 0.06, 0.75, 0, 0.58, 0, '#38bdf8'), cyl(0.04, 0.04, 0.4, -0.85, 0.75, 0, METAL)];
    case 'sink':
      return [cyl(0.22, 0.3, 0.7, 0, 0.35, 0, '#e2e8f0'), box(0.7, 0.18, 0.55, 0, 0.79, 0, WHITE), cyl(0.03, 0.03, 0.3, 0, 0.98, -0.2, METAL)];
    // --- Electronics ---
    case 'tv':
      return [box(2, 0.9, 0.12, 0, 1.35, 0, '#020617'), box(1.85, 0.75, 0.04, 0, 1.35, 0.08, '#1e3a8a'), box(0.5, 0.3, 0.5, 0, 0.15, 0, '#1e293b'), cyl(0.06, 0.06, 0.5, 0, 0.55, 0, '#334155')];
    case 'stereo':
      return [box(0.9, 0.7, 0.5, 0, 0.9, 0, '#0f172a'), cyl(0.16, 0.16, 0.06, -0.2, 0.9, 0.26, '#334155'), cyl(0.16, 0.16, 0.06, 0.2, 0.9, 0.26, '#334155'), cyl(0.05, 0.05, 0.7, 0, 0.35, 0, '#1e293b')];
    case 'computer':
      return [box(1.1, 0.7, 0.5, 0, 0.9, 0, '#1e293b'), box(0.9, 0.55, 0.04, 0, 1.05, 0.27, '#38bdf8'), box(0.7, 0.04, 0.25, 0, 0.56, 0.4, '#334155')];
    case 'games_console':
      return [box(0.7, 0.16, 0.7, 0, 0.1, 0, '#111827'), box(0.5, 0.05, 0.3, 0, 0.19, 0, '#374151'), box(0.9, 0.5, 0.9, 0, 0.5, 0.5, '#1e293b')];
    // --- Skill ---
    case 'easel':
      return [cyl(0.04, 0.04, 1.5, -0.3, 0.75, -0.25, WOOD), cyl(0.04, 0.04, 1.5, 0.3, 0.75, -0.25, WOOD), cyl(0.04, 0.04, 1.5, 0, 0.75, 0.3, WOOD), box(0.9, 0.7, 0.05, 0, 1.1, 0, WHITE), box(0.5, 0.3, 0.02, -0.1, 1.15, 0.04, '#ef4444'), box(0.3, 0.25, 0.02, 0.2, 1.05, 0.04, '#3b82f6')];
    case 'treadmill':
      return [box(1, 0.12, 2, 0, 0.15, 0, '#111827'), box(0.75, 0.05, 1.7, 0, 0.22, 0, '#334155'), cyl(0.05, 0.05, 1.1, -0.45, 0.7, -0.85, METAL), cyl(0.05, 0.05, 1.1, 0.45, 0.7, -0.85, METAL), box(1, 0.08, 0.25, 0, 1.22, -0.85, '#0f172a')];
    case 'chess_table':
      return [box(0.9, 0.06, 0.9, 0, 0.7, 0, DARK_WOOD), cyl(0.08, 0.08, 0.7, 0, 0.35, 0, DARK_WOOD), box(0.6, 0.03, 0.6, 0, 0.74, 0, '#e7e5e4')];
    case 'telescope':
      return [cyl(0.06, 0.06, 1.2, 0, 0.6, 0, METAL), cyl(0.18, 0.22, 1.1, 0.3, 1.45, 0, '#1e293b'), cyl(0.05, 0.05, 0.5, -0.15, 0.25, 0.15, METAL)];
    case 'mirror':
      return [box(0.9, 1.6, 0.12, 0, 1, 0, '#0f172a'), box(0.75, 1.45, 0.02, 0, 1, 0.08, '#e2e8f0'), box(1, 0.1, 0.5, 0, 0.15, 0, '#1e293b')];
    // --- Decor ---
    case 'plant':
      return [cyl(0.22, 0.28, 0.4, 0, 0.2, 0, '#b45309'), sph(0.45, 0, 0.85, 0, '#15803d'), sph(0.3, 0.25, 1.1, 0.1, '#166534')];
    case 'painting':
      return [box(1, 1.2, 0.08, 0, 1.7, 0, '#a16207'), box(0.85, 1.05, 0.02, 0, 1.7, 0.06, '#fbbf24')];
    case 'expensive_art':
      return [box(0.5, 1.6, 0.5, 0, 0.8, 0, '#57534e'), sph(0.35, 0, 1.75, 0, '#d4af37'), cyl(0.3, 0.3, 0.1, 0, 0.05, 0, '#1c1917')];
    case 'rug':
      return [box(2, 0.03, 3, 0, 0.02, 0, '#1e293b')];
    case 'floor_lamp':
      return [cyl(0.25, 0.25, 0.05, 0, 0.03, 0, '#1e293b'), cyl(0.035, 0.035, 1.5, 0, 0.8, 0, METAL), cyl(0.28, 0.18, 0.35, 0, 1.65, 0, '#fef08a')];
    // --- Outdoor ---
    case 'lounger':
      return [box(1, 0.12, 2, 0, 0.3, 0, TEAK), box(0.9, 0.1, 0.9, 0, 0.72, -0.85, '#f8fafc'), cyl(0.04, 0.04, 0.3, -0.4, 0.15, -0.85, METAL), cyl(0.04, 0.04, 0.3, 0.4, 0.15, -0.85, METAL)];
    case 'hot_tub':
      return [cyl(0.9, 0.9, 0.7, 0, 0.35, 0, '#0f766e'), cyl(0.75, 0.75, 0.06, 0, 0.68, 0, '#22d3ee'), cyl(0.05, 0.05, 0.3, 0.6, 0.7, 0.4, METAL)];
    case 'garden_plot':
      return [box(2, 0.25, 2, 0, 0.12, 0, '#3f1a07'), box(1.8, 0.06, 1.8, 0, 0.26, 0, '#292524'), cyl(0.05, 0.05, 0.6, -0.5, 0.55, -0.5, '#15803d'), cyl(0.05, 0.05, 0.6, 0.5, 0.55, -0.5, '#15803d'), cyl(0.05, 0.05, 0.6, -0.5, 0.55, 0.5, '#16a34a'), cyl(0.05, 0.05, 0.6, 0.5, 0.55, 0.5, '#16a34a')];
    case 'swing_set':
      return [cyl(0.07, 0.07, 1.8, -0.9, 0.9, 0, '#dc2626'), cyl(0.07, 0.07, 1.8, 0.9, 0.9, 0, '#dc2626'), box(2, 0.1, 0.1, 0, 1.8, 0, '#dc2626'), box(0.5, 0.05, 0.3, -0.5, 0.5, 0, '#1e293b'), box(0.5, 0.05, 0.3, 0.5, 0.5, 0, '#1e293b'), cyl(0.02, 0.02, 1.3, -0.5, 1.15, 0, METAL), cyl(0.02, 0.02, 1.3, 0.5, 1.15, 0, METAL)];
    default:
      return [box(1, 1, 1, 0, 0.5, 0, '#64748b')];
  }
}

function ObjectMesh({ catalogId }: { catalogId: string }) {
  const parts = shapeFor(catalogId);
  return (
    <>
      {parts.map((part, i) => {
        if (part.g === 'cyl') {
          return (
            <mesh key={i} position={part.p} castShadow receiveShadow>
              <cylinderGeometry args={[part.s[0], part.s[1], part.s[2], 16]} />
              <meshStandardMaterial color={part.c} roughness={0.6} />
            </mesh>
          );
        }
        if (part.g === 'sph') {
          return (
            <mesh key={i} position={part.p} castShadow>
              <sphereGeometry args={[part.s[0], 16, 12]} />
              <meshStandardMaterial color={part.c} roughness={0.7} />
            </mesh>
          );
        }
        return (
          <mesh key={i} position={part.p} castShadow receiveShadow>
            <boxGeometry args={part.s} />
            <meshStandardMaterial color={part.c} roughness={0.6} metalness={part.c === METAL ? 0.7 : 0} />
          </mesh>
        );
      })}
    </>
  );
}

/** Action bubble anchored to the clicked object. */
function ObjectPopup({ placed }: { placed: PlacedObject }) {
  const def = CATALOG_BY_ID[placed.catalogId];
  const selectedSimId = useLifeStore((s) => s.selectedSimId);
  const household = useLifeStore((s) => s.household);
  const order = useSimStore((s) => s.order);
  const inspect = useLifeStore((s) => s.inspect);
  const mode = useLifeStore((s) => s.mode);

  if (!def) return null;
  const sim = household?.sims.find((s) => s.id === selectedSimId) ?? household?.sims[0];
  const actions = def.interactions;
  if (actions.length === 0) return null;

  return (
    <Html position={[0, 2.2, 0]} center distanceFactor={12} zIndexRange={[25, 0]}>
      <div className="w-44 rounded-2xl border border-white/20 bg-slate-950/95 p-1.5 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between px-1.5 pb-1">
          <span className="text-[10px] font-bold text-white/70">
            {def.emoji} {def.name}
          </span>
          <button
            type="button"
            onClick={() => inspect(null)}
            className="rounded px-1 text-[10px] text-white/50 hover:bg-white/10 cursor-pointer"
          >
            ✕
          </button>
        </div>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={mode === 'build' || !sim}
            onClick={() => {
              if (!sim) return;
              order(sim.id, interactionIdFor(placed.uid, action.key));
            }}
            className={`flex w-full items-center gap-1.5 rounded-xl px-1.5 py-1 text-left text-[11px] font-semibold transition ${
              mode === 'build' || !sim ? 'cursor-not-allowed text-white/35' : 'cursor-pointer hover:bg-white/15'
            }`}
          >
            <span>{action.emoji}</span>
            <span className="flex-1">{action.label}</span>
            <span className="text-[9px] text-white/40">{action.minutes}m</span>
          </button>
        ))}
      </div>
    </Html>
  );
}


export function LotObjects() {
  const lot = useLifeStore((s) => s.household?.lot);
  const inspectedUid = useLifeStore((s) => s.inspectedUid);
  const inspect = useLifeStore((s) => s.inspect);
  const mode = useLifeStore((s) => s.mode);

  if (!lot) return null;

  return (
    <>
      {lot.map((placed) => {
        const def = CATALOG_BY_ID[placed.catalogId];
        if (!def) return null;
        const [w, d] = def.footprint;
        const width = placed.rotation % 2 === 0 ? w : d;
        const depth = placed.rotation % 2 === 0 ? d : w;
        return (
          <group
            key={placed.uid}
            position={[placed.x, 0, placed.z]}
            rotation={[0, (placed.rotation * Math.PI) / 2, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (mode === 'build') {
                useLifeStore.getState().startMoving(placed.uid);
              } else {
                inspect(placed.uid === inspectedUid ? null : placed.uid);
              }
            }}
          >
            <SolidObject name={`lot-${placed.uid}`}>
              <ObjectMesh catalogId={placed.catalogId} />
            </SolidObject>
            {/* Invisible pick target so small objects are easy to click. */}
            <mesh position={[0, 0.7, 0]}>
              <boxGeometry args={[Math.max(1, width), 1.4, Math.max(1, depth)]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {inspectedUid === placed.uid && <ObjectPopup placed={placed} />}
          </group>
        );
      })}
    </>
  );
}
