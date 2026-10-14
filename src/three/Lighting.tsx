import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { clockParts } from '../sim/time';
import { useSimStore } from '../sim/simStore';

// A real day/night cycle driven by the simulation clock.

interface Mood {
  sky: string;
  fog: string;
  ambient: number;
  sunIntensity: number;
  sunColor: string;
  hemisphere: number;
}

function moodForHour(hour: number): Mood {
  if (hour >= 5 && hour < 7) {
    return { sky: '#f0b27a', fog: '#f3c69b', ambient: 0.5, sunIntensity: 0.9, sunColor: '#ffca85', hemisphere: 0.4 };
  }
  if (hour >= 7 && hour < 17) {
    return { sky: '#a7d4ef', fog: '#bcd9ec', ambient: 0.72, sunIntensity: 1.45, sunColor: '#fff8e1', hemisphere: 0.52 };
  }
  if (hour >= 17 && hour < 19) {
    return { sky: '#e98b5a', fog: '#d98f68', ambient: 0.55, sunIntensity: 0.85, sunColor: '#ff9e5e', hemisphere: 0.38 };
  }
  if (hour >= 19 && hour < 21) {
    return { sky: '#2c3e63', fog: '#33456b', ambient: 0.42, sunIntensity: 0.28, sunColor: '#8fb2ff', hemisphere: 0.28 };
  }
  return { sky: '#050912', fog: '#0a1020', ambient: 0.26, sunIntensity: 0.07, sunColor: '#4f6ecb', hemisphere: 0.16 };
}

export function Lighting() {
  const hour = useSimStore((s) => clockParts(s.clock).hour);
  const scene = useThree((s) => s.scene);
  const sun = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const mood = moodForHour(hour);

  useFrame(() => {
    scene.background = new THREE.Color(mood.sky);
    if (scene.fog) scene.fog.color = new THREE.Color(mood.fog);
    if (ambient.current) ambient.current.intensity = mood.ambient;
    if (hemi.current) hemi.current.intensity = mood.hemisphere;
    if (sun.current) {
      sun.current.intensity = mood.sunIntensity;
      sun.current.color.set(mood.sunColor);
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
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-far={160}
      />
    </>
  );
}
