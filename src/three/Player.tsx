import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';
import { input, attachInput, playerWorldPos } from './input';
import { roomAt, WORLD_BOUNDS, PLAYER_SPAWN, moveWithSliding } from './rooms';
import { updateAvatarCollider, removeAvatarCollider } from './collisionStore';
import { useGame } from '../store';
import { multiplayer } from '../engine/multiplayer';
import { useTour, TOUR_STOPS } from './tourStore';
import { useCamera } from './cameraStore';
import { useEmote } from './emoteStore';

const SPEED = 9;
const CAM_DIST = 16;
const CAM_HEIGHT = 14;

export function Player() {
  const group = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(PLAYER_SPAWN[0], 0, PLAYER_SPAWN[1]));
  const yaw = useRef(0);
  const camYaw = useRef(0);
  const camLookAt = useRef(new THREE.Vector3(PLAYER_SPAWN[0], 1.2, PLAYER_SPAWN[1]));
  const lastRoom = useRef(roomAt(PLAYER_SPAWN[0], PLAYER_SPAWN[1]));
  const camera = useThree((s) => s.camera);

  const [isWalking, setIsWalking] = useState(false);
  const isWalkingRef = useRef(false);
  const stuckFrames = useRef(0);
  const targetStartTime = useRef(0);

  useEffect(() => {
    attachInput();
    return () => {
      removeAvatarCollider('player');
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const keys = input.keys;

    // Camera orbit with Q/E
    if (keys.KeyQ) camYaw.current += 1.8 * dt;
    if (keys.KeyE) camYaw.current -= 1.8 * dt;

    // Movement direction relative to camera yaw
    const fwd = new THREE.Vector3(-Math.sin(camYaw.current), 0, -Math.cos(camYaw.current));
    const right = new THREE.Vector3(Math.cos(camYaw.current), 0, -Math.sin(camYaw.current));

    const dz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);

    // Blend in virtual joystick (mobile): y up = forward, x right = strafe
    const joyDz = -input.moveVector.y;
    const joyDx = input.moveVector.x;
    const totalDz = dz + joyDz;
    const totalDx = dx + joyDx;

    // Manual input cancels click-to-move immediately
    if (totalDz !== 0 || totalDx !== 0) {
      if (input.target) {
        console.log('[Player] Manual movement cancelled active target');
      }
      input.target = null;
      stuckFrames.current = 0;
      targetStartTime.current = 0;
    }

    let move = new THREE.Vector3();
    if (input.target) {
      if (targetStartTime.current === 0) {
        targetStartTime.current = performance.now();
      }
      // Safety timeout: target cannot last more than 2.5 seconds
      if (performance.now() - targetStartTime.current > 2500) {
        console.log('[Player] Target movement timed out - stopping');
        input.target = null;
        targetStartTime.current = 0;
        stuckFrames.current = 0;
      } else {
        const to = new THREE.Vector3(input.target.x, 0, input.target.z);
        move = to.clone().sub(pos.current);
        move.y = 0;
        const len = move.length();
        if (len < 1.4) {
          console.log('[Player] Target reached within interaction radius');
          input.target = null;
          move.set(0, 0, 0);
          stuckFrames.current = 0;
          targetStartTime.current = 0;
        } else {
          move.normalize();
        }
      }
    } else {
      targetStartTime.current = 0;
      move = fwd.multiplyScalar(totalDz).add(right.multiplyScalar(totalDx));
      if (move.lengthSq() > 1) move.normalize();
      const sprint = keys.ShiftLeft || keys.ShiftRight ? 1.6 : 1;
      move.multiplyScalar(sprint);
    }

    // If tour is active, keep avatar idle while the camera flies through rooms
    if (useTour.getState().isActive) {
      move.set(0, 0, 0);
    }

    const moving = move.lengthSq() > 0.001;
    if (moving !== isWalkingRef.current) {
      isWalkingRef.current = moving;
      setIsWalking(moving);
    }

    const prevX = pos.current.x;
    const prevZ = pos.current.z;

    if (moving) {
      const step = moveWithSliding(pos.current, move.x * SPEED * dt, move.z * SPEED * dt, 0.45, 'player');
      pos.current.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, step.x));
      pos.current.z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, step.z));
      yaw.current = Math.atan2(move.x, move.z);
    }

    // Stuck detection: if target is active but walls block forward movement, cancel target
    if (input.target) {
      const actualMoved = Math.hypot(pos.current.x - prevX, pos.current.z - prevZ);
      if (actualMoved < SPEED * dt * 0.3) {
        stuckFrames.current += 1;
        if (stuckFrames.current > 5) {
          console.log('[Player] Stuck against wall detected - cancelling target');
          input.target = null;
          stuckFrames.current = 0;
          targetStartTime.current = 0;
          setIsWalking(false);
          isWalkingRef.current = false;
        }
      } else {
        stuckFrames.current = 0;
      }
    } else {
      stuckFrames.current = 0;
    }

    // Sync real-time position for NPC proximity detection and avatar-to-avatar collision
    playerWorldPos.x = pos.current.x;
    playerWorldPos.z = pos.current.z;
    updateAvatarCollider('player', pos.current.x, pos.current.z, 0.45);

    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = yaw.current;
    }

    const isTourActive = useTour.getState().isActive;
    const tourIndex = useTour.getState().currentStopIndex;
    const tourStop = TOUR_STOPS[tourIndex] ?? TOUR_STOPS[0];

    // Camera follow (cinematic fly-through during guided tour or smooth follow during gameplay)
    if (isTourActive) {
      const targetCam = new THREE.Vector3(...tourStop.cameraPos);
      const targetLook = new THREE.Vector3(...tourStop.lookAt);
      camera.position.lerp(targetCam, Math.min(1, 4.5 * dt));
      camLookAt.current.lerp(targetLook, Math.min(1, 4.5 * dt));
      camera.lookAt(camLookAt.current);
    } else {
      const cameraMode = useCamera.getState().mode;
      const camDist = cameraMode === 'human' ? 4.2 : CAM_DIST;
      const camHeight = cameraMode === 'human' ? 2.1 : CAM_HEIGHT;
      const lookY = cameraMode === 'human' ? 1.55 : 1.2;

      const normalCam = new THREE.Vector3(
        pos.current.x + Math.sin(camYaw.current) * camDist,
        camHeight,
        pos.current.z + Math.cos(camYaw.current) * camDist,
      );
      const normalLook = new THREE.Vector3(pos.current.x, lookY, pos.current.z);
      camera.position.lerp(normalCam, Math.min(1, (cameraMode === 'human' ? 8.5 : 6.5) * dt));
      camLookAt.current.lerp(normalLook, Math.min(1, 8.5 * dt));
      camera.lookAt(camLookAt.current);
    }

    // Room detection → keep the game store in sync
    const room = roomAt(pos.current.x, pos.current.z);
    if (room !== lastRoom.current) {
      lastRoom.current = room;
      useGame.getState().setRoom(room);
    }

    // Broadcast my position to the multiplayer server (throttled internally)
    if (moving) multiplayer.sendMove(pos.current.x, pos.current.z, room);
  });

  const player = useGame((s) => s.state?.player);
  const activeEmote = useEmote((s) => s.activeEmote);
  const [emoteAnim, setEmoteAnim] = useState<
    'idle' | 'walk' | 'dance' | 'celebrate' | 'shock' | 'angry' | 'thumbsup' | null
  >(null);

  useEffect(() => {
    if (!activeEmote) return;
    let anim: 'celebrate' | 'dance' | 'angry' | 'shock' | null = null;
    if (activeEmote.type === 'hype') anim = 'celebrate';
    else if (activeEmote.type === 'dance') anim = 'dance';
    else if (activeEmote.type === 'clapback') anim = 'angry';
    else if (activeEmote.type === 'wave') anim = 'celebrate';

    if (anim) {
      setEmoteAnim(anim);
      const timer = setTimeout(() => setEmoteAnim(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [activeEmote]);

  if (!player) return null;

  return (
    <group ref={group}>
      <Character
        position={[0, 0, 0]}
        yaw={0}
        accent={player.accentColor}
        emoji={player.avatar}
        name={player.nickname}
        gender={player.gender}
        isPlayer
        isWalking={isWalking}
        animOverride={emoteAnim}
        skinTone={player.skinTone}
        hairstyle={player.hairstyle}
      />
    </group>
  );
}
