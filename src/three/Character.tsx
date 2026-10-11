import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useCamera } from './cameraStore';
import { stripRootMotion } from './rootMotion';
import type { Hairstyle, Gender } from '../types';

export interface CharacterProps {
  position: [number, number, number];
  yaw?: number;
  accent: string;
  emoji: string;
  name: string;
  gender?: Gender;
  isPlayer?: boolean;
  isWalking?: boolean;
  isDancing?: boolean;
  animOverride?: 'idle' | 'walk' | 'dance' | 'celebrate' | 'shock' | 'angry' | 'thumbsup' | null;
  skinTone?: string;
  hairstyle?: Hairstyle;
  speechBubble?: string | null;
  isNearby?: boolean;
  onTalk?: () => void;
}

// -------------------------------------------------------------
// Realistic Skinned Rigged 3D Human Avatar (GLB Mesh + PBR Materials)
// -------------------------------------------------------------
export function RealHumanModel({
  gender = 'M',
  accent,
  skinTone,
  isWalking = false,
  isDancing = false,
  animOverride = null,
}: {
  gender?: Gender;
  accent: string;
  skinTone?: string;
  isWalking?: boolean;
  isDancing?: boolean;
  animOverride?: 'idle' | 'walk' | 'dance' | 'celebrate' | 'shock' | 'angry' | 'thumbsup' | null;
}) {
  const modelUrl = gender === 'F' ? '/models/female_avatar.glb' : '/models/avatar.glb';
  const modelGltf = useGLTF(modelUrl);
  const walkGltf = useGLTF('/models/anim_walk.glb');
  const idleGltf = useGLTF('/models/anim_idle.glb');
  const danceGltf = useGLTF('/models/anim_dance.glb');
  const celebrateGltf = useGLTF('/models/anim_celebrate.glb');
  const shockGltf = useGLTF('/models/anim_shock.glb');
  const angryGltf = useGLTF('/models/anim_angry.glb');

  // Clone skinned mesh so each housemate has an independent skeleton rig
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(modelGltf.scene);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mesh = child as THREE.Mesh;
        // Apply signature outfit accent color to top garments only if separated
        if (mesh.name === 'Wolf3D_Outfit_Top') {
          if (mesh.material && !Array.isArray(mesh.material)) {
            mesh.material = mesh.material.clone();
            (mesh.material as THREE.MeshStandardMaterial).color = new THREE.Color(accent);
          }
        }
      }
    });
    return c;
  }, [modelGltf.scene, accent, skinTone]);

  // Create independent AnimationMixer on the cloned skeleton
  const mixer = useMemo(() => new THREE.AnimationMixer(clone), [clone]);

  // Action blending: Idle vs Walking vs Dancing vs Mocap Emotes
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const idleClip = stripRootMotion(idleGltf.animations[0]);
    const walkClip = stripRootMotion(walkGltf.animations[0]);
    const danceClip = stripRootMotion(danceGltf.animations[0]);
    const celebrateClip = stripRootMotion(celebrateGltf.animations[0]);
    const shockClip = stripRootMotion(shockGltf.animations[0]);
    const angryClip = stripRootMotion(angryGltf.animations[0]);

    const idleAction = idleClip ? mixer.clipAction(idleClip) : null;
    const walkAction = walkClip ? mixer.clipAction(walkClip) : null;
    const danceAction = danceClip ? mixer.clipAction(danceClip) : null;
    const celebrateAction = celebrateClip ? mixer.clipAction(celebrateClip) : null;
    const shockAction = shockClip ? mixer.clipAction(shockClip) : null;
    const angryAction = angryClip ? mixer.clipAction(angryClip) : null;

    let targetAction = idleAction;
    if (animOverride === 'celebrate' && celebrateAction) {
      targetAction = celebrateAction;
    } else if (animOverride === 'shock' && shockAction) {
      targetAction = shockAction;
    } else if (animOverride === 'angry' && angryAction) {
      targetAction = angryAction;
    } else if ((animOverride === 'dance' || isDancing) && danceAction) {
      targetAction = danceAction;
    } else if ((animOverride === 'walk' || isWalking) && walkAction) {
      targetAction = walkAction;
    }

    if (targetAction && targetAction !== activeActionRef.current) {
      const prevAction = activeActionRef.current;
      targetAction.reset();
      if (prevAction) {
        targetAction.play();
        prevAction.crossFadeTo(targetAction, 0.25, true);
      } else {
        targetAction.fadeIn(0.2).play();
      }
      activeActionRef.current = targetAction;
    }
  }, [
    mixer,
    isWalking,
    isDancing,
    animOverride,
    idleGltf.animations,
    walkGltf.animations,
    danceGltf.animations,
    celebrateGltf.animations,
    shockGltf.animations,
    angryGltf.animations,
  ]);

  useFrame((_, delta) => {
    mixer.update(delta);
  });

  return <primitive object={clone} position={[0, 0, 0]} rotation={[0, 0, 0]} />;
}

