import { blocked, type ClipDef } from '../../anim/clip';

/**
 * ICH clips. He has no face, so the body does all of it: posture, hands, hat, coat and the
 * brightness of his letters. Values are deltas from the rest drawing (degrees).
 * Shared by all three design directions (same bone names).
 */

/** Professorial: near hand gripping the lapel, far hand behind the back, rocking on his heels. */
const idle: ClipDef = {
  name: 'idle', duration: 3.2, loop: true,
  tracks: {
    'upperarm.near.r': [{ t: 0, v: -27, e: 'sineInOut' }, { t: 0.9, v: -30, e: 'sineInOut' }, { t: 1.8, v: -27, e: 'sineInOut' }],
    'forearm.near.r': [{ t: 0, v: 146 }],
    'hand.near.r': [{ t: 0, v: -20 }],
    'upperarm.far.r': [{ t: 0, v: 8, e: 'sineInOut' }, { t: 1.6, v: 10, e: 'sineInOut' }], 'forearm.far.r': [{ t: 0, v: -6 }],
    'torso.r': [{ t: 0, v: -4, e: 'sineInOut' }, { t: 0.9, v: -8, e: 'sineInOut' }, { t: 1.8, v: -4, e: 'sineInOut' }, { t: 2.5, v: -3, e: 'sineInOut' }],
    'torso.sy': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 0.9, v: 1.015, e: 'sineInOut' }, { t: 1.8, v: 1, e: 'sineInOut' }],
    'head.r': [{ t: 0, v: -2, e: 'sineInOut' }, { t: 0.9, v: -5, e: 'sineInOut' }, { t: 1.8, v: -2, e: 'sineInOut' }],
    'pelvis.y': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.9, v: -3, e: 'sineInOut' }, { t: 1.8, v: 0, e: 'sineInOut' }],
    'foot.near.r': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.9, v: -7, e: 'sineInOut' }, { t: 1.8, v: 0, e: 'sineInOut' }],
    'foot.far.r': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.9, v: -7, e: 'sineInOut' }, { t: 1.8, v: 0, e: 'sineInOut' }],
  },
  attach: { 'hand.near': [{ t: 0, v: 'hand.near#fist' }] },
};

/** Arms simply hanging (used when hands are needed quickly). */
const stand: ClipDef = {
  name: 'stand', duration: 3, loop: true,
  tracks: {
    'torso.r': [{ t: 0, v: -3, e: 'sineInOut' }, { t: 1.5, v: -4.5, e: 'sineInOut' }],
    'upperarm.near.r': [{ t: 0, v: -2, e: 'sineInOut' }, { t: 1.5, v: 1, e: 'sineInOut' }],
    'upperarm.far.r': [{ t: 0, v: 2, e: 'sineInOut' }, { t: 1.5, v: -1, e: 'sineInOut' }],
    'forearm.near.r': [{ t: 0, v: -8 }], 'forearm.far.r': [{ t: 0, v: -6 }],
  },
};

/**
 * The Pose. Anticipation crouch, then a snap into: weight back, coat flared, magnifier raised
 * beside the plate, other fist on the hip, plate turned up to the audience. Holds.
 */
const pose: ClipDef = blocked('pose', 1.6, [
  [0, { 'pelvis.y': 0, 'torso.r': -3, 'head.r': 0, 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'upperarm.far.r': 0, 'forearm.far.r': -6, 'coat.front.r': 0, 'coat.back.r': 0, 'foot.near.x': 0, 'foot.far.x': 0, 'hat.r': 0 }, 'sineIn'],
  [0.28, { 'pelvis.y': 22, 'torso.r': 10, 'head.r': 8, 'upperarm.near.r': 20, 'forearm.near.r': -20, 'upperarm.far.r': 16, 'coat.front.r': 6, 'coat.back.r': -4 }, 'expoOut'],
  [0.46, { 'pelvis.y': -6, 'torso.r': -12, 'head.r': -9, 'upperarm.near.r': -128, 'forearm.near.r': -44, 'hand.near.r': 6, 'upperarm.far.r': 34, 'forearm.far.r': -112, 'coat.front.r': -18, 'coat.back.r': 20, 'foot.near.x': 34, 'foot.far.x': -18, 'hat.r': -8 }, 'backOut'],
  [0.7, { 'pelvis.y': 2, 'torso.r': -10, 'head.r': -7, 'coat.front.r': -6, 'coat.back.r': 8, 'hat.r': 2 }, 'sineInOut'],
  [1.6, { 'pelvis.y': 0, 'torso.r': -11, 'head.r': -8, 'upperarm.near.r': -126, 'forearm.near.r': -46, 'hand.near.r': 4, 'upperarm.far.r': 34, 'forearm.far.r': -112, 'coat.front.r': -4, 'coat.back.r': 5, 'foot.near.x': 34, 'foot.far.x': -18, 'hat.r': 0 }],
], {
  attach: { 'hand.near': [{ t: 0.3, v: 'hand.near#fist' }], magnifier: [{ t: 0.3, v: 'magnifier' }], 'hand.far': [{ t: 0.4, v: 'hand.far#fist' }] },
  tracks: { '@letters': [{ t: 0, v: 1 }, { t: 0.46, v: 1.5, e: 'quadOut' }, { t: 0.9, v: 1.2 }] },
  events: [{ t: 0.46, name: 'sfx', data: 'whoosh' }],
});

