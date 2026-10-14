import { SOCIAL_INTERACTIONS } from '../src/life/social';
import { useLifeStore, registerLotInteractions } from '../src/life/lifeStore';
import { resolveSocialOutcome } from '../src/life/bridge';
import { useSimStore } from '../src/sim/simStore';
import { getInteraction, allSocialInteractions } from '../src/sim/interactions';
import { createSimAvatar, enqueueInteraction, tickAvatar } from '../src/sim/engine';
import { chooseAutonomousInteraction, scoreInteraction } from '../src/sim/autonomy';
import { MOTIVE_IDS, type Motives } from '../src/sim/types';
import { relationKindFor } from '../src/life/aging';
import { cumulativeXpForLevel } from '../src/sim/skills';
import type { NewSimConfig } from '../src/life/types';

// ---------------------------------------------------------------------------
// Social life: Sims interacting with each other, and relationships moving.
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

const simConfig = (over: Partial<NewSimConfig> = {}): NewSimConfig => ({
  firstName: 'Ada',
  lastName: 'Okafor',
  gender: 'F',
  stage: 'youngAdult',
  traits: ['cheerful'],
  aspiration: 'popularity',
  avatar: '😎',
  accentColor: '#e63946',
  career: null,
  ...over,
});

function full(value = 70): Motives {
  const m = {} as Motives;
  for (const id of MOTIVE_IDS) m[id] = value;
  return m;
}

console.log('→ Testing Social Interactions & Relationships');

// ---------------------------- Definitions ---------------------------------
{
  const ids = new Set(SOCIAL_INTERACTIONS.map((i) => i.id));
  assert(ids.size === SOCIAL_INTERACTIONS.length, `Social ids are unique (${SOCIAL_INTERACTIONS.length} interactions)`);
  assert(
    SOCIAL_INTERACTIONS.every((i) => Boolean(i.social) && i.minutes > 0),
    'Every social interaction has effects and a duration',
  );
  assert(
    SOCIAL_INTERACTIONS.every((i) => i.social!.relationship.friendship !== undefined || i.social!.relationship.romance !== undefined),
    'Every social interaction moves the relationship one way or the other',
  );
  assert(
    SOCIAL_INTERACTIONS.some((i) => (i.social!.relationship.friendship ?? 0) > 0) &&
      SOCIAL_INTERACTIONS.some((i) => (i.social!.relationship.friendship ?? 0) < 0),
    'There are both friendly and hostile interactions',
  );
  assert(
    SOCIAL_INTERACTIONS.some((i) => (i.social!.relationship.romance ?? 0) > 0),
    'Romantic interactions exist',
  );
}

// --------------------------- Registration ---------------------------------
{
  useLifeStore.getState().reset();
  useSimStore.getState().reset();
  useLifeStore.getState().createHousehold({ name: 'Social House', sims: [simConfig(), simConfig({ firstName: 'Bola', gender: 'M' })] });
  const home = useLifeStore.getState().household!;
  registerLotInteractions(home.lot);

  const registered = allSocialInteractions();
  assert(registered.length === SOCIAL_INTERACTIONS.length, 'Social interactions are registered with the sim core');
  assert(
    registered.every((d) => getInteraction(d.id) !== undefined),
    'Social interactions are resolvable by id from the registry',
  );
  assert(
    home.sims[0].relationships[home.sims[1].id].friendship === 15,
    'Household members start as acquaintances',
  );
}

// ------------------------ Ordering with a target --------------------------
{
  const home = useLifeStore.getState().household!;
  const [actor, partner] = home.sims;
  const sim = useSimStore.getState();
  sim.upsertAvatar(actor.id, actor.firstName, actor.traits);
  sim.upsertAvatar(partner.id, partner.firstName, partner.traits);

  useSimStore.getState().order(actor.id, 'social_chat', partner.id);
  const active = useSimStore.getState().avatars[actor.id].active!;
  assert(active.defId === 'social_chat', 'A social action can be ordered');
  assert(active.targetSimId === partner.id, 'The social action remembers who it is aimed at');
}

