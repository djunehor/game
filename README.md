# Life Sim

A life simulator in the browser. Create a household, move them onto a plot of
land, build the house they live in, and watch them live: needs, moods, skills,
careers, friendships, romance, children and old age.

Your Sims look after themselves. You decide when to step in.

```bash
npm install
npm run dev          # play at http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and build |
| `npm test` | Unit + logic suite (~460 assertions) |
| `npm run test:e2e` | Plays the real game in headless Chrome (~57 checks) |

`npm run test:e2e` needs Chrome; set `CHROME_PATH` if it is not in the usual
place. `HEADED=1 npm run test:e2e` lets you watch it play.

---

## Playing

| Input | Action |
|---|---|
| `W A S D` / arrows | Walk the selected Sim |
| Click a Sim | Select them. Click another and they become the person to talk to |
| Click an object | Choose what to do with it |
| Mouse wheel | Zoom · `Q` / `E` orbit · `V` close-up camera |
| `Space` | Pause · `1` `2` `3` normal, fast, ultra |
| `☰` | Rename the household, move Sims in or out, start over, controls |

Clicking an object opens a bubble of what that object can do. Room names are
worked out from the walls you draw and what you put inside — a bed makes a
Bedroom, a stove makes a Kitchen.

## Building

`🔨 Build` opens the tools. Everything costs money; the household earns it by
working.

- **Objects** — 37 pieces across nine categories. Each has motive **ratings
  (0–10)**, and an object's rating is exactly how much it satisfies a need, so a
  ₦11,000 canopy bed is worth the money over a ₦700 camp bed.
- **Walls** (₦30) — draw on the grid lines. Rooms are *derived* from your walls
  by flood fill, not baked in.
- **Doors** (₦120) — fit into a wall segment. They separate rooms but let Sims
  through. Without one, a room is sealed.
- **Floors** (₦45/tile) — lay flooring over bare grass.
- **Remove** — knock a wall or door down for half back.

Walls toggle between **Walls Up** (with roofs), **Cut Away** (waist height, so
you can always see inside) and **Walls Down**.

## Neighbours and family

Sims interact with each other: chat, joke, compliment, gossip, hug, flirt, kiss,
argue, insult, apologise. Relationships move for **both** people, and the
actions you are offered depend on how close they already are — you cannot hug a
stranger, and nothing romantic is ever offered toward a child.

Close couples can **try for a baby**, and a single Sim can **adopt**. Children
inherit their parents' traits (with room for something of their own) and a
blended version of their looks, then age through baby, child, teen, young adult,
adult and elder with their own lives.

## Systems

**Motives** — hunger, bladder, energy, hygiene, social, fun, comfort,
environment. Each drains at its own rate, modified by the Sim's traits, and
social is only satisfied by other people.

**Moodlets** — condition moodlets derived from needs plus timed ones from what
your Sims do, resolved into twelve emotions and a mood score.

**Consequences** — a need left at zero actually costs you: collapsing from
exhaustion, an accident, fainting from hunger, a meltdown. Collapsing interrupts
whatever they were doing.

**Skills** — the food, charisma, fitness, logic, creativity, cleaning, gardening
and gaming. Each level in an interaction's own skill improves what it gives you,
so skilling up is worth the time.

**Careers** — seven careers with ten levels, real shift times and pay.
Performance builds from shifts, promotions need the matching skill, and missing
shifts costs you.

**Aspirations** — eight tracks of three milestones each, drawn from real play
(skills reached, relationships built, things owned, actions repeated).
Milestones pay out, and finishing a track fulfils the dream for a bigger reward.

**Free will** — Sims pick their own actions with a utility scorer over their
needs, and a lonely Sim will seek out company unprompted.

The household saves automatically to `localStorage`. Saves are versioned: an
unversioned save that has land is migrated in place, and an unusable one is
discarded rather than loading into an empty world.

---

## Layout

```
src/sim/      motive, moodlet, skill, clock and autonomy core (no React, no three)
src/lot/      the land: tile grid, walls, doors, room detection
src/life/     household, catalog, building, careers, ageing, family, aspirations
src/three/    rendering: the lot, objects, Sims, build cursor, camera rig
src/components/  HUD, build panel, household menu
tests/        logic suites; tests/e2e/playable.mjs drives the real game
```

`src/sim` and `src/lot` are deliberately free of React and three.js so the whole
simulation can be tested headlessly.
