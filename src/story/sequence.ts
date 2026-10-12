/**
 * Cutscenes as deterministic timelines.
 *
 * A sequence is `setup` (puts the world into its start state) + timed `events` (play a clip,
 * walk, move the camera, show a line, open a bin…) + an optional `tick` for continuous control.
 * Because every actor, spring and rope is simulated with seeded randomness, re-running a
 * sequence from zero at a fixed step reproduces it exactly. That is how the Animation Lab
 * scrubs and slows down cutscenes, and how "skip" lands in the right end state.
 */
export interface SeqEvent<W> {
  t: number;
  run: (w: W) => void;
  /** Shown in the Animation Lab's timeline. */
  label?: string;
}

export interface SequenceDef<W> {
  id: string;
  /** German title, shown in the Animation Lab. */
  title: string;
  duration: number;
  setup: (w: W) => void;
  events: SeqEvent<W>[];
  tick?: (w: W, t: number, dt: number) => void;
}

/** Plays a sequence in real time. The caller steps the world; this only drives events. */
export class SequencePlayer<W> {
  t = 0;
  private next = 0;
  private readonly events: SeqEvent<W>[];
  done = false;
  private resolve: (() => void) | null = null;
  readonly finished: Promise<void>;

  constructor(readonly def: SequenceDef<W>, readonly world: W, setup = true) {
    this.events = [...def.events].sort((a, b) => a.t - b.t);
    this.finished = new Promise((r) => { this.resolve = r; });
    if (setup) def.setup(world);
    this.fire(0);
  }

  private fire(upTo: number): void {
    while (this.next < this.events.length && this.events[this.next].t <= upTo) {
      this.events[this.next].run(this.world);
      this.next++;
    }
  }

  /** Advance the sequence clock (before the world is stepped by `dt`). */
  update(dt: number): void {
    if (this.done) return;
    this.t += dt;
    this.fire(this.t);
    this.def.tick?.(this.world, Math.min(this.t, this.def.duration), dt);
    if (this.t >= this.def.duration) this.finish();
  }

  finish(): void {
    if (this.done) return;
    this.fire(Infinity);
    this.done = true;
    this.resolve?.();
  }

  /**
   * Skip: fast-forward to the end with fixed steps (events fire in order, physics settles),
   * so the world ends in exactly the state a full playback would.
   */
  skip(stepWorld: (dt: number) => void, dt = 1 / 30): void {
    while (!this.done) {
      this.update(dt);
      stepWorld(dt);
    }
  }
}

/**
 * Re-simulates a sequence from zero to `t` (used for scrubbing). `reset` must restore everything
 * the sequence touches; `stepWorld` advances actors, camera, cabin and UI by dt.
 */
export function seek<W>(def: SequenceDef<W>, world: W, reset: () => void, stepWorld: (dt: number) => void, t: number, dt = 1 / 60): SequencePlayer<W> {
  reset();
  const p = new SequencePlayer(def, world, true);
  let left = Math.min(t, def.duration);
  while (left > 1e-6) {
    const h = Math.min(dt, left);
    p.update(h);
    stepWorld(h);
    left -= h;
  }
  return p;
}

/** Small helpers for authoring event lists. */
export const at = <W>(t: number, run: (w: W) => void, label?: string): SeqEvent<W> => ({ t, run, label });
