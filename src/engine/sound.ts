// Web Audio API procedural sound engine for Biggie's House.
// Zero external audio files required — all sounds synthesized dynamically in-browser.

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  private partyTimer: ReturnType<typeof setInterval> | null = null;
  private beat = 0;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Big Brother's iconic menacing buzzer
  public playBiggieBuzzer() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, this.ctx.currentTime); // Low A
    osc1.frequency.exponentialRampToValueAtTime(82.4, this.ctx.currentTime + 0.5); // Down to Low E

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(116.5, this.ctx.currentTime); // Dissonant Bb

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.6);
    osc2.stop(this.ctx.currentTime + 0.6);
  }

  // Pleasant chime for rewards, coins, positive actions
  public playRewardChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.4);
    });
  }

  // Dramatic tense table-shaking drone (for nominations / eviction)
  public playDramaHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 1.2);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(55, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    sub.start();
    osc.stop(this.ctx.currentTime + 1.3);
    sub.stop(this.ctx.currentTime + 1.3);
  }

  // Soft footstep thud
  private lastStep = 0;
  public playFootstep() {
    if (this.muted) return;
    const now = Date.now();
    if (now - this.lastStep < 300) return;
    this.lastStep = now;

    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80 + Math.random() * 25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Dialogue pop / talk blip
  public playTalkBlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380 + Math.random() * 120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  // ---- Party music (procedural 4-on-the-floor beat + bass) ----
  public startPartyMusic() {
    if (this.partyTimer) return;
    this.init();
    if (!this.ctx) return;

    this.beat = 0;
    // 120 BPM -> one beat every 0.5s
    this.partyTimer = setInterval(() => this.scheduleBeat(), 500);
    this.scheduleBeat();
  }

  public stopPartyMusic() {
    if (this.partyTimer) {
      clearInterval(this.partyTimer);
      this.partyTimer = null;
    }
  }

  private scheduleBeat() {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Kick drum (4 on the floor)
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(150, t);
    kick.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    kickGain.gain.setValueAtTime(0.5, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    kick.connect(kickGain);
    kickGain.connect(ctx.destination);
    kick.start(t);
    kick.stop(t + 0.18);

    // Off-beat hi-hat
    const hat = ctx.createOscillator();
    const hatGain = ctx.createGain();
    hat.type = 'square';
    hat.frequency.setValueAtTime(6000, t + 0.25);
    hatGain.gain.setValueAtTime(0.06, t + 0.25);
    hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    hat.connect(hatGain);
    hatGain.connect(ctx.destination);
    hat.start(t + 0.25);
    hat.stop(t + 0.32);

    // Bass line (walking afrobeats-ish groove)
    const bassFreqs = [55, 55, 65.4, 49]; // A1, A1, C2, G1
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(bassFreqs[this.beat % bassFreqs.length], t);
    bassGain.gain.setValueAtTime(0.25, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(t);
    bass.stop(t + 0.42);

    this.beat++;
  }
}

export const sound = new SoundEngine();
