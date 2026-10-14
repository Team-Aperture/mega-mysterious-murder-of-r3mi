import type { GaitDef } from '../../anim/gait';
import { Spring } from '../../engine/spring';
import { clamp, DEG } from '../../engine/math';
import type { Actor, CharacterSpec, Feature } from '../actor';
import { SpringBone } from '../features';
import { IchLetters } from '../ichLetters';
import { ICH_BONES, ICH_EXPRESSIONS, ICH_GAIT, ICH_SLOTS } from './index';
import { ICH_CLIPS } from './clips';
import { JC, LETTERS_C, PLATE_C, SCOPE_DOWN, SCOPE_UP } from './geoC';
import { ichSheetC } from './sheetC';

/**
 * ICH, design direction C „Das Periskop" (see docs/ICH_DESIGN_DIRECTIONS.md).
 * A square sign on a long telescopic neck above a small plum cape cone, thin springy legs, big
 * shoes. Same skeleton, slots and clips as A; its own sheet, a bouncier gait and one extra
 * feature (`Periscope`): the telescope slides out of its fixed outer tube while he snoops, shoots
 * up on „Aha!" and ducks in when he is nervous — layered on top of the shared clips.
 */

/**
 * How far the telescope is out (units, + = up) for the clip that is playing. The shared clips
 * stay untouched: this only adds a slide of the neck bone along the torso axis on top of them.
 */
function scopeTarget(clip: string | null, t: number, arms: string | null): number {
  const UP = SCOPE_UP, DOWN = -SCOPE_DOWN;
  switch (clip) {
    // snooping: the plate rides up and forward over whatever he examines
    case 'examine': return t < 0.3 ? 0 : 50;
    case 'examineUp': return t < 0.25 ? 0 : 70;
    // „Aha!": the periscope shoots up past the raised finger
    case 'aha': return t < 0.12 ? 0 : 74;
    case 'shocked': return t < 0.04 ? 0 : t < 0.4 ? UP : 0;
    case 'pose': return t < 0.32 ? -30 : 30;
    case 'popOut': return t < 0.12 ? DOWN : t < 0.7 ? UP : 30;
    case 'reachUp': return UP;
    case 'tossUp': return t < 0.14 ? -24 : UP;
    // peekaboo: he ducks into his collar
    case 'nervous': case 'buried': return DOWN;
    // the plate comes down to meet his short arms
    case 'hatTip': return t < 0.8 ? DOWN : 0;
    case 'hatAdjust': return t < 1.0 ? DOWN : 0;
    case 'chinStroke': case 'pointSelf': return DOWN;
    case 'doze': return t < 0.3 ? 0 : t < 1.7 ? DOWN : -40;
    case 'dozing': return -40;
    // he lies on the floor, then the plate peeks up at the audience
    case 'trip': return t > 3.2 && t < 4.2 ? 30 : 0;
    default: return arms === 'balance' ? 24 : 0;
  }
}

/**
 * His arms are short for the long neck: where a shared clip reaches for the hat, the near arm
 * swings a little further forward (degrees), so the glove meets the brim in front of the plate
 * instead of covering the letters.
 */
function reachTarget(clip: string | null, t: number): number {
  switch (clip) {
    case 'hatTip': return t < 0.85 ? 24 : 0;
    case 'hatAdjust': return t < 1.0 ? 24 : 0;
    case 'doze': return t > 0.3 && t < 1.5 ? 24 : 0;
    default: return 0;
  }
}

/** The periscope: a sprung slide of the neck bone (overshoots a little, then clunks on its stops). */
class Periscope implements Feature {
  private readonly s = new Spring(0, 2.8, 0.42);
  private readonly arm = new Spring(0, 3, 0.8);
  reset(): void { this.s.reset(0); this.arm.reset(0); }
  pre(a: Actor, dt: number): void {
    const clip = a.anim.current(), t = a.anim.currentTime();
    this.s.target = scopeTarget(clip, t, a.anim.current('arms'));
    this.s.step(dt);
    // each spoken syllable bobs the plate down a little
    const ext = clamp(this.s.value - a.talk * 6, -SCOPE_DOWN, SCOPE_UP);
    const neck = a.sk.bone('neck');
    a.pose.add(neck, 'y', -ext);
    // squash & stretch of the neck (bonked) goes mostly into the telescope: the plate keeps more of its shape
    const nsy = a.pose.get(neck, 'sy');
    if (Math.abs(nsy - 1) > 1e-3 && nsy > 0.05) a.pose.add(a.sk.bone('head'), 'sy', Math.pow(1 / nsy, 0.7));
    this.arm.target = reachTarget(clip, t);
    this.arm.step(dt);
    if (Math.abs(this.arm.value) > 0.01) a.pose.add(a.sk.bone('upperarm.near'), 'r', this.arm.value * DEG);
  }
}

