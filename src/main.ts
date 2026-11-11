import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GameState } from './core/GameState';
import { SoundEngine } from './audio/SoundEngine';
import { PortEnvironment } from './environment/PortEnvironment';
import { Weapon } from './weapon/Weapon';
import { EnemyManager } from './enemies/EnemyManager';
import { PlayerController } from './player/PlayerController';
import { TutorialManager } from './tutorial/TutorialManager';

class GameApp {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  private gameState: GameState;
  private sound: SoundEngine;
  private tutorialManager: TutorialManager;
  private environment!: PortEnvironment;
  private weapon!: Weapon;
  private enemyManager!: EnemyManager;
  private player!: PlayerController;

  // DOM Elements
  private hudElement: HTMLElement;
  private startScreen: HTMLElement;
  private victoryScreen: HTMLElement;
  private defeatScreen: HTMLElement;
  private healthBar: HTMLElement;
  private healthVal: HTMLElement;
  private ammoClip: HTMLElement;
  private ammoReserve: HTMLElement;
  private weaponStatus: HTMLElement;
  private objectiveText: HTMLElement;
  private subObjectiveText: HTMLElement;
  private radarBlipsContainer: HTMLElement;
  private crosshairContainer: HTMLElement;
  private hitMarker: HTMLElement;
  private damageVignette: HTMLElement;

  constructor() {
    this.gameState = new GameState();
    this.sound = new SoundEngine();
    this.tutorialManager = new TutorialManager(this.sound);
    this.clock = new THREE.Clock();

    // 1. Setup Three.js Scene and Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 400);
    this.scene.add(this.camera);

    const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Cinematic Postprocessing (Bloom & Tonemapping)
    const renderPass = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.75, // Bloom strength
      0.45, // Bloom radius
      0.22  // Bloom threshold
    );
    const outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(bloomPass);
    this.composer.addPass(outputPass);

    // 2. Fetch DOM elements
    this.hudElement = document.getElementById('hud')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.victoryScreen = document.getElementById('victory-screen')!;
    this.defeatScreen = document.getElementById('defeat-screen')!;
    this.healthBar = document.getElementById('health-bar')!;
    this.healthVal = document.getElementById('health-val')!;
    this.ammoClip = document.getElementById('ammo-clip')!;
    this.ammoReserve = document.getElementById('ammo-reserve')!;
    this.weaponStatus = document.getElementById('weapon-status')!;
    this.objectiveText = document.getElementById('objective-text')!;
    this.subObjectiveText = document.getElementById('sub-objective-text')!;
    this.radarBlipsContainer = document.getElementById('radar-blips')!;
    this.crosshairContainer = document.getElementById('crosshair-container')!;
    this.hitMarker = document.getElementById('hit-marker')!;
    this.damageVignette = document.getElementById('damage-vignette')!;

    // 3. Initialize Components
    this.initGameWorld();
    this.setupEvents();

