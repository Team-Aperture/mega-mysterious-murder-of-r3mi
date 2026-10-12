import { Container, Graphics, Matrix, Sprite } from 'pixi.js';
import { clamp, lerp, TAU } from '../engine/math';
import type { Actor, Feature } from './actor';
import { glowTexture } from './fx';

/**
 * The single optic of R-3MI and V-TGM, drawn live as vector shapes.
 *
 * One eye is all the face these two have, so it carries the acting: shutters (lids) that close
 * from both sides, a tilt that works like a brow, an iris that looks around, and the canon
 * expression shapes (ring, happy/sad arc, slit, proud star, error cross). Expression values come
 * from the actor's smoothed expression state; clips can override them with `@eye.*` tracks.
 *
 * With `sphere`, the whole optic is projected onto a sphere (V-TGM): yaw/pitch slide the eye
 * across the body and foreshorten it, which turns the "head" for real instead of sliding a decal.
 */
export interface OpticStyle {
  bone: string;
  /** Eye centre in sheet space (when not on a sphere). */
  x: number;
  y: number;
  z: number;
  socketR: number;
  irisR: number;
  /** Outer bezel ring (0 = none). */
  bezelR: number;
  bezelColor: number;
  bezelHi: number;
  socketColor: number;
  ringColor: number;
  irisColor: number;
  coreColor: number;
  glowColor: number;
  glowSize: number;
  /** Thin inner ring light at the bezel (V-TGM). */
  ringLight?: number;
  /** Project onto a sphere (centre in sheet space, radius). */
  sphere?: { x: number; y: number; r: number; yaw: number; pitch: number };
  /** How restless the gaze is (saccades per second). */
  saccades: number;
  /** Seconds between blinks (range). */
  blink: [number, number];
}

const M = new Matrix();

export class Optic implements Feature {
  readonly container = new Container();
  readonly g = new Graphics();
  readonly glow = new Sprite(glowTexture());
  private blinkT = 0;
  private nextBlink = 2;
  private sacT = 0;
  private sacX = 0;
  private sacY = 0;
  private sacTX = 0;
  private sacTY = 0;
  private lastShape = 0;
  private pop = 0;

  constructor(readonly actor: Actor, readonly s: OpticStyle) {
    this.glow.anchor.set(0.5);
    this.glow.blendMode = 'add';
    this.container.addChild(this.glow, this.g);
    actor.view.addLive({
      name: 'optic', bone: s.bone, z: s.z, display: this.container,
      ox: s.sphere ? s.sphere.x : s.x, oy: s.sphere ? s.sphere.y : s.y, emissive: true,
    });
  }

  reset(): void {
    this.blinkT = 0;
    this.nextBlink = this.actor.rng.range(this.s.blink[0], this.s.blink[1]);
    this.sacT = 0; this.sacX = this.sacY = this.sacTX = this.sacTY = 0;
    this.pop = 0;
  }

  /** Current value of an eye parameter: clip override (`@eye.x`) wins over the expression. */
  private p(name: string, fallback: number): number {
    const a = this.actor;
    const o = a.pose.params[`eye.${name}`];
    if (o !== undefined) return o;
    const e = a.expr[name];
    return e === undefined ? fallback : e;
  }

