export type ShopId = 'gas_station' | 'supermarket' | 'restaurant' | 'bar' | 'activity';

export interface CommerceItem {
  id: string;
  shopId: ShopId;
  name: string;
  emoji: string;
  cost: number; // in Naira ₦
  description: string;
  category: string;
  effectDescription: string;
  effect?: {
    energy?: number;
    hunger?: number; // negative reduces hunger (restores satiety)
    sanity?: number;
    clout?: number;
    fuel?: number;
    affinityWithAll?: number;
  };
}

export interface ShopDefinition {
  id: ShopId;
  name: string;
  emoji: string;
  headline: string;
  tagline: string;
  accentColor: string;
  bgGradient: string;
}

export const SHOPS: Record<ShopId, ShopDefinition> = {
  gas_station: {
    id: 'gas_station',
    name: 'Lekki Energy & Gas Station',
    emoji: '⛽',
    headline: 'PMS, Diesel & Quick Vehicle Maintenance',
    tagline: 'Keep your car, danfo, keke, or bike fully fueled and running smooth.',
    accentColor: '#0284c7',
    bgGradient: 'from-sky-950 via-slate-900 to-black',
  },
  supermarket: {
    id: 'supermarket',
    name: 'Mega Mart Supermarket',
    emoji: '🛒',
    headline: 'Fresh Groceries, Swag & Daily Essentials',
    tagline: 'Stock up your housemate inventory with energy boosters and fashion accessories.',
    accentColor: '#dc2626',
    bgGradient: 'from-red-950 via-slate-900 to-black',
  },
  restaurant: {
    id: 'restaurant',
    name: 'Lekki Suya & African Kitchen',
    emoji: '🍢',
    headline: 'Fresh Charcoal Suya, Jollof Rice & Pepper Soup',
    tagline: 'Authentic Nigerian party delicacies to satisfy your cravings.',
    accentColor: '#ea580c',
    bgGradient: 'from-orange-950 via-slate-900 to-black',
  },
  bar: {
    id: 'bar',
    name: 'Lagos Island Bar & Nightclub',
    emoji: '🍸',
    headline: 'Chilled Cocktails, Cold Beer & VIP Bottle Service',
    tagline: 'Level up your hype, unwind after challenges, and spray money on friends.',
    accentColor: '#9333ea',
    bgGradient: 'from-purple-950 via-slate-900 to-black',
  },
  activity: {
    id: 'activity',
    name: 'Town Entertainment & Activities',
    emoji: '🎟️',
    headline: 'Live Stage, Arcade Passes & City Transit',
    tagline: 'Participate in recreational activities and boost your fanbase clout.',
    accentColor: '#059669',
    bgGradient: 'from-emerald-950 via-slate-900 to-black',
  },
};

