import { blocked, type ClipDef } from '../../anim/clip';

/**
 * R-3MI clips. Values are deltas from the rest drawing (rotations in degrees, positive = the
 * part's lower end swings backwards for a rig facing right; negative raises an arm forwards).
 * Authored pose-to-pose: key poses first, then breakdowns, with curves on the keys.
 */

/** Cabin stoop: he never stands straight in here. Breathing and a slow weight shift. */
const idle: ClipDef = {
  name: 'idle', duration: 4, loop: true,
  tracks: {
    'torso.r': [{ t: 0, v: 4, e: 'sineInOut' }, { t: 1, v: 3.2, e: 'sineInOut' }, { t: 2, v: 4.2, e: 'sineInOut' }, { t: 3, v: 4.8, e: 'sineInOut' }],
    'torso.sy': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 1.1, v: 1.014, e: 'sineInOut' }, { t: 2, v: 1, e: 'sineInOut' }, { t: 3.1, v: 1.012, e: 'sineInOut' }],
    'neck.r': [{ t: 0, v: 5, e: 'sineInOut' }, { t: 2.2, v: 6.5, e: 'sineInOut' }],
    'head.r': [{ t: 0.2, v: 3, e: 'sineInOut' }, { t: 1.3, v: 0.5, e: 'sineInOut' }, { t: 2.4, v: 3.5, e: 'sineInOut' }, { t: 3.4, v: 1.5, e: 'sineInOut' }],
    'pelvis.x': [{ t: 0, v: -2, e: 'sineInOut' }, { t: 2, v: 3, e: 'sineInOut' }],
    'pelvis.y': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 1, v: 2.5, e: 'sineInOut' }, { t: 2, v: 0, e: 'sineInOut' }, { t: 3, v: 2, e: 'sineInOut' }],
    'upperarm.near.r': [{ t: 0.3, v: -2, e: 'sineInOut' }, { t: 2.3, v: 1, e: 'sineInOut' }],
    'upperarm.far.r': [{ t: 0.6, v: 2, e: 'sineInOut' }, { t: 2.6, v: -1, e: 'sineInOut' }],
    'forearm.near.r': [{ t: 0.4, v: -7, e: 'sineInOut' }, { t: 2.4, v: -4, e: 'sineInOut' }],
    'forearm.far.r': [{ t: 0.8, v: -5, e: 'sineInOut' }, { t: 2.8, v: -8, e: 'sineInOut' }],
    'hand.near.r': [{ t: 0.5, v: 4, e: 'sineInOut' }, { t: 2.5, v: -2, e: 'sineInOut' }],
  },
};

/** Fidget variant: fingertips of both hands tap together in front of the chest. Nervous. */
const fidget: ClipDef = blocked('fidget', 2.4, [
  [0, { 'torso.r': 6, 'neck.r': 6, 'head.r': 6, 'upperarm.near.r': -38, 'forearm.near.r': -78, 'hand.near.r': -18, 'upperarm.far.r': -42, 'forearm.far.r': -70, 'hand.far.r': -10, 'pelvis.y': 4 }, 'sineInOut'],
  [0.3, { 'forearm.near.r': -84, 'forearm.far.r': -64, 'head.r': 8 }, 'quadOut'],
  [0.5, { 'forearm.near.r': -78, 'forearm.far.r': -70 }, 'quadOut'],
  [0.7, { 'forearm.near.r': -84, 'forearm.far.r': -64 }, 'quadOut'],
  [0.9, { 'forearm.near.r': -78, 'forearm.far.r': -70, 'head.r': 4 }, 'sineInOut'],
  [1.5, { 'forearm.near.r': -84, 'forearm.far.r': -64, 'head.r': 9 }, 'quadOut'],
  [1.7, { 'forearm.near.r': -78, 'forearm.far.r': -70 }, 'quadOut'],
  [1.9, { 'forearm.near.r': -84, 'forearm.far.r': -64 }, 'quadOut'],
  [2.4, { 'forearm.near.r': -78, 'forearm.far.r': -70, 'head.r': 6 }, 'sineInOut'],
], { loop: true });

/** „Hiii!": up on the toes, big open-hand wave. */
const wave: ClipDef = blocked('wave', 1.9, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -6, 'torso.r': 4, 'head.r': 2, 'pelvis.y': 0 }, 'backIn'],
  [0.22, { 'upperarm.near.r': -150, 'forearm.near.r': -24, 'hand.near.r': 0, 'torso.r': -2, 'head.r': -8, 'pelvis.y': -10 }, 'quadOut'],
  [0.42, { 'forearm.near.r': 22, 'hand.near.r': 12 }, 'sineInOut'],
  [0.62, { 'forearm.near.r': -28, 'hand.near.r': -14 }, 'sineInOut'],
  [0.82, { 'forearm.near.r': 22, 'hand.near.r': 12 }, 'sineInOut'],
  [1.02, { 'forearm.near.r': -28, 'hand.near.r': -14 }, 'sineInOut'],
  [1.22, { 'forearm.near.r': 14, 'hand.near.r': 6, 'pelvis.y': -6 }, 'quadInOut'],
  [1.6, { 'upperarm.near.r': -20, 'forearm.near.r': -10, 'hand.near.r': 0, 'torso.r': 3, 'head.r': 1, 'pelvis.y': 0 }, 'sineOut'],
  [1.9, { 'upperarm.near.r': 0, 'forearm.near.r': -6, 'torso.r': 4, 'head.r': 2 }],
], { attach: { 'hand.near': [{ t: 0.12, v: 'hand.near#open' }, { t: 1.5, v: 'hand.near' }] }, tracks: { '@eye.shape': [{ t: 0.1, v: 1 }, { t: 1.6, v: 0 }], '@eye.arc': [{ t: 0, v: 1 }] } });

