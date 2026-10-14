import { useState } from 'react';
import { HudHtml as Html } from './hudPortal';
import { useLifeStore } from '../life/lifeStore';
import { CATALOG_BY_ID } from '../life/catalog';
import { canPlace, footprintOf } from '../life/buildMode';
import { hKey, vKey } from '../lot/grid';

// ---------------------------------------------------------------------------
// Build-mode cursor. Depending on the active tool it previews an object, a wall
// segment or a floor tile, and applies the edit on click.
// ---------------------------------------------------------------------------

interface WallTarget {
  key: string;
  x: number;
  z: number;
  length: number;
  kind: 'h' | 'v';
}

/** Nearest grid line to the pointer — that's where a wall would go. */
function nearestWallTarget(
  originX: number,
  originZ: number,
  width: number,
  depth: number,
  px: number,
  pz: number,
): WallTarget | null {
  const gi = Math.round(px - originX);
  const gk = Math.round(pz - originZ);

  const distV = Math.abs(px - (originX + gi));
  const distH = Math.abs(pz - (originZ + gk));

  if (distV <= distH) {
    const i = Math.max(0, Math.min(width, gi));
    const j = Math.max(0, Math.min(depth - 1, Math.floor(pz - originZ)));
    return { key: vKey(i, j), x: originX + i, z: originZ + j + 0.5, length: 1, kind: 'v' };
  }
  const k = Math.max(0, Math.min(depth, gk));
  const i = Math.max(0, Math.min(width - 1, Math.floor(px - originX)));
  return { key: hKey(i, k), x: originX + i + 0.5, z: originZ + k, length: 1, kind: 'h' };
}

export function BuildCursor() {
  const mode = useLifeStore((s) => s.mode);
  const tool = useLifeStore((s) => s.tool);
  const household = useLifeStore((s) => s.household);
  const ghost = useLifeStore((s) => s.ghost);
  const rotation = useLifeStore((s) => s.rotation);
  const placingCatalogId = useLifeStore((s) => s.placingCatalogId);
  const setGhost = useLifeStore((s) => s.setGhost);
  const toggleWall = useLifeStore((s) => s.toggleWall);
  const toggleDoor = useLifeStore((s) => s.toggleDoor);
  const paintTile = useLifeStore((s) => s.paintTile);
  const [hoverWall, setHoverWall] = useState<string | null>(null);

  if (mode !== 'build' || !household?.plot) return null;
  const plot = household.plot;

  const def = placingCatalogId ? CATALOG_BY_ID[placingCatalogId] : null;
  const check = def && ghost
    ? canPlace(household.lot, placingCatalogId!, ghost.x, ghost.z, rotation, useLifeStore.getState().placingUid ?? undefined, plot)
    : null;
  const box = def && ghost ? footprintOf(ghost.x, ghost.z, def.footprint, rotation) : null;

  const wallTarget = ghost && (tool === 'wall' || tool === 'door' || tool === 'erase')
    ? nearestWallTarget(plot.originX, plot.originZ, plot.width, plot.depth, ghost.x, ghost.z)
    : null;

  const tile = ghost
    ? {
        tx: Math.floor(ghost.x - plot.originX),
        tz: Math.floor(ghost.z - plot.originZ),
      }
    : null;
  const tileValid = tile && tile.tx >= 0 && tile.tz >= 0 && tile.tx < plot.width && tile.tz < plot.depth;

  const handlePointer = (point: { x: number; z: number }) => {
    setGhost(point.x, point.z);
    if (wallTarget) setHoverWall(wallTarget.key);
  };

  const applyClick = () => {
    if (!ghost) return;
    if (tool === 'wall' && wallTarget) {
      toggleWall(wallTarget.key);
    } else if (tool === 'door' && wallTarget) {
      toggleDoor(wallTarget.key);
    } else if (tool === 'erase' && wallTarget) {
      toggleWall(wallTarget.key); // toggling an existing wall removes it
    } else if (tool === 'floor' && tileValid) {
      paintTile(tile!.tx, tile!.tz, 'floor');
    } else if (tool === 'object') {
      useLifeStore.getState().confirmPlace();
    }
  };

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plot.originX + (plot.width * plot.tileSize) / 2, 0.09, plot.originZ + (plot.depth * plot.tileSize) / 2]}
        onPointerMove={(e) => {
          e.stopPropagation();
          handlePointer(e.point);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          applyClick();
        }}
      >
        <planeGeometry args={[plot.width * plot.tileSize + 8, plot.depth * plot.tileSize + 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Object ghost */}
      {tool === 'object' && def && box && (
        <group position={[(box.minX + box.maxX) / 2, 0.2, (box.minZ + box.maxZ) / 2]}>
          <mesh>
            <boxGeometry args={[box.maxX - box.minX, 0.4, box.maxZ - box.minZ]} />
            <meshBasicMaterial color={check?.ok ? '#22c55e' : '#ef4444'} transparent opacity={0.35} />
          </mesh>
          <Html position={[0, 1.1, 0]} center distanceFactor={18} zIndexRange={[20, 0]}>
            <div className={`pointer-events-none whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold shadow-lg ${check?.ok ? 'bg-emerald-600/95 text-white' : 'bg-rose-600/95 text-white'}`}>
              {def.emoji} {def.name}
              {!check?.ok && check?.reason ? ` — ${check.reason}` : ''}
            </div>
          </Html>
        </group>
      )}

      {/* Wall ghost */}
      {(tool === 'wall' || tool === 'door' || tool === 'erase') && wallTarget && (
        <mesh position={[wallTarget.x, 1.35, wallTarget.z]}>
          <boxGeometry
            args={
              wallTarget.kind === 'h'
                ? [wallTarget.length, 2.7, 0.18]
                : [0.18, 2.7, wallTarget.length]
            }
          />
          <meshBasicMaterial
            color={
              tool === 'door'
                ? '#38bdf8'
                : plot.walls.includes(wallTarget.key)
                  ? '#ef4444'
                  : '#22c55e'
            }
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
      {hoverWall && (tool === 'wall' || tool === 'door' || tool === 'erase') && (
        <Html position={[wallTarget?.x ?? 0, 2.9, wallTarget?.z ?? 0]} center distanceFactor={20} zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full bg-slate-950/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            {tool === 'door'
              ? (plot.doors ?? []).includes(hoverWall)
                ? 'Click to remove door'
                : 'Click to fit a door · ₦120'
              : plot.walls.includes(hoverWall)
                ? 'Click to remove wall'
                : 'Click to build wall · ₦30'}
          </div>
        </Html>
      )}

      {/* Floor ghost */}
      {tool === 'floor' && tileValid && (
        <mesh
          position={[
            plot.originX + (tile!.tx + 0.5) * plot.tileSize,
            0.07,
            plot.originZ + (tile!.tz + 0.5) * plot.tileSize,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[plot.tileSize + 0.02, plot.tileSize + 0.02]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.45} />
        </mesh>
      )}

      {/* Highlight every wall you own so you can see the floor plan you drew. */}
      {tool === 'erase' &&
        plot.walls.map((key) => {
          const [kind, rawX, rawZ] = key.split(',');
          const gx = Number(rawX);
          const gz = Number(rawZ);
          const x = kind === 'h' ? plot.originX + gx + 0.5 : plot.originX + gx;
          const z = kind === 'h' ? plot.originZ + gz : plot.originZ + gz + 0.5;
          return (
            <mesh key={key} position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={kind === 'h' ? [1, 0.4] : [0.4, 1]} />
              <meshBasicMaterial color="#f87171" transparent opacity={0.7} />
            </mesh>
          );
        })}
    </>
  );
}
