# TODO: Saltline FPS Quality Overhaul

## 1. Visual Quality & Environmental Atmosphere
- [x] Remove viewmodel overexposure glare on weapon
- [x] Remove rigid geometric cones from floodlight towers
- [x] Tune rain streaks (reduce count to 3,800 and opacity to 0.14 for natural wet atmospheric downpour)
- [x] Enhance terminal visibility (tune moonlight and ambient sky fill; lower fog density to 0.007 so cargo stacks and crane are visible)
- [x] Apply PBR normal maps and roughness maps to shipping containers and tarmac
- [x] Add subtle camera directional fill light for clear weapon silhouette and metallic specular definition
- [x] Add vertical green light beacon column to extraction zone when active

## 2. Weapon & Combat Physics
- [x] Implement obstacle raycasting (prevent bullets from penetrating shipping containers and walls)
- [x] Add dynamic viewmodel weapon sway during camera turns
- [x] Add synthesized ricochet and thunder sounds to SoundEngine
- [x] Verify weapon iron sights / holographic reticle alignment during Aim Down Sights (ADS)
- [x] Make EOTech holographic sight frame hollow (open window)
- [x] Align ADS viewmodel height (`y = -0.115`) with glowing cyan holographic reticle and crystal-clear optic glass

## 3. Enemy Units & AI Visuals
- [x] Upgrade Gull aerial drone model (aerodynamic hull, searchlight, quad-rotor spinning blades)
- [x] Upgrade Hound quadruped robot model (articulated running legs, armored chassis, red scanner eye)
- [x] Add enemy muzzle flash and laser tracer effects

## 4. Mission Flow & Objectives
- [x] 3 Security Relays destruction tracking
- [x] Electrical spark arc effects when damaging relays
- [x] Extraction zone visual beacon beam and victory trigger

## 5. Verification & Testing
- [x] Build production assets (`npm run build`)
- [x] Inspect hollow ADS sight in Chrome DevTools MCP and record screenshot
- [x] Inspect weapon lighting and extraction beacon in Chrome DevTools MCP
- [x] Verify clean console logs and zero errors

## 6. Combat & Cinematic Polish
- [x] Add enemy hit flash effect (flash red on bullet impact)
- [x] Add HUD audio toggle button (mute/unmute procedural sound)
- [x] Spawn tactical VTOL extraction dropship when all 3 relays are destroyed
- [x] Add green extraction zone beacon marker to radar minimap
- [x] Add mission statistics summary to defeat / game over screen

## 7. Controls Accessibility & Interactive Tutorial
- [x] Add Arrow keys navigation (ArrowUp/Down move, ArrowLeft/Right turn camera)
- [x] Make pointer lock optional with smooth trackpad and keyboard steering
- [x] Add floating controls guide button (`?`) at screen edge with tactical popover
- [x] Implement interactive step-by-step Tutorial Mode with real-time task confirmation

## 8. Visual & Logic Defect Fixes from Video/Screenshot Audit
- [x] Fix pixelated yellow and cyan square specular artifacts on wet asphalt puddles
- [x] Fix glowing white ring on suppressor tip caused by weapon flashlight clipping
- [x] Fix pitch-black weapon receiver and stock by adding target to camera fill light and tuning PBR metalness/roughness
- [x] Fix Tutorial Step 4 (`TACTICAL STRAFE`) skipping by checking actual strafe input (`A`/`D`)
- [x] Hide green extraction beacon beam until all 3 security relays are destroyed
- [x] Update initial briefing screen controls list to include Arrow keys and Trackpad drag
- [x] Hide center HUD crosshair lines while aiming down sights (ADS) so only optic reticle is shown
- [x] Fix oversized white rain splash rings (`O` shapes) and repeating dark circular puddle spots on wet asphalt tarmac