/** Bouncy: deep springy knees, high lift, the plate lagging on its mast. */
export const ICH_C_GAIT: GaitDef = {
  ...ICH_GAIT,
  stride: 240, speed: 220, duty: 0.52, lift: 66, bob: 20, bobPhase: 0.2, drop: 24,
  lean: 3, heel: 18, toe: 34, footLen: 72, armSwing: 26, elbow: 12, armLag: 0.07,
  flavor: {
    name: 'ichC.walkFlavor', duration: 1, loop: true,
    tracks: {
      // the mast settles after each bounce and springs back up (lags the pelvis bob)
      'neck.y': [{ t: 0.16, v: 7, e: 'sineInOut' }, { t: 0.4, v: -8, e: 'sineInOut' }, { t: 0.66, v: 7, e: 'sineInOut' }, { t: 0.9, v: -8, e: 'sineInOut' }],
      'head.r': [{ t: 0.2, v: 2.5, e: 'sineInOut' }, { t: 0.45, v: -2.5, e: 'sineInOut' }, { t: 0.7, v: 2.5, e: 'sineInOut' }, { t: 0.95, v: -2.5, e: 'sineInOut' }],
      'torso.r': [{ t: 0, v: -1.5, e: 'sineInOut' }, { t: 0.5, v: 1.5, e: 'sineInOut' }],
      // floppy wrists
      'hand.near.r': [{ t: 0.1, v: 10, e: 'sineInOut' }, { t: 0.6, v: -10, e: 'sineInOut' }],
      'hand.far.r': [{ t: 0.1, v: -10, e: 'sineInOut' }, { t: 0.6, v: 10, e: 'sineInOut' }],
      'hat.r': [{ t: 0.22, v: 3, e: 'sineInOut' }, { t: 0.47, v: -3, e: 'sineInOut' }, { t: 0.72, v: 3, e: 'sineInOut' }, { t: 0.97, v: -3, e: 'sineInOut' }],
    },
  },
};

function buildC(a: Actor): void {
  // first: the springs below measure the plate where the periscope has put it
  a.features.push(new Periscope());
  a.features.push(new SpringBone(a, { bone: 'coat.front', freq: 2.2, zeta: 0.2, gainX: 0.0014, gainY: 0.001, limit: 24 }));
  a.features.push(new SpringBone(a, { bone: 'coat.back', freq: 1.9, zeta: 0.18, gainX: 0.0016, gainY: 0.001, limit: 28 }));
  a.features.push(new SpringBone(a, { bone: 'neck', freq: 2.6, zeta: 0.3, gainX: 0.00016, gainY: 0.0001, limit: 5 }));
  a.features.push(new SpringBone(a, { bone: 'hat', freq: 2.6, zeta: 0.22, gainX: 0.0006, gainY: 0.0009, limit: 14 }));
  a.features.push(new SpringBone(a, { bone: 'head', freq: 3.0, zeta: 0.35, gainX: 0.00024, gainY: 0.0003, limit: 6 }));
  a.features.push(new IchLetters(a, { bone: 'head', z: 25, x: PLATE_C.cx, y: PLATE_C.cy, size: LETTERS_C, color: 0xffb22e, core: 0xfff1c9, glow: 0xff9a1a, glowW: 220 }));
}

export const ICH_C: CharacterSpec = {
  id: 'ich-c',
  name: 'ICH',
  rig: { id: 'ich-c', bones: ICH_BONES(JC), slots: ICH_SLOTS },
  sheet: ichSheetC,
  clips: ICH_CLIPS,
  gait: ICH_C_GAIT,
  idle: 'idle',
  walkBase: 'stand',
  height: 752,
  headTop: [10, -754],
  headBone: 'head',
  lens: [JC.wrN[0] + 4, JC.wrN[1] + 128],
  shadow: 70,
  expressions: ICH_EXPRESSIONS,
  build: buildC,
};
