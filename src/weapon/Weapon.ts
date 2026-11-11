import * as THREE from 'three';
import { SoundEngine } from '../audio/SoundEngine';
import { ProceduralTextures } from '../textures/ProceduralTextures';

export interface WeaponState {
  ammoClip: number;
  ammoReserve: number;
  maxClip: number;
  isReloading: boolean;
  isAiming: boolean;
}

export class Weapon {
  public group: THREE.Group;
  public state: WeaponState;

  // Viewmodel Positions
  private readonly hipPosition = new THREE.Vector3(0.18, -0.22, -0.42);
  private readonly adsPosition = new THREE.Vector3(0.0, -0.115, -0.28);

  private targetPosition: THREE.Vector3;
  private targetRotation: THREE.Euler;

  // Sway and Recoil
  private recoilOffset = new THREE.Vector3();
  private recoilRotation = new THREE.Euler();
  private swayOffset = new THREE.Vector2();

  // Timing
  private lastFireTime: number = 0;
  private readonly fireInterval: number = 100; // ms between shots (600 RPM)
  private reloadStartTime: number = 0;
  private readonly reloadDuration: number = 1600; // ms

  // Components
  private muzzleFlashMesh: THREE.Sprite;
  private muzzleFlashLight: THREE.PointLight;
  private muzzleFlashTimer: number = 0;
  private weaponFlashlight: THREE.SpotLight | null = null;

  private sound: SoundEngine;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;

