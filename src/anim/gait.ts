import { DEG, clamp, fract, lerp, smoothstep } from '../engine/math';
import { EASES } from '../engine/ease';
import { solveTwoBone } from './ik';
import { BoundClip, type ClipDef } from './clip';
import { Pose, Skeleton } from './rig';

/**
 * Procedural locomotion with planted feet.
 *
 * The gait phase advances with *distance travelled*, not time, and each foot's stance moves
 * backwards relative to the hips at exactly the body's speed. A planted foot therefore stays
 * fixed on the floor whatever the walking speed: no foot sliding by construction.
 * Feet are reached with two-bone IK; heel strike and toe-off rotate the foot around the heel and
 * the toe. Classic pose-to-pose walk ingredients (down/up bob, lean, arm swing with overlap) are
 * parameters, and a per-character "flavour" clip, keyed on the gait phase, adds personality.
 */
export interface LegDef { thigh: string; shin: string; foot: string; /** phase offset (0 or 0.5) */ phase: number }
export interface ArmDef { upper: string; fore: string; hand?: string; phase: number }

export interface GaitDef {
  pelvis: string;
  torso?: string;
  head?: string;
  legs: LegDef[];
  arms: ArmDef[];
  /** Distance per full cycle (two steps), in units. */
  stride: number;
  /** Walking speed, units per second. */
  speed: number;
  /** Fraction of the cycle a foot is on the ground. */
  duty: number;
  /** Foot lift at mid-swing. */
  lift: number;
  /** Pelvis down/up bob amplitude. */
  bob: number;
  /** Where in each step the low point falls (0 = at contact). */
  bobPhase: number;
  /** How much the pelvis drops while walking (bent knees). */
  drop: number;
  /** Forward lean of the torso while walking (deg). */
  lean: number;
  /** Heel strike (toe up) and toe-off (heel up) angles, deg. */
  heel: number;
  toe: number;
  /** Foot length from ankle to toe (units). */
  footLen: number;
  /** Arm swing amplitude (deg) and extra elbow bend on the forward swing (deg). */
  armSwing: number;
  elbow: number;
  /** Arm lag behind the legs, in cycle fractions (overlap). */
  armLag: number;
  /** Per-character flavour: an additive clip of duration 1 sampled at the gait phase. */
  flavor?: ClipDef;
}

interface LegRig {
  thigh: number; shin: number; foot: number; parent: number;
  l1: number; l2: number; a1: number; a2: number;
  /** Rest ankle position (character space). */
  ax: number; ay: number;
  phase: number;
}

export interface FootTarget { x: number; y: number; rot: number; lock: boolean }

export class Locomotion {
  phase = 0;
  /** Current stride (fitted per walk so the walk ends in double support). */
  stride: number;
  /** 0 = standing, 1 = full walk. */
  weight = 0;
  /** Signed distance travelled since reset (used for footsteps). */
  travelled = 0;
  readonly legs: LegRig[];
  private readonly flavor?: BoundClip;
  readonly targets: FootTarget[];
  private lastStep = [0, 0];
  onStep: ((leg: number) => void) | null = null;

  constructor(readonly sk: Skeleton, readonly def: GaitDef) {
    this.legs = def.legs.map((l) => {
      const bones = sk.def.bones;
      const t = sk.bone(l.thigh), s = sk.bone(l.shin), f = sk.bone(l.foot);
      const H = bones[t], K = bones[s], A = bones[f];
      return {
        thigh: t, shin: s, foot: f, parent: sk.parent[t],
        l1: Math.hypot(K.x - H.x, K.y - H.y),
        l2: Math.hypot(A.x - K.x, A.y - K.y),
        a1: Math.atan2(K.y - H.y, K.x - H.x),
        a2: Math.atan2(A.y - K.y, A.x - K.x),
        ax: A.x, ay: A.y,
        phase: l.phase,
      };
    });
    this.targets = this.legs.map((l) => ({ x: l.ax, y: l.ay, rot: 0, lock: true }));
    if (def.flavor) this.flavor = new BoundClip(def.flavor, sk);
    this.stride = def.stride;
  }

  reset(): void { this.phase = 0; this.weight = 0; this.travelled = 0; this.lastStep = [0, 0]; }

  /** Advance by a travelled distance (always positive along the facing direction). */
  advance(distance: number): void {
    const before = this.phase;
    this.travelled += distance;
    this.phase = fract(this.phase + distance / this.stride);
    // contact events: leg i contacts when its local phase wraps to 0
    this.legs.forEach((l, i) => {
      const a = fract(before + l.phase), b = fract(this.phase + l.phase);
      if (distance > 0 && b < a && this.lastStep[i] !== Math.floor((this.travelled / this.stride) * 2)) {
        this.lastStep[i] = Math.floor((this.travelled / this.stride) * 2);
        this.onStep?.(i);
      }
    });
  }

