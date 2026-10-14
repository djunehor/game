// ---------------------------------------------------------------------------
// A tiny synthesised sound engine.
//
// No audio files: short WebAudio envelopes are enough for the handful of cues a
// life sim needs, and it keeps the bundle free of assets. Everything is a no-op
// when muted or when the browser has not had a user gesture yet.
// ---------------------------------------------------------------------------

type Cue =
  | 'click'
  | 'deny'
  | 'purchase'
  | 'complete'
  | 'levelUp'
  | 'milestone'
  | 'birthday'
  | 'warning';

interface Note {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  /** Start offset within the cue, in seconds. */
  at?: number;
}

const CUES: Record<Cue, Note[]> = {
  click: [{ frequency: 520, duration: 0.05, type: 'triangle', gain: 0.05 }],
  deny: [
    { frequency: 220, duration: 0.09, type: 'sawtooth', gain: 0.05 },
    { frequency: 160, duration: 0.12, type: 'sawtooth', gain: 0.05, at: 0.09 },
  ],
  purchase: [
    { frequency: 660, duration: 0.07, type: 'triangle', gain: 0.06 },
    { frequency: 880, duration: 0.1, type: 'triangle', gain: 0.06, at: 0.07 },
  ],
  complete: [
    { frequency: 587, duration: 0.08, type: 'sine', gain: 0.05 },
    { frequency: 784, duration: 0.12, type: 'sine', gain: 0.05, at: 0.08 },
  ],
  levelUp: [
    { frequency: 523, duration: 0.09, type: 'triangle', gain: 0.06 },
    { frequency: 659, duration: 0.09, type: 'triangle', gain: 0.06, at: 0.09 },
    { frequency: 880, duration: 0.16, type: 'triangle', gain: 0.06, at: 0.18 },
  ],
  milestone: [
    { frequency: 698, duration: 0.1, type: 'sine', gain: 0.06 },
    { frequency: 932, duration: 0.1, type: 'sine', gain: 0.06, at: 0.1 },
    { frequency: 1175, duration: 0.22, type: 'sine', gain: 0.05, at: 0.2 },
  ],
  birthday: [
    { frequency: 784, duration: 0.12, type: 'triangle', gain: 0.06 },
    { frequency: 988, duration: 0.12, type: 'triangle', gain: 0.06, at: 0.12 },
    { frequency: 1319, duration: 0.24, type: 'triangle', gain: 0.05, at: 0.24 },
  ],
  warning: [
    { frequency: 330, duration: 0.14, type: 'square', gain: 0.04 },
    { frequency: 247, duration: 0.2, type: 'square', gain: 0.04, at: 0.14 },
  ],
};

const MUTE_KEY = 'life-sim-muted-v1';

class SoundEngine {
  muted = false;
  private ctx: AudioContext | null = null;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    }
  }

  /**
   * Browsers refuse to start audio until the user has interacted. Creating the
   * context lazily on the first cue sidesteps that, and failure is silent.
   */
  private context(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  play(cue: Cue): void {
    if (this.muted) return;
    const ctx = this.context();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const start = ctx.currentTime;
    for (const note of CUES[cue]) {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type;
        osc.frequency.value = note.frequency;
        const at = start + (note.at ?? 0);
        // A short pluck: quick attack, exponential decay.
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(note.gain, at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + note.duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + note.duration + 0.02);
      } catch {
        /* audio is a nicety, never a failure */
      }
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    }
    if (!this.muted) this.play('click');
    return this.muted;
  }
}

export const sound = new SoundEngine();
