import { Container, Graphics } from 'pixi.js';
import { Animator } from '../anim/animator';
import type { Atlas } from '../anim/atlas';
import type { ClipDef, ClipEvent } from '../anim/clip';
import { Locomotion, fitStride, type GaitDef } from '../anim/gait';
import { Pose, Skeleton, type RigDef } from '../anim/rig';
import { RigView } from '../anim/rigView';
import { clamp, damp, lerp, Rng } from '../engine/math';
import { EASES } from '../engine/ease';

/**
 * A character on stage: skeleton + animator + locomotion + live features, with the
 * game-facing verbs (walk, face, play, express, look, talk).
 *
 * Update order each frame (the same in game, cutscenes and the Animation Lab):
 *   clips → procedural layers (breath, gait, features' pre-solve) → leg IK → solve
 *   → features (eyes, hoses, tank, springs) → display sync.
 */
export interface CharacterSpec {
  id: string;
  /** Name as shown in dialogue. */
  name: string;
  rig: RigDef;
  sheet: () => string;
  clips: ClipDef[];
  gait: GaitDef;
  idle: string;
  /** Base clip while walking (if the idle holds the arms somewhere the gait should not). */
  walkBase?: string;
  /** Approximate height (units), used for framing and speech bubble anchors. */
  height: number;
  /** Bone that carries the face (bubble anchor, look-at). */
  headBone: string;
  /** Top of the head in sheet space (moves with the head bone): the speech-bubble anchor. */
  headTop: [number, number];
  /** Centre of the magnifier lens in sheet space, on `hand.near` (ICH only): used to measure reach. */
  lens?: [number, number];
  /** Shadow half-width (units). */
  shadow: number;
  /** Display scale of the rig (lets a sheet be drawn at a convenient size). Default 1. */
  scale?: number;
  /** Named expressions → parameter targets. */
  expressions: Record<string, Record<string, number>>;
  /** Attaches live features (eyes, hoses, liquid, letters…). */
  build(actor: Actor): void;
}

export interface Feature {
  /** Adjusts the pose before IK and solve (look-at, springs on bones). */
  pre?(actor: Actor, dt: number): void;
  /** Updates displays after the skeleton is solved. */
  post?(actor: Actor, dt: number): void;
  /** Snap to rest (used when re-simulating). */
  reset?(actor: Actor): void;
}

export type Facing = 1 | -1;

interface WalkState {
  target: number;
  speed: number;
  resolve: () => void;
  style: 'walk' | 'sneak';
}

export class Actor {
  readonly sk: Skeleton;
  readonly pose: Pose;
  readonly anim: Animator;
  readonly loco: Locomotion;
  readonly view: RigView;
  /** World root: position on the floor, facing flip. */
  readonly root = new Container();
  /** Holds the rig, scaled by the turn and `scale`. */
  readonly body = new Container();
  readonly shadow = new Graphics();
  readonly features: Feature[] = [];
  readonly rng: Rng;

  x = 0;
  y = 0;
  facing: Facing = 1;
  scale = 1;
  /** Seconds since reset. */
  time = 0;
  /** Expression parameter targets and their smoothed values. */
  exprName = 'neutral';
  readonly expr: Record<string, number> = {};
  readonly exprTarget: Record<string, number> = {};
  /** 0..1 loudness of the current syllable (driven by the dialogue voice). */
  talk = 0;
  talking = false;
  /** World-space point the character looks at, or null. */
  look: { x: number; y: number } | null = null;
  /** Breathing amplitude multiplier (0 while asleep, etc.). */
  breath = 1;
  /** When false, locomotion and IK are left to the clip (sitting, falling). */
  ik = 1;
  private ikTarget = 1;
  /** Scene light multiplier for non-emissive parts. */
  light = 0xffffff;
  /** Per-actor extras features can use. */
  readonly data: Record<string, unknown> = {};

  private walkState: WalkState | null = null;
  private speedNow = 0;
  private turnT = 1;
  private turnFrom: Facing = 1;
  private walkW = 0;
  onEvent: ((e: ClipEvent | { name: string; data?: unknown }) => void) | null = null;

