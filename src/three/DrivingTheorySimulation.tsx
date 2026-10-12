import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheoryExamStore } from '../world/theoryExamStore';
import { DRIVING_THEORY_SCENARIOS } from '../data/drivingTheoryScenarios';

export function DrivingTheorySimulation() {
  const currentScenarioId =
    useTheoryExamStore((s) => s.currentScenarioId) ??
    useTheoryExamStore.getState().currentScenarioId;
  const playbackTime =
    useTheoryExamStore((s) => s.playbackTime) ?? useTheoryExamStore.getState().playbackTime;
  const isPlaying =
    useTheoryExamStore((s) => s.isPlaying) ?? useTheoryExamStore.getState().isPlaying;
  const cameraMode =
    useTheoryExamStore((s) => s.cameraMode) ?? useTheoryExamStore.getState().cameraMode;
  const tick = useTheoryExamStore((s) => s.tick);

  const scenario =
    DRIVING_THEORY_SCENARIOS.find((s) => s.id === currentScenarioId) ??
    DRIVING_THEORY_SCENARIOS[0];

  const ownCarGroup = useRef<THREE.Group>(null);
  const actor1Group = useRef<THREE.Group>(null);
  const actor2Group = useRef<THREE.Group>(null);

  // Animate simulation loop
  useFrame((_, delta) => {
    if (isPlaying) {
      tick(delta);
    }

    const t = playbackTime;
    const progress = Math.min(1, t / scenario.durationSeconds);

    // 1. Own Vehicle Progress
    if (ownCarGroup.current) {
      // Moves along Z axis towards intersection at Z = 0
      const startZ = 45;
      const endZ = currentScenarioId === 'bus_warnblinklicht' ? 12 : 4;
      const currentZ = THREE.MathUtils.lerp(startZ, endZ, progress);
      ownCarGroup.current.position.set(0, 0, currentZ);

      // Turning right motion in cyclist scenario
      if (currentScenarioId === 'radfahrer_abwaerts' && progress > 0.65) {
        const turnAngle = THREE.MathUtils.lerp(0, -Math.PI / 6, (progress - 0.65) / 0.35);
        ownCarGroup.current.rotation.y = turnAngle;
      } else {
        ownCarGroup.current.rotation.y = 0;
      }
    }

    // 2. Scenario-specific traffic actors
    if (currentScenarioId === 'rechts_vor_links') {
      // Actor 1: Blue Car approaching from the right (X = 35 -> X = 6, Z = 0)
      if (actor1Group.current) {
        const actorProgress = Math.min(1, Math.max(0, (t - 2.5) / 6.0));
        const posX = THREE.MathUtils.lerp(35, 6, actorProgress);
        actor1Group.current.position.set(posX, 0, 0);
        actor1Group.current.rotation.y = -Math.PI / 2; // Facing left
      }
      // Actor 2: Green Car approaching from the left (X = -35 -> X = -8, Z = 0)
      if (actor2Group.current) {
        const actor2Progress = Math.min(1, Math.max(0, (t - 4.0) / 4.5));
        const posX = THREE.MathUtils.lerp(-35, -8, actor2Progress);
        actor2Group.current.position.set(posX, 0, 0);
        actor2Group.current.rotation.y = Math.PI / 2; // Facing right
      }
    } else if (currentScenarioId === 'radfahrer_abwaerts') {
      // Actor 1: Cyclist in right parallel bike lane (X = 3.6)
      if (actor1Group.current) {
        const bikeProgress = Math.min(1, t / scenario.durationSeconds);
        const bikeZ = THREE.MathUtils.lerp(35, 3, bikeProgress);
        actor1Group.current.position.set(3.6, 0, bikeZ);
        actor1Group.current.rotation.y = 0;
      }
    } else if (currentScenarioId === 'bus_warnblinklicht') {
      // Actor 1: Stationary Transit Bus at right curb (X = 3.2, Z = 4)
      if (actor1Group.current) {
        actor1Group.current.position.set(3.4, 0, 4);
        actor1Group.current.rotation.y = 0;
      }
      // Actor 2: Pedestrian crossing ahead of bus (X = 4 -> X = 0, Z = -1)
      if (actor2Group.current) {
        const pedProgress = Math.min(1, Math.max(0, (t - 4.5) / 3.5));
        const pedX = THREE.MathUtils.lerp(4.5, 1.2, pedProgress);
        actor2Group.current.position.set(pedX, 0, -1);
        actor2Group.current.rotation.y = -Math.PI / 2;
      }
    }
  });

  return (
    <group>
      {/* Daylight Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[15, 25, 20]} intensity={1.5} castShadow />

      {/* Camera View Anchor depending on cameraMode */}
      <group position={[0, 0, 0]}>
        {/* Environment: Ground, Roads, Sidewalks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#2d5a27" /> {/* Grass verge */}
        </mesh>

        {/* Main North-South Asphalt Road */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[7, 120]} />
          <meshStandardMaterial color="#1e242c" roughness={0.8} />
        </mesh>

        {/* Crossroad (East-West road for intersections) */}
        {currentScenarioId === 'rechts_vor_links' && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[120, 7]} />
            <meshStandardMaterial color="#1e242c" roughness={0.8} />
          </mesh>
        )}

        {/* Bike Lane on Right (Cyclist Scenario) */}
        {currentScenarioId === 'radfahrer_abwaerts' && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.6, 0.02, 0]}>
            <planeGeometry args={[1.5, 120]} />
            <meshStandardMaterial color="#881337" roughness={0.6} /> {/* Red asphalt bike path */}
          </mesh>
        )}

        {/* Road Markings (Dashed white center line) */}
        {[-30, -20, -10, 10, 20, 30, 40].map((z) => (
          <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, z]}>
            <planeGeometry args={[0.2, 4]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}

        {/* Sidewalk Curbs */}
        <mesh position={[-4.2, 0.1, 0]}>
          <boxGeometry args={[1.4, 0.2, 120]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[currentScenarioId === 'radfahrer_abwaerts' ? 5.2 : 4.2, 0.1, 0]}>
          <boxGeometry args={[1.4, 0.2, 120]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>

        {/* Surrounding German Town Buildings */}
        {[-35, -20, -5, 10, 25, 40].map((z, i) => (
          <group key={`bldg-left-${i}`}>
            <mesh position={[-12, 4, z]}>
              <boxGeometry args={[10, 8, 12]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#cbd5e1' : '#f1f5f9'} />
            </mesh>
            {/* Gabled roof */}
            <mesh position={[-12, 9, z]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[5, 5, 12]} />
              <meshStandardMaterial color="#991b1b" />
            </mesh>
          </group>
        ))}

        {[-35, -20, -5, 10, 25, 40].map((z, i) => (
          <group key={`bldg-right-${i}`}>
            <mesh position={[12, 4, z]}>
              <boxGeometry args={[10, 8, 12]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#e2e8f0' : '#dbeafe'} />
            </mesh>
            <mesh position={[12, 9, z]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[5, 5, 12]} />
              <meshStandardMaterial color="#7c2d12" />
            </mesh>
          </group>
        ))}

        {/* Pedestrian Crossing Stripes for Bus / Hazard Scenario */}
        {currentScenarioId === 'bus_warnblinklicht' && (
          <group position={[0, 0.04, -1]}>
            {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x) => (
              <mesh key={`zebra-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]}>
                <planeGeometry args={[0.5, 3]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        )}

        {/* Traffic Sign: Zone 30 or Bus Stop */}
        <group position={[currentScenarioId === 'radfahrer_abwaerts' ? 4.8 : 3.8, 0, 30]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 3]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
          <mesh position={[0, 2.8, 0]}>
            <boxGeometry args={[0.7, 0.7, 0.05]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          {/* Red circle border for German Zone 30 sign */}
          <mesh position={[0, 2.8, 0.03]}>
            <ringGeometry args={[0.25, 0.3, 32]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      </group>

      {/* 1. Own Vehicle (The Driver's Car) */}
      <group ref={ownCarGroup} position={[0, 0, 45]}>
        {/* Car Chassis */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.9, 0.8, 4.2]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Cabin Glass & Roof */}
        <mesh position={[0, 1.25, -0.3]}>
          <boxGeometry args={[1.6, 0.65, 2.3]} />
          <meshStandardMaterial color="#0f172a" transparent opacity={0.65} />
        </mesh>
        {/* Wheels */}
        {[-0.95, 0.95].map((x) =>
          [-1.3, 1.3].map((z) => (
            <mesh
              key={`wheel-${x}-${z}`}
              position={[x, 0.35, z]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.35, 0.35, 0.25, 24]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          ))
        )}

        {/* Cockpit Interior Overlay Geometry (Rendered when inside cockpit) */}
        {cameraMode === 'cockpit' && (
          <group position={[0, 0.9, -0.1]}>
            {/* Dashboard Arc */}
            <mesh position={[0, 0.05, -0.7]}>
              <boxGeometry args={[1.7, 0.3, 0.5]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
            {/* Steering Wheel */}
            <group position={[-0.45, 0.22, -0.55]} rotation={[-Math.PI / 5, 0, 0]}>
              <mesh>
                <torusGeometry args={[0.2, 0.025, 16, 32]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
            </group>
            {/* Center Rearview Mirror (Rückspiegel) */}
            <mesh position={[0, 0.55, -0.65]}>
              <boxGeometry args={[0.42, 0.12, 0.04]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Right Side Mirror (Außenspiegel) */}
            <mesh position={[0.98, 0.25, -0.6]}>
              <boxGeometry args={[0.2, 0.12, 0.04]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Left Side Mirror */}
            <mesh position={[-0.98, 0.25, -0.6]}>
              <boxGeometry args={[0.2, 0.12, 0.04]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )}
      </group>

      {/* 2. Primary Traffic Actor (Blue Car / Cyclist / Bus) */}
      <group ref={actor1Group} position={[30, 0, 0]}>
        {currentScenarioId === 'rechts_vor_links' && (
          /* Blue Car from the Right */
          <group>
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[1.9, 0.8, 4.0]} />
              <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.25, -0.2]}>
              <boxGeometry args={[1.6, 0.6, 2.2]} />
              <meshStandardMaterial color="#0f172a" transparent opacity={0.65} />
            </mesh>
            {/* Headlights */}
            <mesh position={[-0.7, 0.6, -2.01]}>
              <boxGeometry args={[0.3, 0.15, 0.05]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0.7, 0.6, -2.01]}>
              <boxGeometry args={[0.3, 0.15, 0.05]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}

        {currentScenarioId === 'radfahrer_abwaerts' && (
          /* Bicycle and Cyclist */
          <group position={[0, 0, 0]}>
            {/* Bike Wheels */}
            <mesh position={[0, 0.35, -0.6]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0.35, 0.6]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* Diamond Bike Frame */}
            <mesh position={[0, 0.55, 0]}>
              <boxGeometry args={[0.08, 0.35, 1.0]} />
              <meshStandardMaterial color="#16a34a" />
            </mesh>
            {/* Cyclist Torso & Helmet */}
            <mesh position={[0, 1.15, -0.1]}>
              <boxGeometry args={[0.35, 0.55, 0.3]} />
              <meshStandardMaterial color="#ea580c" />
            </mesh>
            <mesh position={[0, 1.55, -0.1]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#eab308" /> {/* Yellow Safety Helmet */}
            </mesh>
          </group>
        )}

        {currentScenarioId === 'bus_warnblinklicht' && (
          /* Public Transit Bus with Hazard Lights */
          <group position={[0, 0, 0]}>
            {/* Bus Body */}
            <mesh position={[0, 1.4, 0]}>
              <boxGeometry args={[2.5, 2.4, 9.5]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} /> {/* Yellow BVG/Standard city bus */}
            </mesh>
            {/* Windows Stripe */}
            <mesh position={[0, 1.8, 0]}>
              <boxGeometry args={[2.55, 0.8, 9.2]} />
              <meshStandardMaterial color="#0f172a" transparent opacity={0.7} />
            </mesh>
            {/* Blinking Hazard Lights (Orange) */}
            <mesh position={[-1.28, 1.0, 4.76]}>
              <boxGeometry args={[0.2, 0.2, 0.08]} />
              <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[1.28, 1.0, 4.76]}>
              <boxGeometry args={[0.2, 0.2, 0.08]} />
              <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.5} />
            </mesh>
          </group>
        )}
      </group>

      {/* 3. Secondary Traffic Actor (Green Car / Pedestrian) */}
      <group ref={actor2Group} position={[-30, 0, 0]}>
        {currentScenarioId === 'rechts_vor_links' && (
          /* Green Car from Left */
          <group>
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[1.9, 0.8, 4.0]} />
              <meshStandardMaterial color="#16a34a" metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.25, -0.2]}>
              <boxGeometry args={[1.6, 0.6, 2.2]} />
              <meshStandardMaterial color="#0f172a" transparent opacity={0.65} />
            </mesh>
          </group>
        )}

        {currentScenarioId === 'bus_warnblinklicht' && (
          /* Pedestrian crossing near bus front bumper */
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 1.0]} />
              <meshStandardMaterial color="#3b82f6" />
            </mesh>
            <mesh position={[0, 1.55, 0]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#fed7aa" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}
