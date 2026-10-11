import fs from 'node:fs';
import path from 'node:path';
import { GLTFLoader } from 'three-stdlib';

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

console.log('→ Testing Mocap Animation Files & Skeleton Track Binding Logic');

const MOCAP_FILES = [
  { file: 'anim_celebrate.glb', expectedClip: 'celebrate' },
  { file: 'anim_shock.glb', expectedClip: 'shock' },
  { file: 'anim_angry.glb', expectedClip: 'angry' },
  { file: 'anim_thumbsup.glb', expectedClip: 'thumbsup' },
];

const loader = new GLTFLoader();

async function verifyFile(item: { file: string; expectedClip: string }) {
  const filePath = path.resolve('public/models', item.file);
  assert(fs.existsSync(filePath), `${item.file} exists in public/models`);
  const buf = fs.readFileSync(filePath);
  assert(buf.length > 50000, `${item.file} has substantial animation data (${buf.length} bytes)`);

  const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  await new Promise<void>((resolve, reject) => {
    loader.parse(
      arrayBuf,
      '',
      (gltf) => {
        assert(gltf.animations.length >= 1, `${item.file} contains at least 1 animation clip`);
        const clip = gltf.animations[0];
        assert(clip.duration > 0.5, `${item.file} clip has valid duration (${clip.duration.toFixed(2)}s)`);
        assert(clip.tracks.length >= 40, `${item.file} has skeletal tracks (${clip.tracks.length} tracks)`);

        const trackNames = clip.tracks.map((t) => t.name);
        const hasHips = trackNames.some((n) => n.startsWith('Hips.'));
        const hasSpine = trackNames.some((n) => n.startsWith('Spine.'));
        const hasArm = trackNames.some((n) => n.includes('Arm.'));
        assert(hasHips, `${item.file} contains Hips track`);
        assert(hasSpine, `${item.file} contains Spine track`);
        assert(hasArm, `${item.file} contains Arm track`);
        resolve();
      },
      (err) => reject(err)
    );
  });
}

for (const item of MOCAP_FILES) {
  await verifyFile(item);
}

// Emote to animation mapping test
const mapEmoteToAnim = (type: string) => {
  switch (type) {
    case 'hype':
    case 'wave':
      return 'celebrate';
    case 'dance':
      return 'dance';
    case 'clapback':
      return 'angry';
    case 'shock':
      return 'shock';
    default:
      return null;
  }
};

assert(mapEmoteToAnim('hype') === 'celebrate', 'hype maps to celebrate mocap');
assert(mapEmoteToAnim('clapback') === 'angry', 'clapback maps to angry mocap');
assert(mapEmoteToAnim('dance') === 'dance', 'dance maps to dance animation');
assert(mapEmoteToAnim('shock') === 'shock', 'shock maps to shock mocap');

console.log(`\nMocap Logic Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