// -------------------------------------------------------------
// Main Character Component (Player + AI Housemates + Networked Players)
// -------------------------------------------------------------
export function Character({
  position,
  yaw = 0,
  accent,
  emoji,
  name,
  gender = 'M',
  isPlayer,
  isWalking = false,
  isDancing = false,
  animOverride = null,
  skinTone = '#c98a5b',
  speechBubble,
  isNearby = false,
  onTalk,
}: CharacterProps) {
  const rootRef = useRef<THREE.Group>(null);
  const cameraMode = useCamera((s) => s.mode);

  return (
    <group ref={rootRef} position={position} rotation={[0, yaw, 0]}>
      {/* Dynamic Ground Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>

      {/* Skinned Rigged 3D Human Character Model */}
      <RealHumanModel
        gender={gender}
        accent={accent}
        skinTone={skinTone}
        isWalking={isWalking}
        isDancing={isDancing}
        animOverride={animOverride}
      />

      {/* Name Tag, Prompts, and Speech Bubbles */}
      <Html
        position={[0, 2.05, 0]}
        center
        distanceFactor={cameraMode === 'human' ? 6 : 10}
        zIndexRange={[15, 0]}
      >
        <div className="flex flex-col items-center whitespace-nowrap pointer-events-none">
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
              onClick={(e) => {
                e.stopPropagation();
                onTalk?.();
              }}
              className="pointer-events-auto mb-1 flex items-center gap-1 rounded-full bg-bbn px-3 py-1 text-[11px] font-black text-white shadow-lg transition hover:scale-105 active:scale-95 animate-pulse-dot"
            >
              <span>💬 Talk</span>
              <span className="rounded bg-white/20 px-1 py-0.5 text-[9px] font-bold">F</span>
            </button>
          )}

          {/* Badge: In human 3rd-person view, omit player's own badge so camera view is clean */}
          {(!isPlayer || cameraMode === 'overhead') && (
            <div
              onClick={(e) => {
                if (!isPlayer && onTalk) {
                  e.stopPropagation();
                  onTalk();
                }
              }}
              className={`flex items-center gap-1 ${!isPlayer ? 'pointer-events-auto cursor-pointer hover:scale-105 transition-transform' : ''}`}
            >
              <span className="text-base drop-shadow">{emoji}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold shadow-md ${
                  isPlayer ? 'bg-bbn text-white ring-2 ring-white/50' : 'bg-white/95 text-ink hover:bg-gold/20'
                }`}
              >
                {name}
              </span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// Preload models and animations for instant rendering
useGLTF.preload('/models/avatar.glb');
useGLTF.preload('/models/female_avatar.glb');
useGLTF.preload('/models/anim_walk.glb');
useGLTF.preload('/models/anim_idle.glb');
useGLTF.preload('/models/anim_dance.glb');
useGLTF.preload('/models/anim_celebrate.glb');
useGLTF.preload('/models/anim_shock.glb');
useGLTF.preload('/models/anim_angry.glb');
