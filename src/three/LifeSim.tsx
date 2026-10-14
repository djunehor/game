import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';
import { moveWithSliding } from './movement';
import {
  updateAvatarCollider,
  removeAvatarCollider,
  wasAvatarDrivenRecently,
  getAvatarCollider,
} from './collisionStore';
import { useSimStore } from '../sim/simStore';
import { computeMood } from '../sim/moodlets';
import { getInteraction } from '../sim/interactions';
import { parseObjectInteractionId } from '../life/objects';
import { useLifeStore } from '../life/lifeStore';
import type { Sim } from '../life/types';

// ---------------------------------------------------------------------------
// A household member in the 3D world. Movement is driven by whatever the
// simulation has them doing — they walk to the room that holds the object.
// ---------------------------------------------------------------------------

function moodColor(grade: number): string {
  if (grade >= 70) return '#22c55e';
  if (grade >= 45) return '#eab308';
  if (grade >= 25) return '#f97316';
  return '#ef4444';
}

/** The floating diamond over a Sim's head. Colour tracks their mood. */
function Plumbob({ simId, selected }: { simId: string; selected: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const grade = useSimStore((s) => {
    const avatar = s.avatars[simId];
    if (!avatar) return 60;
    return computeMood(avatar, s.clock.totalMinutes).grade;
  });

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 1.6;
    ref.current.position.y = 2.75 + Math.sin(state.clock.getElapsedTime() * 2) * 0.06;
  });

  return (
    <mesh ref={ref} position={[0, 2.75, 0]} scale={selected ? 1.35 : 1}>
      <octahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial
        color={moodColor(grade)}
        emissive={moodColor(grade)}
        emissiveIntensity={0.9}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

export function LifeSim({ sim, index }: { sim: Sim; index: number }) {
  const plot = useLifeStore((s) => s.household?.plot);
  // Spawn indoors — front room of the starter house — so everyone is visible
  // and the house is immediately inhabited.
  const spawn = {
    x: (plot?.originX ?? -24) + 13,
    z: (plot?.originZ ?? -12) + 19,
  };
  const initial = useRef({
    x: spawn.x + (index % 2 === 0 ? -1 : 1) * 1.2,
    z: spawn.z + index * 1.1,
  });
  const pos = useRef(new THREE.Vector3(initial.current.x, 0, initial.current.z));
  const target = useRef(new THREE.Vector3(initial.current.x, 0, initial.current.z));
  const yaw = useRef(index * 1.4 + Math.PI);
  const stuckFrames = useRef(0);
  const timeRef = useRef(0);

  const [renderPos, setRenderPos] = useState<[number, number, number]>([pos.current.x, 0, pos.current.z]);
  const [renderYaw, setRenderYaw] = useState(yaw.current);
  const [isWalking, setIsWalking] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);

  const selectedSimId = useLifeStore((s) => s.selectedSimId);
  const selectSim = useLifeStore((s) => s.selectSim);
  const isSelected = selectedSimId === sim.id;

  const activeDefId = useSimStore((s) => s.avatars[sim.id]?.active?.defId ?? null);

  useEffect(() => {
    updateAvatarCollider(sim.id, pos.current.x, pos.current.z, 0.45);
    return () => removeAvatarCollider(sim.id);
  }, [sim.id]);

  // Steer toward the object the simulation is using.
  useEffect(() => {
    if (!activeDefId) return;
    const def = getInteraction(activeDefId);
    if (!def) return;
    const parsed = parseObjectInteractionId(activeDefId);
    const placed = parsed
      ? useLifeStore.getState().household?.lot.find((o) => o.uid === parsed.uid)
      : null;
    if (placed) {
      // Stand just off the object rather than inside it.
      target.current.set(placed.x + (index % 2 === 0 ? 1.1 : -1.1), 0, placed.z + 1.1);
      stuckFrames.current = 0;
    }
    setBubble(`${def.emoji} ${def.label}`);
    const timer = setTimeout(() => setBubble(null), 4500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDefId]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    timeRef.current = state.clock.getElapsedTime();

    // If the player is walking this Sim, mirror the position they moved them to
    // rather than running our own movement logic.
    if (wasAvatarDrivenRecently(sim.id)) {
      const driven = getAvatarCollider(sim.id);
      if (driven) {
        pos.current.x = driven.x;
        pos.current.z = driven.z;
        if (driven.yaw !== undefined) yaw.current = driven.yaw;
      }
      if (!isWalking) setIsWalking(true);
      setRenderPos([pos.current.x, 0, pos.current.z]);
      setRenderYaw(yaw.current);
      return;
    }

    const toTarget = target.current.clone().sub(pos.current);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (dist > 0.5) {
      toTarget.normalize();
      const speed = 2.6;
      const prevX = pos.current.x;
      const prevZ = pos.current.z;
      const step = moveWithSliding(pos.current, toTarget.x * speed * dt, toTarget.z * speed * dt, 0.45, sim.id);
      pos.current.x = step.x;
      pos.current.z = step.z;
      updateAvatarCollider(sim.id, pos.current.x, pos.current.z, 0.45);
      yaw.current = Math.atan2(toTarget.x, toTarget.z);

      const moved = Math.hypot(pos.current.x - prevX, pos.current.z - prevZ);
      if (moved < speed * dt * 0.25) {
        stuckFrames.current++;
        if (stuckFrames.current > 8) {
          target.current.set(
            spawn.x + (Math.random() - 0.5) * 6,
            0,
            spawn.z + (Math.random() - 0.5) * 6,
          );
          stuckFrames.current = 0;
        }
      } else {
        stuckFrames.current = 0;
      }
      if (!isWalking) setIsWalking(true);
    } else if (isWalking) {
      setIsWalking(false);
    }

    setRenderPos([pos.current.x, 0, pos.current.z]);
    setRenderYaw(yaw.current);
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        selectSim(sim.id);
      }}
    >
      {/* The plumbob rides the Sim, not the group origin. */}
      <group position={renderPos}>
        <Plumbob simId={sim.id} selected={isSelected} />
      </group>
      <Character
        position={renderPos}
        yaw={renderYaw}
        accent={isSelected ? '#fbbf24' : sim.accentColor}
        emoji={sim.avatar}
        name={`${sim.firstName} ${isSelected ? '★' : ''}`}
        gender={sim.gender}
        isWalking={isWalking}
        skinTone={sim.skinTone}
        hairstyle={sim.hairstyle}
        speechBubble={bubble}
      />
    </group>
  );
}

export function LifeSims() {
  const sims = useLifeStore((s) => s.household?.sims);
  if (!sims) return null;
  return (
    <>
      {sims.map((sim, i) => (
        <LifeSim key={sim.id} sim={sim} index={i} />
      ))}
    </>
  );
}

