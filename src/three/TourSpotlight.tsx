import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTour, TOUR_STOPS } from './tourStore';

export function TourSpotlight() {
  const isTourActive = useTour((s) => s.isActive);
  const currentStopIndex = useTour((s) => s.currentStopIndex);
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  const stop = TOUR_STOPS[currentStopIndex] ?? TOUR_STOPS[0];

  useFrame((_, delta) => {
    if (!isTourActive) return;
    if (ringRef.current) {
      ringRef.current.rotation.z += 1.5 * delta;
    }
    if (beamRef.current) {
      beamRef.current.rotation.y += 0.8 * delta;
    }
  });

  if (!isTourActive) return null;

  const [x, , z] = stop.lookAt;

  return (
    <group position={[x, 0, z]}>
      {/* Pulsing 3D floor holographic ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[1.6, 2.4, 32]} />
        <meshBasicMaterial
          color={stop.color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle vertical light beam */}
      <mesh ref={beamRef} position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 5, 24, 1, true]} />
        <meshBasicMaterial
          color={stop.color}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