/** Points forward (at the window, at the seat, at the problem). Holds the end pose. */
const point: ClipDef = blocked('point', 0.9, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -6, 'torso.r': 4 }, 'backIn'],
  [0.28, { 'upperarm.near.r': -88, 'forearm.near.r': -6, 'hand.near.r': -8, 'torso.r': 8, 'head.r': 4 }, 'backOut'],
  [0.9, { 'upperarm.near.r': -82, 'forearm.near.r': -8, 'hand.near.r': -4, 'torso.r': 7, 'head.r': 3 }],
], { attach: { 'hand.near': [{ t: 0.1, v: 'hand.near#point' }] } });

/** Startled jolt: up, back, arms out, then settles. */
const flinch: ClipDef = blocked('flinch', 0.9, [
  [0, { 'pelvis.y': 0, 'torso.r': 4, 'head.r': 2, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -6, 'forearm.far.r': -6 }, 'expoOut'],
  [0.08, { 'pelvis.y': -26, 'torso.r': -10, 'head.r': -12, 'neck.r': -6, 'upperarm.near.r': -40, 'upperarm.far.r': 30, 'forearm.near.r': -50, 'forearm.far.r': -40 }, 'quadInOut'],
  [0.35, { 'pelvis.y': -8, 'torso.r': -4, 'head.r': -4, 'neck.r': 0 }, 'sineInOut'],
  [0.9, { 'pelvis.y': 0, 'torso.r': 4, 'head.r': 2, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -6, 'forearm.far.r': -6 }],
], { attach: { 'hand.near': [{ t: 0.05, v: 'hand.near#open' }, { t: 0.7, v: 'hand.near' }] } });

/** Ducks with a hand over his head (ceilings, overhead bins, life). Holds. */
const duck: ClipDef = blocked('duck', 0.7, [
  [0, { 'pelvis.y': 0, 'torso.r': 4, 'neck.r': 5, 'head.r': 3, 'upperarm.near.r': 0, 'forearm.near.r': -6 }, 'backIn'],
  [0.3, { 'pelvis.y': 46, 'torso.r': 20, 'neck.r': 14, 'head.r': 10, 'upperarm.near.r': -172, 'forearm.near.r': -62, 'hand.near.r': -30 }, 'backOut'],
  [0.7, { 'pelvis.y': 42, 'torso.r': 18, 'neck.r': 12, 'head.r': 9, 'upperarm.near.r': -168, 'forearm.near.r': -64, 'hand.near.r': -28 }],
], { z: { 'hand.near': [{ t: 0, v: 45 }], 'forearm.near': [{ t: 0, v: 44 }] } });

/** Small speaking accents (additive layer). */
const nod: ClipDef = {
  name: 'nod', duration: 0.6,
  tracks: {
    'head.r': [{ t: 0, v: 0, e: 'quadOut' }, { t: 0.15, v: 5, e: 'sineInOut' }, { t: 0.4, v: -1.5, e: 'sineInOut' }, { t: 0.6, v: 0 }],
    'neck.r': [{ t: 0, v: 0, e: 'quadOut' }, { t: 0.2, v: 2, e: 'sineInOut' }, { t: 0.6, v: 0 }],
  },
};
const beat: ClipDef = {
  name: 'beat', duration: 0.7,
  tracks: {
    'upperarm.near.r': [{ t: 0, v: 0, e: 'backOut' }, { t: 0.2, v: -24, e: 'sineInOut' }, { t: 0.7, v: 0 }],
    'forearm.near.r': [{ t: 0, v: 0, e: 'backOut' }, { t: 0.22, v: -40, e: 'sineInOut' }, { t: 0.7, v: 0 }],
    'head.r': [{ t: 0, v: 0 }, { t: 0.18, v: -4, e: 'sineInOut' }, { t: 0.7, v: 0 }],
  },
};

/** Shrug: shoulders up, palms out. */
const shrug: ClipDef = blocked('shrug', 1.2, [
  [0, { 'torso.r': 4, 'head.r': 2, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -6, 'forearm.far.r': -6, 'pelvis.y': 0 }, 'backIn'],
  [0.25, { 'torso.r': 0, 'torso.sy': 1.03, 'head.r': -6, 'neck.r': -4, 'upperarm.near.r': -24, 'upperarm.far.r': -18, 'forearm.near.r': -78, 'forearm.far.r': -70, 'hand.near.r': -30, 'pelvis.y': -6 }, 'sineInOut'],
  [0.75, { 'head.r': -9, 'torso.sy': 1.025 }, 'quadInOut'],
  [1.2, { 'torso.r': 4, 'torso.sy': 1, 'head.r': 2, 'neck.r': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -6, 'forearm.far.r': -6, 'hand.near.r': 0, 'pelvis.y': 0 }],
], { attach: { 'hand.near': [{ t: 0.1, v: 'hand.near#open' }, { t: 1.0, v: 'hand.near' }], 'hand.far': [{ t: 0.1, v: 'hand.far#open' }, { t: 1.0, v: 'hand.far' }] } });

export const R3MI_CLIPS: ClipDef[] = [idle, fidget, wave, point, flinch, duck, nod, beat, shrug];
