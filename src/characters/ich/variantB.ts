import type { GaitDef } from '../../anim/gait';
import type { RigDef } from '../../anim/rig';
import { DEG, Mat, clamp, lerp, smoothstep } from '../../engine/math';
import type { Actor, CharacterSpec, Feature } from '../actor';
import { SpringBone } from '../features';
import { IchLetters } from '../ichLetters';
import { ICH_CLIPS } from './clips';
import { J as JA } from './geo';
import { JB, LENS_B, LETTERS_B, PLATE_B } from './geoB';
import { ICH_BONES, ICH_EXPRESSIONS, ICH_GAIT, ICH_SLOTS } from './index';
import { ichSheetB } from './sheetB';

/**
 * ICH, design direction B „Der Aktenschrank" (see docs/ICH_DESIGN_DIRECTIONS.md).
 *
 * Same skeleton and the same shared clips as A. Two small runtime adapters (features, below)
 * fit those clips to a rigid filing cabinet on stubby legs:
 *  - LegFit: the clips' pelvis offsets are authored for A's long legs. Crouches are scaled to
 *    B's leg length (and clamped so the legs never fold through the floor); while seated, the
 *    hips keep A's absolute height, because the cabin seats are built for it. Torso angles are
 *    scaled down: the whole brick tips on its plinth, a much longer lever than A's waist.
 *  - CabinetFollow: `coat.front` is the bottom drawer front and `coat.back` the folder tabs in
 *    the top drawer. Their bones hang off the pelvis (shared skeleton), so they are re-parented
 *    to the carcass (torso) and the top drawer (head) every frame. The coat swings the clips and
 *    springs ask for become a drawer that rattles and slides out a little, and tabs that flutter.
 */

/* ------------------------------------------------------------------ runtime fit */

interface LegFitDef {
  /**
   * Scale of the torso's rotation. The carcass pivots on the plinth, so its lever is much longer
   * than A's waist: the same angle would swing the faceplate about 1.6× as far. Stiffer, too.
   */
  torsoScale: number;
  /** Leg length of this rig ÷ A's (scales the clips' crouches). */
  legScale: number;
  /** Scale of the clips' foot offsets (stance width). */
  footScale: number;
  /** Rest hip heights of this rig and of A. */
  hipY: number;
  hipYA: number;
  /** Deepest pelvis drop (units) before the stubby legs would fold through the floor. */
  maxDrop: number;
  /** Seated clips: the hips keep A's absolute height there (the seat cushion is built for A). */
  sitClips: string[];
}

class LegFit implements Feature {
  private readonly sit: Set<string>;
  constructor(readonly d: LegFitDef) { this.sit = new Set(d.sitClips); }
  pre(a: Actor): void {
    const { sk, pose } = a;
    const d = this.d;
    const pel = sk.bone('pelvis');
    const torso = sk.bone('torso');
    pose.set(torso, 'r', pose.get(torso, 'r') * d.torsoScale);
    // the gait's own drop and bob are already in B's units: blend the scale out while walking
    const clipY = pose.get(pel, 'y');
    let y = clipY * lerp(d.legScale, 1, a.loco.weight);
    const clip = a.anim.current();
    if (clip && this.sit.has(clip)) {
      // how far the thighs have swung forward into the seated pose (FK, -86° in SIT)
      const s = smoothstep(0.1, 0.95, -pose.get(sk.bone('thigh.near'), 'r') / (86 * DEG));
      y = lerp(y, d.hipYA + clipY - d.hipY, s);
    }
    pose.set(pel, 'y', Math.min(y, d.maxDrop));
    for (const f of ['foot.near', 'foot.far']) {
      const b = sk.bone(f);
      pose.set(b, 'x', pose.get(b, 'x') * d.footScale);
      pose.set(b, 'y', pose.get(b, 'y') * d.footScale);
    }
  }
}

interface FollowDef {
  /** Bone to re-parent (its real parent is the pelvis). */
  bone: string;
  /** Bone it should move with. */
  follow: string;
  /** Own rotation = clamp(asked rotation × gain, ±limit) (deg). */
  gain: number;
  limit: number;
  /** Slide along `dir` (units per degree asked, max) in the followed bone's frame: a drawer. */
  slide?: { perDeg: number; max: number; dir: [number, number] };
}

/** Moves pelvis children rigidly with another bone, keeping a little of their own swing. */
class CabinetFollow implements Feature {
  private readonly m = new Mat();
  private readonly l = new Mat();
  private readonly t = new Mat();
  constructor(readonly defs: FollowDef[]) {}
  pre(a: Actor): void {
    const { sk, pose } = a;
    const bones = sk.def.bones;
    for (const f of this.defs) {
      const bi = sk.bone(f.bone);
      const parent = sk.parent[bi];
      // chain from the shared parent down to the followed bone
      const chain: number[] = [];
      for (let i = sk.bone(f.follow); i !== parent; i = sk.parent[i]) {
        if (i < 0) throw new Error(`CabinetFollow: ${f.follow} does not descend from ${bones[parent].name}`);
        chain.unshift(i);
      }
      const m = this.m.identity();
      for (const i of chain) {
        this.l.compose(sk.restX[i] + pose.get(i, 'x'), sk.restY[i] + pose.get(i, 'y'), pose.get(i, 'r'), pose.get(i, 'sx'), pose.get(i, 'sy'));
        this.t.copyFrom(m);
        m.multiply(this.t, this.l);
      }
      const asked = pose.get(bi, 'r') / DEG;
      const fb = bones[sk.bone(f.follow)], me = bones[bi];
      let ox = me.x - fb.x, oy = me.y - fb.y;
      if (f.slide) {
        const s = clamp(Math.abs(asked) * f.slide.perDeg, 0, f.slide.max);
        ox += f.slide.dir[0] * s;
        oy += f.slide.dir[1] * s;
      }
      const p = m.apply(ox, oy);
      const sx = Math.hypot(m.a, m.b);
      const sy = (m.a * m.d - m.b * m.c) / (sx || 1);
      pose.set(bi, 'r', m.rotation + clamp(asked * f.gain, -f.limit, f.limit) * DEG);
      pose.set(bi, 'x', p.x - sk.restX[bi]);
      pose.set(bi, 'y', p.y - sk.restY[bi]);
      pose.set(bi, 'sx', sx);
      pose.set(bi, 'sy', sy);
    }
  }
}

