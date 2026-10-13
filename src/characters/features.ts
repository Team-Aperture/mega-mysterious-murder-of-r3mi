import { Container, Graphics, MeshRope, Point, Sprite } from 'pixi.js';
import { ShapeRope } from '../anim/rope';
import { Spring } from '../engine/spring';
import { clamp, DEG, type Vec2 } from '../engine/math';
import type { Actor, Feature } from './actor';
import { glowTexture, hoseTexture } from './fx';

/* ------------------------------------------------------------------ hoses */

export interface Anchor { bone: string; x: number; y: number }
export interface HoseDef {
  name: string;
  z: number;
  a: Anchor;
  b: Anchor;
  /** Bulge control point (follows its bone). */
  c: Anchor;
  /** Optional second control (near b): makes the rest shape a cubic, for round loops. */
  c2?: Anchor;
  width: number;
  base: string;
  accent: string;
  segments?: number;
  stiffness?: number;
  /** Fluid-filled hoses glow and are not darkened by scene light. */
  emissive?: boolean;
}

/**
 * A hose between two bones. Simulated in *world* space (so it lags when the character walks
 * or turns), displayed in character space as a textured MeshRope.
 */
export class Hose implements Feature {
  readonly rope: ShapeRope;
  readonly mesh: MeshRope;
  private readonly pts: Point[];
  private readonly wa: Vec2 = { x: 0, y: 0 };
  private readonly wb: Vec2 = { x: 0, y: 0 };
  private readonly wc: Vec2 = { x: 0, y: 0 };
  private readonly wc2: Vec2 | undefined;

  constructor(readonly actor: Actor, readonly d: HoseDef) {
    const n = d.segments ?? (d.c2 ? 16 : 12);
    if (d.c2) this.wc2 = { x: 0, y: 0 };
    this.rope = new ShapeRope(n, d.stiffness ?? 16, 0.02, 600);
    this.pts = Array.from({ length: n }, () => new Point());
    const tex = hoseTexture(d.base, d.accent);
    this.mesh = new MeshRope({ texture: tex, points: this.pts, textureScale: d.width / tex.height });
    const holder = new Container();
    holder.addChild(this.mesh);
    actor.view.addLive({ name: `hose.${d.name}`, bone: d.a.bone, z: d.z, display: holder, follow: false, emissive: d.emissive });
  }

  private anchors(a: Actor): void {
    const A = a.worldPoint(this.d.a.bone, this.d.a.x, this.d.a.y);
    const B = a.worldPoint(this.d.b.bone, this.d.b.x, this.d.b.y);
    const C = a.worldPoint(this.d.c.bone, this.d.c.x, this.d.c.y);
    this.wa.x = A.x; this.wa.y = A.y; this.wb.x = B.x; this.wb.y = B.y; this.wc.x = C.x; this.wc.y = C.y;
    if (this.d.c2 && this.wc2) {
      const C2 = a.worldPoint(this.d.c2.bone, this.d.c2.x, this.d.c2.y);
      this.wc2.x = C2.x; this.wc2.y = C2.y;
    }
  }

  reset(a: Actor): void {
    a.sk.solve(a.pose);
    this.anchors(a);
    this.rope.reset(this.wa, this.wc, this.wb, this.wc2);
    this.toLocal(a);
  }

  post(a: Actor, dt: number): void {
    this.anchors(a);
    // a zero step (first frame after a reset or a turn applied instantly) snaps to the rest shape
    if (dt > 0) this.rope.step(dt, this.wa, this.wc, this.wb, this.wc2);
    else this.rope.reset(this.wa, this.wc, this.wb, this.wc2);
    this.toLocal(a);
  }

  private toLocal(a: Actor): void {
    const fs = a.facingScale() * a.scale, s = a.scale;
    for (let i = 0; i < this.pts.length; i++) {
      const p = this.rope.pts[i];
      this.pts[i].set((p.x - a.x) / fs, (p.y - a.y) / s);
    }
  }
}

/* ------------------------------------------------------------------ tank */

export interface TankDef {
  bone: string;
  z: number;
  /** Interior rectangle in sheet space. */
  x: number; y: number; w: number; h: number;
  /** Fill level 0..1 from the bottom. */
  level: number;
  fluid: number;
  fluidHi: number;
  glow: number;
  /** Lean of the glass in degrees (the drawing is rotated about its centre by the same amount). */
  tilt?: number;
}

/**
 * Glass tank fluid: the surface tilts against the tank's acceleration (spring slosh), bubbles
 * rise and pop. `@tank.bubbles` (0..1) scales the bubbling (low while asleep).
 */
export class Tank implements Feature {
  readonly g = new Graphics();
  readonly glow = new Sprite(glowTexture());
  private readonly tilt = new Spring(0, 1.6, 0.18);
  private readonly wave = new Spring(0, 2.2, 0.12);
  private prevX = 0;
  private prevV = 0;
  private bubbles: { x: number; y: number; r: number; v: number }[] = [];

  private readonly lean: number;

