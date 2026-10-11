import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { stripRootMotion } from '../src/three/rootMotion';

// ---------------------------------------------------------------------------
// Regression test for the "walk through a solid object then rubber-band back"
// bug.
//
// The visible avatar is a skinned mesh driven by GLTF mocap clips. `anim_walk`
// bakes forward translation into the root "Hips" bone (~3.2m across the cycle).
// The game's collision system only constrains the logical avatar position, so
// that baked translation visually drags the model through obstacles before it
// snaps back. `stripRootMotion` must remove the horizontal component while
// preserving the vertical bob.
// ---------------------------------------------------------------------------

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

function loadGlb(file: string): Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }> {
  const buffer = fs.readFileSync(path.join(process.cwd(), 'public', 'models', file));
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      '',
      (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations }),
      (err) => reject(err),
    );
  });
}

/** Measure the maximum horizontal travel of the Hips bone across a clip. */
function measureHipsTravel(clip: THREE.AnimationClip, scene: THREE.Group) {
  const root = new THREE.Group();
  const model = scene.clone(true);
  root.add(model);
  root.updateMatrixWorld(true);

  const hips = model.getObjectByName('Hips');
  if (!hips) throw new Error('Hips bone not found in clip model');

  const mixer = new THREE.AnimationMixer(model);
  const action = mixer.clipAction(clip);
  action.play();

  // Capture the baseline from the animated pose at t=0 — the exported bind pose
  // of the walk rig sits at the *end* of the cycle, so it is not a valid origin.
  mixer.setTime(0);
  model.updateMatrixWorld(true);
  const base = hips.getWorldPosition(new THREE.Vector3());

  let maxHorizontal = 0;
  let minY = Infinity;
  let maxY = -Infinity;

  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    mixer.setTime((i / steps) * clip.duration);
    model.updateMatrixWorld(true);
    const p = hips.getWorldPosition(new THREE.Vector3());
    maxHorizontal = Math.max(maxHorizontal, Math.hypot(p.x - base.x, p.z - base.z));
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  action.stop();
  mixer.uncacheClip(clip);
  return { maxHorizontal, verticalBob: maxY - minY };
}

async function main() {
  console.log('→ Testing Locomotion Root-Motion Stripping');

  const walk = await loadGlb('anim_walk.glb');
  const rawClip = walk.animations[0];
  assert(Boolean(rawClip), `Loaded walk clip "${rawClip?.name}" (${rawClip?.duration.toFixed(2)}s)`);

  const hipsPositionTrack = rawClip.tracks.find(
    (t) => t.name.endsWith('.position') && /hips/i.test(t.name),
  ) as THREE.VectorKeyframeTrack | undefined;
  assert(Boolean(hipsPositionTrack), 'Walk clip contains a Hips position (root motion) track');

  // 1. The raw upstream clip is the bug: it moves the root bone forward.
  const rawTravel = measureHipsTravel(rawClip, walk.scene);
  assert(
    rawTravel.maxHorizontal > 2.0,
    `Raw walk clip displaces the rendered Hips ≈${rawTravel.maxHorizontal.toFixed(2)}m from the logical position (root motion present — the bug)`,
  );

  // 2. The stripped clip must play strictly in place.
  const stripped = stripRootMotion(rawClip);
  assert(Boolean(stripped && stripped !== rawClip), 'stripRootMotion returns a distinct clip instance');
  const strippedTravel = measureHipsTravel(stripped!, walk.scene);
  assert(
    strippedTravel.maxHorizontal < 0.12,
    `Stripped walk clip keeps the rendered Hips in place (max horizontal drift ${strippedTravel.maxHorizontal.toFixed(4)}m vs ${rawTravel.maxHorizontal.toFixed(2)}m unstripped)`,
  );

  // 3. The vertical bob must survive so walking still looks natural.
  assert(
    strippedTravel.verticalBob > 0.01,
    `Stripped walk clip preserves the vertical bob (${strippedTravel.verticalBob.toFixed(3)}m)`,
  );

  // 4. The shared source GLTF clip must not be mutated (all avatars share it).
  const sourceZTravel = (() => {
    const v = hipsPositionTrack!.values;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 2; i < v.length; i += 3) {
      min = Math.min(min, v[i]);
      max = Math.max(max, v[i]);
    }
    return max - min;
  })();
  assert(
    sourceZTravel > 2.0,
    `Original shared clip data is left untouched (Z travel still ${sourceZTravel.toFixed(2)}m)`,
  );

  // 5. Stripping is cached/idempotent so every character reuses one clip.
  assert(
    stripRootMotion(rawClip) === stripped,
    'stripRootMotion caches its result (single shared stripped clip)',
  );

  // 6. All other locomotion clips must remain usable and in place.
  const others = ['anim_idle.glb', 'anim_dance.glb', 'anim_celebrate.glb', 'anim_shock.glb', 'anim_angry.glb'];
  for (const file of others) {
    const gltf = await loadGlb(file);
    const clip = gltf.animations[0];
    const travel = measureHipsTravel(clip, gltf.scene);
    assert(
      travel.maxHorizontal < 0.6,
      `${file} plays in place (max horizontal drift ${travel.maxHorizontal.toFixed(3)}m)`,
    );
  }

  // 7. Defensive: undefined clips and clips without root tracks are safe.
  assert(stripRootMotion(undefined) === undefined, 'stripRootMotion(undefined) returns undefined');
  const synthetic = new THREE.AnimationClip('synthetic', 1, [
    new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 1, 0, 0, 2, 5]),
    new THREE.QuaternionKeyframeTrack('Hips.quaternion', [0], [0, 0, 0, 1]),
  ]);
  const strippedSynthetic = stripRootMotion(synthetic)!;
  const synthValues = (strippedSynthetic.tracks[0] as THREE.VectorKeyframeTrack).values;
  assert(
    synthValues[2] === synthValues[5] && synthValues[0] === synthValues[3] && synthValues[1] !== synthValues[4],
    'Synthetic clip: horizontal root motion zeroed, vertical preserved',
  );

  console.log(`\nRoot Motion Tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('❌ Root motion test failed:', err);
  process.exit(1);
});
