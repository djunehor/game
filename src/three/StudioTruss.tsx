import * as THREE from 'three';

const NO_RAY: () => null = () => null;

/**
 * Authentic BBNaija Television Studio Infrastructure:
 * Overhead metal lighting truss grid, studio spotlights, camera track rails,
 * and doorway lintels above all room entrances.
 */
export function StudioTruss() {
  const trussColor = '#94a3b8'; // Brushed broadcast aluminum
  const beamMat = new THREE.MeshStandardMaterial({
    color: trussColor,
    metalness: 0.8,
    roughness: 0.3,
  });

  return (
    <group position={[0, 0, 0]} raycast={NO_RAY}>
      {/* ========================================================= */}
      {/* 1. SOUNDSTAGE PERIMETER GANTRY & TRUSS CHORDS */}
      {/* Aligned along wall tops (X=-26.5, X=-15, X=-1, X=26.5) */}
      {/* ========================================================= */}
      {/* Wall-Top Gantries (North-South Chords running along wall lines) */}
      {[-26.5, -15, -1, 26.5].map((x) => (
        <mesh key={`ns-truss-${x}`} position={[x, 4.8, -0.5]} material={beamMat} raycast={NO_RAY}>
          <boxGeometry args={[0.35, 0.25, 55]} />
        </mesh>
      ))}

      {/* Wall-Top Gantries (East-West Chords running along dividing wall lines) */}
      {[-28, -15, -4, 12, 13.5, 27].map((z) => (
        <mesh key={`ew-truss-${z}`} position={[0, 4.8, z]} material={beamMat} raycast={NO_RAY}>
          <boxGeometry args={[54, 0.3, 0.3]} />
        </mesh>
      ))}

      {/* ========================================================= */}
      {/* 2. TV BROADCAST STUDIO LIGHTING FIXTURES & SPOTLIGHTS */}
      {/* Mounted directly to the wall gantries */}
      {/* ========================================================= */}
      {/* Lounge Wall-Mounted Broadcast Lights */}
      <group position={[-1, 4.6, 4]}>
        <mesh position={[0, 0, -2]} raycast={NO_RAY}>
          <boxGeometry args={[0.5, 0.25, 0.8]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0, 2]} raycast={NO_RAY}>
          <boxGeometry args={[0.5, 0.25, 0.8]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Diary Room Dramatic Studio Spotlight */}
      <group position={[-15, 4.6, 18]}>
        <mesh position={[-0.4, 0, 0]} raycast={NO_RAY}>
          <cylinderGeometry args={[0.2, 0.4, 0.5, 12]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Kitchen Task Spotlight (Mounted above atrium line) */}
      <group position={[-10, 4.6, -4]}>
        <mesh position={[0, 0, -0.4]} raycast={NO_RAY}>
          <boxGeometry args={[1.2, 0.15, 0.4]} />
          <meshStandardMaterial color="#fed7aa" emissive="#fed7aa" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Arena High-Intensity Stadium Floodlights */}
      <group position={[16, 4.6, 13.5]}>
        {[-3, 3].map((dx) => (
          <mesh key={`arena-light-${dx}`} position={[dx, 0, 0.4]} raycast={NO_RAY}>
            <boxGeometry args={[0.8, 0.3, 0.4]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
          </mesh>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 3. ARCHITECTURAL DOORWAY LINTELS & HEADERS */}
      {/* Connects the wall openings so doorways are real frames */}
      {/* ========================================================= */}
      {/* Kitchen to Lounge Open Atrium Header (Z = -4, X ∈ [-16, -4]) */}
      <mesh position={[-10, 3.8, -4]} raycast={NO_RAY}>
        <boxGeometry args={[12.2, 0.8, 0.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* Lounge to Bedroom Doorway Header (Z = 12, X ∈ [-13, -3]) */}
      <mesh position={[-8, 3.8, 12]} raycast={NO_RAY}>
        <boxGeometry args={[10.2, 0.8, 0.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* Diary Room Iconic Doorway Frame & Header (X = -15, Z = 18) */}
      <mesh position={[-15, 3.8, 18]} raycast={NO_RAY}>
        <boxGeometry args={[0.8, 0.8, 3.2]} />
        <meshStandardMaterial color="#a855f7" roughness={0.6} />
      </mesh>
      {/* Big Brother Eye Logo Emblem Above Diary Room Entrance */}
      <mesh position={[-14.55, 3.8, 18]} rotation={[0, -Math.PI / 2, 0]} raycast={NO_RAY}>
        <circleGeometry args={[0.45, 16]} />
        <meshBasicMaterial color="#eab308" side={THREE.DoubleSide} />
      </mesh>

      {/* HoH Suite Entrance Header (Z = -15, X ∈ [12, 20]) */}
      <mesh position={[16, 3.8, -15]} raycast={NO_RAY}>
        <boxGeometry args={[8.2, 0.8, 0.8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>

      {/* Arena Sliding Heavy Doorway Header (Z = 13.5, X ∈ [12, 20]) */}
      <mesh position={[16, 3.8, 13.5]} raycast={NO_RAY}>
        <boxGeometry args={[8.2, 0.8, 0.8]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* Garden Glass Patio Doorway Header (X = -1, Z = 4) */}
      <mesh position={[-1, 3.8, 4]} raycast={NO_RAY}>
        <boxGeometry args={[0.8, 0.8, 14.2]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* ========================================================= */}
      {/* 4. PERIMETER COMPOUND SECURITY LIGHTS ON OUTER WALLS */}
      {/* ========================================================= */}
      {/* North wall security lights */}
      {[-16, 0, 16].map((x) => (
        <group key={`sec-n-${x}`} position={[x, 5.3, -27.8]} raycast={NO_RAY}>
          <mesh position={[0, 0, 0.3]}>
            <boxGeometry args={[0.4, 0.2, 0.3]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* East perimeter wall security lights behind garden */}
      {[-16, 0, 16].map((z) => (
        <group key={`sec-e-${z}`} position={[26.3, 5.3, z]} raycast={NO_RAY}>
          <mesh position={[-0.3, 0, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.4]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
