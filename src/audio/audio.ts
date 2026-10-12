/**
 * Audio facade. Everything is synthesised with WebAudio at runtime (no audio files):
 * see synth.ts for the instruments. Audio only starts after a user gesture (browser rule).
 */
import type { Who } from '../ui/dialogue';
import { Synth } from './synth';

export class Audio {
  private synth: Synth | null = null;
  volumes = { music: 0.6, sfx: 0.8, voice: 0.7 };
  muted = false;
  /** Suppresses sounds while skipping or seeking. */
  silent = false;

  /** Must be called from a user gesture. */
  unlock(): void {
    if (this.synth) { this.synth.resume(); return; }
    try {
      this.synth = new Synth();
      this.apply();
    } catch {
      this.synth = null;
    }
  }

  apply(): void {
    this.synth?.setVolumes(this.muted ? 0 : this.volumes.music, this.muted ? 0 : this.volumes.sfx, this.muted ? 0 : this.volumes.voice);
  }

  sfx(name: string, opts: { pan?: number; gain?: number } = {}): void {
    if (this.silent) return;
    this.synth?.sfx(name, opts);
  }

  blip(who: Who, ch: string, i: number): void {
    if (this.silent) return;
    this.synth?.voice(who, ch, i);
  }

  music(name: string | null): void { this.synth?.music(name); }
  ambience(on: boolean, level = 1): void { this.synth?.ambience(on, level); }
}
