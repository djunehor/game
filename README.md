# SALTLINE: Cargo Terminal Infiltration

A tactical first-person shooter (FPS) built with **Three.js** and **TypeScript**, running natively in the browser.

Infiltrate Sector 7—a storm-swept coastal shipping container terminal. Locate and destroy autonomous security relays, eliminate patrolling robotic defense units, and reach the extraction dropship before you are compromised.

---

## Overview

- **Engine & Graphics:** Built from the ground up on Three.js (WebGL) with PBR materials, custom procedural textures, normal & roughness maps, dynamic shadows, volumetric fog, and atmospheric rain downpour.
- **Synthesized Audio:** Fully procedural Web Audio API sound engine (tactical carbine fire, ricochets, spent brass ejection, distant rolling thunder, mechanical drone hums, footstep cadence).
- **Combat Physics:** Raycast bullet ballistics with obstacle penetration blocking, dynamic weapon sway, recoil impulse, and Aim Down Sights (ADS) through an open-frame holographic optic sight.
- **Autonomous Enemy AI:** 
  - **Gulls:** Aerial quad-rotor combat drones equipped with spotlight tracking, spinning rotors, and laser tracers.
  - **Hounds:** Quadruped robotic ground units with articulated running animations and red scanner sweeps.
- **Mission Flow:** Multi-phase objective system with real-time radar minimap, security relay sabotage, tactical VTOL dropship extraction, and combat statistics debrief.
- **Accessibility:** Keyboard-first controls with optional trackpad/mouse control (disabled by default so the browser cursor is never hijacked), mobile touch joystick support, and an interactive step-by-step tutorial calibration mode.

---

## Controls

### Desktop & Laptop

| Action | Keyboard Input (Default) | Optional Trackpad / Mouse (When Enabled) |
|---|---|---|
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> / <kbd>&uarr;</kbd> <kbd>&darr;</kbd> | — |
| **Turn / Look** | <kbd>&larr;</kbd> <kbd>&rarr;</kbd> | Click & Drag Trackpad / Mouse |
| **Fire Weapon** | <kbd>F</kbd> | <kbd>Left Click</kbd> |
| **Aim Down Sights (ADS)** | <kbd>Q</kbd> (Toggle) | <kbd>Right Click</kbd> (Hold) |
| **Reload** | <kbd>R</kbd> | — |
| **Sprint** | <kbd>Shift</kbd> (Hold) | — |
| **Jump** | <kbd>Space</kbd> | — |
| **Interact / Sabotage** | <kbd>E</kbd> | — |
| **Controls Guide** | Click <kbd>?</kbd> button | — |

### Mobile Touch

- **Left Screen:** Virtual analog joystick for smooth movement.
- **Right Screen:** Touch and drag to look and aim.
- **Dedicated Buttons:** `FIRE`, `AIM` (toggle optic zoom), `RELOAD`, and `JUMP`.

---

## Mission Objectives

1. **Infiltrate Sector 7:** Navigate through towering shipping container stacks, crane gantries, and floodlight towers under zero-visibility rainstorm conditions.
2. **Sabotage 3 Security Relays:** Locate autonomous power relays marked with warning beacons and destroy them via gunfire or proximity interaction.
3. **Neutralize Patrols:** Eliminate patrolling Gull aerial drones and Hound ground assault robots.
4. **Extract:** Once all relays are disabled, a tactical VTOL extraction dropship deploys with a vertical green light beacon marking the extraction zone.

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in any modern WebGL-compatible browser.

### Production Build

```bash
# Type check and bundle for production
npm run build

# Preview production build locally
npm run preview
```

### Code Quality & Testing

```bash
# Run ESLint
npm run lint

# Run headless gameplay test script
node scripts/test-gameplay.js
```

---

## Project Structure

```
├── index.html              # Canvas container, HUD overlays, briefing modals
├── src/
│   ├── main.ts             # Game bootstrap, loop orchestration, UI wiring
│   ├── style.css           # Tactical military HUD styling and animations
│   ├── audio/
│   │   └── SoundEngine.ts  # Web Audio API procedural sound synthesizer
│   ├── core/
│   │   └── GameState.ts    # Mission state, health, objective tracking, score
│   ├── enemies/
│   │   └── EnemyManager.ts # Gull drone & Hound quadruped AI, combat, animations
│   ├── environment/
│   │   └── PortEnvironment.ts # Cargo terminal, containers, lighting, rain, VTOL
│   ├── player/
│   │   └── PlayerController.ts # Movement physics, camera, input handling, raycasting
│   ├── textures/
│   │   └── ProceduralTextures.ts # PBR canvas textures (asphalt, containers, optic)
│   ├── tutorial/
│   │   └── TutorialManager.ts # Step-by-step interactive onboarding calibration
│   └── weapon/
│       └── Weapon.ts       # Viewmodel modeling, recoil, sway, ADS optic, casings
├── scripts/
│   └── test-gameplay.js    # Puppeteer headless gameplay verification script
├── TODO.md                 # Roadmap and task completion log
├── tsconfig.json           # TypeScript compiler configuration
└── vite.config.ts          # Vite build pipeline
```

---

## License

Private / Proprietary. All rights reserved.
