import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { Player } from './Player';
import type { Housemate } from '../types';

export function GameCanvas({
  onTalk,
  onOpenDiaryRoom = () => {},
}: {
  onTalk: (h: Housemate) => void;
  onOpenDiaryRoom?: () => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [-16, 14, 24], fov: 50, near: 0.5, far: 300 }}
      className="absolute inset-0"
    >
      <Scene onTalk={onTalk} onOpenDiaryRoom={onOpenDiaryRoom} />
      <Player />
    </Canvas>
  );
}
