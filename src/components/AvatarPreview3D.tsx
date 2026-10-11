import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RealHumanModel } from '../three/Character';
import type { Gender } from '../types';

export interface AvatarPreview3DProps {
  gender: Gender;
  accentColor: string;
  skinTone?: string;
  nickname?: string;
  avatarEmoji?: string;
}

export type AvatarAnimState = 'idle' | 'walk' | 'dance' | 'celebrate' | 'shock' | 'angry';

function StageScene({
  gender,
  accentColor,
  skinTone,
  animState,
}: {
  gender: Gender;
  accentColor: string;
  skinTone?: string;
  animState: AvatarAnimState;
}) {
  const isWalking = animState === 'walk';
  const isDancing = animState === 'dance';
  const animOverride = animState;

  return (
    <>
      <ambientLight intensity={1.3} />
      <directionalLight position={[2.5, 4.5, 3]} intensity={2.0} castShadow />
      <directionalLight position={[-2.5, 2, -2]} intensity={0.7} />
      <pointLight position={[0, 0.4, 1.8]} intensity={2.5} color={accentColor} />

      {/* Stage Podium & Glowing Base Ring */}
      <group position={[0, -0.01, 0]}>
        {/* Dark stage pedestal */}
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.75, 0.82, 0.08, 36]} />
          <meshStandardMaterial color="#141824" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Outer glowing accent ring */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.72, 0.77, 48]} />
          <meshBasicMaterial color={accentColor} side={THREE.DoubleSide} />
        </mesh>

        {/* Soft contact shadow beneath shoes */}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.42, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.45} />
        </mesh>
      </group>

      {/* 3D Character Model */}
      <group position={[0, 0, 0]}>
        <RealHumanModel
          gender={gender}
          accent={accentColor}
          skinTone={skinTone}
          isWalking={isWalking}
          isDancing={isDancing}
          animOverride={animOverride}
        />
      </group>
    </>
  );
}

export function AvatarPreview3D({
  gender,
  accentColor,
  skinTone,
  nickname,
  avatarEmoji = '😎',
}: AvatarPreview3DProps) {
  const [mounted, setMounted] = useState(false);
  const [animState, setAnimState] = useState<AvatarAnimState>('idle');
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetRotation = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (!mounted) {
    return (
      <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl animate-bounce">{avatarEmoji}</span>
          <span className="text-xs font-semibold text-ink-soft">Loading 3D Avatar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[420px] w-full flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-[#161d2d] to-[#0c101c] p-2 ring-1 ring-white/10 shadow-2xl">
      {/* Top Floating Badge */}
      <div className="pointer-events-none absolute top-4 inset-x-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5 backdrop-blur ring-1 ring-white/15 shadow-lg">
          <span className="text-xl">{avatarEmoji}</span>
          <span className="text-xs font-extrabold text-white">
            {nickname?.trim() || (gender === 'F' ? 'Female Housemate' : 'Male Housemate')}
          </span>
          <span
            className="size-2 rounded-full animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-bbn/20 px-2.5 py-1 text-[10px] font-bold text-gold uppercase tracking-wider backdrop-blur ring-1 ring-gold/30">
          <span>3D LIVE STAGE</span>
        </div>
      </div>

      {/* 3D Canvas Stage */}
      <div className="relative h-full w-full cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [0, 0.96, 3.8], fov: 36 }}
          style={{ width: '100%', height: '100%' }}
        >
          <OrbitControls
            ref={controlsRef}
            target={[0, 0.90, 0]}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={Math.PI / 1.85}
            autoRotate={autoRotate}
            autoRotateSpeed={2.0}
          />
          <Suspense fallback={null}>
            <StageScene
              gender={gender}
              accentColor={accentColor}
              skinTone={skinTone}
              animState={animState}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Bottom Interactive Stage Controls */}
      <div className="absolute bottom-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ink/85 p-2 backdrop-blur ring-1 ring-white/15">
        {/* Animation State Selectors */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAnimState('idle')}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
              animState === 'idle'
                ? 'bg-gold text-ink shadow-sm'
                : 'bg-white/5 text-ink-soft hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>🧍</span>
            <span>Idle</span>
          </button>
          <button
            type="button"
            onClick={() => setAnimState('walk')}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
              animState === 'walk'
                ? 'bg-gold text-ink shadow-sm'
                : 'bg-white/5 text-ink-soft hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>🚶</span>
            <span>Walk</span>
          </button>
          <button
            type="button"
            onClick={() => setAnimState('dance')}
            className={`flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition ${
              animState === 'dance'
                ? 'bg-gold text-ink shadow-sm'
                : 'bg-white/5 text-ink-soft hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>💃</span>
            <span>Dance</span>
          </button>
          <button
            type="button"
            onClick={() => setAnimState('celebrate')}
            className={`flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition ${
              animState === 'celebrate'
                ? 'bg-gold text-ink shadow-sm'
                : 'bg-white/5 text-ink-soft hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>🙌</span>
            <span>Celebrate</span>
          </button>
          <button
            type="button"
            onClick={() => setAnimState('shock')}
            className={`flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition ${
              animState === 'shock'
                ? 'bg-gold text-ink shadow-sm'
                : 'bg-white/5 text-ink-soft hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>😱</span>
            <span>Shock</span>
          </button>
          <button
            type="button"
            onClick={() => setAnimState('angry')}
            className={`flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition ${
              animState === 'angry'
                ? 'bg-bbn text-white shadow-sm'
                : 'bg-white/5 text-ink-soft hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>🤬</span>
            <span>Clapback</span>
          </button>
        </div>

        {/* View Controls: Auto Rotate & Reset */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`rounded-xl px-2 py-1 text-[11px] font-bold transition ${
              autoRotate
                ? 'bg-white/20 text-white ring-1 ring-white/30'
                : 'bg-white/5 text-ink-soft hover:bg-white/10'
            }`}
            title="Toggle 360 degree auto rotation"
          >
            🔄 {autoRotate ? 'Rotating' : 'Auto Turn'}
          </button>
          <button
            type="button"
            onClick={resetRotation}
            className="rounded-xl bg-white/5 px-2 py-1 text-[11px] font-bold text-ink-soft transition hover:bg-white/10 hover:text-white"
            title="Reset front camera view"
          >
            🎯 Reset
          </button>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/avatar.glb');
useGLTF.preload('/models/female_avatar.glb');
useGLTF.preload('/models/anim_walk.glb');
useGLTF.preload('/models/anim_idle.glb');
useGLTF.preload('/models/anim_dance.glb');
useGLTF.preload('/models/anim_celebrate.glb');
useGLTF.preload('/models/anim_shock.glb');
useGLTF.preload('/models/anim_angry.glb');