  constructor(readonly spec: CharacterSpec, atlas: Atlas, seed = 7) {
    this.sk = new Skeleton(spec.rig);
    this.pose = new Pose(this.sk.size);
    this.anim = new Animator(this.sk, spec.clips);
    this.loco = new Locomotion(this.sk, spec.gait);
    this.view = new RigView(this.sk, atlas);
    this.rng = new Rng(seed);
    this.root.label = spec.id;
    this.shadow.ellipse(0, 0, spec.shadow, spec.shadow * 0.16).fill({ color: 0x000000, alpha: 0.38 });
    this.root.addChild(this.shadow, this.body);
    this.body.addChild(this.view.root);
    this.anim.onEvent = (e) => this.onEvent?.(e);
    this.loco.onStep = (leg) => this.onEvent?.({ name: 'step', data: { leg, style: this.walkState?.style ?? 'walk' } });
    this.scale = spec.scale ?? 1;
    spec.build(this);
    this.reset();
  }

  get id(): string { return this.spec.id; }
  get walking(): boolean { return this.walkState !== null; }

  /** Resets to a standing idle at the current position (used by sequences and the lab). */
  reset(): void {
    this.time = 0;
    this.anim.reset(this.spec.idle);
    this.loco.reset();
    this.walkState?.resolve();
    this.walkState = null;
    this.speedNow = 0;
    this.walkW = 0;
    this.turnT = 1;
    this.talk = 0;
    this.talking = false;
    this.look = null;
    this.breath = 1;
    this.ik = this.ikTarget = 1;
    this.rng.seed = this.spec.id.length * 9973 + 17;
    this.setExpression('neutral', true);
    for (const f of this.features) f.reset?.(this);
    this.step(0);
  }

  /* ------------------------------------------------------------ verbs */

  setExpression(name: string, instant = false): void {
    const e = this.spec.expressions[name] ?? this.spec.expressions.neutral;
    this.exprName = name;
    const base = this.spec.expressions.neutral;
    for (const k of new Set([...Object.keys(base), ...Object.keys(e)])) {
      this.exprTarget[k] = e[k] ?? base[k];
      if (instant || this.expr[k] === undefined) this.expr[k] = this.exprTarget[k];
    }
  }

  face(dir: Facing, instant = false): void {
    if (dir === this.facing) return;
    this.turnFrom = this.facing;
    this.facing = dir;
    this.turnT = instant ? 1 : 0;
  }

  faceTowards(x: number, instant = false): void {
    if (Math.abs(x - this.x) > 1) this.face(x > this.x ? 1 : -1, instant);
  }

  /** Walks to a world x. Resolves on arrival. Stride is fitted so the walk ends with both feet down. */
  walkTo(x: number, opts: { speed?: number; style?: 'walk' | 'sneak' } = {}): Promise<void> {
    this.walkState?.resolve();
    const dist = x - this.x;
    if (Math.abs(dist) < 2) { this.walkState = null; return Promise.resolve(); }
    this.faceTowards(x);
    const style = opts.style ?? 'walk';
    const base = this.spec.gait.stride * (style === 'sneak' ? 0.62 : 1);
    this.loco.stride = fitStride(dist, base);
    if (this.walkW < 0.05) this.loco.phase = 0.02;
    if (this.spec.walkBase && this.anim.current() === this.spec.idle) void this.anim.play(this.spec.walkBase, { fade: 0.18 });
    return new Promise((resolve) => {
      this.walkState = { target: x, speed: opts.speed ?? this.spec.gait.speed * (style === 'sneak' ? 0.5 : 1), resolve, style };
    });
  }

  stopWalking(): void {
    this.walkState?.resolve();
    this.walkState = null;
  }

  /** Plays a clip on the base layer; resolves when it ends. */
  play(name: string, opts: Parameters<Animator['play']>[1] = {}): Promise<void> {
    return this.anim.play(name, opts);
  }

  idle(fade = 0.25): void { void this.anim.play(this.spec.idle, { fade }); }

  /** Enables or disables leg IK smoothly (clips that sit or fall turn it off). */
  setIk(on: boolean, instant = false): void {
    this.ikTarget = on ? 1 : 0;
    if (instant) this.ik = this.ikTarget;
  }

  /** World position of a sheet-space point on a bone (after the last update). */
  worldPoint(bone: string, sx?: number, sy?: number): { x: number; y: number } {
    const i = this.sk.bone(bone);
    const b = this.sk.def.bones[i];
    const p = this.sk.pointOn(i, sx ?? b.x, sy ?? b.y);
    const s = this.scale;
    return { x: this.x + p.x * s * this.facingScale(), y: this.y + p.y * s };
  }

