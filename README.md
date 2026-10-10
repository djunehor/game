# Biggie's House 🏠

A **Big Brother Naija life-simulation game** that plays free in your browser. Create your
housemate, walk around a 3D Biggie House, survive weekly evictions, dodge Ebuka's table
shaking, and chase the **₦100,000,000** grand prize.

Inspired by the browser life-sim genre (think *Lagos Life* / *The Sims*), rebuilt from scratch
around the BBNaija week: Head of House challenges, nominations, Saturday parties and Sunday
live evictions.

## Features

- **Account onboarding** — sign up with a username + password (optional email), log back in
  later, then create your housemate: gender, skin tone, hairstyle, outfit colour, profession,
  personality trait and more. Your avatar is saved to your account.
- **Real 3D world** — a fully modelled house (lounge, kitchen, bedroom, HoH suite, diary room,
  arena and garden) you actually walk around, rendered with Three.js / React Three Fiber.
- **Direct control** — WASD/arrows to move, Q/E to orbit the camera, click the floor to walk
  there, Shift to sprint. Third-person camera follows you.
- **Character creation** — name, nickname, state of origin, 10 professions, 8 personality
  traits, emoji avatar and accent colour.
- **Weekly game loop** — Monday HoH trivia, Tuesday–Thursday daily actions, Friday
  nominations, Saturday night party, Sunday live eviction.
- **Stats & needs** — energy, sanity, hunger, house standing, fanbase clout, BB Coins and
  strikes (3 strikes = disqualified).
- **Room actions** — 14 actions across 7 rooms, triggered from the room you're standing in,
  each with trait-specific bonuses.
- **Living house** — 8 AI housemates walking the rooms, random events, and a reactive
  "Biggie Feed" (Twitter-style) side panel.
- **Win or lose** — get evicted, get disqualified, or survive to the finale and win the money.
- **Persistent saves** — progress is stored in `localStorage`.

## Tech stack

- **React 19 + TypeScript** (Vite)
- **Three.js + React Three Fiber + drei** for the 3D world
- **Tailwind CSS v4**
- **Zustand** for state
- Pure, testable game engine (no framework coupling)

## Getting started

```bash
npm install
npm run dev          # client at http://localhost:5173
npm run dev:server   # multiplayer server at http://localhost:3001  (separate terminal)
```

## Multiplayer

The game is multiplayer-first. A Node.js + WebSocket server (`server/`) shards players
across houses with these rules:

- Each house holds a **maximum of 20 live players**.
- When a house hits 20, the next player starts filling a **new house**.
- Houses below 20 are **backfilled with AI-controlled housemates** so every house always
  has a full 20-person roster.

Real players appear as live housemates moving through the 3D house, and a house chat lets
everyone talk. Run the server with `npm run dev:server`, then open the client in two browser
tabs to see each other join the same house (up to 20), or open a third to trigger a second house.

The **week is shared** across the house: one server-authoritative timeline drives Monday's Head
of House, Friday's nominations and Sunday's eviction for everyone. When any housemate advances
the day, the whole house advances together.

## Deploying to Cloudflare Workers

The multiplayer server runs as a **Cloudflare Worker + Durable Object** (`worker/`), reusing the
same house-sharding and timeline logic as the local Node server. The static client is served
alongside it from the same Worker.

```bash
npm run deploy          # builds the client, then `wrangler deploy`
```

That deploys one Worker serving both the game (`/`) and the WebSocket endpoint (`/ws`).
The production build is live at **https://biggie-house.djunehor.workers.dev**.

> **Heads-up:** you need a Cloudflare account and `wrangler login` once, or set
> `CLOUDFLARE_API_TOKEN` (see `.env.example`). The token needs Workers Scripts: Edit,
> Workers Routes: Edit, Workers Deployments: Edit (account scope) and Memberships: Read
> (user scope). `account_id` is already in `wrangler.toml`.

### Persistence & auth

The Durable Object **persists all houses, members, accounts and player tokens** to Cloudflare
storage, so game state survives hibernation and redeploys. Players create accounts
(username + password, optional email) with scrypt-hashed passwords (OWASP-recommended KDF). On login the saved avatar
is restored, and the reconnecting player **resumes their house slot** instead of being
re-sharded. Passwords are hashed with scrypt; wrong credentials and impersonation attempts
are rejected, and stat updates are clamped to curb trivial inflation.

For local development, the Node server (`npm run dev:server`) is fully tested and faster to
iterate on; the Worker is for production.

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` / arrows | Move your housemate |
| `Q` / `E` | Orbit the camera |
| Click the floor | Walk to that spot |
| `Shift` | Sprint |

## Scripts

| Command | Description |
| ------------------ | --------------------------------------------- |
| `npm run dev` | Start the dev server |
| `npm run dev:server` | Start the multiplayer WebSocket server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run the engine unit tests (no browser needed) |
| `npm run test:server` | Run the server house-sharding + integration tests |
| `npm run test:smoke` | Drive the full UI in headless Chrome |

## Project structure

```
src/
  three/         # 3D world: rooms, player controller, characters, scene
  engine/        # Pure game logic + multiplayer client (state machine, actions, storage, net)
  data/          # Content: housemates, professions, traits, events, quiz questions
  components/    # React UI overlays (creator, HUD, action bar, feeds, modals, chat)
  store.ts       # Zustand store wiring the engine to the UI
  types.ts       # Shared domain types
server/          # Node.js + WebSocket multiplayer server (house sharding, AI backfill)
scripts/         # Tests
```

## How the game works

1. You enter the house and play the **Head of House** quiz on Monday. Win and you're immune.
2. On **Tuesday–Thursday** you spend 3 actions per day — walk to a room and hit its action
   buttons to raise your clout, keep your needs up and manage relationships.
3. On **Friday** you nominate two housemates (your picks carry double weight).
4. On **Saturday** there's a party — more actions, more drama.
5. On **Sunday**, the nominated housemate with the **lowest fanbase clout** is evicted.
6. Reach the final two and whoever has the highest clout wins the ₦100M.

Manage your **strikes** carefully — three and Biggie shows you the door.
