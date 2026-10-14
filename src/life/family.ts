import { LIFE_STAGES } from './content';
import type { LifeStage, Sim, YoungSimConfig } from './types';

// ---------------------------------------------------------------------------
// Family: having children, and what they inherit.
//
// Children are born from two parents (or adopted by one) and take after them —
// their looks are blended and their personality traits come from the parents
// plus a little of their own.
// ---------------------------------------------------------------------------

export const PREGNANCY_DAYS = 3;
export const ADOPTION_COST = 3000;
export const BABY_MIN_ROMANCE = 60;

/** Stages that may take on a child. */
export function isAdultStage(stage: LifeStage): boolean {
  return stage === 'youngAdult' || stage === 'adult' || stage === 'elder';
}

const BABY_NAMES = [
  'Amara', 'Chidi', 'Ngozi', 'Tunde', 'Yemi', 'Kemi', 'Emeka', 'Zainab',
  'Femi', 'Ada', 'Ife', 'Bola', 'Segun', 'Temi', 'Uche', 'Halima',
];

/** Deterministic-ish random in [0,1). */
function pick<T>(list: T[], roll: number): T {
  return list[Math.floor(roll * list.length) % list.length];
}

/** Blend two hex colours, weighted toward the first. */
export function blendColors(a: string, b: string, weight = 0.5): string {
  const parse = (hex: string) => {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (x: number, y: number) =>
    Math.max(0, Math.min(255, Math.round(x * weight + y * (1 - weight))));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(mix(r1, r2))}${hex(mix(g1, g2))}${hex(mix(b1, b2))}`;
}

/**
 * A child's traits: some from each parent, plus a chance of something new.
 * Never duplicates a trait and never exceeds the household trait limit.
 */
export function inheritTraits(
  parents: Sim[],
  availableTraits: string[],
  maxTraits = 3,
): string[] {
  const inherited: string[] = [];
  for (const parent of parents) {
    for (const trait of parent.traits) {
      if (!inherited.includes(trait)) inherited.push(trait);
    }
  }
  // Keep at most maxTraits - 1 so there is always room for something of their own.
  const chosen = inherited.slice(0, Math.max(0, maxTraits - 1));
  const remaining = availableTraits.filter((t) => !chosen.includes(t));

  const own: string[] = [];
  // Deterministically vary by parent ids so siblings are not identical.
  const seed = parents.reduce((sum, p) => sum + p.id.length, 0) + chosen.length;
  if (remaining.length > 0) {
    for (let i = 0; i < remaining.length && chosen.length + own.length < maxTraits; i++) {
      const index = (seed * (i + 3) * 7) % remaining.length;
      const candidate = remaining[index];
      if (candidate && !chosen.includes(candidate) && !own.includes(candidate)) own.push(candidate);
    }
  }
  return [...chosen, ...own].slice(0, maxTraits);
}

/** The body a child is born with: blended from both parents. */
export function inheritAppearance(parents: Sim[], roll = 0.5): YoungSimConfig['appearance'] {
  const a = parents[0];
  // Adopted children have one parent, so everything comes from them.
  const b = parents[1] ?? parents[0];
  return {
    avatar: pick([a.avatar, b.avatar], roll),
    accentColor: pick([a.accentColor, b.accentColor], 1 - roll),
    hairstyle: pick([a.hairstyle ?? 'afro', b.hairstyle ?? 'afro'], roll),
    skinTone:
      a.skinTone && b.skinTone ? blendColors(a.skinTone, b.skinTone) : (a.skinTone ?? b.skinTone),
  };
}

export interface BabyOptions {
  parents: Sim[];
  availableTraits: string[];
  /** Stable roll so a save/reload does not reroll the child. */
  roll?: number;
  gender?: 'M' | 'F';
  stage?: LifeStage;
}

/** Build the new household member produced by two parents (or one adopter). */
export function createBaby(options: BabyOptions): YoungSimConfig {
  const { parents, availableTraits } = options;
  const roll = options.roll ?? 0.42;
  const surname = parents[parents.length - 1].lastName;
  const gender = options.gender ?? (roll > 0.5 ? 'M' : 'F');
  const stage = options.stage ?? 'baby';

  return {
    firstName: pick(BABY_NAMES, roll * 1.37),
    lastName: surname,
    gender,
    stage,
    traits: inheritTraits(parents, availableTraits),
    aspiration: pick(
      ['family', 'knowledge', 'creativity', 'popularity', 'nature'] as const,
      roll * 2.11,
    ),
    appearance: inheritAppearance(parents, roll),
    parentIds: parents.map((p) => p.id),
  };
}

// ------------------------------ Eligibility --------------------------------

export interface CoupleCheck {
  ok: boolean;
  reason?: string;
}

export function canTryForBaby(a: Sim, b: Sim, householdSize: number): CoupleCheck {
  if (a.id === b.id) return { ok: false, reason: 'A Sim cannot have a baby alone' };
  if (a.gender === b.gender) return { ok: false, reason: 'This pair cannot conceive' };
  if (!LIFE_STAGES[a.stage].canRomance || !LIFE_STAGES[b.stage].canRomance) {
    return { ok: false, reason: 'They are too young' };
  }
  if (a.pregnantUntilDayOffset !== undefined || b.pregnantUntilDayOffset !== undefined) {
    return { ok: false, reason: 'Somebody is already expecting' };
  }
  // Both of them have to be in it, not just one.
  const relA = a.relationships[b.id];
  const relB = b.relationships[a.id];
  if (!relA || !relB) return { ok: false, reason: 'They barely know each other' };
  if (relA.romance < BABY_MIN_ROMANCE || relB.romance < BABY_MIN_ROMANCE) {
    return { ok: false, reason: 'They are not close enough yet' };
  }
  if (householdSize >= 8) return { ok: false, reason: 'The house is full' };
  return { ok: true };
}

export function canAdopt(sim: Sim, householdSize: number, funds: number): CoupleCheck {
  if (!isAdultStage(sim.stage)) return { ok: false, reason: 'Only adults can adopt' };
  if (householdSize >= 8) return { ok: false, reason: 'The house is full' };
  if (funds < ADOPTION_COST) {
    return { ok: false, reason: `Adoption costs ₦${ADOPTION_COST.toLocaleString()}` };
  }
  return { ok: true };
}

/** Which Sims are due to give birth on or before this day offset. */
export function dueBirths(sims: Sim[], dayOffset: number): Sim[] {
  return sims.filter(
    (s) => s.pregnantUntilDayOffset !== undefined && dayOffset >= s.pregnantUntilDayOffset,
  );
}

/** Family links: parent/child both ways, and siblings between the children. */
export function familyRelationshipKinds(
  parents: Sim[],
  child: Sim,
  existing: Sim[],
): { simId: string; otherId: string; kind: 'parent' | 'child' | 'sibling' }[] {
  const links: { simId: string; otherId: string; kind: 'parent' | 'child' | 'sibling' }[] = [];
  for (const parent of parents) {
    links.push({ simId: parent.id, otherId: child.id, kind: 'parent' });
    links.push({ simId: child.id, otherId: parent.id, kind: 'child' });
  }
  for (const other of existing) {
    const sharesParent =
      child.parentIds &&
      other.parentIds &&
      child.parentIds.some((id) => other.parentIds!.includes(id));
    if (sharesParent) {
      links.push({ simId: child.id, otherId: other.id, kind: 'sibling' });
      links.push({ simId: other.id, otherId: child.id, kind: 'sibling' });
    }
  }
  return links;
}