  constructor(readonly actor: Actor, readonly d: TankDef) {
    const c = new Container();
    // the fluid is drawn in the glass's own (leaned) frame, rotated about the glass centre
    const inner = new Container();
    this.lean = ((d.tilt ?? 0) * Math.PI) / 180;
    inner.pivot.set(d.w / 2, d.h / 2);
    inner.position.set(d.w / 2, d.h / 2);
    inner.rotation = this.lean;
    this.glow.anchor.set(0.5);
    this.glow.blendMode = 'add';
    inner.addChild(this.glow, this.g);
    c.addChild(inner);
    actor.view.addLive({ name: 'tank.fluid', bone: d.bone, z: d.z, display: c, ox: d.x, oy: d.y, emissive: true });
  }

  reset(a: Actor): void {
    this.tilt.reset(0); this.wave.reset(0);
    this.prevX = a.worldPoint(this.d.bone).x; this.prevV = 0;
    this.bubbles = [];
    for (let i = 0; i < 6; i++) this.spawn(a, a.rng.next() * this.d.h);
  }

  private spawn(a: Actor, y = 0): void {
    const d = this.d;
    this.bubbles.push({ x: a.rng.range(4, d.w - 4), y: d.h - 3 - y, r: a.rng.range(1.5, 4), v: a.rng.range(28, 60) });
  }

  post(a: Actor, dt: number): void {
    const d = this.d;
    const wx = a.worldPoint(d.bone).x;
    const v = dt > 0 ? (wx - this.prevX) / dt : 0;
    const acc = dt > 0 ? (v - this.prevV) / dt : 0;
    this.prevX = wx; this.prevV = v;
    // the surface leans against the acceleration (and the tank's own rotation is undone)
    this.tilt.target = clamp(-acc * 0.00012 * a.facing, -0.35, 0.35);
    this.tilt.step(dt);
    this.wave.target = 0;
    this.wave.kick(-acc * 0.00002);
    this.wave.step(dt);
    const bub = a.pose.params['tank.bubbles'] ?? 1;
    const g = this.g;
    g.clear();
    const lvl = d.h * (1 - d.level);
    // keep the surface (nearly) level in the world: undo the bone's rotation and the glass lean
    const boneRot = a.sk.rot(a.sk.bone(d.bone)) + this.lean;
    const t = this.tilt.value - boneRot * 0.85;
    const w = d.w;
    const yl = lvl - Math.tan(t) * w * 0.5 + Math.sin(a.time * 3.1) * 0.6;
    const yr = lvl + Math.tan(t) * w * 0.5 + Math.sin(a.time * 2.7 + 1) * 0.6;
    const mid = (yl + yr) / 2 + this.wave.value * 30;
    g.moveTo(0, clamp(yl, 2, d.h)).quadraticCurveTo(w / 2, clamp(mid, 2, d.h), w, clamp(yr, 2, d.h))
      .lineTo(w, d.h).lineTo(0, d.h).closePath().fill({ color: d.fluid, alpha: 0.92 });
    // bright meniscus line and inner streak
    g.moveTo(0, clamp(yl, 2, d.h)).quadraticCurveTo(w / 2, clamp(mid, 2, d.h), w, clamp(yr, 2, d.h))
      .stroke({ color: d.fluidHi, width: 2.2, alpha: 0.9 });
    // the light comes from the front and top (canon): the streak is on the front side of the glass
    g.rect(w * 0.68, Math.max(yl, yr) + 4, w * 0.12, d.h - Math.max(yl, yr) - 8).fill({ color: d.fluidHi, alpha: 0.35 });
    // bubbles
    const rate = bub;
    if (a.rng.next() < dt * 7 * rate) this.spawn(a);
    const surf = Math.min(yl, yr);
    this.bubbles = this.bubbles.filter((b) => {
      b.y -= b.v * dt * (0.4 + 0.6 * rate);
      b.x += Math.sin(a.time * 6 + b.r * 3) * 0.15;
      if (b.y < surf + 2) return false;
      g.circle(b.x, b.y, b.r).stroke({ color: d.fluidHi, width: 1.2, alpha: 0.85 });
      return true;
    });
    this.glow.position.set(w / 2, d.h * 0.6);
    this.glow.tint = d.glow;
    this.glow.alpha = 0.12 + 0.06 * rate;
    this.glow.scale.set((d.h * 1.1) / 64);
  }
}

/* ------------------------------------------------------------------ LEDs */

export interface LedDef {
  name: string;
  bone: string;
  z: number;
  x: number; y: number;
  /** Rounded-rect size; for round LEDs set w = h. */
  w: number; h: number;
  color: number;
  glow: number;
  /** Pose parameter controlling brightness 0..1 (default 1). */
  param?: string;
  ring?: boolean;
}

