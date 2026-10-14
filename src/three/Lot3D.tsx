import { useEffect, useMemo } from 'react';
import { useLifeStore } from '../life/lifeStore';
import { wallGeometry } from '../lot/grid';
import { registerStaticBox, unregisterStaticBox } from './collisionStore';
import type { LotLayout } from '../lot/types';

// ---------------------------------------------------------------------------
// The lot: grass, the flooring the player laid, and the walls they drew.
// Those walls are also published to the collision system so Sims walk around
// them rather than through them.
// ---------------------------------------------------------------------------

export const WALL_HEIGHT = 2.7;
/** Heights per wall mode — the cutaway keeps Sims visible from any angle. */
export const WALL_MODE_HEIGHT: Record<string, number> = { up: WALL_HEIGHT, cut: 0.85, down: 0 };


export const WALL_THICKNESS = 0.18;

const TILE_COLORS: Record<string, string> = {
  floor: '#c8a97e',
  deck: '#8b5a2b',
};

function LotWalls({ plot, height }: { plot: LotLayout; height: number }) {
  const walls = useMemo(
    () => plot.walls.map((key) => wallGeometry(plot, key)).filter((w): w is NonNullable<typeof w> => Boolean(w)),
    [plot],
  );

  useEffect(() => {
    for (const wall of walls) {
      const size: [number, number] =
        wall.kind === 'h'
          ? [wall.length + WALL_THICKNESS, WALL_THICKNESS]
          : [WALL_THICKNESS, wall.length + WALL_THICKNESS];
      registerStaticBox(`lotwall-${wall.key}`, [wall.x, wall.z], size);
    }
    return () => {
      for (const wall of walls) unregisterStaticBox(`lotwall-${wall.key}`);
    };
  }, [walls]);

  return (
    <>
      {walls.map((wall) => (
        <mesh key={wall.key} position={[wall.x, height / 2, wall.z]} castShadow receiveShadow>
          <boxGeometry
            args={
              wall.kind === 'h'
                ? [wall.length + WALL_THICKNESS, height, WALL_THICKNESS]
                : [WALL_THICKNESS, height, wall.length + WALL_THICKNESS]
            }
          />
          <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
        </mesh>
      ))}
    </>
  );
}

function LotFloors({ plot }: { plot: LotLayout }) {
  const tiles = useMemo(() => {
    const out: { key: string; x: number; z: number; kind: string }[] = [];
    for (let z = 0; z < plot.depth; z++) {
      for (let x = 0; x < plot.width; x++) {
        const kind = plot.tiles[z * plot.width + x];
        if (kind === 'grass') continue;
        out.push({
          key: `${x},${z}`,
          x: plot.originX + (x + 0.5) * plot.tileSize,
          z: plot.originZ + (z + 0.5) * plot.tileSize,
          kind,
        });
      }
    }
    return out;
  }, [plot]);

  return (
    <>
      {tiles.map((tile) => (
        <mesh key={tile.key} position={[tile.x, 0.04, tile.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[plot.tileSize, plot.tileSize]} />
          <meshStandardMaterial color={TILE_COLORS[tile.kind] ?? '#c8a97e'} roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

/** A slightly greener patch showing where the player's land begins. */
function LotBoundary({ plot }: { plot: LotLayout }) {
  const cx = plot.originX + (plot.width * plot.tileSize) / 2;
  const cz = plot.originZ + (plot.depth * plot.tileSize) / 2;
  return (
    <mesh position={[cx, 0.02, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[plot.width * plot.tileSize, plot.depth * plot.tileSize]} />
      <meshStandardMaterial color="#6aa85a" roughness={0.95} />
    </mesh>
  );
}

export function Lot3D() {
  const plot = useLifeStore((s) => s.household?.plot);
  const wallMode = useLifeStore((s) => s.wallMode);
  if (!plot) return null;
  const height = WALL_MODE_HEIGHT[wallMode] ?? WALL_HEIGHT;
  return (
    <group>
      <LotBoundary plot={plot} />
      <LotFloors plot={plot} />
      {height > 0 && <LotWalls plot={plot} height={height} />}
    </group>
  );
}