/** „Aha!": finger up, plate up, a tiny hop. Then the pause in which nothing happens. */
const aha: ClipDef = blocked('aha', 1.4, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'head.r': 0, 'torso.r': -3, 'pelvis.y': 0 }, 'backIn'],
  [0.2, { 'upperarm.near.r': -158, 'forearm.near.r': -14, 'hand.near.r': -6, 'head.r': -10, 'torso.r': -8, 'pelvis.y': -12 }, 'backOut'],
  [0.4, { 'pelvis.y': 0, 'head.r': -8 }, 'sineInOut'],
  [1.4, { 'upperarm.near.r': -154, 'forearm.near.r': -16, 'hand.near.r': -4, 'head.r': -7, 'torso.r': -7 }],
], {
  attach: { 'hand.near': [{ t: 0.1, v: 'hand.near#point' }] },
  tracks: { '@letters': [{ t: 0.18, v: 1 }, { t: 0.22, v: 1.6, e: 'quadOut' }, { t: 0.6, v: 1.15 }] },
});

/** Strokes the bottom edge of the plate (he has no chin), other arm holds the elbow. */
const chinStroke: ClipDef = blocked('chinStroke', 2.4, [
  [0, { 'upperarm.near.r': -30, 'forearm.near.r': -168, 'hand.near.r': -10, 'upperarm.far.r': -28, 'forearm.far.r': -86, 'head.r': 5, 'torso.r': 2 }, 'sineInOut'],
  [0.4, { 'forearm.near.r': -174, 'hand.near.r': 8, 'head.r': 6 }, 'sineInOut'],
  [0.8, { 'forearm.near.r': -168, 'hand.near.r': -10 }, 'sineInOut'],
  [1.2, { 'forearm.near.r': -174, 'hand.near.r': 8, 'head.r': 7 }, 'sineInOut'],
  [1.6, { 'forearm.near.r': -168, 'hand.near.r': -10 }, 'sineInOut'],
  [2.0, { 'forearm.near.r': -174, 'hand.near.r': 8, 'head.r': 5 }, 'sineInOut'],
  [2.4, { 'upperarm.near.r': -30, 'forearm.near.r': -168, 'hand.near.r': -10, 'head.r': 5 }],
], { loop: true, z: { 'hand.near': [{ t: 0, v: 36 }] } });

/** Nervous: hunched, hands wringing in front, a shiver, letters flicker (expression). */
const nervous: ClipDef = blocked('nervous', 1.2, [
  [0, { 'torso.r': 9, 'pelvis.y': 10, 'head.r': 8, 'upperarm.near.r': -44, 'forearm.near.r': -72, 'hand.near.r': -20, 'upperarm.far.r': -40, 'forearm.far.r': -76, 'hand.far.r': -10, 'coat.front.r': 2 }, 'sineInOut'],
  [0.15, { 'hand.near.r': 6, 'hand.far.r': -26, 'pelvis.y': 12, 'head.r': 10 }, 'sineInOut'],
  [0.3, { 'hand.near.r': -20, 'hand.far.r': -10, 'pelvis.y': 10 }, 'sineInOut'],
  [0.45, { 'hand.near.r': 6, 'hand.far.r': -26, 'pelvis.y': 12, 'head.r': 7 }, 'sineInOut'],
  [0.6, { 'hand.near.r': -20, 'hand.far.r': -10, 'pelvis.y': 10 }, 'sineInOut'],
  [0.75, { 'hand.near.r': 6, 'hand.far.r': -26, 'pelvis.y': 12, 'head.r': 10 }, 'sineInOut'],
  [0.9, { 'hand.near.r': -20, 'hand.far.r': -10, 'pelvis.y': 10 }, 'sineInOut'],
  [1.05, { 'hand.near.r': 6, 'hand.far.r': -26, 'pelvis.y': 12, 'head.r': 7 }, 'sineInOut'],
  [1.2, { 'hand.near.r': -20, 'hand.far.r': -10, 'pelvis.y': 10, 'head.r': 8 }],
], { loop: true });

