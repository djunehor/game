import { voice } from './voice';

// Sound engine for Biggie's House.
// Synthetic oscillator noises removed per realistic audio requirements.

class SoundEngine {
  private _muted: boolean = false;

  public get muted(): boolean {
    return this._muted;
  }

  public set muted(val: boolean) {
    this._muted = val;
    voice.enabled = !val;
    if (val) {
      voice.stop();
    }
  }

  // Big Brother buzzer
  public playBiggieBuzzer() {}

  // Reward chime
  public playRewardChime() {}

  // Drama hit
  public playDramaHit() {}

  // Footstep (silent)
  public playFootstep() {}

  // Dialogue pop (silent)
  public playTalkBlip() {}

  // Party music (silent)
  public startPartyMusic() {}

  public stopPartyMusic() {}

  // Biggie Tone (silent)
  public playBiggieTone() {}

  // Emote audio feedback (silent)
  public playEmoteSound(_type: 'wave' | 'hype' | 'clapback' | 'dance' | 'hug') {}
}

export const sound = new SoundEngine();
