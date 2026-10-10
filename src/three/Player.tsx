import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';
import { input, attachInput, playerWorldPos } from './input';
import { roomAt, WORLD_BOUNDS, PLAYER_SPAWN, collideWalls } from './rooms';
import { useGame } from '../store';
import { sound } from '../engine/sound';
import { multiplayer } from '../engine/multiplayer';

const SPEED = 9;
const CAM_DIST = 16;
const CAM_HEIGHT = 14;

export function Player() {
  const group = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(PLAYER_SPAWN[0], 0, PLAYER_SPAWN[1]));
  const yaw = useRef(0);
  const camYaw = useRef(0);
  const lastRoom = useRef(roomAt(PLAYER_SPAWN[0], PLAYER_SPAWN[1]));
  const camera = useThree((s) => s.camera);

  const [isWalking, setIsWalking] = useState(false);
  const isWalkingRef = useRef(false);

  useEffect(() => {
    attachInput();
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

    let move = new THREE.Vector3();
    if (input.target) {
      const to = new THREE.Vector3(input.target.x, 0, input.target.z);
      move = to.clone().sub(pos.current);
      move.y = 0;
      const len = move.length();
      if (len < 0.5) {
        input.target = null;
        move.set(0, 0, 0);
      } else {
        move.normalize();
      }
    } else {
      move = fwd.multiplyScalar(totalDz).add(right.multiplyScalar(totalDx));
      if (move.lengthSq() > 1) move.normalize();
      const sprint = keys.ShiftLeft || keys.ShiftRight ? 1.6 : 1;
      move.multiplyScalar(sprint);
    }

    const moving = move.lengthSq() > 0.001;
    if (moving !== isWalkingRef.current) {
      isWalkingRef.current = moving;
      setIsWalking(moving);
    }

    if (moving) {
      pos.current.addScaledVector(move, SPEED * dt);
      yaw.current = Math.atan2(move.x, move.z);
      sound.playFootstep();
    }

    // Clamp to world bounds, then resolve wall collision
    pos.current.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, pos.current.x));
    pos.current.z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, pos.current.z));
    collideWalls(pos.current);

    // Sync real-time position for NPC proximity detection
    playerWorldPos.x = pos.current.x;
    playerWorldPos.z = pos.current.z;

    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = yaw.current;
    }

    // Camera follow
    camera.position.set(
      pos.current.x + Math.sin(camYaw.current) * CAM_DIST,
      CAM_HEIGHT,
      pos.current.z + Math.cos(camYaw.current) * CAM_DIST,
    );
    camera.lookAt(pos.current.x, 1.2, pos.current.z);

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

  if (!player) return null;

  return (
    <group ref={group}>
      <Character
        position={[0, 0, 0]}
        yaw={0}
        accent={player.accentColor}
        emoji={player.avatar}
        name={player.nickname}
        isPlayer
        isWalking={isWalking}
        skinTone={player.skinTone}
        hairstyle={player.hairstyle}
      />
    </group>
  );
}
