import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';
import { ROOM_DEFS, getRandomWalkablePointInRoom, moveWithSliding } from './rooms';
import { updateAvatarCollider, removeAvatarCollider } from './collisionStore';
import { playerWorldPos, input } from './input';
import { AMBIENT_CHATTER } from '../data/dialogue';
import { useEmote } from './emoteStore';
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

  // Initial position in open walkable floor space
  const initialPt = getRandomWalkablePointInRoom(room, 0.45);
  const initialPos = new THREE.Vector3(initialPt.x, 0, initialPt.z);

  const pos = useRef<THREE.Vector3>(initialPos);
  const target = useRef<THREE.Vector3>(initialPos.clone());
  const initialYaw = index * 1.25 + Math.PI;
  const yaw = useRef<number>(initialYaw);
  const [renderPos, setRenderPos] = useState<[number, number, number]>([
    initialPos.x,
    0,
    initialPos.z,
  ]);
  const [renderYaw, setRenderYaw] = useState<number>(initialYaw);
  const [isWalking, setIsWalking] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  const nextWanderTime = useRef(4 + Math.random() * 6);
  const nextChatterTime = useRef(6 + Math.random() * 12);
  const bubbleClearTimer = useRef(0);
  const animClearTimer = useRef(0);
  const lastEmoteTime = useRef(0);
  const stuckFrames = useRef(0);
  const [animOverride, setAnimOverride] = useState<
    'idle' | 'walk' | 'dance' | 'celebrate' | 'shock' | 'angry' | 'thumbsup' | null
  >(null);

  useEffect(() => {
    updateAvatarCollider(housemate.id, pos.current.x, pos.current.z, 0.45);
    return () => {
      removeAvatarCollider(housemate.id);
    };
  }, [housemate.id]);

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

    // Emote reaction check
    const currentEmote = useEmote.getState().activeEmote;
    if (currentEmote && currentEmote.timestamp > lastEmoteTime.current) {
      lastEmoteTime.current = currentEmote.timestamp;
      if (distToPlayer < 5.0) {
        let reply = '';
        if (currentEmote.type === 'wave') {
          reply = `Hey! 👋 Nice to see you!`;
          setAnimOverride('celebrate');
        } else if (currentEmote.type === 'hype') {
          reply = `Energy high! 🔥 Let's go!`;
          setAnimOverride('celebrate');
        } else if (currentEmote.type === 'dance') {
          reply = `Oya dance! 💃✨`;
          setAnimOverride('dance');
        } else if (currentEmote.type === 'clapback') {
          reply = `Who are you shouting at?! 🌶️`;
          setAnimOverride('angry');
        } else if (currentEmote.type === 'hug') {
          reply = `Aww, sweet vibes! ❤️`;
          setAnimOverride('celebrate');
        }
        setSpeechBubble(reply);
        bubbleClearTimer.current = time + 4.0;
        animClearTimer.current = time + 3.2;
      }
    }

    if (animOverride && time > animClearTimer.current) {
      setAnimOverride(null);
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
      const pt = getRandomWalkablePointInRoom(room, 0.45);
      target.current.set(pt.x, 0, pt.z);
      stuckFrames.current = 0;
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

    if (!isParty && dist > 0.5) {
      toTarget.normalize();
      const speed = 2.4;
      const prevX = pos.current.x;
      const prevZ = pos.current.z;

      // Predictive movement step with zero penetration and avatar-to-avatar collision
      const step = moveWithSliding(pos.current, toTarget.x * speed * dt, toTarget.z * speed * dt, 0.45, housemate.id);
      pos.current.x = step.x;
      pos.current.z = step.z;
      updateAvatarCollider(housemate.id, pos.current.x, pos.current.z, 0.45);

      yaw.current = Math.atan2(toTarget.x, toTarget.z);

      // Stuck detection: if NPC cannot make forward progress, reroute cleanly
      const moved = Math.hypot(pos.current.x - prevX, pos.current.z - prevZ);
      if (moved < speed * dt * 0.25) {
        stuckFrames.current += 1;
        if (stuckFrames.current > 8) {
          const pt = getRandomWalkablePointInRoom(room, 0.45);
          target.current.set(pt.x, 0, pt.z);
          stuckFrames.current = 0;
        }
      } else {
        stuckFrames.current = 0;
      }

      if (!isWalking) setIsWalking(true);
    } else {
      if (isWalking) setIsWalking(false);
      stuckFrames.current = 0;
      if (isParty) {
        // Face the camera-ish and groove
        yaw.current += dt * 0.5;
      }
    }

    // Sync visual transform occasionally
    setRenderPos([pos.current.x, 0, pos.current.z]);
    setRenderYaw(yaw.current);
  });

  const handleInteract = () => {
    const distToPlayer = Math.hypot(
      pos.current.x - playerWorldPos.x,
      pos.current.z - playerWorldPos.z
    );
    if (distToPlayer <= 4.2) {
      onTalk(housemate);
    }
  };

  return (
    <Character
      position={renderPos}
      yaw={renderYaw}
      accent={housemate.accentColor}
      emoji={housemate.avatar}
      name={housemate.nickname}
      gender={housemate.gender}
      isWalking={isWalking}
      isDancing={isParty}
      animOverride={animOverride}
      isNearby={isNearby}
      speechBubble={speechBubble}
      skinTone={housemate.skinTone}
      hairstyle={housemate.hairstyle}
      onTalk={handleInteract}
    />
  );
}