  /**
   * Writes the walk into the pose (pelvis, torso, arms) and computes foot targets.
   * `w` blends between standing (feet at rest) and walking.
   */
  apply(pose: Pose, w: number): void {
    const d = this.def, sk = this.sk;
    const ph = this.phase;
    const pelvis = sk.bone(d.pelvis);
    // pelvis: drop + down/up bob, two per cycle
    const u = fract(ph * 2);
    const bob = Math.cos((u - d.bobPhase) * Math.PI * 2) * d.bob;
    pose.add(pelvis, 'y', (d.drop + bob) * w);
    if (d.torso) pose.add(sk.bone(d.torso), 'r', (d.lean + Math.sin(u * Math.PI * 2) * 1.2) * DEG * w);
    // arms swing against the legs, lagging a little (overlap)
    for (const a of d.arms) {
      const p = ph - d.armLag + a.phase;
      const swing = Math.cos(p * Math.PI * 2);
      pose.add(sk.bone(a.upper), 'r', swing * d.armSwing * DEG * w);
      const fwd = Math.max(0, -Math.cos((p - 0.06) * Math.PI * 2));
      pose.add(sk.bone(a.fore), 'r', -(d.elbow * 0.35 + fwd * d.elbow) * DEG * w);
    }
    if (this.flavor) this.flavor.apply(pose, ph * this.flavor.duration, w, true);
    // feet
    const R = (d.duty * this.stride) / 2;
    this.legs.forEach((l, i) => {
      const lp = fract(ph + l.phase);
      let x: number, y = 0, rot = 0;
      let lock = true;
      if (lp < d.duty) {
        const s = lp / d.duty;
        x = lerp(R, -R, s);
        // heel strike: toe comes down; toe-off: heel lifts around the toe
        if (s < 0.18) rot = -d.heel * (1 - EASES.quadOut(s / 0.18));
        if (s > 0.62) {
          const k = EASES.quadIn((s - 0.62) / 0.38);
          rot = d.toe * k;
          lock = false;
        }
      } else {
        lock = false;
        const s = (lp - d.duty) / (1 - d.duty);
        x = lerp(-R, R, EASES.sineInOut(s));
        // quick lift, longer reach: the curve peaks at 40% of the swing
        const lift = s < 0.4 ? Math.sin((s / 0.4) * Math.PI / 2) : Math.cos(((s - 0.4) / 0.6) * Math.PI / 2);
        y = -d.lift * lift;
        rot = lerp(d.toe * 0.8, -d.heel, smoothstep(0.1, 0.95, s));
      }
      // toe-off pivot: lifting the heel by `rot` raises the ankle around the toe
      let ax = x, ay = y;
      if (rot > 0) {
        const fl = d.footLen;
        const toeX = x + fl, toeY = 0 + y;
        const vx = -fl, vy = 0;
        const c = Math.cos(rot * DEG), s = Math.sin(rot * DEG);
        ax = toeX + (vx * c - vy * s);
        ay = toeY + (vx * s + vy * c);
      }
      const t = this.targets[i];
      t.x = l.ax + ax * w;
      t.y = l.ay + ay * w;
      t.rot = rot * w;
      t.lock = lock || w < 0.5;
    });
  }

  /**
   * Solves leg IK toward the current targets, honouring per-leg offsets already in the pose
   * (foot x/y channels are treated as target offsets) and keeping a foot reachable by
   * lowering the pelvis if needed. `ik` (0..1) blends between FK (the pose) and IK.
   */
  solveLegs(pose: Pose, ik = 1): void {
    if (ik <= 0) return;
    const sk = this.sk;
    const pelvis = sk.bone(this.def.pelvis);
    sk.solve(pose);
    // keep reach: if a target is out of reach, lower the pelvis (no floating feet)
    let lower = 0;
    for (let i = 0; i < this.legs.length; i++) {
      const l = this.legs[i], t = this.targets[i];
      const hip = sk.world[l.thigh];
      const tx = t.x + pose.get(l.foot, 'x'), ty = t.y + pose.get(l.foot, 'y');
      const dd = Math.hypot(tx - hip.tx, ty - hip.ty);
      const reach = (l.l1 + l.l2) * 0.995;
      if (dd > reach) {
        const dx = tx - hip.tx;
        const needY = Math.sqrt(Math.max(0, reach * reach - dx * dx));
        lower = Math.max(lower, (ty - hip.ty) - needY);
      }
    }
    if (lower > 0) { pose.add(pelvis, 'y', lower * ik); sk.solve(pose); }
    for (let i = 0; i < this.legs.length; i++) {
      const l = this.legs[i], t = this.targets[i];
      const hip = sk.world[l.thigh];
      const tx = t.x + pose.get(l.foot, 'x'), ty = t.y + pose.get(l.foot, 'y');
      const r = solveTwoBone(hip.tx, hip.ty, tx, ty, l.l1, l.l2, 1);
      const parentRot = l.parent >= 0 ? sk.world[l.parent].rotation : 0;
      const w1 = r.a1 - l.a1;
      const w2 = r.a2 - l.a2;
      const footRot = t.rot * DEG + pose.get(l.foot, 'r');
      const thighR = w1 - parentRot;
      const shinR = w2 - w1;
      const footR = footRot - w2;
      pose.set(l.thigh, 'r', lerp(pose.get(l.thigh, 'r'), thighR, ik));
      pose.set(l.shin, 'r', lerp(pose.get(l.shin, 'r'), shinR, ik));
      pose.set(l.foot, 'r', lerp(pose.get(l.foot, 'r'), footR, ik));
      pose.set(l.foot, 'x', 0);
      pose.set(l.foot, 'y', 0);
    }
    sk.solve(pose);
  }
}

/** Number of half-steps that fit a distance, so a walk always ends in double support. */
export function fitStride(distance: number, stride: number): number {
  const n = Math.max(1, Math.round(Math.abs(distance) / (stride / 2)));
  return clamp((2 * Math.abs(distance)) / n, stride * 0.55, stride * 1.35);
}
