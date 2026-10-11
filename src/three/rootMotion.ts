import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Root-motion stripping
// ---------------------------------------------------------------------------
// Some mocap clips (notably `anim_walk.glb`) bake forward translation directly
// into the skeleton's root "Hips" bone — its local Z travels ~3.21m across the
// walk cycle. Because avatar locomotion is driven entirely by the game's
// collision system, replaying that baked translation drags the *rendered*
// character away from its logical position: the model visibly glides through
// sofas and walls, then snaps back when the clip loops or crossfades to idle
// (the "rubber-band" effect).
//
// We neutralise the horizontal component of the root bone's translation while
// preserving the vertical bob (Y), so every clip plays strictly in place.
const HIPS_POSITION_RE = /(^|[^a-z])hips([^a-z]|$)/i;

const strippedClipCache = new WeakMap<THREE.AnimationClip, THREE.AnimationClip>();

export function stripRootMotion(
  clip?: THREE.AnimationClip,
): THREE.AnimationClip | undefined {
  if (!clip) return undefined;

  const cached = strippedClipCache.get(clip);
  if (cached) return cached;

  const cloned = clip.clone();

  for (const track of cloned.tracks) {
    // Only translation tracks carry baked root motion.
    if (!track.name.endsWith('.position')) continue;

    const nodeName = track.name.slice(0, track.name.lastIndexOf('.'));
    if (!HIPS_POSITION_RE.test(nodeName)) continue;

    const keyframeTrack = track as THREE.VectorKeyframeTrack;
    // `AnimationClip.clone()` shares the underlying `values` buffer with the
    // source clip, so copy before mutating to avoid corrupting the shared GLTF.
    const values = Float32Array.from(keyframeTrack.values);
    const baseX = values[0];
    const baseZ = values[2];

    for (let i = 0; i < values.length; i += 3) {
      values[i] = baseX;
      values[i + 2] = baseZ;
    }

    keyframeTrack.values = values;
  }

  strippedClipCache.set(clip, cloned);
  return cloned;
}