export const COMMERCE_CATALOG: CommerceItem[] = [
  // ==========================================
  // 1. GAS STATION (Fuel & Vehicle Care)
  // ==========================================
  {
    id: 'fuel-pms-tank',
    shopId: 'gas_station',
    name: 'PMS Petrol Full Tank',
    emoji: '⛽',
    cost: 5000,
    category: 'Fuel',
    description: 'Full tank of premium motor spirit for bikes, cars, and kekes.',
    effectDescription: 'Refills vehicle fuel tank +100% and gives top cruising speed.',
    effect: { fuel: 100, energy: 10 },
  },
  {
    id: 'fuel-diesel-heavy',
    shopId: 'gas_station',
    name: 'Commercial Diesel Bulk Fill',
    emoji: '🛢️',
    cost: 8500,
    category: 'Fuel',
    description: 'High-octane diesel for Danfo buses and luxury Innoson SUVs.',
    effectDescription: 'Heavy-duty long range fill +100% fuel tank.',
    effect: { fuel: 100, energy: 15 },
  },
  {
    id: 'service-engine-oil',
    shopId: 'gas_station',
    name: 'Synthetic Engine Oil & Tune-up',
    emoji: '🔧',
    cost: 3500,
    category: 'Maintenance',
    description: 'Quality lubricant preventing engine friction and wear.',
    effectDescription: 'Smooth vehicle handling and acceleration.',
    effect: { fuel: 50, sanity: 10 },
  },
  {
    id: 'service-car-wash',
    shopId: 'gas_station',
    name: 'Deluxe Foam Wash & Tire Shine',
    emoji: '🧽',
    cost: 2000,
    category: 'Cosmetic',
    description: 'High-pressure foam wash and gleaming rim polish.',
    effectDescription: '+15 Fanbase Clout for driving a sparkling clean ride.',
    effect: { clout: 1500, sanity: 10 },
  },

  // ==========================================
  // 2. SUPERMARKET (Groceries, Goods & Swag)
  // ==========================================
  {
    id: 'mart-energy-drink',
    shopId: 'supermarket',
    name: 'Fearless Energy Drink Can',
    emoji: '⚡',
    cost: 1200,
    category: 'Drinks',
    description: 'Ice-cold carbonated energy drink packed with caffeine and taurine.',
    effectDescription: '+30 Energy, +10 Sanity.',
    effect: { energy: 30, sanity: 10 },
  },
  {
    id: 'mart-plantain-chips',
    shopId: 'supermarket',
    name: 'Crunchy Plantain Chips & Malt',
    emoji: '🍌',
    cost: 800,
    category: 'Snacks',
    description: 'Crispy salted dodo chips paired with a cold malt beverage.',
    effectDescription: '-20 Hunger, +10 Sanity.',
    effect: { hunger: -20, sanity: 10 },
  },
  {
    id: 'mart-designer-shades',
    shopId: 'supermarket',
    name: 'Designer Sunglasses & Hat',
    emoji: '🕶️',
    cost: 12000,
    category: 'Fashion',
    description: 'Dark polarized rimless shades and a trendy Lagos bucket hat.',
    effectDescription: '+3,500 Fanbase Clout (Pure Celebrity Swag).',
    effect: { clout: 3500, sanity: 20 },
  },
  {
    id: 'mart-cologne-spray',
    shopId: 'supermarket',
    name: 'Luxury Arabian Oud Cologne',
    emoji: '🧴',
    cost: 4500,
    category: 'Grooming',
    description: 'Long-lasting rich fragrance that turns heads everywhere you walk.',
    effectDescription: '+1,200 Clout, +15 Sanity.',
    effect: { clout: 1200, sanity: 15 },
  },
  {
    id: 'mart-snack-hamper',
    shopId: 'supermarket',
    name: 'Biggie Housemate Snack Hamper',
    emoji: '🧺',
    cost: 6000,
    category: 'Groceries',
    description: 'Gift basket with biscuits, imported chocolates, juices, and nuts.',
    effectDescription: '-35 Hunger, +25 Sanity, +10 Energy.',
    effect: { hunger: -35, sanity: 25, energy: 10 },
  },

  // ==========================================
  // 3. RESTAURANT & SUYA SPOT (Delicacies)
  // ==========================================
  {
    id: 'food-beef-suya',
    shopId: 'restaurant',
    name: 'Lekki Charcoal Beef Suya Platter',
    emoji: '🍢',
    cost: 3500,
    category: 'Suya',
    description: 'Tender grilled spiced beef strips tossed with raw onions and yaji.',
    effectDescription: '-45 Hunger, +20 Energy, +15 Sanity.',
    effect: { hunger: -45, energy: 20, sanity: 15 },
  },
  {
    id: 'food-party-jollof',
    shopId: 'restaurant',
    name: 'Smoky Party Jollof with Fried Plantain',
    emoji: '🍛',
    cost: 5000,
    category: 'Mains',
    description: 'Authentic firewood jollof rice served with golden dodo and grilled chicken.',
    effectDescription: '-60 Hunger, +30 Energy, +25 Sanity.',
    effect: { hunger: -60, energy: 30, sanity: 25 },
  },
  {
    id: 'food-pepper-soup',
    shopId: 'restaurant',
    name: 'Hot Catfish Pepper Soup',
    emoji: '🍲',
    cost: 6500,
    category: 'Soups',
    description: 'Steaming aromatic herbal broth with fresh point-and-kill catfish.',
    effectDescription: '-50 Hunger, +35 Sanity, +20 Energy.',
    effect: { hunger: -50, sanity: 35, energy: 20 },
  },
  {
    id: 'food-asun-goat',
    shopId: 'restaurant',
    name: 'Spicy Fire Asun (Peppercorn Goat Meat)',
    emoji: '🍖',
    cost: 4200,
    category: 'Grills',
    description: 'Smoked goat meat roasted and drenched in habanero peppers and onions.',
    effectDescription: '-40 Hunger, +25 Energy, +20 Sanity.',
    effect: { hunger: -40, energy: 25, sanity: 20 },
  },

  // ==========================================
  // 4. BAR & NIGHTCLUB LOUNGE (Drinks & Nightlife)
  // ==========================================
  {
    id: 'bar-chapman-cocktail',
    shopId: 'bar',
    name: 'Chilled Classic Chapman Mocktail',
    emoji: '🍹',
    cost: 2500,
    category: 'Cocktails',
    description: 'Traditional Nigerian blend with Angostura bitters, cucumber, and lime.',
    effectDescription: '+30 Sanity, +15 Energy.',
    effect: { sanity: 30, energy: 15 },
  },
  {
    id: 'bar-star-radler',
    shopId: 'bar',
    name: 'Ice-Cold Star Radler Citrus Can',
    emoji: '🍺',
    cost: 1800,
    category: 'Beer',
    description: 'Crisp, refreshing beer infused with real lemon citrus juice.',
    effectDescription: '+25 Sanity, +10 Hype.',
    effect: { sanity: 25, energy: 10 },
  },
  {
    id: 'bar-zobo-punch',
    shopId: 'bar',
    name: 'Iced Spiced Zobo Hibiscus Punch',
    emoji: '🍷',
    cost: 1500,
    category: 'Specials',
    description: 'Natural brewed hibiscus tea spiced with ginger, cloves, and pineapple.',
    effectDescription: '+25 Energy, +20 Sanity.',
    effect: { energy: 25, sanity: 20 },
  },
  {
    id: 'bar-vip-champagne',
    shopId: 'bar',
    name: 'VIP Moët & Chandon Bottle Service',
    emoji: '🍾',
    cost: 35000,
    category: 'VIP Luxury',
    description: 'Golden champagne bottle with sparkler fire display and crystal glasses.',
    effectDescription: '+8,000 Clout, +50 Sanity, +35 Energy (High Roller Status).',
    effect: { clout: 8000, sanity: 50, energy: 35 },
  },

  // ==========================================
  // 5. ACTIVITIES & ENTERTAINMENT
  // ==========================================
  {
    id: 'act-transit-pass',
    shopId: 'activity',
    name: 'Danfo & Okada 24h Transit Pass',
    emoji: '🚌',
    cost: 1000,
    category: 'Travel',
    description: 'Unlimited priority travel boarding token across Admiralty Way and Town.',
    effectDescription: '+10 Energy, +10 Sanity.',
    effect: { energy: 10, sanity: 10 },
  },
  {
    id: 'act-karaoke-night',
    shopId: 'activity',
    name: 'Live Karaoke Stage Solo Performance',
    emoji: '🎤',
    cost: 2500,
    category: 'Stage',
    description: 'Take the mic at the Saturday house party and perform an Afrobeats hit.',
    effectDescription: '+2,000 Fanbase Clout, +30 Sanity.',
    effect: { clout: 2000, sanity: 30 },
  },
  {
    id: 'act-arena-high-roller',
    shopId: 'activity',
    name: 'Arena Games Championship Entry',
    emoji: '🏆',
    cost: 6000,
    category: 'Gaming',
    description: 'Registered entry token into high-stakes mini-games with prize pools.',
    effectDescription: '+3,500 Fanbase Clout, +25 Energy.',
    effect: { clout: 3500, energy: 25 },
  },
  {
    id: 'act-diary-fast-pass',
    shopId: 'activity',
    name: 'Biggie Diary Room VIP Fast-Pass',
    emoji: '🎙️',
    cost: 10000,
    category: 'Secret',
    description: 'Skip the nomination line for a priority one-on-one session with Biggie.',
    effectDescription: '+4,000 Clout, +40 Sanity.',
    effect: { clout: 4000, sanity: 40 },
  },
];
