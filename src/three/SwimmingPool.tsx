import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getPoolMosaicTexture } from './textures';

// High-fidelity luxury swimming pool with animated water shader, mosaic tile basin,
// submerged steps, chrome ladders, and poolside resort loungers.

export function SwimmingPool() {
  const waterRef = useRef<THREE.Mesh>(null);
  const mosaicTex = getPoolMosaicTexture(8, 5);

  useFrame((state) => {
    if (waterRef.current) {
      const t = state.clock.getElapsedTime();
      // Subtle organic water wave ripple oscillation
      waterRef.current.position.y = -0.15 + Math.sin(t * 1.8) * 0.025;
      waterRef.current.rotation.z = Math.sin(t * 0.8) * 0.003;
      waterRef.current.rotation.x = -Math.PI / 2 + Math.cos(t * 1.2) * 0.003;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Travertine Stone Pool Coping Border (Rim) */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[11.6, 0.2, 7.6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>

      {/* 2. Inner Recessed Basin Cutout (Dark basin interior) */}
      {/* Floor with Mosaic Tiles */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.4, 6.4]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Basin Walls (North, South, West, East) */}
      <mesh position={[0, -0.6, -3.2]} castShadow receiveShadow>
        <boxGeometry args={[10.4, 1.2, 0.1]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.6, 3.2]} castShadow receiveShadow>
        <boxGeometry args={[10.4, 1.2, 0.1]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.2} />
      </mesh>
      <mesh position={[-5.2, -0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 1.2, 6.4]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.2} />
      </mesh>
      <mesh position={[5.2, -0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 1.2, 6.4]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.2} />
      </mesh>

      {/* 3. Submerged Walk-In Shallow Steps (West End) */}
      {[-4.6, -4.0, -3.4].map((stepX, idx) => (
        <mesh key={`step-${idx}`} position={[stepX, -0.9 + idx * 0.25, 0]} receiveShadow>
          <boxGeometry args={[0.7, 0.25, 4.2]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.25} />
        </mesh>
      ))}

      {/* 4. Underwater Cyan LED Ambient Glow Lights */}
      <pointLight position={[-2, -0.5, 0]} color="#38bdf8" intensity={1.8} distance={8} />
      <pointLight position={[2, -0.5, 0]} color="#38bdf8" intensity={1.8} distance={8} />

      {/* 5. Animated Translucent Water Surface with Specular Sun Glint */}
      <mesh
        ref={waterRef}
        position={[0, -0.15, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[10.3, 6.3, 32, 32]} />
        <meshStandardMaterial
          color="#0284c7"
          transparent
          opacity={0.72}
          roughness={0.08}
          metalness={0.25}
          depthWrite={false}
        />
      </mesh>

      {/* 6. Chrome Stainless Steel Pool Ladder (East End) */}
      <group position={[4.6, 0.2, 2.2]}>
        {/* Left and right vertical rails */}
        <mesh position={[0, 0.2, -0.3]}>
          <cylinderGeometry args={[0.035, 0.035, 1.4, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.2, 0.3]}>
          <cylinderGeometry args={[0.035, 0.035, 1.4, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Horizontal steps */}
        {[-0.1, 0.2, 0.5].map((ry, i) => (
          <mesh key={`rung-${i}`} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* 7. Floating Pool Inflatable Donut Ring */}
      <mesh position={[1.5, -0.08, -1]} rotation={[0.2, 0.5, 0.1]} castShadow>
        <torusGeometry args={[0.6, 0.22, 16, 32]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* 8. Luxury Poolside Sun Loungers & Parasol Umbrellas (North Deck) */}
      {[-2.5, 2.5].map((lx, idx) => (
        <group key={`lounger-${idx}`} position={[lx, 0.2, -4.8]} rotation={[0, Math.PI, 0]}>
          {/* Teak Wood Lounger Frame */}
          <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.0, 0.14, 2.2]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          {/* Angled Backrest */}
          <mesh position={[0, 0.45, -0.8]} rotation={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.95, 0.12, 0.9]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          {/* Striped Aqua Cushion */}
          <mesh position={[0, 0.26, 0.1]} castShadow>
            <boxGeometry args={[0.92, 0.1, 1.4]} />
            <meshStandardMaterial color="#06b6d4" roughness={0.5} />
          </mesh>
          {/* Pillow */}
          <mesh position={[0, 0.52, -0.75]} rotation={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.7, 0.1, 0.35]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          {/* Wood Legs */}
          {[-0.42, 0.42].map((legX, li) => (
            <mesh key={`leg-${li}`} position={[legX, 0.07, 0]}>
              <boxGeometry args={[0.08, 0.14, 2.0]} />
              <meshStandardMaterial color="#451a03" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Resort Cantilevered Sun Umbrella */}
      <group position={[0, 0.2, -5.4]}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.8, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.7, 0]}>
          <coneGeometry args={[1.8, 0.6, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
