import { BoundClip, type ClipDef, type ClipEvent } from './clip';
import { Pose, Skeleton } from './rig';

/**
 * Layered clip playback for one skeleton.
 *
 * - `base`: one active clip with cross-fades (idle, sit, gestures, gags).
 * - overlay layers: named slots ("arms", "accent", …) that blend on top, either replacing the
 *   bones they key (override) or adding to them (additive). Because each clip only keys the bones
 *   it needs, a clip is its own mask: an arm gesture can play while the gait drives the legs.
 *
 * All state advances only through `update(dt)`, so playback is deterministic and can be re-run
 * from zero to any time (that is how the Animation Lab scrubs).
 */
export interface PlayOpts {
  fade?: number;
  speed?: number;
  /** Start time inside the clip. */
  from?: number;
  /** Layer name; 'base' by default. */
  layer?: string;
  additive?: boolean;
  /** Layer weight (overlays). */
  weight?: number;
}

interface Track {
  clip: BoundClip;
  time: number;
  speed: number;
  weight: number;
  target: number;
  fadeRate: number;
  done: boolean;
  resolve?: () => void;
}

interface Layer {
  name: string;
  additive: boolean;
  tracks: Track[];
}

export class Animator {
  readonly clips = new Map<string, BoundClip>();
  private readonly layers: Layer[] = [{ name: 'base', additive: false, tracks: [] }];
  onEvent: ((e: ClipEvent, clip: string) => void) | null = null;

  constructor(readonly sk: Skeleton, defs: ClipDef[] = []) {
    for (const d of defs) this.add(d);
  }

  add(def: ClipDef): void { this.clips.set(def.name, new BoundClip(def, this.sk)); }
  has(name: string): boolean { return this.clips.has(name); }

  private layer(name: string, additive = false): Layer {
    let l = this.layers.find((x) => x.name === name);
    if (!l) { l = { name, additive, tracks: [] }; this.layers.push(l); }
    return l;
  }

  /** Plays a clip; resolves when a non-looping clip reaches its end (or is replaced). */
  play(name: string, opts: PlayOpts = {}): Promise<void> {
    const clip = this.clips.get(name);
    if (!clip) throw new Error(`no clip "${name}" on ${this.sk.def.id}`);
    const layer = this.layer(opts.layer ?? 'base', opts.additive);
    if (opts.additive !== undefined) layer.additive = opts.additive;
    const fade = opts.fade ?? 0.2;
    const top = layer.tracks[layer.tracks.length - 1];
    if (top && top.clip === clip && !top.done && clip.loop && opts.from === undefined) {
      top.speed = opts.speed ?? top.speed;
      return Promise.resolve();
    }
    for (const t of layer.tracks) {
      t.target = 0;
      t.fadeRate = fade > 0 ? 1 / fade : Infinity;
      t.resolve?.();
      t.resolve = undefined;
    }
    const isBase = layer.name === 'base';
    const track: Track = {
      clip,
      time: opts.from ?? 0,
      speed: opts.speed ?? 1,
      weight: isBase && layer.tracks.length === 0 ? 1 : fade > 0 ? 0 : 1,
      target: opts.weight ?? 1,
      fadeRate: fade > 0 ? 1 / fade : Infinity,
      done: false,
    };
    layer.tracks.push(track);
    return new Promise<void>((res) => {
      if (clip.loop) { track.resolve = res; return; }
      track.resolve = res;
    });
  }

  /** Fades an overlay layer out. */
  stop(layerName: string, fade = 0.2): void {
    const l = this.layers.find((x) => x.name === layerName);
    if (!l) return;
    for (const t of l.tracks) {
      t.target = 0;
      t.fadeRate = fade > 0 ? 1 / fade : Infinity;
      t.resolve?.();
      t.resolve = undefined;
    }
  }

  /** Name of the dominant clip on a layer. */
  current(layerName = 'base'): string | null {
    const l = this.layers.find((x) => x.name === layerName);
    const t = l?.tracks[l.tracks.length - 1];
    return t && t.target > 0 ? t.clip.def.name : null;
  }

  currentTime(layerName = 'base'): number {
    const l = this.layers.find((x) => x.name === layerName);
    const t = l?.tracks[l.tracks.length - 1];
    return t ? t.time : 0;
  }

  update(dt: number): void {
    for (const l of this.layers) {
      for (const t of l.tracks) {
        const prev = t.time;
        t.time += dt * t.speed;
        if (this.onEvent) for (const e of t.clip.eventsBetween(prev, t.time)) this.onEvent(e, t.clip.def.name);
        if (!t.clip.loop && t.time >= t.clip.duration && !t.done) {
          t.done = true;
          t.time = t.clip.duration;
          const r = t.resolve;
          t.resolve = undefined;
          r?.();
        }
        if (t.weight !== t.target) {
          const step = t.fadeRate === Infinity ? 1 : dt * t.fadeRate;
          t.weight = t.weight < t.target ? Math.min(t.target, t.weight + step) : Math.max(t.target, t.weight - step);
        }
      }
      // drop fully faded tracks, but never the last base track
      l.tracks = l.tracks.filter((t, i) => t.weight > 0 || t.target > 0 || (l.name === 'base' && i === l.tracks.length - 1));
      if (l.name !== 'base') {
        // finished one-shot overlays fade out on their own
        for (const t of l.tracks) if (t.done && t.target > 0) { t.target = 0; t.fadeRate = 5; }
      }
    }
  }

  /** Writes all layers into `pose` (which should start at rest). */
  evaluate(pose: Pose): void {
    for (const l of this.layers) {
      for (const t of l.tracks) {
        if (t.weight <= 0) continue;
        t.clip.apply(pose, t.time, t.weight, l.additive);
      }
    }
  }

  /** Clears all layers and plays `name` instantly (used when re-simulating from zero). */
  reset(name?: string): void {
    for (const l of this.layers) {
      for (const t of l.tracks) { t.resolve?.(); t.resolve = undefined; }
      l.tracks = [];
    }
    if (name) void this.play(name, { fade: 0 });
  }
}
