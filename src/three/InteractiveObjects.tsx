import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { playerWorldPos, setTarget } from './input';
import { useGame } from '../store';
import { useTour } from './tourStore';
import { sound } from '../engine/sound';
import { useToast } from '../engine/toastStore';
import { ROOM_ACTIONS } from '../engine/actions';
import type { Room } from '../types';

export interface InteractiveStation {
  id: string;
  room: Room;
  name: string;
  emoji: string;
  pos: [number, number, number];
  actionKey?: string;
  isDiaryRoom?: boolean;
  requiresHoH?: boolean;
}

export const STATIONS: InteractiveStation[] = [
  // --------------------------- LOUNGE ---------------------------
  {
    id: 'lounge_table',
    room: 'Lounge',
    name: 'Play Ludo',
    emoji: '🎲',
    pos: [-10, 0.6, 4.8],
    actionKey: 'play_ludo',
  },
  {
    id: 'lounge_ayo',
    room: 'Lounge',
    name: 'Play Ayo Olopon',
    emoji: '🪵',
    pos: [-8.8, 0.6, 4.6],
    actionKey: 'play_ayo',
  },
  {
    id: 'lounge_tv',
    room: 'Lounge',
    name: 'Watch TV',
    emoji: '📺',
    pos: [-10, 1.2, 10.5],
    actionKey: 'watch_tv',
  },
  {
    id: 'lounge_spin_bottle',
    room: 'Lounge',
    name: 'Truth or Dare',
    emoji: '🍾',
    pos: [-10, 0.5, 2.2],
    actionKey: 'spin_bottle',
  },
  {
    id: 'lounge_meeting',
    room: 'Lounge',
    name: 'House Meeting',
    emoji: '📢',
    pos: [-10, 0.6, 6.2],
    actionKey: 'house_meeting',
  },
  {
    id: 'lounge_wager',
    room: 'Lounge',
    name: 'Wager Rehearsal',
    emoji: '🎭',
    pos: [-7, 0.5, 8.0],
    actionKey: 'wager_rehearsal',
  },
  {
    id: 'lounge_snuggle',
    room: 'Lounge',
    name: 'Sofa Courting',
    emoji: '🥰',
    pos: [-13.5, 0.6, 3.5],
    actionKey: 'sofa_snuggle',
  },
  {
    id: 'lounge_callout',
    room: 'Lounge',
    name: 'Full Chest Callout',
    emoji: '🤬',
    pos: [-6.5, 0.6, 3.5],
    actionKey: 'full_chest_callout',
  },
  {
    id: 'lounge_phone',
    room: 'Lounge',
    name: 'Redial Phone',
    emoji: '☎️',
    pos: [-4.5, 1.0, 6.0],
    actionKey: 'redial_phone',
  },
  {
    id: 'lounge_ebuka',
    room: 'Lounge',
    name: 'Table Shaking',
    emoji: '🪑',
    pos: [-10, 1.2, 8.8],
    actionKey: 'ebuka_table_shake',
  },
  {
    id: 'lounge_freeze',
    room: 'Lounge',
    name: 'Housemates FREEZE!',
    emoji: '🧊',
    pos: [-10, 0.6, 0.5],
    actionKey: 'housemates_freeze',
  },
  {
    id: 'lounge_envelope',
    room: 'Lounge',
    name: 'Black Envelope Hunt',
    emoji: '✉️',
    pos: [-13.5, 0.6, 1.5],
    actionKey: 'black_envelope_hunt',
  },
  {
    id: 'lounge_eviction_exit',
    room: 'Lounge',
    name: 'Eviction Walkout',
    emoji: '🚪',
    pos: [-3.0, 1.0, -3.0],
    actionKey: 'eviction_walkout',
  },

  // --------------------------- KITCHEN & DINING ---------------------------
  {
    id: 'kitchen_stove',
    room: 'Kitchen',
    name: 'Cook Jollof',
    emoji: '🍲',
    pos: [-10, 0.9, -14.5],
    actionKey: 'cook_jollof',
  },
  {
    id: 'kitchen_fridge',
    room: 'Kitchen',
    name: 'Midnight Snack',
    emoji: '🥪',
    pos: [-14.5, 1.2, -15.5],
    actionKey: 'midnight_chop',
  },
  {
    id: 'kitchen_sink',
    room: 'Kitchen',
    name: 'Wash Dishes',
    emoji: '🧼',
    pos: [-7.5, 0.9, -14.5],
    actionKey: 'wash_dishes',
  },
  {
    id: 'kitchen_meat',
    room: 'Kitchen',
    name: 'Steal Meat',
    emoji: '🥩',
    pos: [-11.5, 1.0, -11.0],
    actionKey: 'steal_meat',
  },
  {
    id: 'kitchen_coffee',
    room: 'Kitchen',
    name: 'Brew Coffee',
    emoji: '☕',
    pos: [-8.5, 1.0, -11.0],
    actionKey: 'brew_coffee',
  },
  {
    id: 'kitchen_dining',
    room: 'Kitchen',
    name: 'Share Meal',
    emoji: '🤝',
    pos: [-10, 0.6, -8.0],
    actionKey: 'share_meal',
  },
  {
    id: 'kitchen_noodles',
    room: 'Kitchen',
    name: 'Quick Noodles',
    emoji: '🍜',
    pos: [-12.5, 1.0, -14.5],
    actionKey: 'quick_noodles',
  },

  // --------------------------- STORE ROOM / PANTRY ---------------------------
  {
    id: 'pantry_rush',
    room: 'Kitchen',
    name: 'Pantry Rush',
    emoji: '📦',
    pos: [-16.0, 1.0, -8.0],
    actionKey: 'pantry_rush',
  },
  {
    id: 'pantry_props',
    room: 'Kitchen',
    name: 'Task Prop Chest',
    emoji: '🧰',
    pos: [-16.0, 0.6, -6.0],
    actionKey: 'task_prop_chest',
  },
  {
    id: 'pantry_stash',
    room: 'Kitchen',
    name: 'Hide Food Stash',
    emoji: '🤫',
    pos: [-16.5, 0.6, -10.0],
    actionKey: 'pantry_stash',
  },

  // --------------------------- BEDROOM ---------------------------
  {
    id: 'bedroom_bed',
    room: 'Bedroom',
    name: 'Power Nap',
    emoji: '😴',
    pos: [-9, 0.8, 18],
    actionKey: 'power_nap',
  },
  {
    id: 'bedroom_mirror',
    room: 'Bedroom',
    name: 'Mirror Slay',
    emoji: '💅🏾',
    pos: [-6, 1.2, 22],
    actionKey: 'mirror_slay',
  },
  {
    id: 'bedroom_duvet',
    room: 'Bedroom',
    name: 'Duvet Whispers',
    emoji: '🛌',
    pos: [-3, 0.8, 18],
    actionKey: 'duvet_whisper',
  },
  {
    id: 'bedroom_wardrobe',
    room: 'Bedroom',
    name: 'Wardrobe Change',
    emoji: '👗',
    pos: [-12, 1.0, 16],
    actionKey: 'wardrobe_change',
  },
  {
    id: 'bedroom_suitcase',
    room: 'Bedroom',
    name: 'Pack Suitcase',
    emoji: '🧳',
    pos: [-3, 0.5, 21],
    actionKey: 'pack_suitcase',
  },
  {
    id: 'bedroom_hair',
    room: 'Bedroom',
    name: 'Hair Braiding',
    emoji: '💈',
    pos: [-8, 0.8, 21],
    actionKey: 'hair_styling',
  },
  {
    id: 'bedroom_pillow',
    room: 'Bedroom',
    name: 'Pillow Fight',
    emoji: '🪶',
    pos: [-6, 0.8, 16],
    actionKey: 'pillow_fight',
  },

  // --------------------------- BATHROOM & POWDER ROOM ---------------------------
  {
    id: 'bathroom_shower',
    room: 'Bedroom',
    name: 'Hot Shower',
    emoji: '🚿',
    pos: [-12, 1.0, 22],
    actionKey: 'hot_shower',
  },
  {
    id: 'bathroom_vanity',
    room: 'Bedroom',
    name: 'Vanity Gossip',
    emoji: '💄',
    pos: [-9.5, 1.0, 23],
    actionKey: 'vanity_gossip',
  },
  {
    id: 'bathroom_romance',
    room: 'Bedroom',
    name: 'Shower Romance',
    emoji: '🧖',
    pos: [-12, 1.0, 19.5],
    actionKey: 'shower_romance',
  },

  // --------------------------- DIARY ROOM ---------------------------
  {
    id: 'diary_chair',
    room: 'Diary Room',
    name: 'Confess to Biggie',
    emoji: '🎙️',
    pos: [-20, 0.8, 17.5],
    isDiaryRoom: true,
  },
  {
    id: 'diary_nominate',
    room: 'Diary Room',
    name: 'Nominations Ritual',
    emoji: '🗳️',
    pos: [-17.5, 0.8, 20.0],
    actionKey: 'diary_nominate',
  },
  {
    id: 'diary_secret_task',
    room: 'Diary Room',
    name: 'Accept Secret Task',
    emoji: '🕵️',
    pos: [-22.0, 0.8, 20.0],
    actionKey: 'secret_task',
  },
  {
    id: 'diary_strike_appeal',
    room: 'Diary Room',
    name: 'Strike Appeal',
    emoji: '🙏',
    pos: [-20.0, 0.8, 20.5],
    actionKey: 'strike_appeal',
  },
  {
    id: 'diary_complaint',
    room: 'Diary Room',
    name: 'Report Violation',
    emoji: '📝',
    pos: [-23.5, 0.8, 18.0],
    actionKey: 'lodge_complaint',
  },

  // --------------------------- HOH SUITE ---------------------------
  {
    id: 'hoh_bed',
    room: 'HoH Suite',
    name: 'HoH Luxury',
    emoji: '👑',
    pos: [16, 0.8, -23],
    actionKey: 'luxuriate',
    requiresHoH: true,
  },
  {
    id: 'hoh_surveillance',
    room: 'HoH Suite',
    name: 'Surveillance Monitors',
    emoji: '🖥️',
    pos: [20, 1.0, -23],
    actionKey: 'surveillance_spy',
    requiresHoH: true,
  },
  {
    id: 'hoh_jacuzzi',
    room: 'HoH Suite',
    name: 'VIP Jacuzzi',
    emoji: '🛁',
    pos: [12, 0.5, -18],
    actionKey: 'hoh_jacuzzi',
    requiresHoH: true,
  },
  {
    id: 'hoh_guest',
    room: 'HoH Suite',
    name: 'Invite VIP Guest',
    emoji: '🤝',
    pos: [14, 0.8, -18],
    actionKey: 'invite_vip_guest',
    requiresHoH: true,
  },
  {
    id: 'hoh_veto',
    room: 'HoH Suite',
    name: 'Save & Replace Veto',
    emoji: '⚡',
    pos: [19.5, 0.8, -18],
    actionKey: 'veto_power',
    requiresHoH: true,
  },

  // --------------------------- GARDEN ---------------------------
  {
    id: 'garden_pool',
    room: 'Garden',
    name: 'Pool Chill',
    emoji: '🏊',
    pos: [16, 0.4, -2],
    actionKey: 'pool_chill',
  },
  {
    id: 'garden_gym',
    room: 'Garden',
    name: 'Work Out',
    emoji: '💪',
    pos: [20, 0.8, 8],
    actionKey: 'exercise',
  },
  {
    id: 'garden_suya',
    room: 'Garden',
    name: 'Grill Suya',
    emoji: '🍢',
    pos: [10, 0.6, -10],
    actionKey: 'grill_suya',
  },
  {
    id: 'garden_dj',
    room: 'Garden',
    name: 'DJ Booth Dance',
    emoji: '🎧',
    pos: [20, 1.0, -10],
    actionKey: 'dj_booth',
  },
  {
    id: 'garden_jacuzzi',
    room: 'Garden',
    name: 'Outdoor Jacuzzi',
    emoji: '🛁',
    pos: [22, 0.5, -2],
    actionKey: 'garden_jacuzzi',
  },
  {
    id: 'garden_laundry',
    room: 'Garden',
    name: 'Wash Clothes',
    emoji: '🧺',
    pos: [10, 0.6, 6],
    actionKey: 'laundry_wash',
  },
  {
    id: 'garden_lounger',
    room: 'Garden',
    name: 'Sun Lounger Strategy',
    emoji: '🕶️',
    pos: [9, 0.5, -2],
    actionKey: 'sun_lounger',
  },
  {
    id: 'garden_gossip_bench',
    room: 'Garden',
    name: 'Gossip Bench',
    emoji: '🚬',
    pos: [23, 0.5, -14],
    actionKey: 'gossip_bench',
  },
  {
    id: 'garden_sin_bin',
    room: 'Garden',
    name: 'Sin Bin Punishment',
    emoji: '🧹',
    pos: [23, 0.5, 8],
    actionKey: 'sin_bin',
  },

  // --------------------------- ARENA ---------------------------
  {
    id: 'arena_sponsor',
    room: 'Arena',
    name: 'Brand Sponsor Challenge',
    emoji: '💰',
    pos: [16, 0.6, 17],
    actionKey: 'brand_sponsor_task',
  },
  {
    id: 'arena_wager',
    room: 'Arena',
    name: 'Wager Showcase',
    emoji: '🎭',
    pos: [16, 0.6, 20],
    actionKey: 'wager_showcase',
  },
  {
    id: 'arena_drills',
    room: 'Arena',
    name: 'Obstacle Drills',
    emoji: '🧗',
    pos: [18.5, 0.6, 23],
    actionKey: 'obstacle_drills',
  },
  {
    id: 'arena_pushups',
    room: 'Arena',
    name: 'Push-Up Showdown',
    emoji: '🥊',
    pos: [13.5, 0.6, 23],
    actionKey: 'pushup_contest',
  },
  {
    id: 'arena_bet',
    room: 'Arena',
    name: 'Wager Challenge Coins',
    emoji: '🪙',
    pos: [19.5, 0.6, 18],
    actionKey: 'bet_challenge',
  },
  {
    id: 'arena_toth',
    room: 'Arena',
    name: 'Tail of House Costume',
    emoji: '🤡',
    pos: [16, 0.6, 24.5],
    actionKey: 'toth_punishment',
  },

  // --------------------------- EXTENDED & SEASON-SPECIFIC STATIONS ---------------------------
  {
    id: 'arena_innoson',
    room: 'Arena',
    name: 'Innoson Car Challenge',
    emoji: '🚙',
    pos: [11.0, 0.6, 17.0],
    actionKey: 'innoson_car_task',
  },
  {
    id: 'lounge_fake_housemate',
    room: 'Lounge',
    name: 'Probe Fake Housemate',
    emoji: '🕵️‍♂️',
    pos: [-6.5, 0.6, 6.0],
    actionKey: 'fake_housemate_probe',
  },
  {
    id: 'hoh_select_deputy',
    room: 'HoH Suite',
    name: 'Appoint Deputy HoH',
    emoji: '👑',
    pos: [17.5, 0.8, -18.0],
    actionKey: 'select_deputy_hoh',
    requiresHoH: true,
  },
  {
    id: 'arena_house_clash',
    room: 'Arena',
    name: 'Dual-House Wing Clash',
    emoji: '⚔️',
    pos: [13.0, 0.6, 20.0],
    actionKey: 'dual_house_clash',
  },
  {
    id: 'garden_pool_party',
    room: 'Garden',
    name: 'Pool Party Dance-Off',
    emoji: '🌊',
    pos: [13.0, 0.5, 0.0],
    actionKey: 'pool_party_dance',
  },
  {
    id: 'diary_wellness',
    room: 'Diary Room',
    name: 'Biggie Wellness Debrief',
    emoji: '🩺',
    pos: [-24.0, 0.8, 20.0],
    actionKey: 'wellness_checkup',
  },
];