/** A small light (chest slot, joint rings). Brightness from a pose/expression parameter. */
export class Led implements Feature {
  readonly g = new Graphics();
  readonly glow = new Sprite(glowTexture());
  constructor(readonly actor: Actor, readonly d: LedDef) {
    const c = new Container();
    this.glow.anchor.set(0.5);
    this.glow.blendMode = 'add';
    c.addChild(this.glow, this.g);
    actor.view.addLive({ name: `led.${d.name}`, bone: d.bone, z: d.z, display: c, ox: d.x, oy: d.y, emissive: true });
  }
  post(a: Actor): void {
    const d = this.d;
    const pv = d.param ? (a.pose.params[d.param] ?? a.expr[d.param] ?? 1) : 1;
    const v = clamp(pv, 0, 1.5);
    const g = this.g;
    g.clear();
    if (d.ring) {
      g.circle(0, 0, d.w / 2).stroke({ color: 0x0c0b10, width: d.h + 2 });
      g.circle(0, 0, d.w / 2).stroke({ color: d.color, width: d.h, alpha: 0.18 + 0.82 * Math.min(1, v) });
    } else {
      g.roundRect(-d.w / 2 - 1.5, -d.h / 2 - 1.5, d.w + 3, d.h + 3, Math.min(d.w, d.h) / 2 + 1.5).fill({ color: 0x0c0b10 });
      g.roundRect(-d.w / 2, -d.h / 2, d.w, d.h, Math.min(d.w, d.h) / 2).fill({ color: d.color, alpha: 0.15 + 0.85 * Math.min(1, v) });
      g.roundRect(-d.w / 2 + d.w * 0.2, -d.h / 2 + d.h * 0.15, d.w * 0.25, d.h * 0.4, 2).fill({ color: 0xffffff, alpha: 0.5 * Math.min(1, v) });
    }
    this.glow.tint = d.glow;
    this.glow.alpha = 0.55 * Math.min(1, v);
    this.glow.visible = v > 0.02;
    this.glow.scale.set((Math.max(d.w, d.h) * 3.2) / 64);
  }
}

/* ------------------------------------------------------------------ handedness */

export interface HandednessDef {
  /** Facing (+1 right, −1 left) in which the sheet's own decorations are on the wrong side. */
  swapWhen: 1 | -1;
  /** Slot → part overrides applied while swapped (e.g. the big shoulder disk to the other arm). */
  attach: Record<string, string>;
  /** Live displays (by name, e.g. "led.elbow", "hose.c") shown only while NOT swapped … */
  canon: string[];
  /** … and their counterparts shown only while swapped. */
  swapped: string[];
}

/**
 * Keeps asymmetric details on the correct side of the body when a character turns.
 * Mirroring a side-view drawing also mirrors its handedness (a ring on the left arm would end
 * up on the right one); this moves such details to the other limb at the moment of the flip.
 */
export class Handedness implements Feature {
  private on = false;
  constructor(readonly actor: Actor, readonly d: HandednessDef) {}

  private isSwapped(a: Actor): boolean { return Math.sign(a.facingScale()) === this.d.swapWhen; }

  pre(a: Actor): void {
    this.on = this.isSwapped(a);
    if (!this.on) return;
    for (const [slot, part] of Object.entries(this.d.attach)) if (!(slot in a.pose.attach)) a.pose.attach[slot] = part;
  }

  post(a: Actor): void {
    for (const l of a.view.live) {
      if (this.d.canon.includes(l.name)) l.display.visible = !this.on;
      else if (this.d.swapped.includes(l.name)) l.display.visible = this.on;
    }
  }

  reset(a: Actor): void {
    this.on = this.isSwapped(a);
    this.post(a);
  }
}

/* ------------------------------------------------------------------ spring bones */

export interface SpringBoneDef {
  bone: string;
  /** Rotation spring stiffness (Hz) and damping ratio. */
  freq: number;
  zeta: number;
  /** How strongly the bone swings against world-x acceleration and vertical bob. */
  gainX: number;
  gainY: number;
  /** Clamp (deg). */
  limit: number;
}

/**
 * Follow-through on a bone: it rotates against the acceleration of its own pivot (coat tails,
 * hat, head lag, antennae) and settles back.
 */
export class SpringBone implements Feature {
  private readonly s: Spring;
  private px = 0; private py = 0; private vx = 0; private vy = 0;
  constructor(readonly actor: Actor, readonly d: SpringBoneDef) {
    this.s = new Spring(0, d.freq, d.zeta);
  }
  reset(a: Actor): void {
    const p = a.worldPoint(this.d.bone);
    this.px = p.x; this.py = p.y; this.vx = this.vy = 0;
    this.s.reset(0);
  }
  pre(a: Actor, dt: number): void {
    // uses the previous frame's world position (one frame of latency is invisible here)
    a.sk.solve(a.pose);
    const p = a.worldPoint(this.d.bone);
    if (dt > 0) {
      const vx = (p.x - this.px) / dt, vy = (p.y - this.py) / dt;
      const ax = (vx - this.vx) / dt, ay = (vy - this.vy) / dt;
      this.vx = vx; this.vy = vy;
      this.s.kick((-ax * this.d.gainX * a.facing - ay * this.d.gainY) * dt);
    }
    this.px = p.x; this.py = p.y;
    this.s.target = 0;
    this.s.step(dt);
    const lim = this.d.limit * DEG;
    a.pose.add(a.sk.bone(this.d.bone), 'r', clamp(this.s.value, -lim, lim));
  }
}
