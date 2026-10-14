import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { attachInput, input } from './input';
import { useLifeStore } from '../life/lifeStore';
import { useCamera } from './cameraStore';
import { moveWithSliding } from './movement';
import {
  getAvatarCollider,
  markAvatarDriven,
  updateAvatarCollider,
} from './collisionStore';

// ---------------------------------------------------------------------------
// You drive the selected Sim.
//
// WASD / arrow keys walk them, Q and E orbit the camera, the wheel zooms. Let
// go of the keys and they carry on under their own free will.
// ---------------------------------------------------------------------------

const WALK_SPEED = 4.2;
const FOLLOW_DISTANCE = 10;
const FOLLOW_HEIGHT = 7.5;

export function Player() {
  const camera = useThree((s) => s.camera);
  const camYaw = useRef(0);
  const distance = useRef(FOLLOW_DISTANCE);
  const lookAt = useRef(new THREE.Vector3(0, 1.2, 0));

  const plot = useLifeStore((s) => s.household?.plot);
  const selectedSimId = useLifeStore((s) => s.selectedSimId);

  useEffect(() => {
    attachInput();
  }, []);

  // Frame the selected Sim as soon as one exists.
  useEffect(() => {
    if (!selectedSimId) return;
    const collider = getAvatarCollider(selectedSimId);
    if (collider) {
      lookAt.current.set(collider.x, 1.2, collider.z);
    } else if (plot) {
      const cx = plot.originX + (plot.width * plot.tileSize) / 2;
      const cz = plot.originZ + plot.depth * plot.tileSize * 0.62;
      lookAt.current.set(cx, 1.2, cz);
    }
  }, [selectedSimId, plot]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      distance.current = Math.max(4, Math.min(30, distance.current + e.deltaY * 0.015));
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const keys = input.keys;

    if (keys.KeyQ) camYaw.current += 1.8 * dt;
    if (keys.KeyE) camYaw.current -= 1.8 * dt;

    // --- Walk the selected Sim ---------------------------------------------
    const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const strafe = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);

    if (selectedSimId && (forward || strafe)) {
      const collider = getAvatarCollider(selectedSimId);
      if (collider) {
        // Move relative to the camera's facing.
        const sin = Math.sin(camYaw.current);
        const cos = Math.cos(camYaw.current);
        let dx = -sin * forward + cos * strafe;
        let dz = -cos * forward - sin * strafe;
        const len = Math.hypot(dx, dz) || 1;
        dx /= len;
        dz /= len;

        const step = moveWithSliding(
          { x: collider.x, z: collider.z },
          dx * WALK_SPEED * dt,
          dz * WALK_SPEED * dt,
          0.45,
          selectedSimId,
        );
        const yaw = Math.atan2(dx, dz);
        updateAvatarCollider(selectedSimId, step.x, step.z, 0.45, yaw);
        markAvatarDriven(selectedSimId);
      }
    }

    // --- Camera follows the selected Sim -----------------------------------
    const collider = selectedSimId ? getAvatarCollider(selectedSimId) : undefined;
    const focus = collider ?? { x: lookAt.current.x, z: lookAt.current.z };
    const cameraMode = useCamera.getState().mode;
    const dist = cameraMode === 'human' ? 3.6 : distance.current;
    const height = cameraMode === 'human' ? 2.4 : FOLLOW_HEIGHT;

    const desired = new THREE.Vector3(
      focus.x + Math.sin(camYaw.current) * dist,
      height,
      focus.z + Math.cos(camYaw.current) * dist,
    );

    camera.position.lerp(desired, Math.min(1, 5.5 * dt));
    lookAt.current.lerp(
      new THREE.Vector3(focus.x, cameraMode === 'human' ? 1.5 : 1.15, focus.z),
      Math.min(1, 8 * dt),
    );
    camera.lookAt(lookAt.current);
  });

  return null;
}