  // Spent casings
  private casings: { mesh: THREE.Mesh; velocity: THREE.Vector3; rotSpeed: THREE.Vector3; life: number }[] = [];

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene, sound: SoundEngine) {
    this.camera = camera;
    this.scene = scene;
    this.sound = sound;

    this.state = {
      ammoClip: 30,
      ammoReserve: 120,
      maxClip: 30,
      isReloading: false,
      isAiming: false,
    };

    this.targetPosition = this.hipPosition.clone();
    this.targetRotation = new THREE.Euler(0, 0, 0);

    this.group = new THREE.Group();
    this.buildHighFidelityWeapon();

    // Muzzle Flash
    const flashTex = ProceduralTextures.getInstance().createMuzzleFlashTexture();
    const flashMat = new THREE.SpriteMaterial({
      map: flashTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    this.muzzleFlashMesh = new THREE.Sprite(flashMat);
    this.muzzleFlashMesh.scale.set(0.35, 0.35, 0.35);
    this.muzzleFlashMesh.position.set(0, 0.045, -0.72);
    this.muzzleFlashMesh.visible = false;
    this.group.add(this.muzzleFlashMesh);

    this.muzzleFlashLight = new THREE.PointLight(0xffaa33, 0, 8);
    this.muzzleFlashLight.position.set(0, 0.045, -0.72);
    this.group.add(this.muzzleFlashLight);

    // Camera-attached directional fill lights (with targets on camera) for clear gunmetal definition
    const weaponFillLight = new THREE.DirectionalLight(0x8fb0d0, 1.8);
    weaponFillLight.position.set(0.8, 1.4, 0.6);
    weaponFillLight.target.position.set(0, -0.2, -0.4);
    this.camera.add(weaponFillLight);
    this.camera.add(weaponFillLight.target);

    const weaponRimLight = new THREE.DirectionalLight(0x607890, 1.1);
    weaponRimLight.position.set(-0.8, 0.6, 0.2);
    weaponRimLight.target.position.set(0, -0.2, -0.4);
    this.camera.add(weaponRimLight);
    this.camera.add(weaponRimLight.target);

    // Initial position
    this.group.position.copy(this.hipPosition);
    this.camera.add(this.group);
  }

  private buildHighFidelityWeapon(): void {
    const texGen = ProceduralTextures.getInstance();
    const metalTex = texGen.createGunMetalTexture();
    const polymerTex = texGen.createPolymerTexture();
    const holoTex = texGen.createHoloReticleTexture();

    const receiverMat = new THREE.MeshStandardMaterial({
      map: metalTex,
      color: 0x3e4854,
      metalness: 0.45,
      roughness: 0.42,
    });

    const polymerMat = new THREE.MeshStandardMaterial({
      map: polymerTex,
      color: 0x2a3038,
      metalness: 0.15,
      roughness: 0.65,
    });

    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x303842,
      metalness: 0.55,
      roughness: 0.35,
    });

    // 1. Lower Receiver with Magazine Well & Trigger Guard
    const lowerGeo = new THREE.BoxGeometry(0.042, 0.065, 0.22);
    const lower = new THREE.Mesh(lowerGeo, receiverMat);
    this.group.add(lower);

    // Trigger Guard & Curved Trigger
    const guardGeo = new THREE.TorusGeometry(0.022, 0.003, 6, 12, Math.PI);
    const guard = new THREE.Mesh(guardGeo, barrelMat);
    guard.position.set(0, -0.042, 0.02);
    guard.rotation.y = Math.PI / 2;
    this.group.add(guard);

    const triggerGeo = new THREE.BoxGeometry(0.004, 0.016, 0.006);
    const trigger = new THREE.Mesh(triggerGeo, barrelMat);
    trigger.position.set(0, -0.035, 0.02);
    trigger.rotation.x = -0.3;
    this.group.add(trigger);

    // Ergonomic Stippled Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.036, 0.13, 0.048);
    const grip = new THREE.Mesh(gripGeo, polymerMat);
    grip.position.set(0, -0.085, 0.065);
    grip.rotation.x = -0.32;
    this.group.add(grip);

    // 2. Upper Receiver with Ejection Port
    const upperGeo = new THREE.BoxGeometry(0.040, 0.048, 0.24);
    const upper = new THREE.Mesh(upperGeo, receiverMat);
    upper.position.set(0, 0.042, -0.02);
    this.group.add(upper);

    // Ejection Port Cover (Right side)
    const portGeo = new THREE.BoxGeometry(0.004, 0.018, 0.055);
    const port = new THREE.Mesh(portGeo, barrelMat);
    port.position.set(0.021, 0.045, -0.02);
    this.group.add(port);

    // Brass Deflector Wedge
    const deflectorGeo = new THREE.ConeGeometry(0.012, 0.018, 4);
    const deflector = new THREE.Mesh(deflectorGeo, receiverMat);
    deflector.position.set(0.024, 0.045, 0.02);
    deflector.rotation.z = -Math.PI / 2;
    this.group.add(deflector);

    // 3. Top Picatinny Rail System (Segmented Teeth)
    const railBaseGeo = new THREE.BoxGeometry(0.022, 0.008, 0.38);
    const railBase = new THREE.Mesh(railBaseGeo, receiverMat);
    railBase.position.set(0, 0.07, -0.1);
    this.group.add(railBase);

    // Rail teeth notches
    const toothGeo = new THREE.BoxGeometry(0.024, 0.004, 0.006);
    for (let z = -0.28; z <= 0.08; z += 0.018) {
      const tooth = new THREE.Mesh(toothGeo, barrelMat);
      tooth.position.set(0, 0.075, z);
      this.group.add(tooth);
    }

    // 4. M-LOK Octagonal Handguard with Ventilation Slots
    const handguardGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.28, 8);
    const handguard = new THREE.Mesh(handguardGeo, receiverMat);
    handguard.position.set(0, 0.038, -0.27);
    handguard.rotation.x = Math.PI / 2;
    this.group.add(handguard);

    // 5. Heavy Fluted Barrel & Tactical Suppressor
    const barrelGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.42, 12);
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0.038, -0.38);
    barrel.rotation.x = Math.PI / 2;
    this.group.add(barrel);

    // Threaded Suppressor / Flash Compensator
    const suppressorGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.16, 16);
    const suppressor = new THREE.Mesh(suppressorGeo, barrelMat);
    suppressor.position.set(0, 0.038, -0.62);
    suppressor.rotation.x = Math.PI / 2;
    this.group.add(suppressor);

    // Suppressor Knurling rings
    const ringGeo = new THREE.TorusGeometry(0.021, 0.002, 6, 16);
    for (let sz = -0.68; sz <= -0.56; sz += 0.03) {
      const ring = new THREE.Mesh(ringGeo, receiverMat);
      ring.position.set(0, 0.038, sz);
      this.group.add(ring);
    }

    // 6. Tactical Stock with Buffer Tube
    const tubeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.16, 12);
    const tube = new THREE.Mesh(tubeGeo, barrelMat);
    tube.position.set(0, 0.035, 0.16);
    tube.rotation.x = Math.PI / 2;
    this.group.add(tube);

    const stockGeo = new THREE.BoxGeometry(0.038, 0.095, 0.16);
    const stock = new THREE.Mesh(stockGeo, polymerMat);
    stock.position.set(0, 0.015, 0.22);
    this.group.add(stock);

    // Rubber Buttpad
    const buttpadGeo = new THREE.BoxGeometry(0.039, 0.11, 0.018);
    const buttpad = new THREE.Mesh(buttpadGeo, polymerMat);
    buttpad.position.set(0, 0.015, 0.30);
    this.group.add(buttpad);

    // 7. Curved Polymer Magazine (30 Rounds)
    const magGeo = new THREE.BoxGeometry(0.032, 0.18, 0.065);
    const mag = new THREE.Mesh(magGeo, polymerMat);
    mag.position.set(0, -0.095, -0.045);
    mag.rotation.x = 0.18;
    this.group.add(mag);

    // 8. EOTech Holographic Sight
    const sightBaseGeo = new THREE.BoxGeometry(0.038, 0.025, 0.09);
    const sightBase = new THREE.Mesh(sightBaseGeo, polymerMat);
    sightBase.position.set(0, 0.088, -0.08);
    this.group.add(sightBase);

    // Protective Aluminum Hood Frame (Hollow window for reticle sight line)
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x36404a,
      metalness: 0.5,
      roughness: 0.38,
    });
    // Top roof plate
    const hoodRoofGeo = new THREE.BoxGeometry(0.044, 0.005, 0.075);
    const hoodRoof = new THREE.Mesh(hoodRoofGeo, hoodMat);
    hoodRoof.position.set(0, 0.138, -0.08);
    this.group.add(hoodRoof);

    // Left wall plate
    const hoodWallGeo = new THREE.BoxGeometry(0.005, 0.042, 0.075);
    const hoodLeft = new THREE.Mesh(hoodWallGeo, hoodMat);
    hoodLeft.position.set(-0.020, 0.117, -0.08);
    this.group.add(hoodLeft);

    // Right wall plate
    const hoodRight = new THREE.Mesh(hoodWallGeo, hoodMat);
    hoodRight.position.set(0.020, 0.117, -0.08);
    this.group.add(hoodRight);

    // Glass Optic Lens with Antireflective Tint
    const glassGeo = new THREE.PlaneGeometry(0.036, 0.036);
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0x183040,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const glassFront = new THREE.Mesh(glassGeo, glassMat);
    glassFront.position.set(0, 0.115, -0.118);
    this.group.add(glassFront);

    const glassBack = new THREE.Mesh(glassGeo, glassMat);
    glassBack.position.set(0, 0.115, -0.042);
    this.group.add(glassBack);

    // Holographic Reticle Plane (Cyan Glowing Reticle)
    const reticleGeo = new THREE.PlaneGeometry(0.032, 0.032);
    const reticleMat = new THREE.MeshBasicMaterial({
      map: holoTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.position.set(0, 0.115, -0.08);
    this.group.add(reticle);

    // 9. Tactical Weapon Flashlight (Casts Dynamic Beam into the Rain)
    const lightHousingGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.09, 12);
    const lightHousing = new THREE.Mesh(lightHousingGeo, barrelMat);
    lightHousing.position.set(0.038, 0.045, -0.22);
    lightHousing.rotation.x = Math.PI / 2;
    this.group.add(lightHousing);

    this.weaponFlashlight = new THREE.SpotLight(0xddeeff, 3.2, 45, Math.PI / 8, 0.45, 1.2);
    this.weaponFlashlight.position.set(0.038, 0.045, -0.74);
    this.weaponFlashlight.target.position.set(0.038, 0.045, -20);
    this.group.add(this.weaponFlashlight);
    this.group.add(this.weaponFlashlight.target);
  }

  public setAim(aiming: boolean): void {
    if (this.state.isAiming === aiming || this.state.isReloading) return;
    this.state.isAiming = aiming;

    if (aiming) {
      this.targetPosition.copy(this.adsPosition);
      this.targetRotation.set(0, 0, 0);
    } else {
      this.targetPosition.copy(this.hipPosition);
      this.targetRotation.set(0, 0, 0);
    }
  }

  public toggleAim(): void {
    this.setAim(!this.state.isAiming);
  }

  public canFire(): boolean {
    const now = performance.now();
    return (
      now - this.lastFireTime >= this.fireInterval &&
      !this.state.isReloading &&
      this.state.ammoClip > 0
    );
  }

  public fire(): boolean {
    if (this.state.isReloading) return false;

    if (this.state.ammoClip <= 0) {
      this.sound.playDryFire();
      this.startReload();
      return false;
    }

    const now = performance.now();
    if (now - this.lastFireTime < this.fireInterval) return false;

    this.lastFireTime = now;
    this.state.ammoClip--;

    // Sound
    this.sound.playGunshot();

    // Muzzle flash
    this.muzzleFlashMesh.visible = true;
    this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI * 2;
    this.muzzleFlashLight.intensity = 4.0;
    this.muzzleFlashTimer = 0.05;

    // Recoil Kick
    const kickZ = this.state.isAiming ? 0.035 : 0.065;
    const kickPitch = this.state.isAiming ? 0.04 : 0.08;
    const kickYaw = (Math.random() - 0.5) * 0.025;

    this.recoilOffset.z += kickZ;
    this.recoilRotation.x += kickPitch;
    this.recoilRotation.y += kickYaw;

    // Eject shell casing
    this.ejectShellCasing();

    return true;
  }

  public startReload(): void {
    if (this.state.isReloading || this.state.ammoClip === this.state.maxClip || this.state.ammoReserve <= 0) {
      return;
    }

    this.state.isReloading = true;
    this.setAim(false);
    this.reloadStartTime = performance.now();
    this.sound.playReload();
  }

  private completeReload(): void {
    const needed = this.state.maxClip - this.state.ammoClip;
    const toLoad = Math.min(needed, this.state.ammoReserve);
    this.state.ammoClip += toLoad;
    this.state.ammoReserve -= toLoad;
    this.state.isReloading = false;
  }

  private ejectShellCasing(): void {
    const casingGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.022, 8);
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // brass
      metalness: 0.95,
      roughness: 0.15,
    });
    const mesh = new THREE.Mesh(casingGeo, casingMat);

    const worldPos = new THREE.Vector3(0.025, 0.04, -0.02);
    this.group.localToWorld(worldPos);
    mesh.position.copy(worldPos);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);

    const velocity = right.clone().multiplyScalar(1.9 + Math.random() * 0.5)
      .add(up.clone().multiplyScalar(1.4 + Math.random() * 0.4))
      .add(forward.clone().multiplyScalar((Math.random() - 0.5) * 0.4));

    const rotSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 25
    );

    this.scene.add(mesh);
    this.casings.push({ mesh, velocity, rotSpeed, life: 1.5 });
  }

  public updateSway(deltaX: number, deltaY: number): void {
    const maxSway = 0.03;
    const swayFactor = 0.0008;
    this.swayOffset.x = THREE.MathUtils.clamp(this.swayOffset.x - deltaX * swayFactor, -maxSway, maxSway);
    this.swayOffset.y = THREE.MathUtils.clamp(this.swayOffset.y + deltaY * swayFactor, -maxSway, maxSway);
  }

  public update(delta: number, isMoving: boolean, isSprinting: boolean): void {
    // 1. Muzzle flash timer
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashMesh.visible = false;
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // 2. Reload progress
    if (this.state.isReloading) {
      const elapsed = performance.now() - this.reloadStartTime;
      const progress = elapsed / this.reloadDuration;

      if (progress < 0.4) {
        this.targetPosition.set(0.18, -0.36, -0.38);
        this.targetRotation.set(-0.35, 0.15, -0.2);
      } else if (progress < 0.75) {
        this.targetPosition.set(0.18, -0.30, -0.38);
        this.targetRotation.set(-0.15, 0.05, -0.1);
      } else {
        this.targetPosition.copy(this.hipPosition);
        this.targetRotation.set(0, 0, 0);
      }

      if (elapsed >= this.reloadDuration) {
        this.completeReload();
      }
    }

    // 3. Movement Bobbing & Breathing Sway
    const time = performance.now() * 0.005;
    let bobX = 0;
    let bobY = 0;
    if (isMoving && !this.state.isAiming) {
      const speedMult = isSprinting ? 1.8 : 1.0;
      bobX = Math.cos(time * speedMult) * (isSprinting ? 0.022 : 0.010);
      bobY = Math.abs(Math.sin(time * speedMult)) * (isSprinting ? 0.026 : 0.012);
    } else if (!this.state.isAiming) {
      // Idle breathing sway
      bobX = Math.sin(time * 0.5) * 0.003;
      bobY = Math.cos(time) * 0.004;
    }

    // Recover sway smoothly
    this.swayOffset.lerp(new THREE.Vector2(0, 0), 8 * delta);

    // 4. Smooth interpolation to target position
    const lerpSpeed = this.state.isAiming ? 18 * delta : 12 * delta;
    this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, this.targetPosition.x + bobX + this.swayOffset.x + this.recoilOffset.x, lerpSpeed);
    this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, this.targetPosition.y - bobY + this.swayOffset.y + this.recoilOffset.y, lerpSpeed);
    this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, this.targetPosition.z + this.recoilOffset.z, lerpSpeed);

    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, this.targetRotation.x + this.recoilRotation.x, lerpSpeed);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotation.y + this.recoilRotation.y, lerpSpeed);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, this.targetRotation.z + this.recoilRotation.z, lerpSpeed);

    // 5. Recoil recovery
    const recoilRecovery = 15 * delta;
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), recoilRecovery);
    this.recoilRotation.x = THREE.MathUtils.lerp(this.recoilRotation.x, 0, recoilRecovery);
    this.recoilRotation.y = THREE.MathUtils.lerp(this.recoilRotation.y, 0, recoilRecovery);

    // 6. Camera FOV interpolation for ADS
    const targetFov = this.state.isAiming ? 48 : 75;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 14 * delta);
      this.camera.updateProjectionMatrix();
    }

    // 7. Update spent shell casings
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const casing = this.casings[i];
      casing.life -= delta;
      casing.velocity.y -= 9.8 * delta;
      casing.mesh.position.addScaledVector(casing.velocity, delta);
      casing.mesh.rotation.x += casing.rotSpeed.x * delta;
      casing.mesh.rotation.y += casing.rotSpeed.y * delta;
      casing.mesh.rotation.z += casing.rotSpeed.z * delta;

      if (casing.mesh.position.y <= 0.02) {
        casing.mesh.position.y = 0.02;
        casing.velocity.y = -casing.velocity.y * 0.35;
        casing.velocity.x *= 0.6;
        casing.velocity.z *= 0.6;
      }

      if (casing.life <= 0) {
        this.scene.remove(casing.mesh);
        casing.mesh.geometry.dispose();
        this.casings.splice(i, 1);
      }
    }
  }
}
