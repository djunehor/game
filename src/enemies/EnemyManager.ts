import * as THREE from 'three';
import { SoundEngine } from '../audio/SoundEngine';

export type EnemyType = 'gull' | 'hound';

export interface Enemy {
  id: number;
  type: EnemyType;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  isDead: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  patrolPoints: THREE.Vector3[];
  currentPatrolIdx: number;
  lastAttackTime: number;
  attackCooldown: number;
  alert: boolean;
  collider: THREE.Box3;
  // Specific animation parts
  rotors?: THREE.Mesh[];
  legs?: THREE.Mesh[];
  searchlight?: THREE.SpotLight;
}

export interface EnemyLaser {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class EnemyManager {
  public scene: THREE.Scene;
  public sound: SoundEngine;
  public enemies: Enemy[] = [];
  public lasers: EnemyLaser[] = [];
  public particles: Particle[] = [];

  private nextId: number = 1;

  constructor(scene: THREE.Scene, sound: SoundEngine) {
    this.scene = scene;
    this.sound = sound;
    this.spawnEnemies();
  }

  private spawnEnemies(): void {
    // 3 Gulls (Air Drones)
    this.spawnGull(new THREE.Vector3(-30, 6, 40), [
      new THREE.Vector3(-30, 6, 40),
      new THREE.Vector3(-15, 7, 70),
      new THREE.Vector3(-35, 6, 60),
    ]);

    this.spawnGull(new THREE.Vector3(20, 7, -10), [
      new THREE.Vector3(20, 7, -10),
      new THREE.Vector3(35, 8, 20),
      new THREE.Vector3(5, 6, 10),
    ]);

    this.spawnGull(new THREE.Vector3(-10, 8, -60), [
      new THREE.Vector3(-10, 8, -60),
      new THREE.Vector3(-30, 7, -40),
      new THREE.Vector3(10, 7, -50),
    ]);

    // 3 Hounds (Ground Robotic Dogs)
    this.spawnHound(new THREE.Vector3(0, 0, -20), [
      new THREE.Vector3(0, 0, -20),
      new THREE.Vector3(15, 0, -20),
      new THREE.Vector3(15, 0, -50),
      new THREE.Vector3(0, 0, -50),
    ]);

    this.spawnHound(new THREE.Vector3(-20, 0, 15), [
      new THREE.Vector3(-20, 0, 15),
      new THREE.Vector3(-5, 0, 15),
      new THREE.Vector3(-5, 0, 45),
      new THREE.Vector3(-20, 0, 45),
    ]);

    this.spawnHound(new THREE.Vector3(25, 0, 45), [
      new THREE.Vector3(25, 0, 45),
      new THREE.Vector3(35, 0, 75),
      new THREE.Vector3(15, 0, 75),
    ]);
  }