// ------------------------ Relationship outcome ----------------------------
{
  const home = useLifeStore.getState().household!;
  const [actor, partner] = home.sims;
  const before = home.sims[0].relationships[partner.id].friendship;

  resolveSocialOutcome(actor.id, partner.id, 'social_joke');

  const after = useLifeStore.getState().household!;
  const fromActor = after.sims.find((s) => s.id === actor.id)!.relationships[partner.id];
  const fromPartner = after.sims.find((s) => s.id === partner.id)!.relationships[actor.id];
  assert(fromActor.friendship > before, `Chatting raises friendship (${before} → ${fromActor.friendship})`);
  assert(
    fromPartner.friendship === fromActor.friendship,
    'Both Sims remember the interaction the same way (mutual relationship)',
  );
  assert(
    after.sims.find((s) => s.id === partner.id) !== undefined,
    'The target Sim is still intact',
  );

  // Hostility moves it the other way.
  const beforeInsult = useLifeStore.getState().household!.sims.find((s) => s.id === actor.id)!.relationships[partner.id].friendship;
  resolveSocialOutcome(actor.id, partner.id, 'social_insult');
  const afterInsult = useLifeStore.getState().household!.sims.find((s) => s.id === actor.id)!.relationships[partner.id].friendship;
  assert(afterInsult < beforeInsult, `Insulting lowers friendship (${beforeInsult} → ${afterInsult})`);

  // Romance is its own axis.
  resolveSocialOutcome(actor.id, partner.id, 'social_flirt');
  const romance = useLifeStore.getState().household!.sims.find((s) => s.id === actor.id)!.relationships[partner.id].romance;
  assert(romance > 0, `Flirting builds romance (${romance})`);
}

// ------------------- The target reacts in the moment ----------------------
{
  const home = useLifeStore.getState().household!;
  const [actor, partner] = home.sims;
  const sim = useSimStore.getState();
  // Wipe the target's moodlets so we can see the reaction land.
  useSimStore.setState((s) => ({
    avatars: { ...s.avatars, [partner.id]: { ...s.avatars[partner.id], moodlets: [] } },
  }));
  resolveSocialOutcome(actor.id, partner.id, 'social_joke');
  const target = useSimStore.getState().avatars[partner.id];
  assert(target.moodlets.length > 0, 'The person on the receiving end gets a moodlet');
  assert(target.motives.social > 0, 'The target also gets their social need topped up');
  void sim;
}

// ------------------------ Relationship labels ----------------------------
{
  assert(relationKindFor({ friendship: 0, romance: 0 }) === 'stranger', 'Zero meters read as strangers');
  assert(relationKindFor({ friendship: 45, romance: 0 }) === 'friend', 'Warm friendship reads as friend');
  assert(relationKindFor({ friendship: -60, romance: 0 }) === 'enemy', 'Very negative reads as enemy');
  assert(relationKindFor({ friendship: 80, romance: 65 }) === 'spouse', 'Deep romance reads as spouse');
}

// ------------------- Autonomy needs a partner to talk to ------------------
{
  const lonely: Motives = { ...full(80), social: 4 };
  const withPartner = chooseAutonomousInteraction({
    motives: lonely,
    skills: {},
    traits: ['cheerful'],
    now: 0,
    seed: 0.42,
    socialTargets: ['other-sim'],
  });
  const alone = chooseAutonomousInteraction({
    motives: lonely,
    skills: {},
    traits: ['cheerful'],
    now: 0,
    seed: 0.42,
    socialTargets: [],
  });
  assert(withPartner !== null, 'A lonely Sim picks something');
  assert(
    Boolean(withPartner?.social),
    `A lonely Sim with company seeks a social interaction (picked ${withPartner?.label})`,
  );
  assert(
    !alone?.social,
    `With nobody around they fall back to a solo action (picked ${alone?.label ?? 'nothing'})`,
  );
}