  /** Top of the head in world space (for speech bubbles), wherever the head actually is. */
  headTop(): { x: number; y: number } {
    return this.worldPoint(this.spec.headBone, this.spec.headTop[0], this.spec.headTop[1]);
  }

  facingScale(): number {
    if (this.turnT >= 1) return this.facing;
    // the turn passes quickly through a narrow "edge-on" moment instead of a paper-thin flip
    const k = EASES.inOut(this.turnT);
    const sx = lerp(this.turnFrom, this.facing, k);
    return Math.sign(sx || this.facing) * Math.max(0.3, Math.abs(sx));
  }

  /* ------------------------------------------------------------ simulation */

  step(dt: number): void {
    this.time += dt;
    // locomotion
    let moved = 0;
    const ws = this.walkState;
    if (ws) {
      const remaining = ws.target - this.x;
      const dir: Facing = remaining >= 0 ? 1 : -1;
      if (dir !== this.facing) this.face(dir);
      const decel = Math.min(1, Math.abs(remaining) / (this.loco.stride * 0.45));
      const want = ws.speed * Math.max(0.35, EASES.sineOut(decel));
      this.speedNow = damp(this.speedNow, want, 9, dt);
      const stepLen = Math.min(Math.abs(remaining), this.speedNow * dt);
      this.x += stepLen * dir;
      moved = stepLen;
      if (Math.abs(ws.target - this.x) < 0.5) {
        this.x = ws.target;
        this.walkState = null;
        if (this.spec.walkBase && this.anim.current() === this.spec.walkBase) void this.anim.play(this.spec.idle, { fade: 0.35 });
        ws.resolve();
      }
    } else {
      this.speedNow = damp(this.speedNow, 0, 12, dt);
    }
    // the stride is fitted, so the phase lands on a contact at arrival
    this.loco.advance(moved);
    const wantW = this.walkState ? 1 : 0;
    this.walkW = damp(this.walkW, wantW, wantW > this.walkW ? 10 : 7, dt);
    if (this.walkW < 0.002) this.walkW = 0;
    this.loco.weight = this.walkW;
    if (this.turnT < 1) this.turnT = Math.min(1, this.turnT + dt / 0.16);
    this.ik = damp(this.ik, this.ikTarget, 10, dt);

    // expressions ease toward their targets (a little faster for the eye, so blinks read)
    for (const k of Object.keys(this.exprTarget)) {
      const cur = this.expr[k] ?? this.exprTarget[k];
      this.expr[k] = damp(cur, this.exprTarget[k], 14, dt);
    }

    // clips
    this.anim.update(dt);
    const pose = this.pose;
    pose.reset();
    this.anim.evaluate(pose);
    // breathing: a slow rise of the chest, shared by everybody but scaled per character
    const br = Math.sin(this.time * 2 * Math.PI * 0.28) * this.breath * (1 - this.walkW);
    pose.params.breath = br;
    // locomotion and feature pre-pass
    // clips can switch leg IK off for airborne or seated moments (`@ik` track)
    const ik = this.ik * clamp(pose.params.ik ?? 1);
    this.loco.apply(pose, this.walkW * ik);
    for (const f of this.features) f.pre?.(this, dt);
    if (ik > 0.001) this.loco.solveLegs(pose, ik);
    else this.sk.solve(pose);
    for (const f of this.features) f.post?.(this, dt);
    this.view.lightTint = this.light;
    this.view.sync(pose);
    // display
    this.root.position.set(this.x, this.y);
    this.body.scale.set(this.facingScale() * this.scale, this.scale);
    this.shadow.scale.set(this.scale, this.scale);
  }

  /** Re-simulates from rest for `t` seconds at a fixed step (deterministic scrubbing). */
  simulateTo(t: number, setup: () => void, dt = 1 / 60): void {
    this.reset();
    setup();
    let left = t;
    // at t = 0 nothing would be stepped and the display would keep its previous state
    if (left <= 1e-6) this.step(0);
    while (left > 1e-6) {
      const h = Math.min(dt, left);
      this.step(h);
      left -= h;
    }
  }
}