/** Shocked: a jolt off the floor, arms fling up, coat flares, the hat pops off and lands again. */
const shocked: ClipDef = blocked('shocked', 1.3, [
  [0, { 'root.y': 0, 'pelvis.y': 0, 'torso.r': -3, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -8, 'forearm.far.r': -6, 'coat.front.r': 0, 'coat.back.r': 0, 'hat.y': 0, 'hat.r': 0, 'head.r': 0, '@ik': 1 }, 'expoOut'],
  [0.02, { '@ik': 0 }, 'step'],
  [0.12, { 'root.y': -44, 'torso.r': -14, 'head.r': -12, 'upperarm.near.r': -150, 'upperarm.far.r': 150, 'forearm.near.r': -30, 'forearm.far.r': 30, 'coat.front.r': 24, 'coat.back.r': -26, 'hat.y': -90, 'hat.r': -40 }, 'quadIn'],
  [0.3, { 'root.y': 0, 'hat.y': -120, 'hat.r': -70 }, 'step'],
  [0.32, { '@ik': 1, 'pelvis.y': 16, 'torso.r': -6 }, 'backOut'],
  [0.62, { 'hat.y': 0, 'hat.r': 6, 'pelvis.y': 0, 'upperarm.near.r': -60, 'upperarm.far.r': 50 }, 'bounceOut'],
  [1.3, { 'hat.y': 0, 'hat.r': 0, 'torso.r': -3, 'head.r': -2, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -8, 'forearm.far.r': -6, 'coat.front.r': 0, 'coat.back.r': 0 }],
], {
  attach: { 'hand.near': [{ t: 0.05, v: 'hand.near#open' }, { t: 1.0, v: 'hand.near' }], 'hand.far': [{ t: 0.05, v: 'hand.far#open' }, { t: 1.0, v: 'hand.far' }] },
  tracks: { '@letters': [{ t: 0, v: 1 }, { t: 0.08, v: 1.8, e: 'expoOut' }, { t: 0.5, v: 1.1 }] },
});

/** Tips the hat (forward), with a little bow of the plate. */
const hatTip: ClipDef = blocked('hatTip', 1.1, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'hat.r': 0, 'head.r': 0, 'torso.r': -3 }, 'quadOut'],
  [0.3, { 'upperarm.near.r': -168, 'forearm.near.r': -10, 'hand.near.r': -14 }, 'sineInOut'],
  [0.5, { 'hat.r': 22, 'hat.y': 4, 'head.r': 10, 'torso.r': 8 }, 'sineInOut'],
  [0.75, { 'hat.r': 0, 'hat.y': 0, 'head.r': 0, 'torso.r': -3 }, 'quadOut'],
  [1.1, { 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0 }],
], { z: { 'hand.near': [{ t: 0, v: 36 }], 'forearm.near': [{ t: 0, v: 35.5 }] } });

/** Examine: lean in, magnifier forward, slow drift. Holds while the player reads. */
const examine: ClipDef = blocked('examine', 1.4, [
  [0, { 'pelvis.y': 0, 'torso.r': -3, 'head.r': 0, 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'upperarm.far.r': 0, 'forearm.far.r': -6 }, 'sineInOut'],
  [0.45, { 'pelvis.y': 26, 'torso.r': 24, 'head.r': 6, 'upperarm.near.r': -96, 'forearm.near.r': -18, 'hand.near.r': -64, 'upperarm.far.r': 22, 'forearm.far.r': 30 }, 'sineInOut'],
  [0.95, { 'torso.r': 27, 'head.r': 9, 'upperarm.near.r': -92, 'hand.near.r': -60 }, 'sineInOut'],
  [1.4, { 'pelvis.y': 24, 'torso.r': 24, 'head.r': 6, 'upperarm.near.r': -96, 'forearm.near.r': -18, 'hand.near.r': -64 }],
], { attach: { 'hand.near': [{ t: 0.15, v: 'hand.near#fist' }], magnifier: [{ t: 0.15, v: 'magnifier' }] } });

/** Speaking accents (additive). */
const beat: ClipDef = {
  name: 'beat', duration: 0.7,
  tracks: {
    'upperarm.near.r': [{ t: 0, v: 0, e: 'backOut' }, { t: 0.2, v: -36, e: 'sineInOut' }, { t: 0.7, v: 0 }],
    'forearm.near.r': [{ t: 0, v: 0, e: 'backOut' }, { t: 0.2, v: -50, e: 'sineInOut' }, { t: 0.7, v: 0 }],
    'head.r': [{ t: 0, v: 0 }, { t: 0.18, v: -5, e: 'sineInOut' }, { t: 0.7, v: 0 }],
  },
};
const nod: ClipDef = {
  name: 'nod', duration: 0.5,
  tracks: {
    'head.r': [{ t: 0, v: 0, e: 'quadOut' }, { t: 0.14, v: 6, e: 'sineInOut' }, { t: 0.32, v: -2, e: 'sineInOut' }, { t: 0.5, v: 0 }],
    'hat.r': [{ t: 0.05, v: 0, e: 'quadOut' }, { t: 0.2, v: 5, e: 'sineInOut' }, { t: 0.5, v: 0 }],
  },
};

export const ICH_CLIPS: ClipDef[] = [idle, stand, pose, aha, chinStroke, nervous, shocked, hatTip, examine, beat, nod];
