import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural detailed furniture and props for the Biggie House

export function LoungeFurniture() {
  return (
    <group position={[-16, 0, 4]}>
      {/* Decorative Area Rug */}
      <mesh position={[0, 0.04, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 10]} />
        <meshStandardMaterial color="#2d3748" roughness={0.9} />
      </mesh>
      {/* Rug inner border */}
      <mesh position={[0, 0.045, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.2, 9.2]} />
        <meshStandardMaterial color="#4a5568" roughness={0.95} />
      </mesh>

      {/* Truth or Dare Bottle & Cards on Area Rug */}
      <group position={[0, 0.08, -1.8]}>
        {/* Glass Bottle lying horizontally */}
        <mesh rotation={[0, 0.6, Math.PI / 2]} position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.12, 0.55, 16]} />
          <meshStandardMaterial color="#10b981" transparent opacity={0.75} roughness={0.1} metalness={0.2} />
        </mesh>
        {/* Bottle neck */}
        <mesh rotation={[0, 0.6, Math.PI / 2]} position={[0.22, 0.08, 0.13]}>
          <cylinderGeometry args={[0.04, 0.04, 0.22, 12]} />
          <meshStandardMaterial color="#059669" transparent opacity={0.7} />
        </mesh>
        {/* Truth & Dare Game Cards scattered in a circle */}
        {[-0.4, 0, 0.4].map((dx, i) => (
          <mesh key={`card-${i}`} position={[dx, 0.02, 0.35 * (i % 2 === 0 ? 1 : -1)]} rotation={[-Math.PI / 2, 0, dx * 1.2]}>
            <planeGeometry args={[0.2, 0.3]} />
            <meshStandardMaterial color={i === 0 ? "#ef4444" : i === 1 ? "#3b82f6" : "#f59e0b"} />
          </mesh>
        ))}
      </group>

      {/* Main Sectional Sofa - Left Wing */}
      <group position={[-4, 0, 0]}>
        {/* Base */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.5, 5]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.7} />
        </mesh>
        {/* Backrest */}
        <mesh position={[-1.0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.5, 0.7, 5]} />
          <meshStandardMaterial color="#991b1b" roughness={0.7} />
        </mesh>
        {/* Cushions */}
        <mesh position={[0, 0.65, -1.2]}>
          <boxGeometry args={[1.5, 0.15, 2]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.65, 1.2]}>
          <boxGeometry args={[1.5, 0.15, 2]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
        {/* Throw pillow */}
        <mesh position={[-0.6, 0.75, -1.5]} rotation={[0.2, 0.3, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.2]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
      </group>

      {/* Main Sectional Sofa - Center Back */}
      <group position={[0, 0, -2.2]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.6, 0.5, 2]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.85, -0.8]} castShadow>
          <boxGeometry args={[5.6, 0.7, 0.4]} />
          <meshStandardMaterial color="#991b1b" roughness={0.7} />
        </mesh>
      </group>

      {/* Right Wing Sofa */}
      <group position={[4, 0, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.5, 5]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.7} />
        </mesh>
        <mesh position={[1.0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.5, 0.7, 5]} />
          <meshStandardMaterial color="#991b1b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[1.5, 0.15, 4.4]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
        <mesh position={[0.6, 0.75, 1.5]} rotation={[-0.2, -0.3, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.2]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
      </group>

      {/* Modern Low Coffee Table */}
      <group position={[0, 0, 0.8]}>
        {/* Legs */}
        <mesh position={[-1.8, 0.2, -1]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} />
        </mesh>
        <mesh position={[1.8, 0.2, -1]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} />
        </mesh>
        <mesh position={[-1.8, 0.2, 1]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} />
        </mesh>
        <mesh position={[1.8, 0.2, 1]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} />
        </mesh>
        {/* Table Top (Wood Slab) */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.08, 2.4]} />
          <meshStandardMaterial color="#78350f" roughness={0.4} />
        </mesh>
        {/* Ludo Game Board on Table */}
        <mesh position={[-0.8, 0.48, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <planeGeometry args={[1.0, 1.0]} />
          <meshStandardMaterial color="#fef08a" roughness={0.3} />
        </mesh>
        {/* Ayo Olopon Carved Wooden Mancala Board on Table */}
        <group position={[0.8, 0.48, -0.1]} rotation={[0, -0.1, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.08, 0.5]} />
            <meshStandardMaterial color="#451a03" roughness={0.5} />
          </mesh>
          {/* Carved 12 Pit Depressions */}
          {[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5].map((px) => (
            <group key={`ayo-pit-${px}`}>
              <mesh position={[px, 0.045, -0.12]}>
                <cylinderGeometry args={[0.07, 0.07, 0.02, 12]} />
                <meshStandardMaterial color="#291102" />
              </mesh>
              <mesh position={[px, 0.045, 0.12]}>
                <cylinderGeometry args={[0.07, 0.07, 0.02, 12]} />
                <meshStandardMaterial color="#291102" />
              </mesh>
            </group>
          ))}
        </group>
        {/* Drinks / Glasses */}
        <mesh position={[0.2, 0.52, 0.5]}>
          <cylinderGeometry args={[0.08, 0.06, 0.16]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Feature Wall: Huge Biggie Eye Neon Display */}
      <group position={[0, 2.8, -6.8]}>
        {/* TV / Screen Board */}
        <mesh>
          <boxGeometry args={[6.5, 2.6, 0.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Screen Display */}
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[6.1, 2.2]} />
          <meshBasicMaterial color="#1e1b4b" />
        </mesh>
        {/* Glowing Eye Contour */}
        <mesh position={[0, 0, 0.13]}>
          <ringGeometry args={[0.7, 0.85, 32]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[0, 0, 0.14]}>
          <circleGeometry args={[0.45, 32]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0, 0.15]}>
          <circleGeometry args={[0.2, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* Potted Palm Tree */}
      <group position={[-5.8, 0, -5.5]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.55, 0.4, 1.0, 16]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 1.8]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {/* Foliage spheres */}
        <mesh position={[0, 2.6, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

export function KitchenFurniture() {
  return (
    <group position={[-16, 0, -12]}>
      {/* Kitchen Island */}
      <group position={[0, 0, 0]}>
        {/* Cabinet base */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.5, 1.0, 2.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        {/* White Marble Countertop */}
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.8, 0.1, 2.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Big Firewood Jollof Pot */}
        <group position={[-1.5, 1.1, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.4, 0.6, 16]} />
            <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.1, 16]} />
            <meshStandardMaterial color="#1f2937" metalness={0.8} />
          </mesh>
          {/* Pot handles */}
          <mesh position={[-0.48, 0.4, 0]}>
            <boxGeometry args={[0.12, 0.08, 0.2]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0.48, 0.4, 0]}>
            <boxGeometry args={[0.12, 0.08, 0.2]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
        {/* Chopping board & food */}
        <mesh position={[0.8, 1.12, 0]}>
          <boxGeometry args={[0.8, 0.04, 0.6]} />
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>
      </group>

      {/* Bar Stools */}
      {[-1.6, 0, 1.6].map((x, idx) => (
        <group key={idx} position={[x, 0, 1.8]}>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.75]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.08, 16]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Stainless Double Door Fridge against Back Wall */}
      <group position={[-4.5, 0, -4.5]}>
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 3.2, 1.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Handles */}
        <mesh position={[-0.08, 1.6, 0.72]}>
          <boxGeometry args={[0.04, 1.0, 0.05]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh position={[0.08, 1.6, 0.72]}>
          <boxGeometry args={[0.04, 1.0, 0.05]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
      </group>

      {/* Modern Stove & Range Hood */}
      <group position={[3.5, 0, -4.5]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[2.4, 1.0, 1.4]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        {/* 4 Burners */}
        <mesh position={[-0.4, 1.02, -0.2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.4, 1.02, -0.2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.4, 1.02, 0.2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.4, 1.02, 0.2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>
    </group>
  );
}

export function DiaryRoomFurniture() {
  return (
    <group position={[2, 0, 4]}>
      {/* Soundstage Dark Acoustic Carpet */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 8.5]} />
        <meshStandardMaterial color="#18181b" roughness={0.95} />
      </mesh>

      {/* The Legendary BBNaija Wingback Diary Room Chair */}
      <group position={[0, 0, -0.5]}>
        {/* Golden Pedestal Base */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.7, 0.8, 0.3, 24]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Plush Velvet Seat */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.75, 0.7, 0.5, 24]} />
          <meshStandardMaterial color="#6b21a8" roughness={0.5} />
        </mesh>
        {/* High Curved Wingback */}
        <mesh position={[0, 1.5, -0.45]} castShadow>
          <boxGeometry args={[1.5, 1.6, 0.35]} />
          <meshStandardMaterial color="#581c87" roughness={0.5} />
        </mesh>
        {/* Left Armrest */}
        <mesh position={[-0.75, 0.85, -0.1]}>
          <boxGeometry args={[0.25, 0.45, 0.9]} />
          <meshStandardMaterial color="#7e22ce" roughness={0.5} />
        </mesh>
        {/* Right Armrest */}
        <mesh position={[0.75, 0.85, -0.1]}>
          <boxGeometry args={[0.25, 0.45, 0.9]} />
          <meshStandardMaterial color="#7e22ce" roughness={0.5} />
        </mesh>
        {/* Golden Trim Piping */}
        <mesh position={[0, 2.32, -0.45]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.5]} />
          <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Hanging Big Brother Microphone */}
      <group position={[0, 2.2, 0.8]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#222" metalness={0.9} />
        </mesh>
      </group>

      {/* Dramatic Studio Spotlight */}
      <spotLight
        position={[0, 4.5, 2]}
        target-position={[0, 1, -0.5]}
        intensity={3.5}
        angle={0.65}
        penumbra={0.4}
        color="#a855f7"
      />
    </group>
  );
}

export function HohSuiteFurniture() {
  return (
    <group position={[2, 0, -12]}>
      {/* Luxury Gold Trim Dais / Platform */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[11, 0.3, 9]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.4} />
      </mesh>
      {/* Golden perimeter border */}
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.6, 8.6]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>

      {/* King Canopy Bed */}
      <group position={[0, 0.3, -2]}>
        {/* Headboard */}
        <mesh position={[0, 1.3, -2.1]} castShadow>
          <boxGeometry args={[4.4, 2.0, 0.4]} />
          <meshStandardMaterial color="#78350f" roughness={0.4} />
        </mesh>
        {/* Gold Crown on Headboard */}
        <mesh position={[0, 2.5, -2.0]}>
          <coneGeometry args={[0.4, 0.5, 5]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.0, 0.7, 4.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
        {/* Luxury Silk Duvet */}
        <mesh position={[0, 0.75, 0.3]}>
          <boxGeometry args={[3.9, 0.22, 3.4]} />
          <meshStandardMaterial color="#991b1b" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Pillows */}
        <mesh position={[-1.1, 0.95, -1.4]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[1.2, 0.25, 0.8]} />
          <meshStandardMaterial color="#fef08a" />
        </mesh>
        <mesh position={[1.1, 0.95, -1.4]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[1.2, 0.25, 0.8]} />
          <meshStandardMaterial color="#fef08a" />
        </mesh>
      </group>

      {/* The Head of House Throne Armchair */}
      <group position={[3.8, 0.3, 2.2]} rotation={[0, -0.6, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.4, 0.6, 1.4]} />
          <meshStandardMaterial color="#d97706" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.2, -0.55]} castShadow>
          <boxGeometry args={[1.4, 1.2, 0.3]} />
          <meshStandardMaterial color="#b45309" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.9, -0.55]}>
          <coneGeometry args={[0.35, 0.4, 4]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} />
        </mesh>
      </group>

      {/* Champagne Chiller on Stand */}
      <group position={[-3.8, 0.3, 2.2]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.9]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.3, 0.2, 0.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </mesh>
        {/* Bottle */}
        <mesh position={[0, 1.15, 0]} rotation={[0.2, 0, 0.2]}>
          <cylinderGeometry args={[0.06, 0.08, 0.35]} />
          <meshStandardMaterial color="#14532d" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export function GardenFurniture() {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      const t = state.clock.getElapsedTime();
      waterRef.current.position.y = 0.12 + Math.sin(t * 1.8) * 0.015;
    }
  });

  return (
    <group position={[24, 0, 4]}>
      {/* The Iconic Biggie Swimming Pool */}
      <group position={[0, 0, 0]}>
        {/* Pool Coping Rim (White Stone) */}
        <mesh position={[0, 0.15, 0]} receiveShadow>
          <boxGeometry args={[11.5, 0.3, 17.5]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
        </mesh>
        {/* Pool Water Surface */}
        <mesh ref={waterRef} position={[0, 0.14, 0]}>
          <boxGeometry args={[10.2, 0.25, 16.2]} />
          <meshStandardMaterial
            color="#0ea5e9"
            roughness={0.1}
            metalness={0.1}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Pool Tile Floor underneath */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[10.2, 0.04, 16.2]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        {/* Pool Ladder */}
        <group position={[-5.0, 0.3, -4]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.9]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
          </mesh>
          <mesh position={[0, 0.4, 0.6]}>
            <cylinderGeometry args={[0.04, 0.04, 0.9]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
          </mesh>
        </group>
      </group>

      {/* Sun Loungers along the pool */}
      {[-5, 0, 5].map((z, idx) => (
        <group key={idx} position={[-6.8, 0, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[1.2, 0.25, 2.6]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          {/* Cushion */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.1, 0.1, 2.4]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#38bdf8' : '#fbbf24'} roughness={0.6} />
          </mesh>
          {/* Headrest incline */}
          <mesh position={[0, 0.5, -0.9]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[1.0, 0.1, 0.7]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}

      {/* Palm Trees */}
      <group position={[6.5, 0, -8]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.12, 0.22, 4]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4.2, 0]}>
          <sphereGeometry args={[1.6, 16, 16]} />
          <meshStandardMaterial color="#16a34a" roughness={0.7} />
        </mesh>
      </group>
      <group position={[6.5, 0, 8]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.12, 0.22, 4]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4.2, 0]}>
          <sphereGeometry args={[1.6, 16, 16]} />
          <meshStandardMaterial color="#16a34a" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

export function ArenaFurniture() {
  return (
    <group position={[2, 0, 18]}>
      {/* Running Track Strip */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 8]} />
        <meshStandardMaterial color="#991b1b" roughness={0.9} />
      </mesh>
      {/* White Lane Markers */}
      {[-2.5, 0, 2.5].map((x, idx) => (
        <mesh key={idx} position={[x, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 7.6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Challenge Cones */}
      {[-3, -1, 1, 3].map((x, idx) => (
        <mesh key={idx} position={[x, 0.35, 1.5]} castShadow>
          <coneGeometry args={[0.25, 0.7, 16]} />
          <meshStandardMaterial color="#f97316" roughness={0.3} />
        </mesh>
      ))}

      {/* Challenge Podium (1st, 2nd, 3rd) */}
      <group position={[0, 0, -2.5]}>
        {/* 1st Place */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.2, 0.9, 1.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} />
        </mesh>
        {/* 2nd Place */}
        <mesh position={[-1.3, 0.3, 0]} castShadow>
          <boxGeometry args={[1.1, 0.6, 1.1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} />
        </mesh>
        {/* 3rd Place */}
        <mesh position={[1.3, 0.2, 0]} castShadow>
          <boxGeometry args={[1.1, 0.4, 1.1]} />
          <meshStandardMaterial color="#b45309" metalness={0.6} />
        </mesh>
      </group>

      {/* Innoson Brand SUV Display Prop (The Legendary Car Task) */}
      <group position={[-3.0, 0, -1.0]} rotation={[0, 0.2, 0]}>
        {/* Car Chassis */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.5, 3.2]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Cabin / Windows */}
        <mesh position={[0, 0.85, -0.2]}>
          <boxGeometry args={[1.4, 0.45, 1.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Windshield angle glass */}
        <mesh position={[0, 0.85, 0.8]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[1.35, 0.4, 0.1]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} />
        </mesh>
        {/* 4 Wheels */}
        {[-0.9, 0.9].map((wx, i) =>
          [-1.0, 1.0].map((wz, j) => (
            <mesh key={`wheel-${i}-${j}`} position={[wx, 0.22, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.18, 16]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
        {/* Headlights */}
        <mesh position={[-0.6, 0.5, 1.62]}>
          <boxGeometry args={[0.3, 0.12, 0.05]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.6, 0.5, 1.62]}>
          <boxGeometry args={[0.3, 0.12, 0.05]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      </group>
    </group>
  );
}

export function BedroomFurniture() {
  return (
    <group position={[-16, 0, 20]}>
      {/* Carpet */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 9]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>

      {/* Two Queen Beds */}
      {[-3, 3].map((x, idx) => (
        <group key={idx} position={[x, 0, 0]}>
          {/* Bed Frame */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.6, 4.4]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
          {/* Mattress */}
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[3.0, 0.3, 4.2]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          {/* Duvet with colorful Ankara vibes */}
          <mesh position={[0, 0.82, 0.4]}>
            <boxGeometry args={[2.9, 0.1, 3.2]} />
            <meshStandardMaterial color={idx === 0 ? '#0284c7' : '#e11d48'} roughness={0.6} />
          </mesh>
          {/* Pillows */}
          <mesh position={[-0.7, 0.95, -1.4]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[1.0, 0.2, 0.7]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.7, 0.95, -1.4]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[1.0, 0.2, 0.7]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Vanity Dressing Mirror with lights */}
      <group position={[0, 0, 4.2]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[2.4, 2.6, 0.15]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 1.4, 0.09]}>
          <planeGeometry args={[2.0, 2.2]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>
    </group>
  );
}
