import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export interface CharacterProps {
  position: [number, number, number];
  yaw?: number;
  accent: string;
  emoji: string;
  name: string;
  isPlayer?: boolean;
  isWalking?: boolean;
  isDancing?: boolean;
  skinTone?: string;
  hairstyle?: import('../types').Hairstyle;
  speechBubble?: string | null;
  isNearby?: boolean;
  onTalk?: () => void;
}

export function Character({
  position,
  yaw = 0,
  accent,
  emoji,
  name,
  isPlayer,
  isWalking = false,
  isDancing = false,
  skinTone = '#c98a5b',
  hairstyle = 'lowcut',
  speechBubble,
  isNearby = false,
  onTalk,
}: CharacterProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (isDancing) {
      const danceFreq = 6;
      const bounce = Math.abs(Math.sin(t * danceFreq)) * 0.16 + 0.05;
      const sway = Math.sin(t * danceFreq * 0.5) * 0.25;
      const armWave = Math.sin(t * danceFreq) * 0.5;

      if (bodyRef.current) {
        bodyRef.current.position.y = bounce;
        bodyRef.current.rotation.y = sway;
        bodyRef.current.rotation.z = 0;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = -1.3 + armWave;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -1.3 - armWave;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * danceFreq) * 0.3;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t * danceFreq) * 0.3;
      if (headRef.current) headRef.current.rotation.z = Math.sin(t * danceFreq * 0.5) * 0.12;
    } else if (isWalking) {
      const stepFreq = 14;
      const legSwing = Math.sin(t * stepFreq) * 0.45;
      const bounce = Math.abs(Math.sin(t * stepFreq)) * 0.08;
      const tilt = Math.cos(t * stepFreq * 0.5) * 0.04;

      if (bodyRef.current) {
        bodyRef.current.position.y = bounce;
        bodyRef.current.rotation.z = tilt;
        bodyRef.current.rotation.y = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -legSwing * 0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x = legSwing * 0.7;
      if (headRef.current) headRef.current.rotation.z = -tilt * 0.5;
    } else {
      // Idle breathing
      const idleFreq = 2.4;
      const breathe = Math.sin(t * idleFreq + (name.length || 0)) * 0.02;
      if (bodyRef.current) {
        bodyRef.current.position.y = breathe;
        bodyRef.current.rotation.z = 0;
        bodyRef.current.rotation.y = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (headRef.current) headRef.current.rotation.z = 0;
    }
  });

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* Root animated body container */}
      <group ref={bodyRef}>
        {/* Torso / Clothes */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <capsuleGeometry args={[0.34, 0.65, 8, 16]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>

        {/* Neck collar */}
        <mesh position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.2, 0.28, 0.12, 16]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.8} />
        </mesh>

        {/* Arms */}
        <mesh ref={leftArmRef} position={[-0.42, 1.0, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.42, 1.0, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>

        {/* Head assembly */}
        <group ref={headRef} position={[0, 1.65, 0]}>
          {/* Head sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.28, 24, 24]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>

          {/* Hair */}
          <Hair hairstyle={hairstyle} color={isPlayer ? '#1b1b1b' : '#2b231d'} />

          {/* Sunglasses or Eyes */}
          {isPlayer ? (
            // Stylish dark shades
            <mesh position={[0, 0.04, 0.26]}>
              <boxGeometry args={[0.38, 0.1, 0.08]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.8} />
            </mesh>
          ) : (
            // Eyes
            <group position={[0, 0.04, 0.26]}>
              <mesh position={[0.09, 0, 0]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
              <mesh position={[-0.09, 0, 0]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* Legs (swing independently around hip joint at y=0.55) */}
      <mesh ref={leftLegRef} position={[-0.16, 0.32, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.42, 4, 8]} />
        <meshStandardMaterial color="#1a202c" roughness={0.8} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.16, 0.32, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.42, 4, 8]} />
        <meshStandardMaterial color="#1a202c" roughness={0.8} />
      </mesh>

      {/* Ground contact shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} />
      </mesh>

      {/* Name tag and speech bubbles */}
      <Html position={[0, 2.45, 0]} center distanceFactor={11} zIndexRange={[15, 0]}>
        <div className="flex -translate-x-1/2 flex-col items-center whitespace-nowrap pointer-events-none">
          {/* Ambient Speech Bubble if active */}
          {speechBubble && (
            <div className="mb-2 max-w-[170px] rounded-2xl bg-white px-3 py-1.5 text-center text-[11px] font-bold text-ink shadow-xl ring-2 ring-gold/70 animate-pop-in">
              <span className="leading-tight">{speechBubble}</span>
              <div className="mx-auto -mb-2 size-2 rotate-45 bg-white ring-r-2 ring-b-2 ring-gold/70" />
            </div>
          )}

          {/* Talk Prompt if nearby */}
          {isNearby && !isPlayer && (
            <button
              onClick={onTalk}
              className="pointer-events-auto mb-1 flex items-center gap-1 rounded-full bg-bbn px-3 py-1 text-[11px] font-black text-white shadow-lg transition hover:scale-105 active:scale-95 animate-pulse-dot"
            >
              <span>💬 Talk</span>
              <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] font-bold">E</span>
            </button>
          )}

          {/* Badge */}
          <div className="flex items-center gap-1">
            <span className="text-base drop-shadow">{emoji}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold shadow-md ${
                isPlayer ? 'bg-bbn text-white ring-2 ring-white/50' : 'bg-white/95 text-ink'
              }`}
            >
              {name}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

function Hair({ hairstyle, color }: { hairstyle: import('../types').Hairstyle; color: string }) {
  switch (hairstyle) {
    case 'afro':
      return (
        <mesh position={[0, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.36, 20, 20]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      );
    case 'lowcut':
      return (
        <mesh position={[0, 0.04, 0]} castShadow>
          <sphereGeometry args={[0.29, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      );
    case 'curls':
      return (
        <group>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const r = 0.22;
            return (
              <mesh key={i} position={[Math.cos(a) * r, 0.18, Math.sin(a) * r]} castShadow>
                <sphereGeometry args={[0.11, 12, 12]} />
                <meshStandardMaterial color={color} roughness={0.9} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        </group>
      );
    case 'braids':
      return (
        <group>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const r = 0.24;
            return (
              <mesh key={i} position={[Math.cos(a) * r, -0.05, Math.sin(a) * r]} rotation={[0.15, 0, 0.15]} castShadow>
                <cylinderGeometry args={[0.035, 0.05, 0.55, 8]} />
                <meshStandardMaterial color={color} roughness={0.85} />
              </mesh>
            );
          })}
        </group>
      );
    case 'locs':
      return (
        <group>
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            const r = 0.22;
            return (
              <mesh key={i} position={[Math.cos(a) * r, -0.15, Math.sin(a) * r]} rotation={[0.1, 0, 0.1]} castShadow>
                <cylinderGeometry args={[0.05, 0.06, 0.8, 8]} />
                <meshStandardMaterial color={color} roughness={0.85} />
              </mesh>
            );
          })}
        </group>
      );
    case 'bald':
    default:
      return null;
  }
}