  private spawnGull(startPos: THREE.Vector3, patrolPoints: THREE.Vector3[]): void {
    const group = new THREE.Group();
    group.position.copy(startPos);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x182028, metalness: 0.9, roughness: 0.3 });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: 0xff1020 });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.8, roughness: 0.2 });

    // Chassis
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.3, 0.9);
    const body = new THREE.Mesh(bodyGeo, metalMat);
    group.add(body);

    // Glowing Red Sensor Eye
    const eyeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const eye = new THREE.Mesh(eyeGeo, redGlowMat);
    eye.position.set(0, -0.05, -0.46);
    group.add(eye);

    // 4 Quadcopter Arms and Rotors
    const rotors: THREE.Mesh[] = [];
    const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
    const bladeGeo = new THREE.BoxGeometry(0.65, 0.015, 0.06);

    const armOffsets = [
      [0.6, 0.1, 0.6],
      [-0.6, 0.1, 0.6],
      [0.6, 0.1, -0.6],
      [-0.6, 0.1, -0.6],
    ];

    armOffsets.forEach(offset => {
      const arm = new THREE.Mesh(armGeo, metalMat);
      arm.position.set(offset[0] * 0.5, offset[1] * 0.5, offset[2] * 0.5);
      arm.rotation.z = Math.atan2(offset[1], offset[0]);
      group.add(arm);

      const blade = new THREE.Mesh(bladeGeo, rotorMat);
      blade.position.set(offset[0], offset[1] + 0.1, offset[2]);
      group.add(blade);
      rotors.push(blade);
    });

    // Spotlight search beam pointing down
    const searchlight = new THREE.SpotLight(0xaaddff, 3.0, 35, Math.PI / 6, 0.35, 1.2);
    searchlight.position.set(0, -0.2, 0);
    searchlight.target.position.set(0, -10, 0);
    group.add(searchlight);
    group.add(searchlight.target);

    this.scene.add(group);

    const collider = new THREE.Box3().setFromCenterAndSize(
      startPos,
      new THREE.Vector3(1.8, 1.0, 1.8)
    );

    this.enemies.push({
      id: this.nextId++,
      type: 'gull',
      mesh: group,
      health: 80,
      maxHealth: 80,
      isDead: false,
      position: startPos.clone(),
      velocity: new THREE.Vector3(),
      patrolPoints,
      currentPatrolIdx: 0,
      lastAttackTime: 0,
      attackCooldown: 1800, // ms
      alert: false,
      collider,
      rotors,
      searchlight,
    });
  }

  private spawnHound(startPos: THREE.Vector3, patrolPoints: THREE.Vector3[]): void {
    const group = new THREE.Group();
    group.position.copy(startPos);

    const houndMetal = new THREE.MeshStandardMaterial({ color: 0x222a35, metalness: 0.85, roughness: 0.35 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x0f141a, metalness: 0.9, roughness: 0.2 });
    const sensorMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

    // Main Torso
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.5, 1.4);
    const torso = new THREE.Mesh(torsoGeo, houndMetal);
    torso.position.y = 0.85;
    group.add(torso);

    // Head / Sensor Visor
    const headGeo = new THREE.BoxGeometry(0.45, 0.35, 0.5);
    const head = new THREE.Mesh(headGeo, houndMetal);
    head.position.set(0, 1.1, -0.8);
    group.add(head);

    const visorGeo = new THREE.BoxGeometry(0.35, 0.1, 0.1);
    const visor = new THREE.Mesh(visorGeo, sensorMat);
    visor.position.set(0, 1.12, -1.06);
    group.add(visor);

    // 4 Articulated Quadruped Legs (Upper & Lower Segments)
    const legs: THREE.Mesh[] = [];
    const upperGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.42, 8);
    const lowerGeo = new THREE.CylinderGeometry(0.035, 0.025, 0.45, 8);
    const footGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });

    const legPositions = [
      [-0.36, 0.7, -0.45],
      [0.36, 0.7, -0.45],
      [-0.36, 0.7, 0.45],
      [0.36, 0.7, 0.45],
    ];

    legPositions.forEach(lp => {
      const legRoot = new THREE.Group();
      legRoot.position.set(lp[0], lp[1], lp[2]);

      // Upper leg
      const upper = new THREE.Mesh(upperGeo, jointMat);
      upper.position.y = -0.2;
      upper.rotation.x = 0.2;
      legRoot.add(upper);

      // Knee joint
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), houndMetal);
      knee.position.set(0, -0.4, 0.05);
      legRoot.add(knee);

      // Lower leg
      const lower = new THREE.Mesh(lowerGeo, jointMat);
      lower.position.set(0, -0.6, -0.02);
      lower.rotation.x = -0.35;
      legRoot.add(lower);

      // Foot pad
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(0, -0.82, -0.08);
      legRoot.add(foot);

      group.add(legRoot);
      legs.push(upper); // used for animation reference
    });

    this.scene.add(group);

    const collider = new THREE.Box3().setFromCenterAndSize(
      startPos,
      new THREE.Vector3(1.2, 1.5, 1.8)
    );

    this.enemies.push({
      id: this.nextId++,
      type: 'hound',
      mesh: group,
      health: 110,
      maxHealth: 110,
      isDead: false,
      position: startPos.clone(),
      velocity: new THREE.Vector3(),
      patrolPoints,
      currentPatrolIdx: 0,
      lastAttackTime: 0,
      attackCooldown: 1200,
      alert: false,
      collider,
      legs,
    });
  }

  public damageEnemy(enemy: Enemy, amount: number): boolean {
    if (enemy.isDead) return false;
    enemy.health -= amount;
    enemy.alert = true; // immediately aggro

    // Flash mesh red on bullet impact
    enemy.mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          const origColor = mat.emissive.getHex();
          mat.emissive.setHex(0xff2222);
          setTimeout(() => {
            if (!enemy.isDead && mat.emissive) {
              mat.emissive.setHex(origColor);
            }
          }, 80);
        }
      }
    });

    if (enemy.health <= 0) {
      this.killEnemy(enemy);
      return true; // died
    }
    return false;
  }

  public killEnemy(enemy: Enemy): void {
    if (enemy.isDead) return;
    enemy.isDead = true;
    this.sound.playExplosion();
    this.createExplosion(enemy.mesh.position, enemy.type === 'gull' ? 0xff4422 : 0xff9900);
    this.scene.remove(enemy.mesh);
  }

  public createExplosion(pos: THREE.Vector3, colorHex: number): void {
    // Flash light
    const flashLight = new THREE.PointLight(colorHex, 5.0, 20);
    flashLight.position.copy(pos);
    this.scene.add(flashLight);
    setTimeout(() => this.scene.remove(flashLight), 100);

    // Debris fragments
    const count = 28;
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const speed = 6 + Math.random() * 8;
      const angleTheta = Math.random() * Math.PI * 2;
      const anglePhi = (Math.random() - 0.5) * Math.PI;

      const velocity = new THREE.Vector3(
        Math.cos(angleTheta) * Math.cos(anglePhi) * speed,
        Math.abs(Math.sin(anglePhi)) * speed + 3,
        Math.sin(angleTheta) * Math.cos(anglePhi) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.2,
      });
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, onPlayerHit: (damage: number) => void): void {
    const now = performance.now();

    // 1. Update Enemies
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const distToPlayer = enemy.position.distanceTo(playerPos);

      // Detection
      if (distToPlayer < 35) {
        enemy.alert = true;
      }

      if (enemy.type === 'gull') {
        // --- GULL (Aerial Drone) Behavior ---
        // Spin rotors
        if (enemy.rotors) {
          enemy.rotors.forEach((r, idx) => {
            r.rotation.y += (idx % 2 === 0 ? 35 : -35) * delta;
          });
        }

        if (enemy.alert) {
          // Turn searchlight red when aggro
          if (enemy.searchlight) {
            enemy.searchlight.color.setHex(0xff2222);
            enemy.searchlight.target.position.copy(playerPos);
          }

          // Face player
          enemy.mesh.lookAt(playerPos.x, enemy.position.y, playerPos.z);

          // Strafe / Maintain range of 15m
          const targetPos = playerPos.clone().add(new THREE.Vector3(
            Math.sin(now * 0.001) * 8,
            6 + Math.sin(now * 0.002) * 1.5,
            Math.cos(now * 0.001) * 8
          ));

          enemy.position.lerp(targetPos, 1.2 * delta);
          enemy.mesh.position.copy(enemy.position);

          // Shoot laser burst
          if (now - enemy.lastAttackTime > enemy.attackCooldown && distToPlayer < 40) {
            enemy.lastAttackTime = now;
            this.fireEnemyLaser(enemy.position, playerPos);
          }
        } else {
          // Patrol waypoint
          const targetWaypoint = enemy.patrolPoints[enemy.currentPatrolIdx];
          const distToWaypoint = enemy.position.distanceTo(targetWaypoint);

          if (distToWaypoint < 2.0) {
            enemy.currentPatrolIdx = (enemy.currentPatrolIdx + 1) % enemy.patrolPoints.length;
          }

          enemy.mesh.lookAt(targetWaypoint.x, enemy.position.y, targetWaypoint.z);
          enemy.position.lerp(targetWaypoint, 0.8 * delta);
          enemy.mesh.position.copy(enemy.position);
        }

        // Update collider
        enemy.collider.setFromCenterAndSize(enemy.position, new THREE.Vector3(1.8, 1.0, 1.8));

      } else if (enemy.type === 'hound') {
        // --- HOUND (Ground Quadruped) Behavior ---
        // Leg gallop animation
        if (enemy.legs) {
          const legPhase = now * 0.012;
          enemy.legs[0].rotation.x = Math.sin(legPhase) * 0.5;
          enemy.legs[1].rotation.x = -Math.sin(legPhase) * 0.5;
          enemy.legs[2].rotation.x = -Math.sin(legPhase) * 0.5;
          enemy.legs[3].rotation.x = Math.sin(legPhase) * 0.5;
        }

        if (enemy.alert) {
          enemy.mesh.lookAt(playerPos.x, 0, playerPos.z);

          // Charge towards player
          const dir = new THREE.Vector3().subVectors(playerPos, enemy.position);
          dir.y = 0;
          dir.normalize();

          const runSpeed = 5.5 * delta;
          enemy.position.addScaledVector(dir, runSpeed);
          enemy.position.y = 0;
          enemy.mesh.position.copy(enemy.position);

          // Close range bite / claw attack
          if (distToPlayer < 2.2 && now - enemy.lastAttackTime > enemy.attackCooldown) {
            enemy.lastAttackTime = now;
            this.sound.playHoundBark();
            onPlayerHit(16);
          }
        } else {
          // Patrol waypoint
          const targetWaypoint = enemy.patrolPoints[enemy.currentPatrolIdx];
          const distToWaypoint = enemy.position.distanceTo(targetWaypoint);

          if (distToWaypoint < 2.0) {
            enemy.currentPatrolIdx = (enemy.currentPatrolIdx + 1) % enemy.patrolPoints.length;
          }

          enemy.mesh.lookAt(targetWaypoint.x, 0, targetWaypoint.z);
          const dir = new THREE.Vector3().subVectors(targetWaypoint, enemy.position).normalize();
          enemy.position.addScaledVector(dir, 2.5 * delta);
          enemy.position.y = 0;
          enemy.mesh.position.copy(enemy.position);
        }

        // Update collider
        enemy.collider.setFromCenterAndSize(
          new THREE.Vector3(enemy.position.x, 0.85, enemy.position.z),
          new THREE.Vector3(1.2, 1.5, 1.8)
        );
      }
    }

    // 2. Update Enemy Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.life -= delta;
      laser.mesh.position.addScaledVector(laser.velocity, delta);

      // Check hit against player
      if (laser.mesh.position.distanceTo(playerPos) < 1.2) {
        onPlayerHit(14);
        this.scene.remove(laser.mesh);
        laser.mesh.geometry.dispose();
        this.lasers.splice(i, 1);
        continue;
      }

      if (laser.life <= 0) {
        this.scene.remove(laser.mesh);
        laser.mesh.geometry.dispose();
        this.lasers.splice(i, 1);
      }
    }

    // 3. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.velocity.y -= 12 * delta; // gravity
      p.mesh.position.addScaledVector(p.velocity, delta);

      if (p.mesh.position.y < 0.05) {
        p.mesh.position.y = 0.05;
        p.velocity.y = -p.velocity.y * 0.3;
        p.velocity.x *= 0.7;
        p.velocity.z *= 0.7;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  private fireEnemyLaser(fromPos: THREE.Vector3, toPos: THREE.Vector3): void {
    this.sound.playEnemyLaser();

    const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const mesh = new THREE.Mesh(laserGeo, laserMat);

    mesh.position.copy(fromPos).add(new THREE.Vector3(0, -0.2, 0));
    mesh.lookAt(toPos);
    mesh.rotateX(Math.PI / 2);

    const dir = new THREE.Vector3().subVectors(toPos, fromPos).normalize();
    const velocity = dir.multiplyScalar(32); // 32 m/s

    this.scene.add(mesh);
    this.lasers.push({ mesh, velocity, life: 2.0 });
  }
}

