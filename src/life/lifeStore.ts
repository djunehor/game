import { create } from 'zustand';
import { MOTIVE_IDS } from '../sim/types';
import { useSimStore } from '../sim/simStore';
import { registerObjectInteractions, registerSocialInteractions } from '../sim/interactions';
import { SOCIAL_INTERACTIONS } from './social';
import { advanceAge } from './aging';
import { CATALOG_BY_ID } from './catalog';
import { canPlace, objectPrice, sellValue, snap, type PlacementCheck } from './buildMode';
import {
  ADOPTION_COST,
  PREGNANCY_DAYS,
  canAdopt,
  canTryForBaby,
  createBaby,
  dueBirths,
  familyRelationshipKinds,
} from './family';
import { LIFE_TRAITS } from './content';
import { CAREERS, LIFE_STAGES } from './content';
import { completeShift, isWorkDay, missShift, shiftFor } from './careers';
import { interactionsForLot, regionLabelAt } from './objects';
import { loadHousehold, saveHousehold, SAVE_VERSION } from './persistence';
import {
  createStarterLot,
  detectRegions,
  floorCost,
  labelRegions,
  tileIndex,
  validWallKeys,
} from '../lot/grid';
import { WALL_COST, WALL_REFUND, type LotLayout, type LotRegion, type TileKind } from '../lot/types';
import type { CareerId, Household, NewSimConfig, PlacedObject, Sim } from './types';

export type { NewSimConfig };

// ---------------------------------------------------------------------------
// The life sim's own state: a household, a lot, money, and the day counter.
// Time itself lives in the sim clock; this store reacts to day rollovers.
// ---------------------------------------------------------------------------

export const STARTING_FUNDS = 20000;
export const BILLS_PER_SIM = 40;

