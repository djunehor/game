import { useNet } from '../engine/net';
import { Character } from './Character';
import { ROOM_DEFS } from './rooms';
import type { Housemate } from '../types';

// A live human housemate (another player in your house), positioned by the
// multiplayer server's movement broadcasts.
export function RemotePlayer({ housemate }: { housemate: Housemate }) {
  const pos = useNet((s) => s.remotePlayers[housemate.id]);
  const room = ROOM_DEFS.find((r) => r.id === (pos?.room ?? housemate.currentRoom)) ?? ROOM_DEFS[1];

  const x = pos?.x ?? room.center[0];
  const z = pos?.z ?? room.center[1];

  return (
    <Character
      position={[x, 0, z]}
      yaw={0}
      accent={housemate.accentColor}
      emoji={housemate.avatar}
      name={housemate.nickname}
      skinTone={housemate.skinTone}
      hairstyle={housemate.hairstyle}
    />
  );
}
