import type { Housemate, Gender } from '../types';

export interface VoiceOptions {
  gender?: Gender;
  pitch?: number;
  rate?: number;
  volume?: number;
  isBiggie?: boolean;
}

/**
 * Clean text for text-to-speech by stripping emojis and symbols
 * so the synthesizer speaks words naturally without reading emoji names.
 */
export function cleanSpeechText(text: string): string {
  return text
    // Replace markdown formatting
    .replace(/\*|_|`/g, '')
    // Strip emojis
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '')
    // Clean multiple whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deterministically computes unique vocal pitch and speed per housemate id
 * to give every housemate an identifiable voice tone.
 */
export function getHousemateVoiceParams(housemate: Housemate): { pitch: number; rate: number } {
  let hash = 0;
  for (let i = 0; i < housemate.id.length; i++) {
    hash = (hash * 31 + housemate.id.charCodeAt(i)) >>> 0;
  }

  const pitchVariance = ((hash % 20) - 10) / 100; // -0.10 to +0.10
  const rateVariance = (((hash >> 4) % 15) - 7) / 100; // -0.07 to +0.07

  if (housemate.gender === 'F') {
    return {
      pitch: Math.max(1.15, Math.min(1.45, 1.28 + pitchVariance)),
      rate: Math.max(0.95, Math.min(1.15, 1.04 + rateVariance)),
    };
  } else {
    return {
      pitch: Math.max(0.85, Math.min(1.1, 0.96 + pitchVariance)),
      rate: Math.max(0.92, Math.min(1.1, 1.0 + rateVariance)),
    };
  }
}

class VoiceEngine {
  public enabled: boolean = true;
  private voices: SpeechSynthesisVoice[] = [];
  private isLoaded: boolean = false;

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const load = () => {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length > 0) {
        this.isLoaded = true;
      }
    };

    load();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  /**
   * Find best matching voice:
   * Prioritize Nigerian accent (en-NG) -> English -> gender matching.
   */
  private selectVoice(gender?: Gender, isBiggie?: boolean): SpeechSynthesisVoice | null {
    if (!this.isLoaded || this.voices.length === 0) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.voices = window.speechSynthesis.getVoices();
      }
    }

    if (this.voices.length === 0) return null;

    // 1. Look for Nigerian English voices if available on user device
    const nigerianVoice = this.voices.find(
      (v) => v.lang.toLowerCase().includes('ng') || v.name.toLowerCase().includes('nigeria')
    );
    if (nigerianVoice) return nigerianVoice;

    // 2. Big Brother: Deep male voice (en-GB or en-US)
    if (isBiggie) {
      const maleVoice = this.voices.find(
        (v) =>
          (v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('george') ||
              v.name.toLowerCase().includes('oliver')))
      );
      if (maleVoice) return maleVoice;
    }

    // 3. Gender-specific English voice
    if (gender === 'F') {
      const femaleVoice = this.voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('victoria') ||
            v.name.toLowerCase().includes('karen'))
      );
      if (femaleVoice) return femaleVoice;
    } else if (gender === 'M') {
      const maleVoice = this.voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('daniel') ||
            v.name.toLowerCase().includes('guy'))
      );
      if (maleVoice) return maleVoice;
    }

    // 4. Default to first English voice, or default system voice
    return this.voices.find((v) => v.lang.startsWith('en')) || this.voices[0] || null;
  }

  /**
   * Speak arbitrary text with configured voice properties.
   */
  public speak(text: string, options: VoiceOptions = {}): void {
    if (!this.enabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const cleaned = cleanSpeechText(text);
    if (!cleaned) return;

    try {
      // Cancel previous utterance to prevent queue buildup
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleaned);

      if (options.isBiggie) {
        // Big Brother booming authoritative baritone
        utterance.pitch = options.pitch ?? 0.65;
        utterance.rate = options.rate ?? 0.88;
      } else {
        utterance.pitch = options.pitch ?? (options.gender === 'F' ? 1.25 : 0.95);
        utterance.rate = options.rate ?? 1.02;
      }

      utterance.volume = options.volume ?? 1.0;

      const voice = this.selectVoice(options.gender, options.isBiggie);
      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[VoiceEngine] Speech synthesis error:', err);
    }
  }

  /**
   * Big Brother voice announcement (authoritative baritone).
   */
  public speakBiggie(text: string): void {
    this.speak(text, { isBiggie: true, pitch: 0.65, rate: 0.88 });
  }

  /**
   * Housemate voice speech using individual pitch/rate.
   */
  public speakHousemate(housemate: Housemate, text: string): void {
    const params = getHousemateVoiceParams(housemate);
    this.speak(text, {
      gender: housemate.gender,
      pitch: params.pitch,
      rate: params.rate,
    });
  }

  /**
   * Stop current speech immediately.
   */
  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voice = new VoiceEngine();
