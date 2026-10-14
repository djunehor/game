import { Lighting } from './Lighting';
import { Lot3D } from './Lot3D';
import { LotObjects } from './LotObjects';
import { LifeSims } from './LifeSim';
import { BuildCursor } from './BuildCursor';

// ---------------------------------------------------------------------------
// The world: open ground, the player's lot, and their household.
// ---------------------------------------------------------------------------

export function Scene() {
  return (
    <>
      <Lighting />
      <fog attach="fog" args={['#bcd9ec', 80, 260]} />

      {/* Surrounding landscape, well beyond the lot boundary. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#5ea853" roughness={0.95} />
      </mesh>

      {/* The player's land, what they built on it, and who lives there. */}
      <Lot3D />
      <LotObjects />
      <LifeSims />
      <BuildCursor />
    </>
  );
}
