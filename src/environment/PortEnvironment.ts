import * as THREE from 'three';
import { ProceduralTextures } from '../textures/ProceduralTextures';

export interface SecurityRelay {
  id: number;
  mesh: THREE.Group;
  coreMesh: THREE.Mesh;
  light: THREE.PointLight;
  isDestroyed: boolean;
  health: number;
  maxHealth: number;
  position: THREE.Vector3;
  collider: THREE.Box3;
}

export class PortEnvironment {
  public scene: THREE.Scene;
  public colliders: THREE.Box3[] = [];
  public obstacleMeshes: THREE.Object3D[] = [];
  public relays: SecurityRelay[] = [];
  public extractionPad: THREE.Mesh | null = null;
  public extractionCollider: THREE.Box3 | null = null;

  // Rain Line System (Motion-blurred streaks)
  private rainCount: number = 3800;
  private rainLines: THREE.LineSegments | null = null;
  private rainPositions: Float32Array | null = null;
  private rainVelocities: Float32Array | null = null;

  // Ground Puddle Splash Rings
  private splashCount: number = 80;
  private splashMesh: THREE.InstancedMesh | null = null;
  private splashData: { x: number; z: number; scale: number; opacity: number }[] = [];

  // Animated elements
  private warningBeacons: THREE.PointLight[] = [];
  private relaySpinners: THREE.Group[] = [];
  private lightningLight: THREE.DirectionalLight | null = null;
  private nextLightningTime: number = 0;
  private lightningTimer: number = 0;
  private dropshipMesh: THREE.Group | null = null;
  private extractionBeam: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildTerminal();
    this.buildRainStreaks();
    this.buildSplashRipples();
    this.nextLightningTime = performance.now() + 10000;
  }

  private buildTerminal(): void {
    const texGen = ProceduralTextures.getInstance();

    // 1. Atmospheric Fog & Ambient Lighting
    this.scene.background = new THREE.Color(0x0a121d);
    this.scene.fog = new THREE.FogExp2(0x0d1724, 0.007);

    // Moonlight & Sky Fill (Clear visibility of container stacks & crane)
    const ambientLight = new THREE.AmbientLight(0x3e526a, 2.4);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x7aa0c8, 3.2);
    moonLight.position.set(40, 80, -30);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    this.scene.add(moonLight);

    // Lightning Flash Light
    this.lightningLight = new THREE.DirectionalLight(0xaad8ff, 0);
    this.lightningLight.position.set(-20, 90, 20);
    this.scene.add(this.lightningLight);

    // 2. Photorealistic Wet Asphalt Ground Plane
    const asphaltTex = texGen.createWetAsphaltTexture();
    const roughnessTex = texGen.createWetAsphaltRoughness();
    const normalTex = texGen.createAsphaltNormalMap();

    const groundGeo = new THREE.PlaneGeometry(160, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughnessMap: roughnessTex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: 0.55,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.obstacleMeshes.push(ground);

    // Harbor Sea Water Plane (West side)
    const seaGeo = new THREE.PlaneGeometry(80, 260);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x050a14,
      roughness: 0.05,
      metalness: 0.9,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-100, -0.6, 0);
    this.scene.add(sea);

    // Concrete Seawall Curb
    const curbGeo = new THREE.BoxGeometry(2, 1.5, 240);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x242a30, roughness: 0.8 });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(-60, 0.25, 0);
    this.scene.add(curb);
    this.colliders.push(new THREE.Box3().setFromObject(curb));
    this.obstacleMeshes.push(curb);

    // Outer Perimeter Security Walls
    this.buildWall(0, 5, 120, 160, 10, 2);
    this.buildWall(0, 5, -120, 160, 10, 2);
    this.buildWall(60, 5, 0, 2, 10, 240);

    // 3. Tall Industrial Floodlight Towers with Volumetric Cones
    this.buildFloodlightTower(-40, 0, 70);
    this.buildFloodlightTower(-40, 0, -70);
    this.buildFloodlightTower(35, 0, 60);
    this.buildFloodlightTower(35, 0, -60);
    this.buildFloodlightTower(0, 0, 0);

    // 4. Branded Corrugated Shipping Containers Layout
    this.generateContainerYards(texGen);

    // 5. Giant Harbor Gantry Crane
    this.buildGantryCrane(-45, 0, 10);

    // 6. Concrete Blast Barriers
    this.buildConcreteBarriers(texGen);

    // 7. Tactical Security Relays
    this.buildRelay(1, new THREE.Vector3(-25, 0, 75));
    this.buildRelay(2, new THREE.Vector3(30, 0, 0));
    this.buildRelay(3, new THREE.Vector3(-15, 0, -85));

    // 8. Extraction Zone Pad
    this.buildExtractionZone(new THREE.Vector3(35, 0.05, 95));
  }

  private buildWall(x: number, y: number, z: number, w: number, h: number, d: number): void {
    const wallGeo = new THREE.BoxGeometry(w, h, d);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, y, z);
    this.scene.add(wall);
    this.colliders.push(new THREE.Box3().setFromObject(wall));
    this.obstacleMeshes.push(wall);
  }

  private buildFloodlightTower(x: number, y: number, z: number): void {
    const tower = new THREE.Group();
    tower.position.set(x, y, z);

    // Steel Mast
    const poleGeo = new THREE.CylinderGeometry(0.35, 0.55, 18, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x242d38, metalness: 0.7, roughness: 0.4 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 9;
    tower.add(pole);
    this.obstacleMeshes.push(pole);

    // Floodlight Housing
    const headGeo = new THREE.BoxGeometry(2.6, 0.9, 1.4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x12171e });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 18, 0);
    head.rotation.x = 0.38;
    tower.add(head);

    // Sodium Vapor Light (Warm Golden Radiance over Yard)
    const light = new THREE.PointLight(0xffb844, 5.5, 75, 1.0);
    light.position.set(0, 17.5, 1.2);
    light.castShadow = true;
    tower.add(light);

    // Glowing Emitter Panel
    const glowGeo = new THREE.PlaneGeometry(2.3, 0.7);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffeebb });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, 17.7, 0.72);
    glow.rotation.x = 0.38;
    tower.add(glow);

    // Red Flashing Obstruction Beacon
    const beacon = new THREE.PointLight(0xff2200, 1.5, 25);
    beacon.position.set(0, 19.3, 0);
    tower.add(beacon);
    this.warningBeacons.push(beacon);

    this.scene.add(tower);
    this.colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, 9, z),
      new THREE.Vector3(1.5, 18, 1.5)
    ));
  }

  private generateContainerYards(texGen: ProceduralTextures): void {
    const brands = [
      { color: '#1a4575', brand: 'MAERSK', serial: 'MSKU 891240-3' },
      { color: '#1e5432', brand: 'EVERGREEN', serial: 'EMCU 491028-1' },
      { color: '#8c281e', brand: 'CMA CGM', serial: 'CMAU 729103-7' },
      { color: '#bd8016', brand: 'HAPAG-LLOYD', serial: 'HLXU 339102-4' },
      { color: '#334050', brand: 'COSCO', serial: 'COSU 601928-9' },
    ];

    const normalTex = texGen.createContainerNormalMap();

    const materials = brands.map(b => {
      const tex = texGen.createContainerTexture(b.color, b.brand, b.serial);
      return new THREE.MeshStandardMaterial({
        map: tex,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(0.7, 0.7),
        metalness: 0.65,
        roughness: 0.40,
      });
    });

    const cWidth = 2.5;
    const cHeight = 2.6;
    const cLength40 = 12.0;

    const containerConfigs = [
      // Block A (South-West)
      { x: -35, z: -40, stacks: 3, rotY: 0 },
      { x: -32, z: -40, stacks: 2, rotY: 0 },
      { x: -29, z: -40, stacks: 1, rotY: 0 },
      { x: -35, z: -25, stacks: 2, rotY: 0 },
      { x: -32, z: -25, stacks: 3, rotY: 0 },

      // Block B (Center-West Alleyway)
      { x: -20, z: -10, stacks: 3, rotY: Math.PI / 2 },
      { x: -20, z: -7, stacks: 2, rotY: Math.PI / 2 },
      { x: -5, z: -10, stacks: 2, rotY: Math.PI / 2 },
      { x: -5, z: -7, stacks: 3, rotY: Math.PI / 2 },

      // Block C (Center Hub Maze)
      { x: 10, z: -30, stacks: 3, rotY: 0 },
      { x: 13, z: -30, stacks: 2, rotY: 0 },
      { x: 16, z: -30, stacks: 1, rotY: 0 },
      { x: 10, z: -15, stacks: 2, rotY: 0 },
      { x: 13, z: -15, stacks: 3, rotY: 0 },
      { x: 10, z: 20, stacks: 3, rotY: Math.PI / 2 },
      { x: 10, z: 23, stacks: 2, rotY: Math.PI / 2 },
      { x: 25, z: 20, stacks: 2, rotY: Math.PI / 2 },
      { x: 25, z: 23, stacks: 3, rotY: Math.PI / 2 },

      // Block D (North Corridor toward extraction)
      { x: -10, z: 45, stacks: 3, rotY: 0 },
      { x: -7, z: 45, stacks: 2, rotY: 0 },
      { x: -10, z: 60, stacks: 2, rotY: 0 },
      { x: -7, z: 60, stacks: 3, rotY: 0 },
      { x: 15, z: 60, stacks: 3, rotY: 0 },
      { x: 18, z: 60, stacks: 2, rotY: 0 },
      { x: 21, z: 60, stacks: 1, rotY: 0 },
      { x: 15, z: 75, stacks: 2, rotY: 0 },
    ];

    const boxGeo = new THREE.BoxGeometry(cWidth, cHeight, cLength40);

    // Door lock bar geometry (3D vertical rods on rear face)
    const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, cHeight * 0.9, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.9, roughness: 0.3 });

    containerConfigs.forEach((cfg, idx) => {
      for (let s = 0; s < cfg.stacks; s++) {
        const mat = materials[(idx + s) % materials.length];
        const mesh = new THREE.Mesh(boxGeo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.position.set(cfg.x, (s + 0.5) * cHeight, cfg.z);
        mesh.rotation.y = cfg.rotY;

        // Add 3D container door lock rods on one end
        const rod1 = new THREE.Mesh(rodGeo, rodMat);
        rod1.position.set(-cWidth * 0.25, 0, cLength40 * 0.505);
        mesh.add(rod1);

        const rod2 = new THREE.Mesh(rodGeo, rodMat);
        rod2.position.set(cWidth * 0.25, 0, cLength40 * 0.505);
        mesh.add(rod2);

        this.scene.add(mesh);
        this.colliders.push(new THREE.Box3().setFromObject(mesh));
        this.obstacleMeshes.push(mesh);
      }
    });
  }

  private buildGantryCrane(x: number, y: number, z: number): void {
    const crane = new THREE.Group();
    crane.position.set(x, y, z);

    const craneMat = new THREE.MeshStandardMaterial({
      color: 0xdf8418, // Safety Orange
      metalness: 0.65,
      roughness: 0.45,
    });

    const legGeo = new THREE.BoxGeometry(1.2, 38, 1.2);
    const legPositions = [
      [-12, 19, -15],
      [12, 19, -15],
      [-12, 19, 15],
      [12, 19, 15],
    ];

    legPositions.forEach(p => {
      const leg = new THREE.Mesh(legGeo, craneMat);
      leg.position.set(p[0], p[1], p[2]);
      crane.add(leg);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x + p[0], y + p[1], z + p[2]),
        new THREE.Vector3(1.5, 38, 1.5)
      ));
      this.obstacleMeshes.push(leg);
    });

    const girderGeo = new THREE.BoxGeometry(45, 4, 34);
    const girder = new THREE.Mesh(girderGeo, craneMat);
    girder.position.set(0, 38, 0);
    crane.add(girder);

    const boomGeo = new THREE.BoxGeometry(40, 3, 6);
    const boom = new THREE.Mesh(boomGeo, craneMat);
    boom.position.set(-30, 38, 0);
    crane.add(boom);

    // Operator Cabin with interior light
    const cabinGeo = new THREE.BoxGeometry(4, 3, 4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x11161d });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-6, 34, 0);
    crane.add(cabin);

    const cabinLight = new THREE.PointLight(0xaaddff, 1.5, 12);
    cabinLight.position.set(-6, 33, 0);
    crane.add(cabinLight);

    const beacon1 = new THREE.PointLight(0xff2010, 2.5, 35);
    beacon1.position.set(-45, 41, 0);
    crane.add(beacon1);
    this.warningBeacons.push(beacon1);

    const beacon2 = new THREE.PointLight(0xff2010, 2.5, 35);
    beacon2.position.set(15, 41, 0);
    crane.add(beacon2);
    this.warningBeacons.push(beacon2);

    this.scene.add(crane);
  }

  private buildConcreteBarriers(texGen: ProceduralTextures): void {
    const tex = texGen.createConcreteTexture();
    const barrierMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.85,
      metalness: 0.1,
    });
    const geo = new THREE.BoxGeometry(3.5, 1.2, 0.8);

    const positions = [
      { x: -5, z: 25, rot: 0.2 },
      { x: 0, z: 25, rot: 0.0 },
      { x: 5, z: 25, rot: -0.15 },
      { x: 15, z: -5, rot: Math.PI / 2 },
      { x: 15, z: -9, rot: Math.PI / 2 },
      { x: -20, z: -60, rot: 0.4 },
      { x: -16, z: -62, rot: 0.35 },
    ];

    positions.forEach(p => {
      const mesh = new THREE.Mesh(geo, barrierMat);
      mesh.position.set(p.x, 0.6, p.z);
      mesh.rotation.y = p.rot;
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));
      this.obstacleMeshes.push(mesh);
    });
  }

  private buildRelay(id: number, pos: THREE.Vector3): void {
    const group = new THREE.Group();
    group.position.copy(pos);

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x161e27, metalness: 0.85, roughness: 0.3 });

    // Heavy Industrial Hexagonal Base
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.6, 0.9, 6);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.45;
    group.add(base);

    // High-Voltage Hazard Decal on Base
    const stripeGeo = new THREE.BoxGeometry(0.8, 0.3, 0.02);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffbb00 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.5, 1.4);
    group.add(stripe);

    // Support Pylons
    const pylonGeo = new THREE.CylinderGeometry(0.28, 0.38, 2.6, 8);
    const pylon = new THREE.Mesh(pylonGeo, baseMat);
    pylon.position.y = 1.9;
    group.add(pylon);

    // Glowing Cyan Plasma Core (Target to shoot)
    const coreGeo = new THREE.IcosahedronGeometry(0.48, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d8f0,
      emissiveIntensity: 3.5,
      roughness: 0.05,
      metalness: 0.1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 2.9;
    group.add(core);

    // Rotating Antenna Magnetic Confinement Rings
    const spinner = new THREE.Group();
    spinner.position.y = 2.9;
    const ringGeo = new THREE.TorusGeometry(0.82, 0.045, 8, 24);
    const ring = new THREE.Mesh(ringGeo, baseMat);
    ring.rotation.x = Math.PI / 2;
    spinner.add(ring);

    const finGeo = new THREE.BoxGeometry(0.12, 0.45, 0.28);
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(finGeo, baseMat);
      const angle = (i * Math.PI * 2) / 3;
      fin.position.set(Math.cos(angle) * 0.82, 0, Math.sin(angle) * 0.82);
      spinner.add(fin);
    }
    group.add(spinner);
    this.relaySpinners.push(spinner);

    // Core Point Light with intense bloom emission
    const light = new THREE.PointLight(0x00f0ff, 3.5, 16);
    light.position.y = 2.9;
    group.add(light);

    this.scene.add(group);

    const collider = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(pos.x, pos.y + 1.8, pos.z),
      new THREE.Vector3(2.2, 3.8, 2.2)
    );
    this.colliders.push(collider);

    this.relays.push({
      id,
      mesh: group,
      coreMesh: core,
      light,
      isDestroyed: false,
      health: 120,
      maxHealth: 120,
      position: pos.clone(),
      collider,
    });
  }

  private buildExtractionZone(pos: THREE.Vector3): void {
    const padGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.15, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x0b2014,
      roughness: 0.4,
      metalness: 0.5,
    });
    this.extractionPad = new THREE.Mesh(padGeo, padMat);
    this.extractionPad.position.copy(pos);
    this.scene.add(this.extractionPad);

    // Glowing Green Ring
    const ringGeo = new THREE.RingGeometry(3.6, 4.3, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, pos.y + 0.1, pos.z);
    this.scene.add(ring);

    const padLight = new THREE.PointLight(0x00ff88, 3.5, 18);
    padLight.position.set(pos.x, pos.y + 2.5, pos.z);
    this.scene.add(padLight);

    // Vertical Green Extraction Beacon Beam (Hidden until relays destroyed)
    const beamGeo = new THREE.CylinderGeometry(0.3, 2.5, 50, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(pos.x, pos.y + 25, pos.z);
    beam.visible = false;
    this.extractionBeam = beam;
    this.scene.add(beam);

    this.extractionCollider = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(pos.x, pos.y + 1.0, pos.z),
      new THREE.Vector3(8, 3, 8)
    );
  }

  public spawnDropship(): void {
    if (this.extractionBeam) {
      this.extractionBeam.visible = true;
    }
    if (this.dropshipMesh) return;

    this.dropshipMesh = new THREE.Group();
    const pos = new THREE.Vector3(35, 11, 95);
    this.dropshipMesh.position.copy(pos);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1a222a,
      metalness: 0.85,
      roughness: 0.35,
    });
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8,
    });
    const thrusterMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
    });

    // Fuselage
    const hullGeo = new THREE.BoxGeometry(4.2, 2.2, 9.5);
    const hull = new THREE.Mesh(hullGeo, metalMat);
    this.dropshipMesh.add(hull);

    // Cockpit Canopy
    const canopyGeo = new THREE.BoxGeometry(2.8, 1.2, 2.6);
    const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
    canopy.position.set(0, 0.6, -4.5);
    this.dropshipMesh.add(canopy);

    // Twin Wings & VTOL Thruster Pods
    [-3.8, 3.8].forEach(x => {
      const wingGeo = new THREE.BoxGeometry(2.4, 0.3, 1.8);
      const wing = new THREE.Mesh(wingGeo, metalMat);
      wing.position.set(x * 0.5, 0.4, 0.5);
      this.dropshipMesh!.add(wing);

      const podGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.8, 16);
      const pod = new THREE.Mesh(podGeo, metalMat);
      pod.position.set(x, 0.4, 0.5);
      pod.rotation.x = Math.PI / 2;
      this.dropshipMesh!.add(pod);

      // Glowing Exhaust Ring
      const exhaustGeo = new THREE.RingGeometry(0.4, 0.8, 16);
      const exhaust = new THREE.Mesh(exhaustGeo, thrusterMat);
      exhaust.position.set(x, 0.4, 1.95);
      this.dropshipMesh!.add(exhaust);
    });

    // Green Undercarriage Floodlight
    const dropLight = new THREE.SpotLight(0x00ff88, 6.0, 30, Math.PI / 4, 0.3);
    dropLight.position.set(0, -1, 0);
    dropLight.target.position.set(0, -12, 0);
    this.dropshipMesh.add(dropLight);
    this.dropshipMesh.add(dropLight.target);

    this.scene.add(this.dropshipMesh);
  }

  // High-Speed Motion Blurred Rain Line Segments (Ultra-sharp, photorealistic streaks)
  private buildRainStreaks(): void {
    const streakLength = 0.85;
    // 2 vertices per rain streak (start & end)
    this.rainPositions = new Float32Array(this.rainCount * 2 * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      const x = (Math.random() - 0.5) * 160;
      const y = Math.random() * 50;
      const z = (Math.random() - 0.5) * 220;
      this.rainVelocities[i] = 38 + Math.random() * 15;

      const idx = i * 6;
      // Start point (tail)
      this.rainPositions[idx] = x;
      this.rainPositions[idx + 1] = y + streakLength;
      this.rainPositions[idx + 2] = z;

      // End point (head, with wind slant)
      this.rainPositions[idx + 3] = x + 0.12;
      this.rainPositions[idx + 4] = y;
      this.rainPositions[idx + 5] = z - 0.06;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMat = new THREE.LineBasicMaterial({
      color: 0x88b5dd,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    });

    this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
    this.scene.add(this.rainLines);
  }

  // Puddle Rain Splash Ripple Rings on Ground
  private buildSplashRipples(): void {
    const texGen = ProceduralTextures.getInstance();
    const rippleTex = texGen.createRippleTexture();

    const ringGeo = new THREE.PlaneGeometry(0.26, 0.26);
    const ringMat = new THREE.MeshBasicMaterial({
      map: rippleTex,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.splashMesh = new THREE.InstancedMesh(ringGeo, ringMat, this.splashCount);
    const dummy = new THREE.Object3D();
    dummy.rotation.x = -Math.PI / 2;

    for (let i = 0; i < this.splashCount; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 120;
      const scale = 0.2 + Math.random() * 0.8;
      this.splashData.push({ x, z, scale, opacity: Math.random() });

      dummy.position.set(x, 0.02, z);
      dummy.scale.set(scale, scale, 1);
      dummy.updateMatrix();
      this.splashMesh.setMatrixAt(i, dummy.matrix);
    }

    this.splashMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.splashMesh);
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    // 1. Update Rain Motion-Blurred Lines
    if (this.rainLines && this.rainPositions && this.rainVelocities) {
      const streakLength = 1.2;
      for (let i = 0; i < this.rainCount; i++) {
        const idx = i * 6;
        const vel = this.rainVelocities[i];

        // Move head and tail downward
        this.rainPositions[idx + 1] -= vel * delta;
        this.rainPositions[idx + 4] -= vel * delta;

        // Wind drift along X and Z
        this.rainPositions[idx] += 4.5 * delta;
        this.rainPositions[idx + 3] += 4.5 * delta;
        this.rainPositions[idx + 2] -= 2.5 * delta;
        this.rainPositions[idx + 5] -= 2.5 * delta;

        // Reset if hitting ground
        if (this.rainPositions[idx + 4] <= 0) {
          const spawnY = 40 + Math.random() * 10;
          const spawnX = playerPos.x + (Math.random() - 0.5) * 120;
          const spawnZ = playerPos.z + (Math.random() - 0.5) * 120;

          this.rainPositions[idx] = spawnX;
          this.rainPositions[idx + 1] = spawnY + streakLength;
          this.rainPositions[idx + 2] = spawnZ;

          this.rainPositions[idx + 3] = spawnX + 0.15;
          this.rainPositions[idx + 4] = spawnY;
          this.rainPositions[idx + 5] = spawnZ - 0.08;
        }
      }
      this.rainLines.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Ground Splash Ripples
    if (this.splashMesh) {
      const dummy = new THREE.Object3D();
      dummy.rotation.x = -Math.PI / 2;

      for (let i = 0; i < this.splashCount; i++) {
        const item = this.splashData[i];
        item.scale += 1.4 * delta;

        if (item.scale > 0.95) {
          item.scale = 0.18;
          item.x = playerPos.x + (Math.random() - 0.5) * 50;
          item.z = playerPos.z + (Math.random() - 0.5) * 50;
        }

        dummy.position.set(item.x, 0.02, item.z);
        dummy.scale.set(item.scale, item.scale, 1);
        dummy.updateMatrix();
        this.splashMesh.setMatrixAt(i, dummy.matrix);
      }
      this.splashMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Warning Beacons
    const beaconPulse = (Math.sin(performance.now() * 0.006) + 1) * 0.5;
    this.warningBeacons.forEach(b => {
      b.intensity = beaconPulse > 0.6 ? 3.0 : 0.2;
    });

    // 4. Spin Relay Confinement Rings
    this.relaySpinners.forEach(s => {
      s.rotation.y += 2.2 * delta;
    });

    // 5. Lightning Weather Simulation
    const now = performance.now();
    if (this.lightningLight) {
      if (now > this.nextLightningTime) {
        this.lightningTimer = 0.25; // flash duration
        this.nextLightningTime = now + 12000 + Math.random() * 15000;
      }

      if (this.lightningTimer > 0) {
        this.lightningTimer -= delta;
        // Jitter lightning intensity
        this.lightningLight.intensity = Math.random() > 0.4 ? 4.5 : 0.5;
      } else {
        this.lightningLight.intensity = 0;
      }
    }

    // 6. Extraction Dropship Bobbing
    if (this.dropshipMesh) {
      this.dropshipMesh.position.y = 11 + Math.sin(performance.now() * 0.002) * 0.6;
    }
  }
}