    // 4. Start Render Loop
    this.animate();
  }

  private initGameWorld(): void {
    this.environment = new PortEnvironment(this.scene);
    this.weapon = new Weapon(this.camera, this.scene, this.sound);
    this.enemyManager = new EnemyManager(this.scene, this.sound);

    this.player = new PlayerController(
      this.camera,
      this.weapon,
      this.environment,
      this.enemyManager,
      this.sound,
      this.gameState
    );

    this.player.onHitEnemy = () => {
      this.showHitMarker();
    };

    this.player.onShotFired = () => {
      if (this.tutorialManager.isActive) {
        this.tutorialManager.checkProgress(
          this.player.yaw,
          { x: this.player.position.x, z: this.player.position.z },
          this.player.isGrounded,
          this.weapon.state.isAiming,
          true,
          this.weapon.state.isReloading
        );
      }
    };

    this.tutorialManager.initDOM();
  }

  private setupEvents(): void {
    // Deploy button (Direct Mission)
    document.getElementById('btn-deploy')?.addEventListener('click', () => {
      this.startGame(false);
    });

    // Start with Tutorial button
    document.getElementById('btn-start-tutorial')?.addEventListener('click', () => {
      this.startGame(true);
    });

    // Controls Help Modal
    const modalControls = document.getElementById('controls-modal');
    document.getElementById('btn-controls-help')?.addEventListener('click', () => {
      modalControls?.classList.toggle('hidden');
    });
    document.getElementById('btn-close-controls')?.addEventListener('click', () => {
      modalControls?.classList.add('hidden');
    });
    document.getElementById('btn-dismiss-controls')?.addEventListener('click', () => {
      modalControls?.classList.add('hidden');
    });

    // Audio Toggle button
    const btnAudio = document.getElementById('audio-toggle');
    btnAudio?.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      if (btnAudio) {
        btnAudio.innerText = isMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
      }
    });

    // Restart buttons
    document.getElementById('btn-restart-victory')?.addEventListener('click', () => {
      this.restartGame();
    });
    document.getElementById('btn-restart-defeat')?.addEventListener('click', () => {
      this.restartGame();
    });

    // Window Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private startGame(withTutorial: boolean = false): void {
    this.sound.init();
    this.sound.resume();
    this.gameState.start();

    this.startScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
    this.defeatScreen.classList.add('hidden');
    this.hudElement.classList.remove('hidden');

    if (withTutorial) {
      this.tutorialManager.start(this.player.yaw, {
        x: this.player.position.x,
        z: this.player.position.z,
      });
    }

    try {
      const lockPromise = document.body.requestPointerLock?.();
      if (lockPromise && typeof (lockPromise as unknown as Promise<void>).catch === 'function') {
        (lockPromise as unknown as Promise<void>).catch(() => {});
      }
    } catch {
      // Ignore pointer lock rejections in automated environments
    }
  }

  private restartGame(): void {
    window.location.reload();
  }

  private showHitMarker(): void {
    this.hitMarker.classList.remove('hidden');
    this.hitMarker.classList.add('show');
    setTimeout(() => {
      this.hitMarker.classList.remove('show');
      this.hitMarker.classList.add('hidden');
    }, 90);
  }

  private onPlayerDamaged(damage: number): void {
    const died = this.gameState.takeDamage(damage);

    // Red vignette flash
    this.damageVignette.classList.add('hit');
    setTimeout(() => {
      this.damageVignette.classList.remove('hit');
    }, 180);

    if (died) {
      document.exitPointerLock?.();
      this.hudElement.classList.add('hidden');
      this.defeatScreen.classList.remove('hidden');

      const elRelays = document.getElementById('stat-defeat-relays');
      if (elRelays) elRelays.innerText = `${this.gameState.relaysDestroyed}/${this.gameState.totalRelays}`;
      const elEnemies = document.getElementById('stat-defeat-enemies');
      if (elEnemies) elEnemies.innerText = `${this.gameState.enemiesEliminated}`;
      const elTime = document.getElementById('stat-defeat-time');
      if (elTime) elTime.innerText = this.gameState.getFormattedTime();
    }
  }

  private updateHUD(): void {
    // Health Bar
    const healthPercent = Math.max(0, (this.gameState.health / this.gameState.maxHealth) * 100);
    this.healthBar.style.width = `${healthPercent}%`;
    this.healthVal.innerText = `${Math.ceil(this.gameState.health)}`;

    // Weapon Ammo
    this.ammoClip.innerText = `${this.weapon.state.ammoClip}`;
    this.ammoReserve.innerText = `${this.weapon.state.ammoReserve}`;

    if (this.weapon.state.isReloading) {
      this.weaponStatus.innerText = 'RELOADING...';
      this.weaponStatus.className = 'status-reloading';
    } else if (this.weapon.state.ammoClip === 0) {
      this.weaponStatus.innerText = 'EMPTY [R]';
      this.weaponStatus.className = 'status-empty';
    } else {
      this.weaponStatus.innerText = 'READY';
      this.weaponStatus.className = 'status-ready';
    }

    // Crosshair spread & aim
    if (this.weapon.state.isAiming) {
      this.crosshairContainer.className = 'aiming';
    } else if (this.player.isMoving) {
      this.crosshairContainer.className = 'spread';
    } else {
      this.crosshairContainer.className = '';
    }

    // Mission Objectives
    if (this.gameState.relaysDestroyed < this.gameState.totalRelays) {
      this.objectiveText.innerText = `DESTROY SECURITY RELAYS (${this.gameState.relaysDestroyed}/${this.gameState.totalRelays})`;
    } else {
      this.objectiveText.innerText = 'PRIMARY COMPLETE: PROCEED TO EXTRACTION ZONE';
      this.objectiveText.style.color = '#00ff88';
      this.environment.spawnDropship();
    }

    const aliveEnemies = this.enemyManager.enemies.filter(e => !e.isDead).length;
    this.subObjectiveText.innerText = `HOSTILES ACTIVE: ${aliveEnemies} // EXTRACTION: NORTH DOCK`;

    // Radar Minimap Update
    this.updateRadar();

    // Check Victory
    if (this.gameState.phase === 'victory') {
      document.exitPointerLock?.();
      this.hudElement.classList.add('hidden');
      this.victoryScreen.classList.remove('hidden');

      document.getElementById('stat-relays')!.innerText = `${this.gameState.relaysDestroyed}/${this.gameState.totalRelays}`;
      document.getElementById('stat-enemies')!.innerText = `${this.gameState.enemiesEliminated}`;
      document.getElementById('stat-time')!.innerText = this.gameState.getFormattedTime();
      document.getElementById('stat-accuracy')!.innerText = `${this.gameState.getAccuracy()}%`;
    }
  }

  private updateRadar(): void {
    const radarRadius = 36; // px (half of 72px radar)
    const maxWorldRange = 75; // meters in world

    let html = '';
    const playerPos = this.player.position;
    const playerYaw = this.player.yaw;

    // Project Relays
    for (const relay of this.environment.relays) {
      if (relay.isDestroyed) continue;
      const dx = relay.position.x - playerPos.x;
      const dz = relay.position.z - playerPos.z;

      // Rotate relative to player yaw
      const rotX = dx * Math.cos(-playerYaw) - dz * Math.sin(-playerYaw);
      const rotZ = dx * Math.sin(-playerYaw) + dz * Math.cos(-playerYaw);

      const blipX = (rotX / maxWorldRange) * radarRadius;
      const blipY = (rotZ / maxWorldRange) * radarRadius;

      if (Math.hypot(blipX, blipY) < radarRadius - 2) {
        html += `<div class="radar-blip relay" style="left: ${radarRadius + blipX}px; top: ${radarRadius - blipY}px;"></div>`;
      }
    }

    // Project Enemies
    for (const enemy of this.enemyManager.enemies) {
      if (enemy.isDead) continue;
      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;

      const rotX = dx * Math.cos(-playerYaw) - dz * Math.sin(-playerYaw);
      const rotZ = dx * Math.sin(-playerYaw) + dz * Math.cos(-playerYaw);

      const blipX = (rotX / maxWorldRange) * radarRadius;
      const blipY = (rotZ / maxWorldRange) * radarRadius;

      if (Math.hypot(blipX, blipY) < radarRadius - 2) {
        html += `<div class="radar-blip" style="left: ${radarRadius + blipX}px; top: ${radarRadius - blipY}px;"></div>`;
      }
    }

    // Project Extraction Zone
    if (this.environment.extractionPad) {
      const extPos = this.environment.extractionPad.position;
      const dx = extPos.x - playerPos.x;
      const dz = extPos.z - playerPos.z;

      const rotX = dx * Math.cos(-playerYaw) - dz * Math.sin(-playerYaw);
      const rotZ = dx * Math.sin(-playerYaw) + dz * Math.cos(-playerYaw);

      const blipX = (rotX / maxWorldRange) * radarRadius;
      const blipY = (rotZ / maxWorldRange) * radarRadius;

      if (Math.hypot(blipX, blipY) < radarRadius - 2) {
        html += `<div class="radar-blip extraction" style="left: ${radarRadius + blipX}px; top: ${radarRadius - blipY}px;"></div>`;
      }
    }

    this.radarBlipsContainer.innerHTML = html;
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.gameState.phase === 'playing') {
      this.player.update(delta);

      if (this.tutorialManager.isActive) {
        this.tutorialManager.checkProgress(
          this.player.yaw,
          { x: this.player.position.x, z: this.player.position.z },
          this.player.isGrounded,
          this.weapon.state.isAiming,
          false,
          this.weapon.state.isReloading
        );
      }

      this.enemyManager.update(delta, this.player.position, (damage) => {
        const tutorialDamage = this.tutorialManager.isActive ? 0 : damage;
        if (tutorialDamage > 0) {
          this.onPlayerDamaged(tutorialDamage);
        }
      });
      this.environment.update(delta, this.player.position);
      this.updateHUD();
    }

    this.composer.render();
  };
}

// Start game application
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});

