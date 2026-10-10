import type { Housemate } from '../types';

export interface GameEvent {
  id: string;
  title: string;
  text: string;
  kind: 'drama' | 'romance' | 'game' | 'general';
  // Effect applied to the player when this event fires.
  apply: (player: Housemate) => Partial<Housemate>;
  tweet: { handle: string; text: string };
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

// A pool of random events that can fire during daily phases.
// Each event nudges stats and generates a fan tweet.
export const RANDOM_EVENTS: GameEvent[] = [
  {
    id: 'ev-jollof-war',
    title: 'Jollof War!',
    text: 'A heated argument broke out over whose jollof recipe is superior. Voices were raised. Cameras loved it.',
    kind: 'drama',
    apply: (p) => ({ sanity: clamp(p.sanity - 8), fanbaseClout: p.fanbaseClout + 1200, houseStanding: clamp(p.houseStanding - 4) }),
    tweet: { handle: '@JollofWars', text: 'The Jollof debate has started AGAIN 😭😭 These housemates are unserious!' },
  },
  {
    id: 'ev-nepa',
    title: 'NEPA Took the Light',
    text: 'Power went out for three hours. The house bonded over candlelight and palm wine.',
    kind: 'general',
    apply: (p) => ({ sanity: clamp(p.sanity + 5), energy: clamp(p.energy - 5) }),
    tweet: { handle: '@NaijaWatts', text: 'Even Biggie\u2019s house no get light? NEPA is truly undefeated 😂' },
  },
  {
    id: 'ev-showmance',
    title: 'Showmance Brewing',
    text: 'Two housemates were spotted holding hands in the garden after midnight. The ship is sailing.',
    kind: 'romance',
    apply: (p) => ({ sanity: clamp(p.sanity + 8), fanbaseClout: p.fanbaseClout + 1500 }),
    tweet: { handle: '@ShipCentral', text: 'OMG the garden footage!!! We have a SHIP 🚢💘' },
  },
  {
    id: 'ev-chicken',
    title: 'Chicken Gate',
    text: 'Someone ate the last piece of chicken from the freezer. A full investigation is underway.',
    kind: 'drama',
    apply: (p) => ({ hunger: clamp(p.hunger + 5), sanity: clamp(p.sanity - 5), fanbaseClout: p.fanbaseClout + 900 }),
    tweet: { handle: '@JusticeForChicken', text: 'Freezer gate part 47. WHO TOOK THE CHICKEN? 🍗' },
  },
  {
    id: 'ev-task',
    title: 'Biggie\u2019s Secret Task',
    text: 'Biggie whispered a secret task to you. Complete it silently and the house is none the wiser.',
    kind: 'game',
    apply: (p) => ({ bbCoins: p.bbCoins + 1500, fanbaseClout: p.fanbaseClout + 1000 }),
    tweet: { handle: '@BiggieLeaks', text: 'A secret task?! Biggie is up to something tonight 👀' },
  },
  {
    id: 'ev-fight',
    title: 'Wahala in the Lounge',
    text: 'A shouting match erupted over dirty dishes. You either picked a side or dodged the crossfire.',
    kind: 'drama',
    apply: (p) => ({ sanity: clamp(p.sanity - 10), houseStanding: clamp(p.houseStanding - 6), fanbaseClout: p.fanbaseClout + 1100 }),
    tweet: { handle: '@WahalaTv', text: 'Dirty dishes causing CIVIL WAR in the house? Peak television 🍿' },
  },
  {
    id: 'ev-pool',
    title: 'Pool Party Vibes',
    text: 'A spontaneous afternoon splash in the pool lifted everyone\u2019s mood.',
    kind: 'general',
    apply: (p) => ({ energy: clamp(p.energy - 5), sanity: clamp(p.sanity + 12), fanbaseClout: p.fanbaseClout + 700 }),
    tweet: { handle: '@PoolSideVibes', text: 'The pool content today is giving holiday 😍🌴' },
  },
  {
    id: 'ev-arena',
    title: 'Impromptu Arena Games',
    text: 'Housemates organized a quick arena relay. Team spirit is at an all-time high.',
    kind: 'game',
    apply: (p) => ({ energy: clamp(p.energy - 8), sanity: clamp(p.sanity + 6), houseStanding: clamp(p.houseStanding + 4), fanbaseClout: p.fanbaseClout + 800 }),
    tweet: { handle: '@ArenaUpdate', text: 'Arena relay without Biggie\u2019s say-so? These ones are hungry for the win 💪' },
  },
  {
    id: 'ev-nomination-whisper',
    title: 'Nomination Whispering',
    text: 'You overheard two housemates plotting nominations in the garden. Your name came up.',
    kind: 'drama',
    apply: (p) => ({ sanity: clamp(p.sanity - 8), houseStanding: clamp(p.houseStanding - 5), fanbaseClout: p.fanbaseClout + 900 }),
    tweet: { handle: '@HouseTactics', text: 'Someone is being whispered about in the garden... and the cameras caught it all 👀' },
  },
  {
    id: 'ev-biggie-voice',
    title: 'Biggie Speaks',
    text: 'The speakers crackled: \u201cHousemates, expect the unexpected.\u201d Everyone froze.',
    kind: 'game',
    apply: (p) => ({ sanity: clamp(p.sanity - 4), fanbaseClout: p.fanbaseClout + 1000 }),
    tweet: { handle: '@BiggieLeaks', text: 'Biggie just made an announcement and the house went SILENT. What is coming?! 😱' },
  },
  {
    id: 'ev-karaoke',
    title: 'Lounge Karaoke',
    text: 'An impromptu karaoke session broke out. Some sang like angels, others like alarms.',
    kind: 'general',
    apply: (p) => ({ sanity: clamp(p.sanity + 10), fanbaseClout: p.fanbaseClout + 700 }),
    tweet: { handle: '@KaraokeNaija', text: 'Lounge karaoke is top-tier content tonight. Somebody sign this housemate! 🎤😂' },
  },
  {
    id: 'ev-workout',
    title: 'Group Workout',
    text: 'The fitness coach rallied everyone for a brutal garden workout. Your legs are crying.',
    kind: 'general',
    apply: (p) => ({ energy: clamp(p.energy - 12), sanity: clamp(p.sanity + 6), houseStanding: clamp(p.houseStanding + 3) }),
    tweet: { handle: '@FitNaija', text: 'The whole house doing burpees in the garden? Biggie\u2019s bootcamp has begun 💪' },
  },
];

// Events that can only fire on Saturday night during the party.
export const PARTY_EVENTS: GameEvent[] = [
  {
    id: 'p-showmance',
    title: 'Party Showmance!',
    text: 'Under the strobe lights, two housemates are getting dangerously close on the dancefloor. The fans are screaming.',
    kind: 'romance',
    apply: (p) => ({ sanity: clamp(p.sanity + 8), fanbaseClout: p.fanbaseClout + 1800 }),
    tweet: { handle: '@ShipHQ', text: 'PARTY SHOWMANCE UNLOCKED!! The dancefloor is doing the Lord\u2019s work tonight 🚢🔥' },
  },
  {
    id: 'p-fight',
    title: 'Drunk Drama',
    text: 'Too much small stout led to loud voices and a near-scuffle by the pool. Security stepped in.',
    kind: 'drama',
    apply: (p) => ({ sanity: clamp(p.sanity - 6), fanbaseClout: p.fanbaseClout + 2200, houseStanding: clamp(p.houseStanding - 3) }),
    tweet: { handle: '@WahalaEverywhere', text: 'Party turned to war in 2 seconds! Who let them near the alcohol?! 🍺😭' },
  },
  {
    id: 'p-dance-battle',
    title: 'Dance Battle!',
    text: 'A spontaneous dance battle broke out in the middle of the floor. You brought your best legwork.',
    kind: 'game',
    apply: (p) => ({ energy: clamp(p.energy - 8), fanbaseClout: p.fanbaseClout + 1600, houseStanding: clamp(p.houseStanding + 4) }),
    tweet: { handle: '@DancefloorNaija', text: 'The dance battle content tonight is ELITE! 😮‍💨🔥' },
  },
];