  post(a: Actor, dt: number): void {
    const s = this.s;
    // ---- procedural blink (skipped while the eye is shut or in a special shape)
    this.blinkT += dt;
    let blink = 0;
    if (this.blinkT > this.nextBlink) {
      const u = (this.blinkT - this.nextBlink) / 0.16;
      if (u >= 1) {
        this.blinkT = 0;
        this.nextBlink = a.rng.range(s.blink[0], s.blink[1]);
        if (a.rng.next() < 0.18) this.nextBlink = 0.22; // occasional double blink
      } else blink = Math.sin(u * Math.PI);
    }
    // ---- saccades: small, quick re-targets of the gaze
    this.sacT += dt;
    if (s.saccades > 0 && this.sacT > 1 / s.saccades) {
      this.sacT = a.rng.range(-0.3, 0.3) / s.saccades;
      this.sacTX = a.rng.range(-0.35, 0.35);
      this.sacTY = a.rng.range(-0.2, 0.2);
    }
    const k = 1 - Math.exp(-dt * 30);
    this.sacX += (this.sacTX - this.sacX) * k;
    this.sacY += (this.sacTY - this.sacY) * k;

    const shape = Math.round(this.p('shape', 0));
    if (shape !== this.lastShape) { this.pop = 1; this.lastShape = shape; }
    this.pop = Math.max(0, this.pop - dt * 5);
    const power = this.p('power', 1); // 0 = switched off (sleep)
    const open = clamp(this.p('open', 1) * (1 - blink * (power > 0.2 ? 1 : 0)), 0, 1);
    const squash = this.p('squash', 1);
    const arc = this.p('arc', 0);
    const glowV = this.p('glow', 0.6) * (1 + a.talk * 0.35) * power;
    const tilt = this.p('tilt', 0);
    const size = this.p('size', 1) * (1 + this.pop * 0.12) * (1 + a.talk * 0.05);
    let lookX = clamp(this.p('lookX', 0) + this.sacX * (1 - Math.abs(this.p('lookX', 0))), -1, 1);
    let lookY = clamp(this.p('lookY', 0) + this.sacY, -1, 1);
    // look-at target overrides the gaze direction (in character space, facing handled by sign)
    if (a.look) {
      const eye = a.worldPoint(s.bone, s.sphere ? s.sphere.x : s.x, s.sphere ? s.sphere.y : s.y);
      const dx = (a.look.x - eye.x) * a.facing, dy = a.look.y - eye.y;
      const d = Math.hypot(dx, dy) || 1;
      lookX = clamp(dx / d * 0.9 + this.sacX * 0.3, -1, 1);
      lookY = clamp(dy / d * 0.7, -1, 1);
    }
    const shake = this.p('shake', 0);

    // ---- placement: plain, or projected on the sphere
    const c = this.container;
    if (s.sphere) {
      const yaw = s.sphere.yaw + this.p('yaw', 0) + lookX * 0.18;
      const pitch = s.sphere.pitch + this.p('pitch', 0) + lookY * 0.12;
      const R = s.sphere.r;
      const px = Math.sin(yaw) * Math.cos(pitch) * R;
      const py = -Math.sin(pitch) * R;
      const front = Math.cos(yaw) * Math.cos(pitch);
      // place on the surface: offset from sphere centre, foreshortened along the radial direction
      const ang = Math.atan2(py, px);
      const fore = Math.max(0.12, front);
      // build transform: rotate to radial direction, squash along it, rotate back
      const ca = Math.cos(ang), sa = Math.sin(ang);
      // affine: R(ang) · S(fore, 1) · R(-ang)
      const a11 = ca * ca * fore + sa * sa, a12 = ca * sa * (fore - 1);
      const a22 = sa * sa * fore + ca * ca;
      this.g.setFromMatrix(M.set(a11, a12, a12, a22, px, py));
      this.glow.position.set(px, py);
      c.visible = front > -0.1;
      lookX *= 0.35; lookY *= 0.35; // most of the look is the projection itself
    } else {
      this.g.setFromMatrix(M.identity());
      this.glow.position.set(0, 0);
    }

    // ---- draw
    const g = this.g;
    g.clear();
    const jx = shake ? Math.sin(a.time * 90) * shake * 2.2 : 0;
    const jy = shake ? Math.cos(a.time * 77) * shake * 1.6 : 0;
    if (s.bezelR > 0) {
      g.circle(0, 0, s.bezelR).fill({ color: s.bezelColor });
      g.circle(-s.bezelR * 0.18, -s.bezelR * 0.2, s.bezelR * 0.86).stroke({ color: s.bezelHi, width: s.bezelR * 0.05, alpha: 0.5 });
      g.circle(0, 0, s.bezelR).stroke({ color: 0x1b1620, width: 4 });
    }
    g.circle(0, 0, s.socketR).fill({ color: s.socketColor });
    if (s.ringLight) {
      g.circle(0, 0, s.socketR - s.ringLight / 2).stroke({ color: s.ringColor, width: s.ringLight, alpha: 0.35 + 0.65 * power });
    }
    g.circle(0, 0, s.socketR).stroke({ color: 0x0b0a10, width: 3 });

    const R = s.irisR * size;
    const cx = jx + lookX * (s.socketR - R * 0.85), cy = jy + lookY * (s.socketR - R * 0.85);
    const h = s.irisR * squash * open;
    const center = (1 - open) * s.irisR * 0.3; // the upper shutter travels further
    const top = center - h, bot = center + h;
    const lit = power > 0.02 && open > 0.01;
    if (lit) {
      const alpha = clamp(power * 1.4, 0, 1);
      if (shape === 1) {
        // happy (arc > 0, "∩") or sad (arc < 0, "∪") crescent
        const dir = arc >= 0 ? -1 : 1;
        const pts: number[] = [];
        const r0 = R * 0.78, w = R * 0.42;
        for (let i = 0; i <= 16; i++) {
          const t = Math.PI * (0.12 + 0.76 * (i / 16));
          pts.push(cx - Math.cos(t) * r0, cy + dir * Math.sin(t) * r0 * 0.75 - dir * R * 0.15);
        }
        for (let i = 16; i >= 0; i--) {
          const t = Math.PI * (0.12 + 0.76 * (i / 16));
          pts.push(cx - Math.cos(t) * (r0 - w), cy + dir * Math.sin(t) * (r0 - w) * 0.6 - dir * R * 0.15);
        }
        g.poly(pts).fill({ color: s.irisColor, alpha });
      } else if (shape === 3) {
        g.star(cx, cy, 5, R * 1.05, R * 0.45, -Math.PI / 2).fill({ color: s.irisColor, alpha });
        g.circle(cx, cy, R * 0.28).fill({ color: s.coreColor, alpha });
      } else if (shape === 4) {
        const t = R * 0.18;
        g.moveTo(cx - R * 0.7, cy - R * 0.7).lineTo(cx + R * 0.7, cy + R * 0.7)
          .moveTo(cx + R * 0.7, cy - R * 0.7).lineTo(cx - R * 0.7, cy + R * 0.7)
          .stroke({ color: s.irisColor, width: t * 2, cap: 'round', alpha });
      } else {
        // ring: iris disc + inner ring + hot core, clipped to the shutter band (tilted like a brow)
        g.poly(bandCircle(cx, cy, R, top, bot, tilt, 40)).fill({ color: s.ringColor, alpha });
        g.poly(bandCircle(cx, cy, R * 0.8, top, bot, tilt, 36)).fill({ color: s.irisColor, alpha });
        g.poly(bandCircle(cx, cy, R * 0.52, top, bot, tilt, 28)).fill({ color: mixc(s.irisColor, s.coreColor, 0.55), alpha });
        g.poly(bandCircle(cx, cy, R * 0.3, top, bot, tilt, 24)).fill({ color: s.coreColor, alpha });
        // shutter edges: thin dark lines where the lids are
        if (open < 0.97) {
          const lx = s.socketR;
          const ct = Math.cos(tilt), st = Math.sin(tilt);
          const ln = (y: number) => g.moveTo(-lx * ct - y * st, -lx * st + y * ct).lineTo(lx * ct - y * st, lx * st + y * ct);
          ln(top); ln(bot);
          g.stroke({ color: 0x07060a, width: 3, alpha: 0.9 });
        }
      }
    }
    // glass glint (fixed on the glass, not on the iris)
    if (s.bezelR > 0 || s.socketR > 20) {
      g.ellipse(-s.socketR * 0.42, -s.socketR * 0.48, s.socketR * 0.2, s.socketR * 0.11).fill({ color: 0xffffff, alpha: 0.55 });
      g.circle(-s.socketR * 0.18, -s.socketR * 0.62, s.socketR * 0.05).fill({ color: 0xffffff, alpha: 0.5 });
    }
    // halo
    const gl = lit ? glowV * (0.25 + 0.75 * open) : 0;
    this.glow.visible = gl > 0.01;
    this.glow.tint = s.glowColor;
    this.glow.alpha = clamp(gl, 0, 1) * 0.85;
    const gs = (s.glowSize * (0.6 + 0.6 * glowV)) / 64;
    this.glow.scale.set(gs, gs);
  }
}

/** Circle polygon with its points clamped into the band [top, bot] (rotated by `tilt`). */
function bandCircle(cx: number, cy: number, r: number, top: number, bot: number, tilt: number, seg: number): number[] {
  const out: number[] = [];
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * TAU;
    let x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    // into band space (rotate by -tilt), clamp, back
    const bx = x * ct + y * st, by = -x * st + y * ct;
    const cy2 = Math.min(bot, Math.max(top, by));
    x = bx * ct - cy2 * st;
    y = bx * st + cy2 * ct;
    out.push(x, y);
  }
  return out;
}

function mixc(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
}
