import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHohChallenge } from './hohStore';
import { playerWorldPos } from './input';
import { useGame } from '../store';
import { sound } from '../engine/sound';

const DURATION = 40; // seconds
const PICKUP_RADIUS = 1.4;

// Glowing collectible rings scattered across the Arena.
const BEACON_SPOTS: [number, number][] = [
  [0, 16],
  [4, 18],
  [2, 21],
  [-2, 19],
  [4, 15],
  [-3, 21],
];

export function HohChallenge() {
  const phase = useGame((s) => s.state?.phase);
  const phaseDone = useGame((s) => s.state?.phaseDone);
  const onboardingDone = useGame((s) => s.state?.onboardingDone);
  const active = phase === 'hoh' && !phaseDone && onboardingDone !== false;

  const collected = useRef(new Set<number>());
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const timeRef = useRef(DURATION);

  // Reset when the challenge (re)activates
  useEffect(() => {
    if (active) {
      collected.current = new Set();
      timeRef.current = DURATION;
      useHohChallenge.setState({ active: true, timeLeft: DURATION, collected: 0, total: BEACON_SPOTS.length, finished: false });
    } else {
      useHohChallenge.setState({ active: false, finished: false });
    }
  }, [active]);

  const beacons = useMemo(() => BEACON_SPOTS, []);

  useFrame((_, delta) => {
    if (!active) return;
    const store = useHohChallenge.getState();
    if (store.finished) return;

    const dt = Math.min(delta, 0.05);
    timeRef.current -= dt;

    // Pickup detection
    for (let i = 0; i < beacons.length; i++) {
      if (collected.current.has(i)) continue;
      const [bx, bz] = beacons[i];
      const dist = Math.hypot(playerWorldPos.x - bx, playerWorldPos.z - bz);
      if (dist < PICKUP_RADIUS) {
        collected.current.add(i);
        sound.playRewardChime();
      }
    }

    const count = collected.current.size;
    const timeLeft = Math.max(0, Math.round(timeRef.current));

    useHohChallenge.setState({ timeLeft, collected: count, total: beacons.length });

    // Animate the rings (bob + spin)
    for (let i = 0; i < groupRefs.current.length; i++) {
      const g = groupRefs.current[i];
      if (g) {
        g.rotation.y += dt * 1.5;
        g.position.y = 1.2 + Math.sin(performance.now() / 400 + i) * 0.25;
      }
    }

    // Finish when all collected or time runs out
    if (count >= beacons.length || timeLeft <= 0) {
      useHohChallenge.setState({ finished: true, collected: count, timeLeft, total: beacons.length });
      const game = useGame.getState();
      game.submitHoH(count);
    }
  });

  if (!active) return null;

  return (
    <>
      {beacons.map(([x, z], i) => {
        const isCollected = collected.current.has(i);
        return (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
            position={[x, 1.2, z]}
          >
            {!isCollected ? (
              <>
                <mesh castShadow>
                  <torusGeometry args={[0.8, 0.12, 12, 32]} />
                  <meshStandardMaterial
                    color="#fbbf24"
                    emissive="#f59e0b"
                    emissiveIntensity={1.4}
                    roughness={0.2}
                    metalness={0.4}
                  />
                </mesh>
                {/* Glow core */}
                <mesh>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshBasicMaterial color="#fff7c2" />
                </mesh>
                {/* Tall sky beam to guide player from afar */}
                <mesh position={[0, 5, 0]}>
                  <cylinderGeometry args={[0.08, 0.12, 10, 8]} />
                  <meshBasicMaterial color="#fef08a" transparent opacity={0.35} />
                </mesh>
                {/* Ground marker */}
                <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[1.2, 24]} />
                  <meshBasicMaterial color="#fbbf24" transparent opacity={0.35} />
                </mesh>
              </>
            ) : (
              <mesh>
                <sphereGeometry args={[0.15, 12, 12]} />
                <meshStandardMaterial color="#22b573" emissive="#16a34a" emissiveIntensity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}