let uidCounter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(uidCounter++).toString(36)}`;

export type BuildTool = 'object' | 'wall' | 'floor' | 'erase';

export type WallMode = 'up' | 'cut' | 'down';

export interface LifeNotification {
  id: string;
  text: string;
  emoji: string;
  kind: 'info' | 'money' | 'birthday' | 'career' | 'warning';
  at: number;
}

export interface HouseholdConfig {
  name: string;
  sims: NewSimConfig[];
}

interface LifeState {
  household: Household | null;
  /** Live mode vs build/buy mode. */
  mode: 'live' | 'build';
  selectedSimId: string | null;
  /** Object currently being placed (catalog id) or null. */
  placingCatalogId: string | null;
  placingUid: string | null;
  rotation: 0 | 1 | 2 | 3;
  ghost: { x: number; z: number } | null;
  /** Object the player clicked in the world; drives the interaction popup. */
  inspectedUid: string | null;
  /** Which build tool is active. */
  tool: BuildTool;
  /** How much of the walls to draw: full, cut away, or hidden. */
  wallMode: WallMode;
  /** Who the selected Sim is about to talk to. */
  socialTargetId: string | null;
  /** Last day offset already processed, to detect rollovers. */
  lastDayOffset: number;
  workedToday: Record<string, boolean>;
  notifications: LifeNotification[];

  createHousehold: (config: HouseholdConfig) => void;
  reset: () => void;

  setMode: (mode: 'live' | 'build') => void;
  selectSim: (id: string | null) => void;

  inspect: (uid: string | null) => void;

  /** Build-mode tools that act on the land itself. */
  setTool: (tool: BuildTool) => void;
  cycleWallMode: () => void;
  setSocialTarget: (id: string | null) => void;
  toggleWall: (key: string) => void;
  paintTile: (x: number, z: number, kind: TileKind) => void;
  /** Cached room detection for the current plot + furniture. */
  regions: () => LotRegion[];
  findRoomLabel: (worldX: number, worldZ: number) => string;
  startPlacing: (catalogId: string) => void;
  startMoving: (uid: string) => void;
  cancelPlacing: () => void;
  rotatePlacing: () => void;
  setGhost: (x: number, z: number) => void;
  placementCheck: () => PlacementCheck | null;
  confirmPlace: () => void;
  sellObject: (uid: string) => void;
  clearRoom: (room: string) => void;

  startCareer: (simId: string, careerId: CareerId) => void;
  quitCareer: (simId: string) => void;
  goToWork: (simId: string) => void;

  adjustRelationship: (aId: string, bId: string, friendship?: number, romance?: number) => void;
  addSim: (config: NewSimConfig) => void;
  /** Start a pregnancy between two willing Sims. */
  tryForBaby: (aId: string, bId: string) => void;
  /** Adopt a child into the household (costs money). */
  adoptChild: (parentId: string) => void;
  removeSim: (simId: string) => void;

  advanceLifeDay: (dayOffset: number, weekday: number) => void;
  addFunds: (amount: number) => void;
  /** Record that a Sim achieved an aspiration milestone. */
  markMilestone: (simId: string, milestoneId: string) => void;
  notify: (text: string, emoji: string, kind: LifeNotification['kind']) => void;
  dismissNotification: (id: string) => void;
}

function makeSim(config: NewSimConfig): Sim {
  return {
    id: uid('sim'),
    firstName: config.firstName,
    lastName: config.lastName,
    gender: config.gender,
    stage: config.stage,
    daysInStage: 0,
    traits: config.traits.slice(0, 3),
    aspiration: config.aspiration,
    avatar: config.avatar,
    accentColor: config.accentColor,
    skinTone: config.skinTone,
    hairstyle: config.hairstyle,
    career: config.career ? { id: config.career, level: 0, performance: 0, shiftsWorked: 0 } : null,
    atWork: false,
    relationships: {},
    generation: 0,
    playable: true,
  };
}

/**
 * Starter furniture. Every piece is validated against the plot as it is placed,
 * so the opening house can never come out with furniture jammed into a wall or
 * blocking a doorway.
 */
function starterLot(plot: LotLayout): PlacedObject[] {
  const plan: [string, number, number, PlacedObject['rotation']][] = [
    // Living room — along the north wall, leaving the middle open.
    ['tv', plot.originX + 8, plot.originZ + 6.2, 0],
    ['sofa', plot.originX + 8, plot.originZ + 7.6, 0],
    ['coffee_table', plot.originX + 11, plot.originZ + 7.6, 0],
    ['plant', plot.originX + 19.2, plot.originZ + 6.4, 0],
    ['floor_lamp', plot.originX + 5.6, plot.originZ + 6.4, 0],
    // Kitchen / dining — against the back wall.
    ['fridge', plot.originX + 6.2, plot.originZ + 13.2, 0],
    ['stove', plot.originX + 8.4, plot.originZ + 13.2, 0],
    ['sink', plot.originX + 10.2, plot.originZ + 13.2, 0],
    ['dining_table', plot.originX + 13.4, plot.originZ + 13, 0],
    // Right wing — bedroom and bath.
    ['double_bed', plot.originX + 16.5, plot.originZ + 7.5, 0],
    ['toilet', plot.originX + 19.4, plot.originZ + 12.6, 0],
    ['shower', plot.originX + 17.6, plot.originZ + 13.4, 0],
    ['mirror', plot.originX + 18.6, plot.originZ + 6.4, 0],
    // Garden.
    ['lounger', plot.originX + 22, plot.originZ + 3, 0],
    ['garden_plot', plot.originX + 24, plot.originZ + 1, 0],
    ['barbecue', plot.originX + 21, plot.originZ + 0, 0],
  ];

  const placed: PlacedObject[] = [];
  for (const [catalogId, x, z, rotation] of plan) {
    if (!CATALOG_BY_ID[catalogId]) continue;
    const sx = snap(x);
    const sz = snap(z);
    if (!canPlace(placed, catalogId, sx, sz, rotation, undefined, plot).ok) continue;
    placed.push({ uid: uid('obj'), catalogId, x: sx, z: sz, rotation });
  }
  return placed;
}

/** Add a newborn or adopted child to the household and wire up the family links. */
function addChildToHousehold(
  get: () => LifeState,
  set: (partial: Partial<LifeState>) => void,
  parents: Sim[],
  funds: number,
): void {
  const household = get().household;
  if (!household) return;

  const baby = createBaby({
    parents,
    availableTraits: LIFE_TRAITS.map((t) => t.id),
    roll: (parents[0].id.length % 7) / 11,
  });

  const child: Sim = {
    id: uid('sim'),
    firstName: baby.firstName,
    lastName: baby.lastName,
    gender: baby.gender,
    stage: baby.stage,
    daysInStage: 0,
    traits: baby.traits,
    aspiration: baby.aspiration,
    avatar: baby.appearance.avatar,
    accentColor: baby.appearance.accentColor,
    skinTone: baby.appearance.skinTone,
    hairstyle: baby.appearance.hairstyle,
    career: null,
    atWork: false,
    relationships: {},
    generation: (parents[0]?.generation ?? 0) + 1,
    playable: true,
    parentIds: baby.parentIds,
    counters: {},
  };

  const links = familyRelationshipKinds(parents, child, household.sims);
  for (const member of household.sims) {
    const fromChild = links.find((l) => l.simId === child.id && l.otherId === member.id);
    const fromMember = links.find((l) => l.simId === member.id && l.otherId === child.id);
    child.relationships[member.id] = {
      friendship: fromChild?.kind === 'sibling' ? 40 : 25,
      romance: 0,
      kind: fromChild?.kind ?? 'acquaintance',
    };
    member.relationships[child.id] = {
      friendship: fromMember?.kind === 'parent' ? 70 : 20,
      romance: 0,
      kind: fromMember?.kind ?? 'acquaintance',
    };
  }

  set({ household: { ...household, funds, sims: [...household.sims, child] } });
}

export const useLifeStore = create<LifeState>((set, get) => ({
  // Restore the family from the last session, so a reload doesn't send you
  // back to Create-a-Household.
  household: loadHousehold(),
  mode: 'live',
  selectedSimId: null,
  placingCatalogId: null,
  placingUid: null,
  rotation: 0,
  ghost: null,
  inspectedUid: null,
  tool: 'object',
  wallMode: 'cut',
  socialTargetId: null,
  lastDayOffset: 0,
  workedToday: {},
  notifications: [],

  createHousehold: (config) => {
    const sims = config.sims.map(makeSim);
    const starterPlot = createStarterLot();
    // Everyone starts knowing everyone else.
    for (const a of sims) {
      for (const b of sims) {
        if (a.id === b.id) continue;
        a.relationships[b.id] = { friendship: 15, romance: 0, kind: 'acquaintance' };
      }
    }
    const household: Household = {
      version: SAVE_VERSION,
      name: config.name,
      funds: STARTING_FUNDS,
      sims,
      plot: starterPlot,
      lot: starterLot(starterPlot),
      generation: 0,
    };
    set({
      household,
      selectedSimId: sims[0]?.id ?? null,
      mode: 'live',
      lastDayOffset: 0,
      workedToday: {},
      notifications: [
        {
          id: uid('note'),
          text: `Welcome to ${config.name}! You have ₦${STARTING_FUNDS.toLocaleString()}.`,
          emoji: '🏡',
          kind: 'info',
          at: 0,
        },
      ],
    });
  },

  reset: () =>
    set({
      household: null,
      selectedSimId: null,
      placingCatalogId: null,
      placingUid: null,
      ghost: null,
      inspectedUid: null,
      tool: 'object',
      wallMode: 'cut',
      lastDayOffset: 0,
      workedToday: {},
      notifications: [],
      mode: 'live',
    }),

  setMode: (mode) => set({ mode, placingCatalogId: null, placingUid: null, ghost: null, inspectedUid: null }),
  inspect: (uid) => set({ inspectedUid: uid }),
  setTool: (tool) => set({ tool, placingCatalogId: null, placingUid: null, ghost: null }),
  cycleWallMode: () =>
    set((s) => ({ wallMode: s.wallMode === 'cut' ? 'up' : s.wallMode === 'up' ? 'down' : 'cut' })),
  setSocialTarget: (id) => set({ socialTargetId: id }),

  toggleWall: (key) => {
    const { household } = get();
    if (!household) return;
    if (!validWallKeys(household.plot).has(key)) return;
    const has = household.plot.walls.includes(key);
    if (has) {
      const walls = household.plot.walls.filter((w) => w !== key);
      set({ household: { ...household, plot: { ...household.plot, walls }, funds: household.funds + Math.round(WALL_COST * WALL_REFUND) } });
      return;
    }
    if (household.funds < WALL_COST) {
      get().notify('Not enough money for that wall', '💸', 'warning');
      return;
    }
    const walls = [...household.plot.walls, key];
    set({ household: { ...household, plot: { ...household.plot, walls }, funds: household.funds - WALL_COST } });
  },

  paintTile: (x, z, kind) => {
    const { household } = get();
    if (!household) return;
    const { plot } = household;
    if (x < 0 || z < 0 || x >= plot.width || z >= plot.depth) return;
    const index = tileIndex(plot, x, z);
    const current = plot.tiles[index];
    if (current === kind) return;

    const refund = Math.round(floorCost(current) * 0.5);
    const cost = floorCost(kind);
    const delta = cost - refund;
    if (delta > 0 && household.funds < delta) {
      get().notify('Not enough money for that flooring', '💸', 'warning');
      return;
    }

    const tiles = [...plot.tiles];
    tiles[index] = kind;
    set({ household: { ...household, plot: { ...plot, tiles }, funds: household.funds - delta } });
  },

  regions: () => {
    const { household } = get();
    if (!household?.plot) return [];
    return labelRegions(household.plot, detectRegions(household.plot), household.lot);
  },

  findRoomLabel: (worldX, worldZ) => {
    const { household } = get();
    if (!household?.plot) return 'Outside';
    const regions = get().regions();
    const tx = Math.floor((worldX - household.plot.originX) / household.plot.tileSize);
    const tz = Math.floor((worldZ - household.plot.originZ) / household.plot.tileSize);
    const index = tileIndex(household.plot, tx, tz);
    const region = regions.find((r) => r.tiles.includes(index));
    return region ? region.label : 'Outside';
  },
  selectSim: (id) =>
    set((s) => ({
      selectedSimId: id,
      // Picking someone else to look at makes them the obvious person to talk to.
      socialTargetId: s.socialTargetId === id ? null : s.socialTargetId,
    })),

  startPlacing: (catalogId) =>
    set({ placingCatalogId: catalogId, placingUid: null, mode: 'build', rotation: 0 }),

  startMoving: (uid) => {
    const household = get().household;
    const placed = household?.lot.find((o) => o.uid === uid);
    if (!placed) return;
    set({
      placingCatalogId: placed.catalogId,
      placingUid: uid,
      mode: 'build',
      rotation: placed.rotation,
      ghost: { x: placed.x, z: placed.z },
    });
  },

  cancelPlacing: () => set({ placingCatalogId: null, placingUid: null, ghost: null }),

  rotatePlacing: () => set((s) => ({ rotation: (((s.rotation + 1) % 4) as 0 | 1 | 2 | 3) })),

  setGhost: (x, z) => set({ ghost: { x: snap(x), z: snap(z) } }),

  placementCheck: () => {
    const { household, placingCatalogId, ghost, placingUid } = get();
    if (!household || !placingCatalogId || !ghost) return null;
    return canPlace(
      household.lot,
      placingCatalogId,
      ghost.x,
      ghost.z,
      get().rotation,
      placingUid ?? undefined,
      household.plot,
    );
  },

  confirmPlace: () => {
    const state = get();
    const { household, placingCatalogId, ghost, rotation, placingUid } = state;
    if (!household || !placingCatalogId || !ghost) return;

    const check = canPlace(
      household.lot,
      placingCatalogId,
      ghost.x,
      ghost.z,
      rotation,
      placingUid ?? undefined,
      household.plot,
    );
    if (!check.ok) {
      state.notify(check.reason ?? 'Cannot place that here', '🚫', 'warning');
      return;
    }

    const price = objectPrice(placingCatalogId);
    if (!placingUid && household.funds < price) {
      state.notify(`Not enough money for the ${CATALOG_BY_ID[placingCatalogId]?.name ?? 'item'}`, '💸', 'warning');
      return;
    }

    let lot: PlacedObject[];
    let funds = household.funds;

    if (placingUid) {
      lot = household.lot.map((o) =>
        o.uid === placingUid ? { ...o, x: ghost.x, z: ghost.z, rotation } : o,
      );
    } else {
      lot = [...household.lot, { uid: uid('obj'), catalogId: placingCatalogId, x: ghost.x, z: ghost.z, rotation }];
      funds -= price;
    }

    set({
      household: { ...household, lot, funds },
      placingCatalogId: null,
      placingUid: null,
      ghost: null,
    });
    registerLotInteractions(lot);
  },

  sellObject: (targetUid) => {
    const { household } = get();
    if (!household) return;
    const placed = household.lot.find((o) => o.uid === targetUid);
    if (!placed) return;
    const refund = sellValue(placed.catalogId);
    const lot = household.lot.filter((o) => o.uid !== targetUid);
    set({ household: { ...household, lot, funds: household.funds + refund } });
    registerLotInteractions(lot);
    get().notify(`Sold the ${CATALOG_BY_ID[placed.catalogId]?.name ?? 'item'} for ₦${refund.toLocaleString()}`, '💵', 'money');
  },

  clearRoom: (room) => {
    const { household } = get();
    if (!household) return;
    const regions = get().regions();
    const kept: PlacedObject[] = [];
    let refund = 0;
    for (const placed of household.lot) {
      if (regionLabelAt(household.plot, regions, placed.x, placed.z) === room) {
        refund += sellValue(placed.catalogId);
      } else {
        kept.push(placed);
      }
    }
    set({ household: { ...household, lot: kept, funds: household.funds + refund } });
    registerLotInteractions(kept);
  },

  startCareer: (simId, careerId) => {
    const { household } = get();
    if (!household) return;
    const stage = household.sims.find((s) => s.id === simId)?.stage;
    if (!stage || !LIFE_STAGES[stage].canWork) {
      get().notify('Only adults can take a job.', '🚫', 'warning');
      return;
    }
    set({
      household: {
        ...household,
        sims: household.sims.map((s) =>
          s.id === simId ? { ...s, career: { id: careerId, level: 0, performance: 0, shiftsWorked: 0 } } : s,
        ),
      },
    });
    get().notify(`Started a career in ${CAREERS[careerId].label}`, CAREERS[careerId].emoji, 'career');
  },

  quitCareer: (simId) => {
    const { household } = get();
    if (!household) return;
    set({
      household: {
        ...household,
        sims: household.sims.map((s) => (s.id === simId ? { ...s, career: null } : s)),
      },
    });
  },

  goToWork: (simId) => {
    const { household, workedToday } = get();
    if (!household) return;
    const sim = household.sims.find((s) => s.id === simId);
    if (!sim?.career) return;
    if (workedToday[simId]) {
      get().notify(`${sim.firstName} already worked today.`, '⏰', 'warning');
      return;
    }

    const avatar = useSimStore.getState().avatars[simId];
    if (avatar && avatar.motives.energy < 12) {
      get().notify(`${sim.firstName} is too exhausted to work.`, '😴', 'warning');
      return;
    }

    const skills = avatar?.skills ?? {};
    const result = completeShift(sim, skills);

    set({
      household: {
        ...household,
        funds: household.funds + result.paid,
        sims: household.sims.map((s) => (s.id === simId ? { ...s, career: result.career } : s)),
      },
      workedToday: { ...workedToday, [simId]: true },
    });

    get().notify(`${sim.firstName} earned ₦${result.paid.toLocaleString()}`, '💼', 'money');
    if (result.promoted) {
      const meta = CAREERS[result.career.id];
      get().notify(
        `Promoted to ${meta.levels[result.career.level].title}!`,
        '🎉',
        'career',
      );
    }
  },

  adjustRelationship: (aId, bId, friendship = 0, romance = 0) => {
    const { household } = get();
    if (!household) return;
    set({
      household: {
        ...household,
        sims: household.sims.map((s) => {
          if (s.id !== aId) return s;
          const existing = s.relationships[bId];
          if (!existing) return s;
          const friendshipNext = Math.max(-100, Math.min(100, existing.friendship + friendship));
          const romanceNext = Math.max(0, Math.min(100, existing.romance + romance));
          return {
            ...s,
            relationships: {
              ...s.relationships,
              [bId]: { ...existing, friendship: friendshipNext, romance: romanceNext },
            },
          };
        }),
      },
    });
  },

  addSim: (config) => {
    const { household } = get();
    if (!household) return;
    const sim = makeSim(config);
    sim.generation = household.generation;
    for (const other of household.sims) {
      sim.relationships[other.id] = { friendship: 10, romance: 0, kind: 'acquaintance' };
      other.relationships[sim.id] = { friendship: 10, romance: 0, kind: 'acquaintance' };
    }
    set({ household: { ...household, sims: [...household.sims, sim] } });
  },

  tryForBaby: (aId, bId) => {
    const { household, lastDayOffset } = get();
    if (!household) return;
    const a = household.sims.find((s) => s.id === aId);
    const b = household.sims.find((s) => s.id === bId);
    if (!a || !b) return;

    const check = canTryForBaby(a, b, household.sims.length);
    if (!check.ok) {
      get().notify(check.reason ?? 'Not possible', '🚫', 'warning');
      return;
    }

    set({
      household: {
        ...household,
        sims: household.sims.map((s) =>
          s.id === a.id
            ? {
                ...s,
                pregnantUntilDayOffset: lastDayOffset + PREGNANCY_DAYS,
                pregnancyPartnerId: b.id,
              }
            : s,
        ),
      },
    });
    get().notify(`${a.firstName} is expecting!`, '🤰', 'birthday');
  },

  adoptChild: (parentId) => {
    const { household } = get();
    if (!household) return;
    const parent = household.sims.find((s) => s.id === parentId);
    if (!parent) return;

    const check = canAdopt(parent, household.sims.length, household.funds);
    if (!check.ok) {
      get().notify(check.reason ?? 'Not possible', '🚫', 'warning');
      return;
    }

    addChildToHousehold(get, set, [parent], household.funds - ADOPTION_COST);
  },

  removeSim: (simId) => {
    const { household } = get();
    if (!household) return;
    set({
      household: {
        ...household,
        sims: household.sims
          .filter((s) => s.id !== simId)
          .map((s) => {
            const rel = { ...s.relationships };
            delete rel[simId];
            return { ...s, relationships: rel };
          }),
      },
      selectedSimId: get().selectedSimId === simId ? null : get().selectedSimId,
    });
  },

  advanceLifeDay: (dayOffset, weekday) => {
    const state = get();
    const { household } = state;
    if (!household) return;
    if (dayOffset <= state.lastDayOffset) return;

    const notifications: LifeNotification[] = [];
    let funds = household.funds;
    const newWorkedToday: Record<string, boolean> = {};

    const sims = household.sims.map((sim) => {
      // 1. Age up.
      const aged = advanceAge(sim, 1);
      if (aged.agedUp && aged.newStage) {
        notifications.push({
          id: uid('note'),
          text: `${sim.firstName} is now a ${LIFE_STAGES[aged.newStage].label}! ${LIFE_STAGES[aged.newStage].emoji}`,
          emoji: '🎂',
          kind: 'birthday',
          at: dayOffset,
        });
      }

      // 2. Missed shifts hurt performance. (Children simply go to school.)
      let career = aged.sim.career;
      if (career && !state.workedToday[sim.id] && isWorkDay(career, weekday)) {
        career = missShift(career);
        notifications.push({
          id: uid('note'),
          text: `${sim.firstName} missed a shift — performance dropped.`,
          emoji: '📉',
          kind: 'warning',
          at: dayOffset,
        });
      }
      newWorkedToday[sim.id] = false;

      return { ...aged.sim, career };
    });

    // 3. Births.
    const births = dueBirths(sims, dayOffset);
    for (const expecting of births) {
      const partner = expecting.pregnancyPartnerId
        ? sims.find((m) => m.id === expecting.pregnancyPartnerId)
        : undefined;
      const parents = partner ? [expecting, partner] : [expecting];
      const traits = LIFE_TRAITS.map((t) => t.id);
      const baby = createBaby({
        parents,
        availableTraits: traits,
        roll: (expecting.id.length + dayOffset * 3) / 17 % 1,
      });
      const newborn: Sim = {
        id: uid('sim'),
        firstName: baby.firstName,
        lastName: baby.lastName,
        gender: baby.gender,
        stage: baby.stage,
        daysInStage: 0,
        traits: baby.traits,
        aspiration: baby.aspiration,
        avatar: baby.appearance.avatar,
        accentColor: baby.appearance.accentColor,
        skinTone: baby.appearance.skinTone,
        hairstyle: baby.appearance.hairstyle,
        career: null,
        atWork: false,
        relationships: {},
        generation: expecting.generation + 1,
        playable: true,
        parentIds: baby.parentIds,
        counters: {},
      };

      // Everyone meets the baby; family get their own labels. The link has to be
      // read from each side's point of view, or the directions come out reversed.
      const links = familyRelationshipKinds(parents, newborn, sims);
      for (const member of sims) {
        const fromBaby = links.find((l) => l.simId === newborn.id && l.otherId === member.id);
        const fromMember = links.find((l) => l.simId === member.id && l.otherId === newborn.id);
        newborn.relationships[member.id] = {
          friendship: fromBaby?.kind === 'sibling' ? 40 : 25,
          romance: 0,
          kind: fromBaby?.kind ?? 'acquaintance',
        };
        member.relationships[newborn.id] = {
          friendship: fromMember?.kind === 'parent' ? 70 : 20,
          romance: 0,
          kind: fromMember?.kind ?? 'acquaintance',
        };
      }

      sims.push(newborn);
      // The parents are no longer expecting.
      const parentIds = new Set(parents.map((p) => p.id));
      for (let i = 0; i < sims.length; i++) {
        if (parentIds.has(sims[i].id)) {
          sims[i] = { ...sims[i], pregnantUntilDayOffset: undefined, pregnancyPartnerId: undefined };
        }
      }

      notifications.push({
        id: uid('note'),
        text: `${expecting.firstName} gave birth to ${newborn.firstName}! 🎉`,
        emoji: '👶',
        kind: 'birthday',
        at: dayOffset,
      });
    }

    // 4. Weekly bills on Mondays.
    if (weekday === 1) {
      const bill = Math.round(household.lot.length * 12 + sims.length * BILLS_PER_SIM);
      funds -= bill;
      notifications.push({
        id: uid('note'),
        text: `Bills due: ₦${bill.toLocaleString()}`,
        emoji: '🧾',
        kind: 'money',
        at: dayOffset,
      });
    }

    set({
      household: { ...household, sims, funds },
      lastDayOffset: dayOffset,
      workedToday: newWorkedToday,
      notifications: [...notifications, ...state.notifications].slice(0, 30),
    });
  },

  addFunds: (amount) =>
    set((s) => ({
      household: s.household ? { ...s.household, funds: s.household.funds + amount } : s.household,
    })),

  markMilestone: (simId, milestoneId) =>
    set((s) => {
      if (!s.household) return s;
      return {
        household: {
          ...s.household,
          sims: s.household.sims.map((member) =>
            member.id === simId
              ? {
                  ...member,
                  aspirationProgress: { ...(member.aspirationProgress ?? {}), [milestoneId]: true },
                }
              : member,
          ),
        },
      };
    }),

  notify: (text, emoji, kind) =>
    set((s) => ({
      notifications: [
        { id: uid('note'), text, emoji, kind, at: s.lastDayOffset },
        ...s.notifications,
      ].slice(0, 30),
    })),

  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}));

// ---------------------------------------------------------------------------
// Keep the interaction registry in step with what is on the lot.
// ---------------------------------------------------------------------------
export function registerLotInteractions(lot: PlacedObject[]): void {
  const { household, regions } = useLifeStore.getState();
  if (!household) return;
  registerObjectInteractions(interactionsForLot(lot, household.plot, regions()));
  registerSocialInteractions(SOCIAL_INTERACTIONS);
}

/** Persist the household whenever it changes (low frequency — player actions only). */
if (typeof window !== 'undefined') {
  useLifeStore.subscribe((s) => {
    if (s.household) saveHousehold(s.household);
  });
}

export function currentSim(state: LifeState): Sim | null {
  return state.household?.sims.find((s) => s.id === state.selectedSimId) ?? state.household?.sims[0] ?? null;
}

/** Convenience for tests/UI: the shift a Sim is meant to be on today. */
export function todaysShift(sim: Sim, weekday: number) {
  if (!sim.career) return null;
  return shiftFor(sim.career, weekday);
}

export { MOTIVE_IDS };
