/**
 * SoundService: Synthesized Web Audio API sound effects for library operations
 * Zero external audio files, works 100% offline and low-latency.
 */
class SoundServiceClass {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    const savedMute = localStorage.getItem('libraryos_sound_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('libraryos_sound_muted', String(muted));
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Pleasant high-frequency chime for successful scan/issue
   */
  public playSuccess() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Low discordant double-buzz for scan error, invalid card, or block
   */
  public playError() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(110, now + 0.1);

      gain.gain.setValueAtTime(this.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Soft reminder double-tone for warning (e.g. overdue item or existing fine)
   */
  public playWarning() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(349.23, now + 0.12); // F4

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

export const SoundService = new SoundServiceClass();
