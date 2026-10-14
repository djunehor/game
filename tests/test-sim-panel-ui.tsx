import React from 'react';
import { renderToString } from 'react-dom/server';
import { SimPanelView } from '../src/components/SimPanel';
import { createSimAvatar } from '../src/sim/engine';
import { createClock } from '../src/sim/time';
import { addSkillXp, cumulativeXpForLevel } from '../src/sim/skills';
import type { SimEvent } from '../src/sim/simStore';

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

const avatar = createSimAvatar('player-1', 'Ada', 'Kitchen General');
const withSkills = {
  ...avatar,
  skills: addSkillXp({}, 'cooking', cumulativeXpForLevel(3)).skills,
  active: { defId: 'cook_meal', elapsed: 30, duration: 60, startedBy: 'player' as const },
  queue: ['shower'],
};

const noop = () => {};
const baseProps = {
  avatar: withSkills,
  clock: createClock(1, 8),
  speed: 1 as const,
  autonomyEnabled: true,
  events: [{ id: 'e1', avatarId: 'player-1', nickname: 'Ada', emoji: '🍳', text: 'Ada finished Cook a Meal.', kind: 'completed' as const, at: 60 }] satisfies SimEvent[],
  week: 1,
  room: 'Kitchen' as const,
  onSetSpeed: noop,
  onToggleAutonomy: noop,
  onOrder: noop,
  onCancel: noop,
  onClearQueue: noop,
};

console.log('→ Testing Sims Life Panel UI');

const collapsed = renderToString(<SimPanelView {...baseProps} />);
assert(collapsed.includes('Kitchen General') === false, 'Collapsed panel does not render panel body');
assert(collapsed.includes('😐') || collapsed.includes('😄') || collapsed.includes('🙂') || collapsed.includes('😢') || collapsed.includes('😖'), 'Collapsed launcher shows the current mood emoji');

const html = renderToString(<SimPanelView {...baseProps} defaultOpen />);
assert(html.includes('08:00'), 'Expanded panel shows the sim clock (08:00)');
assert(html.includes('Monday'), 'Expanded panel shows the weekday');
assert(html.includes('Week 1'), 'Expanded panel shows the show week');
assert(html.includes('⏸️') && html.includes('▶️') && html.includes('⏩') && html.includes('⏭️'), 'All four speed controls render (pause/1x/2x/3x)');
assert(html.includes('Free Will'), 'Expanded panel renders the Free Will (autonomy) toggle');
assert(html.includes('role="switch"') || html.includes('aria-checked'), 'Free Will toggle is an accessible switch');

const tabs = renderToString(<SimPanelView {...baseProps} defaultOpen />);
assert(tabs.includes('>needs<') && tabs.includes('>skills<') && tabs.includes('>actions<'), 'Panel renders needs / skills / actions tabs');

// Needs tab (default) — motive bars + moodlet chips + mood grade
assert(html.includes('Hunger'), 'Needs tab renders the Hunger motive label');
assert(html.includes('🍽️') && html.includes('🚽') && html.includes('⚡'), 'Needs tab shows hunger / bladder / energy bars');
assert(html.includes('/100'), 'Mood grade is shown out of 100');

// Actions tab
const actions = renderToString(<SimPanelView {...baseProps} defaultOpen defaultTab="actions" />);
assert(actions.includes('In Kitchen'), 'Actions tab is scoped to the player\u2019s current room');
assert(actions.includes('Cook a Meal'), 'Actions tab lists interactions for the current room');
assert(actions.includes('Cancel') && actions.includes('Queued:'), 'Actions tab shows the active interaction progress and the queue');
assert(actions.includes('60m') || actions.includes('30m'), 'Actions tab lists interaction durations');
assert(actions.includes('Eat Leftovers'), 'Actions tab includes other kitchen interactions');

// Skill gating is surfaced in the list
const skillsTab = renderToString(<SimPanelView {...baseProps} defaultOpen defaultTab="skills" />);
assert(actions.includes('Cook a Gourmet Feast'), 'Skill-gated interaction is listed for a skilled Sim');
assert(!skillsTab.includes('disabled'), 'Skills tab has no disabled controls');

// Skills tab
const skills = renderToString(<SimPanelView {...baseProps} defaultOpen defaultTab="skills" />);
assert(skills.includes('Cooking'), 'Skills tab lists the Cooking skill');
assert(skills.includes('Lv 3'), 'Skills tab shows the current level');
assert(skills.includes('Fitness') && skills.includes('Charisma'), 'Skills tab lists every skill');

// A locked interaction is disabled
const rookie = { ...avatar, skills: {} };
const locked = renderToString(<SimPanelView {...baseProps} avatar={rookie} defaultOpen defaultTab="actions" />);
assert(locked.includes('Lv 0/3'), 'Locked interaction shows the required level');
assert(locked.includes('disabled'), 'Locked interaction is rendered disabled');

console.log(`\nSim Panel UI Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
