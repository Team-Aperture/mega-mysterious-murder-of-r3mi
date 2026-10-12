import { Mat } from '../engine/math';

/**
 * Rig model (pure data + math, no rendering).
 *
 * Everything is authored in the character's *sheet space*: the rest-pose drawing, facing right,
 * feet on y = 0, 1080p reference units (400 units = 1 m). Bone pivots are absolute sheet points,
 * which is how an artist thinks ("the elbow is here"), and are converted to local offsets once.
 *
 * The rig always computes in this unmirrored space. Facing left is purely presentational
 * (the display root is flipped), so IK, springs and clips never need to know about it.
 */

export interface BoneDef {
  name: string;
  parent: string | null;
  /** Rest pivot, absolute, in sheet space. */
  x: number;
  y: number;
}

export interface SlotDef {
  /** Slot (draw layer) name. */
  name: string;
  /** Bone the slot follows. */
  bone: string;
  /** Draw order; higher is in front. Clips may override it with `z` keys. */
  z: number;
  /** Default part id in the rig sheet; defaults to the slot name. `null` = empty by default. */
  part?: string | null;
  /** Emissive slots are not darkened by scene light. */
  emissive?: boolean;
}

export interface RigDef {
  id: string;
  bones: BoneDef[];
  slots: SlotDef[];
}

/** Channels per bone, stored flat: rotation (rad), offset x/y (units), scale x/y (factor). */
export const CH = { r: 0, x: 1, y: 2, sx: 3, sy: 4 } as const;
export type Channel = keyof typeof CH;
export const NCH = 5;

/**
 * A pose: per-bone deltas from rest, plus free parameters (eye state, glow, …),
 * slot attachment overrides and draw-order overrides.
 */
export class Pose {
  readonly v: Float32Array;
  params: Record<string, number> = {};
  attach: Record<string, string | null> = {};
  z: Record<string, number> = {};
  constructor(readonly nBones: number) {
    this.v = new Float32Array(nBones * NCH);
    this.reset();
  }
  reset(): this {
    const v = this.v;
    for (let i = 0; i < this.nBones; i++) {
      const o = i * NCH;
      v[o] = 0; v[o + 1] = 0; v[o + 2] = 0; v[o + 3] = 1; v[o + 4] = 1;
    }
    this.params = {};
    this.attach = {};
    this.z = {};
    return this;
  }
  get(bone: number, ch: Channel): number { return this.v[bone * NCH + CH[ch]]; }
  set(bone: number, ch: Channel, value: number): void { this.v[bone * NCH + CH[ch]] = value; }
  add(bone: number, ch: Channel, value: number): void {
    const i = bone * NCH + CH[ch];
    if (ch === 'sx' || ch === 'sy') this.v[i] *= value; else this.v[i] += value;
  }
  copyFrom(p: Pose): this {
    this.v.set(p.v);
    this.params = { ...p.params };
    this.attach = { ...p.attach };
    this.z = { ...p.z };
    return this;
  }
  /** this = lerp(this, other, w), channel-wise; params blend, discrete overrides switch at w ≥ 0.5. */
  blend(other: Pose, w: number): this {
    if (w <= 0) return this;
    const a = this.v, b = other.v;
    if (w >= 1) return this.copyFrom(other);
    for (let i = 0; i < a.length; i++) a[i] += (b[i] - a[i]) * w;
    const keys = new Set([...Object.keys(this.params), ...Object.keys(other.params)]);
    for (const k of keys) {
      const x = this.params[k], y = other.params[k];
      if (x === undefined) this.params[k] = y;
      else if (y !== undefined) this.params[k] = x + (y - x) * w;
    }
    if (w >= 0.5) {
      Object.assign(this.attach, other.attach);
      Object.assign(this.z, other.z);
    }
    return this;
  }
}

/** Skeleton instance: resolves a pose into world (character-space) matrices. */
export class Skeleton {
  readonly index = new Map<string, number>();
  readonly parent: Int16Array;
  /** Local rest offset of each bone from its parent pivot. */
  readonly restX: Float32Array;
  readonly restY: Float32Array;
  readonly world: Mat[];
  private readonly local = new Mat();

  constructor(readonly def: RigDef) {
    const n = def.bones.length;
    this.parent = new Int16Array(n);
    this.restX = new Float32Array(n);
    this.restY = new Float32Array(n);
    this.world = def.bones.map(() => new Mat());
    def.bones.forEach((b, i) => {
      if (this.index.has(b.name)) throw new Error(`rig ${def.id}: duplicate bone ${b.name}`);
      this.index.set(b.name, i);
    });
    def.bones.forEach((b, i) => {
      if (b.parent === null) {
        this.parent[i] = -1;
        this.restX[i] = b.x;
        this.restY[i] = b.y;
        return;
      }
      const p = this.index.get(b.parent);
      if (p === undefined) throw new Error(`rig ${def.id}: bone ${b.name} has unknown parent ${b.parent}`);
      if (p >= i) throw new Error(`rig ${def.id}: parent ${b.parent} must be listed before ${b.name}`);
      this.parent[i] = p;
      this.restX[i] = b.x - def.bones[p].x;
      this.restY[i] = b.y - def.bones[p].y;
    });
    for (const s of def.slots) {
      if (!this.index.has(s.bone)) throw new Error(`rig ${def.id}: slot ${s.name} uses unknown bone ${s.bone}`);
    }
  }

  get size(): number { return this.def.bones.length; }

  bone(name: string): number {
    const i = this.index.get(name);
    if (i === undefined) throw new Error(`rig ${this.def.id}: unknown bone ${name}`);
    return i;
  }
  has(name: string): boolean { return this.index.has(name); }

  /** Computes world matrices for all bones (parents are always listed first). */
  solve(pose: Pose, from = 0): void {
    const v = pose.v;
    for (let i = from; i < this.size; i++) {
      const o = i * 5;
      this.local.compose(this.restX[i] + v[o + 1], this.restY[i] + v[o + 2], v[o], v[o + 3], v[o + 4]);
      const p = this.parent[i];
      if (p < 0) this.world[i].copyFrom(this.local);
      else this.world[i].multiply(this.world[p], this.local);
    }
  }

  /** World position of a point given in *sheet* coordinates that moves rigidly with `bone`. */
  pointOn(bone: number, sheetX: number, sheetY: number, out = { x: 0, y: 0 }): { x: number; y: number } {
    const b = this.def.bones[bone];
    return this.world[bone].apply(sheetX - b.x, sheetY - b.y, out);
  }

  /** World rotation of a bone. */
  rot(bone: number): number { return this.world[bone].rotation; }
}
