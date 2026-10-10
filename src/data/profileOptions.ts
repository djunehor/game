import type { Hairstyle, Profession, Trait } from '../types';

export interface ProfessionMeta {
  id: Profession;
  emoji: string;
  tagline: string;
  cloutBonus: number; // starting fanbase clout bonus
  bbCoinBonus: number;
}

export const PROFESSIONS: ProfessionMeta[] = [
  { id: 'Tech Sis / Tech Bro', emoji: '💻', tagline: 'Codes by day, ships by night.', cloutBonus: 3000, bbCoinBonus: 1200 },
  { id: 'Instagram Influencer', emoji: '📸', tagline: 'Ring light always on.', cloutBonus: 5000, bbCoinBonus: 1500 },
  { id: 'Musician & Vibe Machine', emoji: '🎤', tagline: 'Every room is a studio.', cloutBonus: 4500, bbCoinBonus: 1000 },
  { id: 'Fashion Designer', emoji: '🧵', tagline: 'Ankara is not a trend, it is culture.', cloutBonus: 3200, bbCoinBonus: 1100 },
  { id: 'Fitness Coach', emoji: '💪', tagline: 'No off days in the gym or the house.', cloutBonus: 2200, bbCoinBonus: 900 },
  { id: 'Corporate Lawyer', emoji: '⚖️', tagline: 'Wins arguments in and out of court.', cloutBonus: 2800, bbCoinBonus: 2000 },
  { id: 'Culinary Chef', emoji: '👨🏾‍🍳', tagline: 'Controls the kitchen, controls the house.', cloutBonus: 2600, bbCoinBonus: 1300 },
  { id: 'Real Estate Hustler', emoji: '🏘️', tagline: 'Closes deals from the diary room.', cloutBonus: 2000, bbCoinBonus: 2500 },
  { id: 'Nurse', emoji: '🩺', tagline: 'Fixes broken hearts and bruises.', cloutBonus: 1800, bbCoinBonus: 1400 },
  { id: 'Event Planner', emoji: '🎉', tagline: 'Every Saturday party is my portfolio.', cloutBonus: 3000, bbCoinBonus: 1600 },
];

export interface TraitMeta {
  id: Trait;
  emoji: string;
  description: string;
  effect: string;
}

export const TRAITS: TraitMeta[] = [
  { id: 'Pepper Dem', emoji: '🌶️', description: 'Quick to clap back, viral-worthy drama.', effect: 'Higher clout from drama events.' },
  { id: 'Strategic Schemer', emoji: '🧠', description: 'Reads the house like a textbook.', effect: 'Better at avoiding nominations.' },
  { id: 'Kitchen General', emoji: '🍲', description: 'Controls the food, controls the house.', effect: 'Bigger boosts from kitchen actions.' },
  { id: 'Lover Boy / Girl', emoji: '💘', description: 'A walking ship factory.', effect: 'More showmance events and fan buzz.' },
  { id: 'Peace Maker', emoji: '🕊️', description: 'Everyone likes you, nobody fears you.', effect: 'Higher house standing, less drama clout.' },
  { id: 'Clout Chaser', emoji: '📢', description: 'Does anything for camera time.', effect: 'High risk, high reward events.' },
  { id: 'Gentle Giant', emoji: '🦍', description: 'Strong in the arena, calm everywhere else.', effect: 'Better arena and challenge results.' },
  { id: 'Crying Specialist', emoji: '😢', description: 'Turns diary-room tears into votes.', effect: 'Clout boost from diary-room visits.' },
];

export const STATES_OF_ORIGIN = [
  'Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti',
  'Anambra', 'Enugu', 'Imo', 'Abia', 'Ebonyi',
  'Rivers', 'Delta', 'Bayelsa', 'Edo', 'Akwa Ibom', 'Cross River',
  'Kaduna', 'Kano', 'Katsina', 'Zamfara', 'Sokoto', 'Kebbi',
  'Plateau', 'Benue', 'Niger', 'Kwara', 'Kogi', 'Nasarawa',
  'Borno', 'Yobe', 'Adamawa', 'Taraba', 'Gombe', 'Bauchi', 'Jigawa', 'Abuja FCT',
];

export const AVATAR_EMOJIS = [
  '😎', '🕶️', '🤓', '😏', '😤', '🥶', '🤠', '😇', '😜', '🤩',
  '🫡', '😌', '😎', '👸🏾', '🤴🏾', '💃🏾', '🕺🏾', '🧑🏾‍🎤', '👨🏾‍💻', '👩🏾‍💻',
];

export const ACCENT_COLORS = [
  '#e63946', '#f5b841', '#22b573', '#3a86ff', '#8338ec',
  '#ff6b35', '#00b4d8', '#e07be0', '#06d6a0', '#9c6644',
];

export const SKIN_TONES = ['#f6d7b0', '#e8b98a', '#c98a5b', '#8d5524', '#5c3a21'];

export const HAIRSTYLES: { id: Hairstyle; label: string; emoji: string }[] = [
  { id: 'afro', label: 'Afro', emoji: '👩🏾‍🦱' },
  { id: 'lowcut', label: 'Low Cut', emoji: '🧑🏾‍🦲' },
  { id: 'curls', label: 'Curls', emoji: '💇🏾‍♀️' },
  { id: 'braids', label: 'Braids', emoji: '👧🏾' },
  { id: 'locs', label: 'Locs', emoji: '🧑🏾‍🦱' },
  { id: 'bald', label: 'Bald', emoji: '👨🏾‍🦲' },
];
