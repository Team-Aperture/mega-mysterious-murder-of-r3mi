import { ease, type EaseSpec } from '../engine/ease';
import { DEG } from '../engine/math';
import { CH, NCH, Pose, Skeleton, type Channel } from './rig';

/**
 * Keyframed clips.
 *
 * Tracks are keyed by `"<bone>.<channel>"` (channel r, x, y, sx, sy; rotations in DEGREES for
 * authoring) or `"@<param>"` for free parameters (eye lid, glow, …). The curve on a key shapes
 * the segment that *starts* at that key. Discrete tracks (`attach`, `z`) step.
 *
 * Bone values are deltas from the rest pose, so the same clip works on any rig with the same
 * bone names (this is what lets the three ICH design directions share their animation).
 */
export interface Key { t: number; v: number; e?: EaseSpec }
export interface StepKey<T> { t: number; v: T }
export interface ClipEvent { t: number; name: string; data?: unknown }

export interface ClipDef {
  name: string;
  duration: number;
  loop?: boolean;
  tracks: Record<string, Key[]>;
  attach?: Record<string, StepKey<string | null>[]>;
  z?: Record<string, StepKey<number>[]>;
  events?: ClipEvent[];
  /** Bones this clip leaves to other layers (e.g. a gesture that should not move the legs). */
  description?: string;
}

interface Binding { bone: number; ch: number; keys: Key[]; deg: boolean }
interface ParamBinding { name: string; keys: Key[] }

/** A clip bound to one skeleton (track names resolved to indices once). */
export class BoundClip {
  readonly bones: Binding[] = [];
  readonly params: ParamBinding[] = [];
  /** Bones touched by this clip (used for masking and blending). */
  readonly touched: Set<number> = new Set();

  constructor(readonly def: ClipDef, sk: Skeleton) {
    for (const [key, keys] of Object.entries(def.tracks)) {
      if (!keys.length) continue;
      const sorted = [...keys].sort((a, b) => a.t - b.t);
      if (key.startsWith('@')) {
        this.params.push({ name: key.slice(1), keys: sorted });
        continue;
      }
      const dot = key.lastIndexOf('.');
      const boneName = key.slice(0, dot);
      const ch = key.slice(dot + 1) as Channel;
      if (!(ch in CH)) throw new Error(`clip ${def.name}: bad channel in ${key}`);
      if (!sk.has(boneName)) continue; // rig variants may lack optional bones
      const bone = sk.bone(boneName);
      this.bones.push({ bone, ch: CH[ch], keys: sorted, deg: ch === 'r' });
      this.touched.add(bone);
    }
  }

  get duration(): number { return this.def.duration; }
  get loop(): boolean { return !!this.def.loop; }

  /** Local clip time for a playhead (wraps or clamps). */
  localTime(t: number): number {
    const d = this.def.duration;
    if (d <= 0) return 0;
    if (this.def.loop) return ((t % d) + d) % d;
    return t < 0 ? 0 : t > d ? d : t;
  }

  /**
   * Writes the clip at time `t` into `pose`. With `additive`, values are added to (or for scale,
   * multiplied into) the pose instead of replacing it.
   */
  apply(pose: Pose, t: number, weight = 1, additive = false): void {
    const lt = this.localTime(t);
    const v = pose.v;
    for (const b of this.bones) {
      let val = sample(b.keys, lt, this.def.loop ? this.def.duration : 0);
      if (b.deg) val *= DEG;
      const i = b.bone * NCH + b.ch;
      const isScale = b.ch >= 3;
      if (additive) {
        if (isScale) v[i] *= 1 + (val - 1) * weight; else v[i] += val * weight;
      } else {
        v[i] += (val - v[i]) * weight;
      }
    }
    for (const p of this.params) {
      const val = sample(p.keys, lt, this.def.loop ? this.def.duration : 0);
      const cur = pose.params[p.name];
      if (additive) pose.params[p.name] = (cur ?? 0) + val * weight;
      else pose.params[p.name] = cur === undefined || weight >= 1 ? val : cur + (val - cur) * weight;
    }
    if (weight >= 0.5) {
      if (this.def.attach) for (const [slot, keys] of Object.entries(this.def.attach)) {
        const k = stepSample(keys, lt);
        if (k !== undefined) pose.attach[slot] = k;
      }
      if (this.def.z) for (const [slot, keys] of Object.entries(this.def.z)) {
        const k = stepSample(keys, lt);
        if (k !== undefined) pose.z[slot] = k;
      }
    }
  }

