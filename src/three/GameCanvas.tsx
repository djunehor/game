import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './Scene';
import { Player } from './Player';

export function GameCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      camera={{ position: [-11, 20, 26], fov: 50, near: 0.5, far: 800 }}
      className="absolute inset-0"
    >
      <Suspense fallback={null}>
        <Scene />
        <Player />
      </Suspense>
    </Canvas>
  );
}
