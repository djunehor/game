import * as THREE from 'three';
import { Weapon } from '../weapon/Weapon';
import { PortEnvironment, SecurityRelay } from '../environment/PortEnvironment';
import { EnemyManager } from '../enemies/EnemyManager';
import { SoundEngine } from '../audio/SoundEngine';
import { GameState } from '../core/GameState';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public weapon: Weapon;
  public environment: PortEnvironment;
  public enemyManager: EnemyManager;
  public sound: SoundEngine;
  public gameState: GameState;

  // Movement physics
  public position = new THREE.Vector3(0, 1.7, -100); // Spawn at south dock
  public velocity = new THREE.Vector3();
  public isGrounded: boolean = true;
  public isMoving: boolean = false;
  public isSprinting: boolean = false;

  private readonly walkSpeed = 5.2;
  private readonly sprintSpeed = 8.8;
  private readonly gravity = 22.0;
  private readonly jumpForce = 7.5;

  // Camera angles
  public pitch: number = 0;
  public yaw: number = Math.PI;

  // Input states
  private keys: Record<string, boolean> = {};
  public mouseControlEnabled: boolean = false;
  public isMouseDown: boolean = false;
  public isPointerLocked: boolean = false;
  private isDraggingMouse: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Mobile virtual joystick & touch look state
  private joystickActive: boolean = false;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickDelta = { x: 0, y: 0 };
  private lastTouchLookPos = { x: 0, y: 0 };
  private touchLookId: number | null = null;

  // Footstep audio timer
  private footstepTimer: number = 0;

  // Hit Marker UI callback & Shot/Reload callbacks
  public onHitEnemy: (() => void) | null = null;
  public onShotFired: (() => void) | null = null;
  public onReloadTriggered: (() => void) | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    weapon: Weapon,
    environment: PortEnvironment,
    enemyManager: EnemyManager,
    sound: SoundEngine,
    gameState: GameState
  ) {
    this.camera = camera;
    this.weapon = weapon;
    this.environment = environment;
    this.enemyManager = enemyManager;
    this.sound = sound;
    this.gameState = gameState;

    this.camera.position.copy(this.position);
    this.setupDesktopInputs();
    this.setupMobileInputs();
  }

  public setMouseControlEnabled(enabled: boolean): void {
    this.mouseControlEnabled = enabled;
    if (!enabled) {
      this.isMouseDown = false;
      this.isDraggingMouse = false;
      this.pitch = 0;
      if (document.pointerLockElement === document.body) {
        document.exitPointerLock?.();
      }
    }
  }

  public toggleMouseControl(): boolean {
    this.setMouseControlEnabled(!this.mouseControlEnabled);
    return this.mouseControlEnabled;
  }

  private setupDesktopInputs(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyR' && this.gameState.phase === 'playing') {
        this.weapon.startReload();
        this.onReloadTriggered?.();
      }
      if (e.code === 'KeyQ' && !e.repeat && this.gameState.phase === 'playing') {
        this.weapon.toggleAim();
      }
      if (e.code === 'Space' && this.isGrounded && this.gameState.phase === 'playing') {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.isMouseDown = false;
      this.isDraggingMouse = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (this.gameState.phase !== 'playing' || !this.mouseControlEnabled) return;

      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, input, label, a, .overlay-modal, .hud-panel, .help-badge, .tutorial-banner')) {
        return;
      }

      this.isDraggingMouse = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (e.button === 0) { // Left Click (Shoot)
        this.isMouseDown = true;
      } else if (e.button === 2) { // Right Click (ADS)
        this.weapon.setAim(true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      this.isDraggingMouse = false;
      if (!this.mouseControlEnabled) return;
      if (e.button === 0) {
        this.isMouseDown = false;
      } else if (e.button === 2) {
        this.weapon.setAim(false);
      }
    });

    window.addEventListener('contextmenu', (e) => {
      if (this.mouseControlEnabled && this.gameState.phase === 'playing') {
        e.preventDefault();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === document.body;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.gameState.phase !== 'playing' || !this.mouseControlEnabled) return;

      const sensitivity = this.weapon.state.isAiming ? 0.0012 : 0.0022;

      if (this.isPointerLocked) {
        this.yaw -= e.movementX * sensitivity;
        this.pitch -= e.movementY * sensitivity;
        this.weapon.updateSway(e.movementX, e.movementY);
      } else if (this.isDraggingMouse) {
        // Laptop trackpad / mouse drag mode without hijacking cursor
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.yaw -= dx * sensitivity * 1.5;
        this.pitch -= dy * sensitivity * 1.5;
        this.weapon.updateSway(dx, dy);
      }

      // Clamp pitch (-85 to +85 degrees)
      const maxPitch = (85 * Math.PI) / 180;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });
  }

  private setupMobileInputs(): void {
    const joystickZone = document.getElementById('touch-joystick-zone');
    const joystickThumb = document.getElementById('touch-joystick-thumb');

    if (joystickZone && joystickThumb) {
      joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystickZone.getBoundingClientRect();
        this.joystickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        this.joystickActive = true;
        this.updateJoystick(touch.clientX, touch.clientY, joystickThumb);
      }, { passive: false });

      joystickZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!this.joystickActive) return;
        const touch = e.touches[0];
        this.updateJoystick(touch.clientX, touch.clientY, joystickThumb);
      }, { passive: false });

      const resetJoystick = () => {
        this.joystickActive = false;
        this.joystickDelta = { x: 0, y: 0 };
        joystickThumb.style.transform = 'translate(-50%, -50%)';
      };

      joystickZone.addEventListener('touchend', resetJoystick);
      joystickZone.addEventListener('touchcancel', resetJoystick);
    }

    // Touch look drag on the right screen half
    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX > window.innerWidth * 0.4 && this.touchLookId === null) {
          this.touchLookId = touch.identifier;
          this.lastTouchLookPos = { x: touch.clientX, y: touch.clientY };
        }
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (this.touchLookId === null || this.gameState.phase !== 'playing') return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchLookId) {
          const dx = touch.clientX - this.lastTouchLookPos.x;
          const dy = touch.clientY - this.lastTouchLookPos.y;
          this.lastTouchLookPos = { x: touch.clientX, y: touch.clientY };

          const sensitivity = 0.0035;
          this.yaw -= dx * sensitivity;
          this.pitch -= dy * sensitivity;
          const maxPitch = (85 * Math.PI) / 180;
          this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        }
      }
    });

    const endTouchLook = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchLookId) {
          this.touchLookId = null;
        }
      }
    };
    window.addEventListener('touchend', endTouchLook);
    window.addEventListener('touchcancel', endTouchLook);

    // Mobile Action buttons
    const btnFire = document.getElementById('btn-touch-fire');
    if (btnFire) {
      btnFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isMouseDown = true;
      });
      btnFire.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.isMouseDown = false;
      });
    }

    const btnAds = document.getElementById('btn-touch-ads');
    if (btnAds) {
      btnAds.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.weapon.toggleAim();
      });
    }

    const btnReload = document.getElementById('btn-touch-reload');
    if (btnReload) {
      btnReload.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.weapon.startReload();
      });
    }

    const btnJump = document.getElementById('btn-touch-jump');
    if (btnJump) {
      btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.isGrounded && this.gameState.phase === 'playing') {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
        }
      });
    }
  }

  private updateJoystick(clientX: number, clientY: number, thumb: HTMLElement): void {
    const maxRadius = 45;
    let dx = clientX - this.joystickOrigin.x;
    let dy = clientY - this.joystickOrigin.y;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    this.joystickDelta = { x: dx / maxRadius, y: dy / maxRadius };
  }

  public update(delta: number): void {
    if (this.gameState.phase !== 'playing') return;

    // 1. Process Shooting
    if ((this.isMouseDown || this.keys['KeyF']) && this.weapon.canFire()) {
      const fired = this.weapon.fire();
      if (fired) {
        this.performRaycastShot();
        this.onShotFired?.();
      }
    }

    // Keyboard camera turning (ArrowLeft / ArrowRight) for laptop and keyboard navigation
    const turnSensitivity = (this.weapon.state.isAiming ? 1.6 : 2.5) * delta;
    if (this.keys['ArrowLeft']) {
      this.yaw += turnSensitivity;
      this.weapon.updateSway(-10, 0);
    }
    if (this.keys['ArrowRight']) {
      this.yaw -= turnSensitivity;
      this.weapon.updateSway(10, 0);
    }

    // 2. Compute Movement Vectors
    this.isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const moveSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    let moveX = 0;
    let moveZ = 0;

    // Desktop Key input (WASD + Arrow Keys)
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA']) moveX -= 1;
    if (this.keys['KeyD']) moveX += 1;

    // Mobile Joystick input
    if (this.joystickActive) {
      moveX += this.joystickDelta.x;
      moveZ -= this.joystickDelta.y;
    }

    // Normalize horizontal movement
    const inputLen = Math.hypot(moveX, moveZ);
    if (inputLen > 1) {
      moveX /= inputLen;
      moveZ /= inputLen;
    }

    this.isMoving = inputLen > 0.05;

    // Apply rotation relative to camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const targetVelX = (forward.x * moveZ + right.x * moveX) * moveSpeed;
    const targetVelZ = (forward.z * moveZ + right.z * moveX) * moveSpeed;

    // Horizontal acceleration & friction
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, 10 * delta);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, 10 * delta);

    // Vertical gravity
    this.velocity.y -= this.gravity * delta;

    // 3. Collision Resolution with Environment (AABB)
    const nextPos = this.position.clone();
    nextPos.x += this.velocity.x * delta;
    if (!this.checkPlayerCollision(nextPos)) {
      this.position.x = nextPos.x;
    } else {
      this.velocity.x = 0;
    }

    nextPos.copy(this.position);
    nextPos.z += this.velocity.z * delta;
    if (!this.checkPlayerCollision(nextPos)) {
      this.position.z = nextPos.z;
    } else {
      this.velocity.z = 0;
    }

    nextPos.copy(this.position);
    nextPos.y += this.velocity.y * delta;
    if (nextPos.y <= 1.7) {
      // Ground plane
      this.position.y = 1.7;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextPos.y;
    }

    // Keep within dock boundaries
    this.position.x = Math.max(-58, Math.min(58, this.position.x));
    this.position.z = Math.max(-115, Math.min(115, this.position.z));

    // 4. Update Camera Rotation & Position
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);
    this.camera.position.copy(this.position);

    // 5. Weapon Update
    this.weapon.update(delta, this.isMoving, this.isSprinting);

    // 6. Footstep Sounds
    if (this.isMoving && this.isGrounded) {
      this.footstepTimer += delta;
      const stepInterval = this.isSprinting ? 0.32 : 0.48;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        this.sound.playFootstep(this.isSprinting);
      }
    } else {
      this.footstepTimer = 0;
    }

    // 7. Check Extraction Zone
    if (this.environment.extractionCollider && this.gameState.checkVictory()) {
      const playerBox = new THREE.Box3().setFromCenterAndSize(this.position, new THREE.Vector3(1, 2, 1));
      if (playerBox.intersectsBox(this.environment.extractionCollider)) {
        this.gameState.triggerExtraction();
      }
    }
  }

  private checkPlayerCollision(pos: THREE.Vector3): boolean {
    const playerRadius = 0.55;
    const playerHeight = 1.8;
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(pos.x, pos.y - 0.8, pos.z),
      new THREE.Vector3(playerRadius * 2, playerHeight, playerRadius * 2)
    );

    for (const collider of this.environment.colliders) {
      if (playerBox.intersectsBox(collider)) {
        return true;
      }
    }
    return false;
  }

  private performRaycastShot(): void {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    let closestHitDist = Infinity;
    let hitType: 'none' | 'obstacle' | 'enemy' | 'relay' = 'none';
    let targetEnemy: any = null;
    let targetRelay: SecurityRelay | null = null;
    const hitPoint = new THREE.Vector3();

    // 1. Raycast Environment Obstacles (Containers, Walls, Barriers, Cranes)
    if (this.environment.obstacleMeshes.length > 0) {
      const obstacleHits = raycaster.intersectObjects(this.environment.obstacleMeshes, true);
      if (obstacleHits.length > 0 && obstacleHits[0].distance < closestHitDist) {
        closestHitDist = obstacleHits[0].distance;
        hitType = 'obstacle';
        hitPoint.copy(obstacleHits[0].point);
      }
    }

    // 2. Raycast Enemies
    for (const enemy of this.enemyManager.enemies) {
      if (enemy.isDead) continue;
      const enemyHits = raycaster.intersectObject(enemy.mesh, true);
      if (enemyHits.length > 0 && enemyHits[0].distance < closestHitDist) {
        closestHitDist = enemyHits[0].distance;
        hitType = 'enemy';
        targetEnemy = enemy;
        hitPoint.copy(enemyHits[0].point);
      }
    }

    // 3. Raycast Relays
    for (const relay of this.environment.relays) {
      if (relay.isDestroyed) continue;
      const relayHits = raycaster.intersectObject(relay.mesh, true);
      if (relayHits.length > 0 && relayHits[0].distance < closestHitDist) {
        closestHitDist = relayHits[0].distance;
        hitType = 'relay';
        targetRelay = relay;
        hitPoint.copy(relayHits[0].point);
      }
    }

    // Process closest impact
    if (hitType === 'enemy' && targetEnemy) {
      const died = this.enemyManager.damageEnemy(targetEnemy, 35);
      this.sound.playHitMarker();
      this.triggerHitMarkerUI();
      this.enemyManager.createExplosion(hitPoint, 0xff4422);

      if (died) {
        this.gameState.eliminateEnemy();
      }
      this.gameState.recordShot(true);
    } else if (hitType === 'relay' && targetRelay) {
      targetRelay.health -= 40;
      this.sound.playHitMarker();
      this.triggerHitMarkerUI();
      this.enemyManager.createExplosion(hitPoint, 0x00f0ff);

      if (targetRelay.health <= 0) {
        this.destroyRelay(targetRelay);
      }
      this.gameState.recordShot(true);
    } else if (hitType === 'obstacle') {
      // Impact sparks and ricochet sound on container / concrete wall
      this.sound.playRicochet();
      this.enemyManager.createExplosion(hitPoint, 0xffcc44);
      this.gameState.recordShot(false);
    } else {
      this.gameState.recordShot(false);
    }
  }

  private destroyRelay(relay: SecurityRelay): void {
    relay.isDestroyed = true;
    relay.light.color.setHex(0xff3300);
    this.sound.playExplosion();
    this.enemyManager.createExplosion(relay.position.clone().add(new THREE.Vector3(0, 2.8, 0)), 0x00f0ff);
    this.gameState.destroyRelay();
  }

  private triggerHitMarkerUI(): void {
    if (this.onHitEnemy) {
      this.onHitEnemy();
    }
  }
}
