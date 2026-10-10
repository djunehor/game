import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store';

// Time-of-day and mood lighting for the Biggie House.
// - Day: bright studio daylight
// - Saturday party: dark night + animated disco lights
// - Sunday eviction: tense dramatic dusk

interface Mood {
  sky: string;
  fog: string;
  ambient: number;
  sunIntensity: number;
  sunColor: string;
  hemisphere: number;
}

function moodFor(phase: string): Mood {
  switch (phase) {
    case 'party':
      return { sky: '#070b1a', fog: '#0a0e22', ambient: 0.45, sunIntensity: 0.25, sunColor: '#7da7ff', hemisphere: 0.2 };
    case 'eviction':
      return { sky: '#241733', fog: '#2a1c38', ambient: 0.5, sunIntensity: 0.5, sunColor: '#ff9e64', hemisphere: 0.25 };
    case 'hoh':
      return { sky: '#8ec9f0', fog: '#a9d4ee', ambient: 0.75, sunIntensity: 1.5, sunColor: '#fff4d6', hemisphere: 0.55 };
    default:
      return { sky: '#a7d4ef', fog: '#bcd9ec', ambient: 0.7, sunIntensity: 1.4, sunColor: '#fff8e1', hemisphere: 0.5 };
  }
}

export function Lighting() {
  const phase = useGame((s) => s.state?.phase ?? 'daily');
  const scene = useThree((s) => s.scene);
  const sun = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const discoA = useRef<THREE.PointLight>(null);
  const discoB = useRef<THREE.PointLight>(null);
  const discoC = useRef<THREE.PointLight>(null);
  const evictionSpot = useRef<THREE.SpotLight>(null);

  const isParty = phase === 'party';
  const isEviction = phase === 'eviction';
  const mood = moodFor(phase);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    scene.background = new THREE.Color(mood.sky);
    if (scene.fog) scene.fog.color = new THREE.Color(mood.fog);

    if (ambient.current) ambient.current.intensity = mood.ambient;
    if (hemi.current) hemi.current.intensity = mood.hemisphere;
    if (sun.current) {
      sun.current.intensity = mood.sunIntensity;
      sun.current.color.set(mood.sunColor);
    }

    // Animated disco lights only during the party
    const showDisco = isParty;
    if (discoA.current) {
      discoA.current.intensity = showDisco ? 12 : 0;
      discoA.current.color.setHSL((t * 0.7) % 1, 1, 0.5);
    }
    if (discoB.current) {
      discoB.current.intensity = showDisco ? 12 : 0;
      discoB.current.color.setHSL((t * 0.7 + 0.33) % 1, 1, 0.5);
    }
    if (discoC.current) {
      discoC.current.intensity = showDisco ? 12 : 0;
      discoC.current.color.setHSL((t * 0.7 + 0.66) % 1, 1, 0.5);
    }

    // Sweeping eviction spotlight over the lounge
    if (evictionSpot.current) {
      evictionSpot.current.intensity = isEviction ? 30 : 0;
      if (isEviction) {
        const sweep = Math.sin(t * 0.7) * 6;
        evictionSpot.current.target.position.set(-16 + sweep, 0, 4);
        evictionSpot.current.target.updateMatrixWorld();
      }
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={mood.ambient} />
      <hemisphereLight ref={hemi} args={['#dbeafe', '#78716c', mood.hemisphere]} />
      <directionalLight
        ref={sun}
        position={[30, 48, 22]}
        intensity={mood.sunIntensity}
        color={mood.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-far={160}
      />

      {/* Disco ball lights (visible only during party) */}
      <pointLight ref={discoA} position={[-16, 5, 4]} distance={18} decay={2} intensity={0} />
      <pointLight ref={discoB} position={[2, 5, 4]} distance={18} decay={2} intensity={0} />
      <pointLight ref={discoC} position={[24, 5, 4]} distance={20} decay={2} intensity={0} />

      {/* Eviction spotlight sweeping the lounge on Sunday night */}
      <spotLight
        ref={evictionSpot}
        position={[-16, 9, 10]}
        angle={0.4}
        penumbra={0.6}
        intensity={0}
        distance={40}
        color="#ffffff"
        castShadow
      />
    </>
  );
}