function StationIndicator({
  station,
  onOpenDiaryRoom,
}: {
  station: InteractiveStation;
  onOpenDiaryRoom: () => void;
}) {
  const [isNearby, setIsNearby] = useState(false);
  const [hovered, setHovered] = useState(false);

  const player = useGame((s) => s.state?.player);
  const phase = useGame((s) => s.state?.phase);
  const actionsLeft = useGame((s) => s.state?.actionsLeft ?? 0);
  const doAction = useGame((s) => s.doAction);

  useFrame(() => {
    const dist = Math.hypot(
      playerWorldPos.x - station.pos[0],
      playerWorldPos.z - station.pos[2]
    );
    const nearby = dist <= 3.2;
    if (nearby !== isNearby) {
      setIsNearby(nearby);
    }
  });

  const handleClick = (e: any) => {
    e?.stopPropagation?.();
    const dist = Math.hypot(
      playerWorldPos.x - station.pos[0],
      playerWorldPos.z - station.pos[2]
    );

    if (dist > 3.8) {
      // Station is out of reach; automatically navigate avatar towards the station
      setTarget(station.pos[0], station.pos[2]);
      useToast.getState().showToast({
        emoji: '🚶',
        title: `Walking to ${station.name}...`,
        type: 'info',
      });
      return;
    }

    // Close enough: trigger action!
    if (station.isDiaryRoom) {
      sound.playBiggieTone();
      useToast.getState().showToast({
        emoji: '🎙️',
        title: 'Entering Biggie’s Diary Room...',
        type: 'info',
      });
      onOpenDiaryRoom();
      return;
    }

    if (station.requiresHoH && !player?.isHoH) {
      sound.playBiggieBuzzer();
      useToast.getState().showToast({
        emoji: '👑',
        title: 'Head of House Only',
        description: 'This station is restricted to the reigning Head of House.',
        type: 'warning',
      });
      return;
    }

    if (station.actionKey) {
      if (actionsLeft <= 0 && phase === 'daily') {
        sound.playBiggieBuzzer();
        useToast.getState().showToast({
          emoji: '⚠️',
          title: '0 Actions Left Today',
          description: 'You have used all 3 daily actions. End the day or rest!',
          type: 'warning',
        });
        return;
      }

      if (player && player.energy < 15 && station.actionKey !== 'power_nap') {
        sound.playBiggieBuzzer();
        useToast.getState().showToast({
          emoji: '😴',
          title: 'Too Exhausted',
          description: 'Energy is below 15. Take a Power Nap in the Bedroom first!',
          type: 'warning',
        });
        return;
      }

      const action = ROOM_ACTIONS.find((a) => a.key === station.actionKey);
      sound.playRewardChime();
      doAction(station.actionKey);

      const effects: string[] = [];
      if (action?.effect.energy) effects.push(`${action.effect.energy > 0 ? '+' : ''}${action.effect.energy} Energy`);
      if (action?.effect.sanity) effects.push(`${action.effect.sanity > 0 ? '+' : ''}${action.effect.sanity} Sanity`);
      if (action?.effect.hunger) effects.push(`${action.effect.hunger > 0 ? '+' : ''}${action.effect.hunger} Hunger`);
      if (action?.effect.bbCoins) effects.push(`${action.effect.bbCoins > 0 ? '+' : ''}${action.effect.bbCoins} BB Coins`);
      if (action?.effect.fanbaseClout) effects.push(`${action.effect.fanbaseClout > 0 ? '+' : ''}${action.effect.fanbaseClout} Clout`);

      useToast.getState().showToast({
        emoji: station.emoji,
        title: `${station.name} Completed!`,
        description: effects.join(' · ') || 'Diary log updated.',
        type: 'success',
      });
    }
  };

  const isRestrictedHoH = station.requiresHoH && !player?.isHoH;
  const showLabel = isNearby || hovered;

  return (
    <group position={station.pos}>
      {/* Floating 3D Action Label */}
      {showLabel && (
        <Html
          position={[0, 1.2, 0]}
          center
          distanceFactor={5}
          zIndexRange={[12, 0]}
        >
          <div
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            className={`pointer-events-auto flex cursor-pointer flex-col items-center whitespace-nowrap transition-all duration-200 ${
              hovered || isNearby ? 'scale-100' : 'scale-90 opacity-75'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-lg backdrop-blur-md transition ${
                station.isDiaryRoom
                  ? 'bg-purple-900/90 text-purple-200 ring-2 ring-purple-400'
                  : isRestrictedHoH
                    ? 'bg-red-950/90 text-red-300 ring-1 ring-red-500'
                    : hovered || isNearby
                      ? 'bg-ink text-gold ring-2 ring-gold'
                      : 'bg-black/75 text-white ring-1 ring-white/20'
              }`}
            >
              <span className="text-sm">{station.emoji}</span>
              <span>{station.name}</span>
              {isNearby && (
                <span className="ml-0.5 rounded bg-white/20 px-1 py-0.2 text-[9px] font-bold text-white uppercase">
                  Tap
                </span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function InteractiveObjects({
  onOpenDiaryRoom,
}: {
  onOpenDiaryRoom: () => void;
}) {
  const isTourActive = useTour((s) => s.isActive);
  if (isTourActive) return null;

  return (
    <>
      {STATIONS.map((station) => (
        <StationIndicator
          key={station.id}
          station={station}
          onOpenDiaryRoom={onOpenDiaryRoom}
        />
      ))}
    </>
  );
}
