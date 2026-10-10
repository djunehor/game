import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';
import { ROOM_DEFS, collideWalls } from './rooms';
import { playerWorldPos, input } from './input';
import { AMBIENT_CHATTER } from '../data/dialogue';
import { useGame } from '../store';
import type { Housemate } from '../types';

export function LivingNPC({
  housemate,
  index,
  onTalk,
}: {
  housemate: Housemate;
  index: number;
  onTalk: (h: Housemate) => void;
}) {
  const room =
    ROOM_DEFS.find((r) => r.id === (housemate.currentRoom ?? 'Lounge')) ?? ROOM_DEFS[1];
  const isParty = useGame((s) => s.state?.phase === 'party');

  // Initial position distributed in room
  const initialOffsetAngle = index * 1.25;
  const initialPos = new THREE.Vector3(
    room.center[0] + Math.cos(initialOffsetAngle) * 3.2,
    0,
    room.center[1] + Math.sin(initialOffsetAngle) * 3.2
  );

  const pos = useRef<THREE.Vector3>(initialPos);
  const target = useRef<THREE.Vector3>(initialPos.clone());
  const yaw = useRef<number>(initialOffsetAngle + Math.PI);
  const [renderPos, setRenderPos] = useState<[number, number, number]>([
    initialPos.x,
    0,
    initialPos.z,
  ]);
  const [renderYaw, setRenderYaw] = useState<number>(initialOffsetAngle + Math.PI);
  const [isWalking, setIsWalking] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  const nextWanderTime = useRef(4 + Math.random() * 6);
  const nextChatterTime = useRef(6 + Math.random() * 12);
  const bubbleClearTimer = useRef(0);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    // Proximity check with player
    const distToPlayer = Math.hypot(
      pos.current.x - playerWorldPos.x,
      pos.current.z - playerWorldPos.z
    );
    const nearby = distToPlayer < 3.2;
    if (nearby !== isNearby) {
      setIsNearby(nearby);
    }

    // If player presses KeyE or KeyF while nearby, trigger talk
    if (nearby && (input.keys.KeyF || (input.keys.KeyE && !input.keys.KeyW && !input.keys.KeyS))) {
      input.keys.KeyE = false;
      input.keys.KeyF = false;
      onTalk(housemate);
    }

    // Autonomous wandering decision (skip during party — everyone dances)
    if (!isParty && time > nextWanderTime.current) {
      nextWanderTime.current = time + 7 + Math.random() * 9;
      // Pick random point in room bounds
      const hw = Math.max(2, room.size[0] / 2 - 1.8);
      const hd = Math.max(2, room.size[1] / 2 - 1.8);
      target.current.set(
        room.center[0] + (Math.random() * 2 - 1) * hw,
        0,
        room.center[1] + (Math.random() * 2 - 1) * hd
      );
    }

    // Ambient chatter decision
    if (time > nextChatterTime.current) {
      nextChatterTime.current = time + 14 + Math.random() * 18;
      const line = AMBIENT_CHATTER[Math.floor(Math.random() * AMBIENT_CHATTER.length)];
      setSpeechBubble(line);
      bubbleClearTimer.current = time + 4.5;
    }

    if (speechBubble && time > bubbleClearTimer.current) {
      setSpeechBubble(null);
    }

    // Move towards target (only when not dancing)
    const toTarget = target.current.clone().sub(pos.current);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (!isParty && dist > 0.4) {
      toTarget.normalize();
      const speed = 2.8;
      pos.current.addScaledVector(toTarget, speed * dt);
      collideWalls(pos.current, 0.4);
      yaw.current = Math.atan2(toTarget.x, toTarget.z);

      if (!isWalking) setIsWalking(true);
    } else {
      if (isWalking) setIsWalking(false);
      if (isParty) {
        // Face the camera-ish and groove
        yaw.current += dt * 0.5;
      }
    }

    // Sync visual transform occasionally
    setRenderPos([pos.current.x, 0, pos.current.z]);
    setRenderYaw(yaw.current);
  });

  return (
    <Character
      position={renderPos}
      yaw={renderYaw}
      accent={housemate.accentColor}
      emoji={housemate.avatar}
      name={housemate.nickname}
      isWalking={isWalking}
      isDancing={isParty}
      isNearby={isNearby}
      speechBubble={speechBubble}
      skinTone={housemate.skinTone}
      hairstyle={housemate.hairstyle}
      onTalk={() => onTalk(housemate)}
    />
  );
}