// ------------------- Autonomy attaches a target and resolves --------------
{
  const lonely: Motives = { ...full(85), social: 6 };
  const avatar = { ...createSimAvatar('ai-social', 'Ada', ['cheerful']), motives: lonely };
  const result = tickAvatar(avatar, 1, {
    now: 0,
    autonomyEnabled: true,
    socialTargets: ['friend-1'],
  });
  assert(Boolean(result.started?.social), `Autonomy starts a social action (${result.started?.label})`);
  assert(result.avatar.active?.targetSimId === 'friend-1', 'Autonomy attaches a target to the social action');

  // Run it to completion and confirm the engine reports the outcome.
  const complete = tickAvatar(result.avatar, result.started!.minutes, { now: 1, autonomyEnabled: false });
  assert(complete.social !== null, 'Completing a social action reports a social outcome');
  assert(complete.social?.targetId === 'friend-1', 'The outcome names the right target');
}

// --------------------- Stage and skill gating ----------------------------
{
  const flirt = getInteraction('social_flirt')!;
  assert(
    flirt.social?.targetStages?.includes('youngAdult') === true,
    'Flirting declares who it can be aimed at',
  );
  assert(
    flirt.social?.targetStages?.includes('child') !== true,
    'Flirting excludes children',
  );
  assert(
    flirt.requiresSkill?.id === 'charisma',
    'Flirting is gated behind Charisma',
  );

  const kid = createSimAvatar('kid', 'Kemi', ['goofball']);
  void kid;
  const withSkill = chooseAutonomousInteraction({
    motives: { ...full(70), social: 10 },
    skills: { charisma: { xp: cumulativeXpForLevel(4) } },
    traits: ['romantic'],
    now: 0,
    seed: 0.2,
    socialTargets: ['someone'],
  });
  assert(withSkill !== null, 'A charming Sim has social options available');
}

// --------------- Gating: no hugging strangers, no flirting with kids ------
{
  const flirt = getInteraction('social_flirt')!;
  const hug = getInteraction('social_hug')!;

  const stranger = {
    motives: { ...full(80), social: 5 } as Motives,
    skills: { charisma: { xp: cumulativeXpForLevel(6) } },
    traits: ['romantic'],
    now: 0,
    seed: 0.3,
    socialTargets: [{ id: 'stranger-1', stage: 'youngAdult' }],
    relationships: { 'stranger-1': { friendship: 0, romance: 0 } },
  };

  assert(scoreInteraction(flirt, stranger) === null, 'A Sim will not flirt with a stranger');
  assert(scoreInteraction(hug, stranger) === null, 'A Sim will not hug somebody they barely know');

  const close = {
    ...stranger,
    relationships: { 'stranger-1': { friendship: 60, romance: 50 } },
  };
  assert(scoreInteraction(hug, close) !== null, 'A hug is available to a close friend');
  assert(scoreInteraction(flirt, close) !== null, 'Flirting is available to a romantic interest');

  const child = {
    ...close,
    socialTargets: [{ id: 'kid-1', stage: 'child' }],
    relationships: { 'kid-1': { friendship: 100, romance: 100 } },
  };
  assert(scoreInteraction(flirt, child) === null, 'A Sim will never flirt with a child');
  assert(scoreInteraction(hug, child) !== null, 'A hug is still fine with a child');

  // The engine must not attach an ineligible target either.
  const lonely: Motives = { ...full(80), social: 4 };
  const avatar = {
    ...createSimAvatar('gated', 'Ada', ['romantic']),
    motives: lonely,
    relationships: { 'kid-1': { friendship: 100, romance: 100 } },
  };
  const ticked = tickAvatar(avatar, 1, {
    now: 0,
    autonomyEnabled: true,
    socialTargets: [{ id: 'kid-1', stage: 'child' }],
  });
  const romanticIds = ['social_flirt', 'social_kiss'];
  assert(
    !romanticIds.includes(ticked.started?.id ?? ''),
    `Autonomy never picks a romantic action for a child target (picked ${ticked.started?.id ?? 'nothing'})`,
  );
  assert(
    ticked.started === null || ticked.avatar.active?.targetSimId !== undefined,
    'Any social action it does start has a target attached',
  );
}

// --------------------- Day rollover keeps relationships -------------------
{
  const home = useLifeStore.getState().household!;
  const before = home.sims[0].relationships[home.sims[1].id].friendship;
  useLifeStore.getState().advanceLifeDay(1, 2);
  const after = useLifeStore.getState().household!.sims[0].relationships[home.sims[1].id].friendship;
  assert(after === before, 'Ageing a day does not erase relationships');
}

console.log(`\nSocial Life Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