/* ------------------------------------------------------------------ gait */

/** Short stiff steps of a wind-up cabinet: quick cadence, almost no bob or sway, upright (the lean cancels the stand clip's backward tilt); the drawer clacks. */
export const ICH_B_GAIT: GaitDef = {
  ...ICH_GAIT,
  stride: 150, speed: 220, duty: 0.6, lift: 22, bob: 4, bobPhase: 0.2, drop: 5,
  lean: 3, heel: 8, toe: 12, footLen: 48, armSwing: 13, elbow: 2, armLag: 0.02,
  flavor: {
    name: 'ichB.walkFlavor', duration: 1, loop: true,
    tracks: {
      // the top drawer stays level and deadpan
      'head.r': [{ t: 0, v: 0.8, e: 'sineInOut' }, { t: 0.25, v: -0.8, e: 'sineInOut' }, { t: 0.5, v: 0.8, e: 'sineInOut' }, { t: 0.75, v: -0.8, e: 'sineInOut' }],
      // each footfall knocks the bottom drawer open a crack (see CabinetFollow)
      'coat.front.r': [{ t: 0, v: 0, e: 'expoOut' }, { t: 0.05, v: 16, e: 'sineInOut' }, { t: 0.22, v: 0 }, { t: 0.5, v: 0, e: 'expoOut' }, { t: 0.55, v: 16, e: 'sineInOut' }, { t: 0.72, v: 0 }],
      'coat.back.r': [{ t: 0.05, v: 8, e: 'sineInOut' }, { t: 0.3, v: -6, e: 'sineInOut' }, { t: 0.55, v: 8, e: 'sineInOut' }, { t: 0.8, v: -6, e: 'sineInOut' }],
      'hat.r': [{ t: 0.03, v: 2.5, e: 'sineInOut' }, { t: 0.28, v: -1, e: 'sineInOut' }, { t: 0.53, v: 2.5, e: 'sineInOut' }, { t: 0.78, v: -1, e: 'sineInOut' }],
      // stiff gloves
      'hand.near.r': [{ t: 0.45, v: -8, e: 'sineInOut' }, { t: 0.95, v: 4, e: 'sineInOut' }],
      'hand.far.r': [{ t: 0.95, v: -8, e: 'sineInOut' }, { t: 0.45, v: 4, e: 'sineInOut' }],
    },
  },
};

/* ------------------------------------------------------------------ spec */

export const ICH_B_RIG: RigDef = { id: 'ich-b', bones: ICH_BONES(JB), slots: ICH_SLOTS };

const SIT_CLIPS = ['sitDown', 'sit', 'doze', 'dozing'];

function buildB(a: Actor): void {
  // leg fit first, so the springs below feel the motion the legs really make
  a.features.push(new LegFit({
    torsoScale: 0.7, legScale: 0.45, footScale: 0.6,
    hipY: JB.hipN[1], hipYA: JA.hipN[1],
    maxDrop: 72, sitClips: SIT_CLIPS,
  }));
  a.features.push(new SpringBone(a, { bone: 'coat.front', freq: 3.2, zeta: 0.3, gainX: 0.0016, gainY: 0.0012, limit: 30 }));
  a.features.push(new SpringBone(a, { bone: 'coat.back', freq: 2.6, zeta: 0.22, gainX: 0.0016, gainY: 0.0012, limit: 30 }));
  a.features.push(new SpringBone(a, { bone: 'hat', freq: 3.4, zeta: 0.28, gainX: 0.0005, gainY: 0.0007, limit: 12 }));
  // steel does not wobble much: a stiff, small head spring
  a.features.push(new SpringBone(a, { bone: 'head', freq: 4.2, zeta: 0.5, gainX: 0.00012, gainY: 0.00016, limit: 3 }));
  a.features.push(new CabinetFollow([
    // bottom drawer: a ±2° rattle, and it slides out of the carcass by up to 16 units (almost
    // level, so it never tucks behind the plinth or the rail above it)
    { bone: 'coat.front', follow: 'torso', gain: 0.06, limit: 2, slide: { perDeg: 0.4, max: 16, dir: [0.995, 0.1] } },
    // folder tabs flutter on their base in the top drawer
    { bone: 'coat.back', follow: 'head', gain: 0.35, limit: 12 },
  ]));
  a.features.push(new IchLetters(a, { bone: 'head', z: 25, x: PLATE_B.cx, y: PLATE_B.cy, size: LETTERS_B, color: 0xffb22e, core: 0xfff1c9, glow: 0xff9a1a, glowW: 250 }));
}

export const ICH_B: CharacterSpec = {
  id: 'ich-b',
  name: 'ICH',
  rig: ICH_B_RIG,
  sheet: ichSheetB,
  clips: ICH_CLIPS,
  gait: ICH_B_GAIT,
  idle: 'idle',
  walkBase: 'stand',
  height: 676,
  headTop: [60, -676],
  headBone: 'head',
  lens: LENS_B,
  shadow: 82,
  expressions: ICH_EXPRESSIONS,
  build: buildB,
};