  /** Events whose time lies in (from, to], handling one loop wrap. */
  eventsBetween(from: number, to: number): ClipEvent[] {
    const ev = this.def.events;
    if (!ev || to <= from) return [];
    const d = this.def.duration;
    if (!this.def.loop) return ev.filter((e) => e.t > from && e.t <= to);
    const out: ClipEvent[] = [];
    const n0 = Math.floor(from / d), n1 = Math.floor(to / d);
    for (let n = n0; n <= n1; n++) {
      for (const e of ev) {
        const at = n * d + e.t;
        if (at > from && at <= to) out.push(e);
      }
    }
    return out;
  }
}

/** Samples a sorted key list at `t`. With `loopLen`, the last key eases back into the first. */
export function sample(keys: Key[], t: number, loopLen = 0): number {
  const n = keys.length;
  if (n === 1) return keys[0].v;
  if (t <= keys[0].t) {
    if (loopLen > 0) {
      const last = keys[n - 1];
      const span = loopLen - last.t + keys[0].t;
      if (span > 0) return segment(last, keys[0], (t + loopLen - last.t) / span);
    }
    return keys[0].v;
  }
  if (t >= keys[n - 1].t) {
    if (loopLen > 0) {
      const last = keys[n - 1];
      const span = loopLen - last.t + keys[0].t;
      if (span > 0) return segment(last, keys[0], (t - last.t) / span);
    }
    return keys[n - 1].v;
  }
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (keys[mid].t <= t) lo = mid; else hi = mid;
  }
  const a = keys[lo], b = keys[hi];
  return segment(a, b, (t - a.t) / (b.t - a.t));
}

function segment(a: Key, b: Key, u: number): number {
  const k = ease(a.e)(u < 0 ? 0 : u > 1 ? 1 : u);
  return a.v + (b.v - a.v) * k;
}

function stepSample<T>(keys: StepKey<T>[], t: number): T | undefined {
  let out: T | undefined;
  for (const k of keys) {
    if (k.t <= t) out = k.v; else break;
  }
  return out;
}

/* ------------------------------------------------------------------ authoring helpers */

/**
 * Pose-to-pose authoring: `poses` is a list of [time, {track: value}] and `ease` the default curve.
 * Every track mentioned anywhere gets a key at every pose time (missing values hold the previous
 * value, or rest if none). This mirrors how an animator blocks key poses.
 */
export function blocked(
  name: string,
  duration: number,
  poses: Array<[number, Record<string, number>, EaseSpec?]>,
  opts: Partial<ClipDef> = {},
): ClipDef {
  const names = new Set<string>();
  for (const [, vals] of poses) for (const k of Object.keys(vals)) names.add(k);
  const tracks: Record<string, Key[]> = {};
  for (const tn of names) {
    const isScale = tn.endsWith('.sx') || tn.endsWith('.sy');
    let prev: number | undefined;
    // value before the first explicit key = first explicit value (so blocking starts in pose)
    for (const [, vals] of poses) if (vals[tn] !== undefined) { prev = vals[tn]; break; }
    if (prev === undefined) prev = isScale ? 1 : 0;
    tracks[tn] = poses.map(([t, vals, e]) => {
      const v = vals[tn] ?? prev!;
      prev = v;
      return { t, v, e };
    });
  }
  return { name, duration, ...opts, tracks: { ...tracks, ...(opts.tracks ?? {}) } };
}
