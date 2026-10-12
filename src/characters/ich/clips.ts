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
  [0.46, { 'pelvis.y': -6, 'torso.r': -12, 'head.r': -9, 'upperarm.near.r': -110, 'forearm.near.r': -64, 'hand.near.r': 0, 'upperarm.far.r': 34, 'forearm.far.r': -112, 'coat.front.r': -18, 'coat.back.r': 20, 'foot.near.x': 34, 'foot.far.x': -18, 'hat.r': -8 }, 'backOut'],
  [0.7, { 'pelvis.y': 2, 'torso.r': -10, 'head.r': -7, 'coat.front.r': -6, 'coat.back.r': 8, 'hat.r': 2 }, 'sineInOut'],
  [1.6, { 'pelvis.y': 0, 'torso.r': -11, 'head.r': -8, 'upperarm.near.r': -108, 'forearm.near.r': -66, 'hand.near.r': 2, 'upperarm.far.r': 34, 'forearm.far.r': -112, 'coat.front.r': -4, 'coat.back.r': 5, 'foot.near.x': 34, 'foot.far.x': -18, 'hat.r': 0 }],
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

/** Examining something at eye level or above: up on his toes, the lens held high, plate tilted up. */
const examineUp: ClipDef = blocked('examineUp', 1.4, [
  [0, { 'pelvis.y': 0, 'torso.r': -3, 'head.r': 0, 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'upperarm.far.r': 0, 'forearm.far.r': -6, 'foot.near.r': 0, 'foot.far.r': 0 }, 'sineInOut'],
  [0.45, { 'pelvis.y': -10, 'torso.r': -6, 'head.r': -16, 'upperarm.near.r': -122, 'forearm.near.r': -14, 'hand.near.r': -48, 'upperarm.far.r': 6, 'forearm.far.r': -14, 'foot.near.r': 12, 'foot.far.r': 12 }, 'sineInOut'],
  [0.95, { 'pelvis.y': -12, 'torso.r': -8, 'head.r': -19, 'upperarm.near.r': -126, 'hand.near.r': -44 }, 'sineInOut'],
  [1.4, { 'pelvis.y': -10, 'torso.r': -6, 'head.r': -16, 'upperarm.near.r': -122, 'forearm.near.r': -14, 'hand.near.r': -48, 'foot.near.r': 12, 'foot.far.r': 12 }],
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

/**
 * Coat caught in the lavatory door: a step forward, then the coat yanks him back — torso snaps
 * back, arms windmill, the hat jumps — a tug, he comes free and stumbles forward.
 */
const yanked: ClipDef = blocked('yanked', 2.3, [
  [0, { 'root.x': 0, 'torso.r': -3, 'head.r': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -8, 'forearm.far.r': -6, 'coat.back.r': 0, 'hat.y': 0, 'hat.r': 0, 'pelvis.y': 0, 'foot.near.x': 0, 'foot.far.x': 0 }, 'expoOut'],
  [0.08, { 'root.x': -26, 'torso.r': -26, 'head.r': -18, 'upperarm.near.r': -120, 'upperarm.far.r': 110, 'forearm.near.r': -40, 'forearm.far.r': 40, 'coat.back.r': -38, 'hat.y': -46, 'hat.r': -25, 'pelvis.y': -10, 'foot.near.x': 24, 'foot.far.x': 10 }, 'sineInOut'],
  [0.32, { 'root.x': -34, 'upperarm.near.r': -60, 'upperarm.far.r': 160, 'forearm.near.r': -90, 'forearm.far.r': 30, 'hat.y': -64, 'hat.r': -45 }, 'sineInOut'],
  [0.56, { 'upperarm.near.r': -150, 'upperarm.far.r': 70, 'forearm.near.r': -20, 'forearm.far.r': 90, 'hat.y': 0, 'hat.r': 8 }, 'bounceOut'],
  [0.9, { 'torso.r': -18, 'upperarm.near.r': -40, 'upperarm.far.r': 30, 'forearm.near.r': -70, 'forearm.far.r': -50, 'hat.r': 0 }, 'quadIn'],
  // the tug: leans forward, pulls
  [1.25, { 'root.x': -20, 'torso.r': 22, 'head.r': 10, 'pelvis.y': 18, 'upperarm.near.r': -20, 'upperarm.far.r': 10, 'coat.back.r': -30, 'foot.near.x': 40, 'foot.far.x': -10 }, 'expoOut'],
  [1.4, { 'root.x': 34, 'torso.r': 30, 'head.r': 14, 'pelvis.y': 12, 'coat.back.r': 20, 'upperarm.near.r': -70, 'upperarm.far.r': 60 }, 'sineInOut'],
  [1.75, { 'root.x': 40, 'torso.r': 6, 'head.r': 0, 'pelvis.y': 0, 'coat.back.r': -6, 'upperarm.near.r': -10, 'upperarm.far.r': 10, 'forearm.near.r': -10, 'forearm.far.r': -6, 'foot.near.x': 0, 'foot.far.x': 0 }, 'sineInOut'],
  [2.3, { 'root.x': 40, 'torso.r': -3, 'coat.back.r': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -8, 'forearm.far.r': -6 }],
], {
  attach: { 'hand.near': [{ t: 0.05, v: 'hand.near#open' }, { t: 1.7, v: 'hand.near' }], 'hand.far': [{ t: 0.05, v: 'hand.far#open' }, { t: 1.7, v: 'hand.far' }] },
  events: [{ t: 0.08, name: 'sfx', data: 'whoosh' }, { t: 1.38, name: 'sfx', data: 'swish' }],
  tracks: { '@flicker': [{ t: 0, v: 0.9 }, { t: 1.0, v: 0.3 }, { t: 1.8, v: 0 }] },
});

/** Straightens the hat with both hands, chin (plate) up. Dignity restored. */
const hatAdjust: ClipDef = blocked('hatAdjust', 1.3, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'hat.r': 0, 'head.r': 0, 'torso.r': -3 }, 'sineInOut'],
  [0.35, { 'upperarm.near.r': -168, 'forearm.near.r': -12, 'hand.near.r': -10, 'hat.r': -10, 'head.r': -4 }, 'sineInOut'],
  [0.6, { 'hat.r': 6, 'hand.near.r': 6 }, 'sineInOut'],
  [0.8, { 'hat.r': 0, 'hand.near.r': 0, 'head.r': -8, 'torso.r': -7 }, 'sineInOut'],
  [1.3, { 'upperarm.near.r': -27, 'forearm.near.r': 146, 'hand.near.r': -20, 'head.r': -3, 'torso.r': -5 }],
], { z: { 'hand.near': [{ t: 0, v: 36 }], 'forearm.near': [{ t: 0, v: 35.5 }] }, attach: { 'hand.near': [{ t: 1.0, v: 'hand.near#fist' }] } });

/** „ICH.": both index fingers point at his own plate. */
const pointSelf: ClipDef = blocked('pointSelf', 1.4, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'upperarm.far.r': 0, 'forearm.far.r': -6, 'torso.r': -3, 'head.r': 0 }, 'backIn'],
  [0.22, { 'upperarm.near.r': -112, 'forearm.near.r': -108, 'hand.near.r': -40, 'upperarm.far.r': -104, 'forearm.far.r': -112, 'hand.far.r': -36, 'torso.r': -8, 'head.r': -6 }, 'backOut'],
  [1.4, { 'upperarm.near.r': -110, 'forearm.near.r': -110, 'hand.near.r': -38, 'upperarm.far.r': -102, 'forearm.far.r': -114, 'hand.far.r': -34, 'torso.r': -7, 'head.r': -5 }],
], { attach: { 'hand.near': [{ t: 0.1, v: 'hand.near#point' }], 'hand.far': [{ t: 0.1, v: 'hand.far#point' }] }, z: { 'hand.near': [{ t: 0, v: 36 }], 'forearm.near': [{ t: 0, v: 35.5 }] } });

/* ------------------------------------------------------------------ seated (15C), FK legs */
const SIT: Record<string, number> = {
  '@ik': 0, 'pelvis.x': -10, 'pelvis.y': 106, 'torso.r': -2, 'thigh.near.r': -86, 'shin.near.r': 85, 'foot.near.r': 1, 'thigh.far.r': -84, 'shin.far.r': 83, 'foot.far.r': 1,
  'upperarm.near.r': -24, 'forearm.near.r': -56, 'hand.near.r': -10, 'upperarm.far.r': -20, 'forearm.far.r': -58, 'coat.front.r': -50, 'coat.back.r': 30,
};
const sitDown: ClipDef = blocked('sitDown', 1.1, [
  [0, { '@ik': 0, 'pelvis.x': 0, 'pelvis.y': 0, 'torso.r': -3, 'thigh.near.r': 0, 'shin.near.r': 0, 'thigh.far.r': 0, 'shin.far.r': 0, 'coat.front.r': 0, 'coat.back.r': 0, 'upperarm.near.r': 0, 'forearm.near.r': -8 }, 'sineInOut'],
  [0.45, { 'pelvis.y': 60, 'torso.r': 20, 'thigh.near.r': -40, 'shin.near.r': 50, 'thigh.far.r': -38, 'shin.far.r': 48, 'coat.front.r': -20 }, 'quadIn'],
  [0.8, { ...SIT, 'torso.r': 4 }, 'backOut'],
  [1.1, SIT],
]);
const sit: ClipDef = {
  name: 'sit', duration: 3, loop: true,
  tracks: { ...Object.fromEntries(Object.entries(SIT).map(([k, v]) => [k, [{ t: 0, v }]])), 'torso.sy': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 1.5, v: 1.01, e: 'sineInOut' }] },
};
/** „Ein Detektiv schläft nie." — and then he does: hat slides over a corner of the plate. */
const doze: ClipDef = blocked('doze', 3.2, [
  [0, { ...SIT, 'hat.y': 0, 'hat.x': 0, 'hat.r': 0, 'head.r': 0 }, 'sineInOut'],
  [0.6, { 'upperarm.near.r': -168, 'forearm.near.r': -14, 'hand.near.r': -12 }, 'sineInOut'],
  [1.1, { 'hat.y': 30, 'hat.x': -18, 'hat.r': 16, 'hand.near.r': 4 }, 'sineInOut'],
  [1.7, { 'upperarm.near.r': -24, 'forearm.near.r': -56, 'hand.near.r': -10, 'head.r': 6 }, 'sineInOut'],
  [2.6, { 'head.r': 14, 'torso.r': 4 }, 'sineInOut'],
  [3.2, { ...SIT, 'hat.y': 30, 'hat.x': -18, 'hat.r': 16, 'head.r': 14, 'torso.r': 4 }],
], {
  z: { 'hand.near': [{ t: 0, v: 36 }], 'forearm.near': [{ t: 0, v: 35.5 }] },
  tracks: { '@letters': [{ t: 0, v: 1 }, { t: 2.0, v: 1 }, { t: 3.2, v: 0.25 }] },
});
const dozing: ClipDef = {
  name: 'dozing', duration: 3.6, loop: true,
  tracks: {
    ...Object.fromEntries(Object.entries({ ...SIT, 'hat.y': 30, 'hat.x': -18, 'hat.r': 16, 'torso.r': 4 }).map(([k, v]) => [k, [{ t: 0, v }]])),
    'head.r': [{ t: 0, v: 13, e: 'sineInOut' }, { t: 1.8, v: 16, e: 'sineInOut' }],
    '@letters': [{ t: 0, v: 0.2, e: 'sineInOut' }, { t: 1.8, v: 0.32, e: 'sineInOut' }],
  },
};

/* ------------------------------------------------------------------ slapstick */
const STANDING: Record<string, number> = {
  'root.x': 0, 'root.y': 0, 'root.r': 0, 'pelvis.y': 0, 'torso.r': -3, 'neck.r': 0, 'head.r': 0,
  'thigh.near.r': 0, 'shin.near.r': 0, 'foot.near.r': 0, 'thigh.far.r': 0, 'shin.far.r': 0, 'foot.far.r': 0,
  'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'upperarm.far.r': 0, 'forearm.far.r': -6, 'hand.far.r': 0,
  'coat.front.r': 0, 'coat.back.r': 0,
};

/**
 * The trip over R-3MI's legs. Foot catches → three hops while windmilling (the hat leaves) →
 * a long dive → KLONK, the plate hits the floor → he lies there → the plate tilts up to face
 * the audience → he gets up with dignity. The whole rig rotates around the feet (root.r),
 * like a falling plank. Ends `TRIP_ADVANCE` units further along.
 */
export const TRIP_ADVANCE = 300;
const trip: ClipDef = blocked('trip', 5.6, [
  [0, { ...STANDING, '@ik': 0, 'torso.r': 8, 'thigh.near.r': 28, 'shin.near.r': 30, 'thigh.far.r': -26, 'shin.far.r': 14, 'upperarm.near.r': -50, 'upperarm.far.r': -30 }, 'expoOut'],
  [0.15, { 'root.r': 18, 'root.x': 20, 'torso.r': 20, 'head.r': 8, 'upperarm.near.r': -150, 'upperarm.far.r': -96, 'forearm.near.r': -20, 'forearm.far.r': -30, 'coat.back.r': -20 }, 'sineInOut'],
  [0.33, { 'root.r': 12, 'root.y': -36, 'root.x': 60, 'upperarm.near.r': 40, 'upperarm.far.r': -170, 'thigh.near.r': 50, 'shin.near.r': 80, 'thigh.far.r': -10, 'shin.far.r': 10, 'coat.front.r': 18 }, 'quadIn'],
  [0.48, { 'root.y': 0, 'root.x': 90, 'root.r': 10, 'thigh.far.r': 0, 'shin.far.r': 0 }, 'quadOut'],
  [0.63, { 'root.y': -42, 'root.x': 140, 'root.r': 16, 'upperarm.near.r': -170, 'upperarm.far.r': 40, 'thigh.near.r': 40, 'shin.near.r': 90, 'head.r': -8 }, 'quadIn'],
  [0.78, { 'root.y': 0, 'root.x': 175, 'root.r': 18 }, 'quadOut'],
  [0.93, { 'root.y': -50, 'root.x': 220, 'root.r': 26, 'upperarm.near.r': -130, 'upperarm.far.r': -120, 'forearm.near.r': -10, 'forearm.far.r': -10, 'head.r': 6 }, 'quadIn'],
  [1.15, { 'root.y': -24, 'root.x': 250, 'root.r': 64, 'thigh.near.r': 24, 'shin.near.r': 30, 'thigh.far.r': 16, 'shin.far.r': 24, 'upperarm.near.r': -172, 'upperarm.far.r': -168, 'coat.front.r': -10, 'coat.back.r': 30 }, 'quadIn'],
  [1.33, { 'root.y': 0, 'root.x': 270, 'root.r': 90, 'upperarm.near.r': -110, 'upperarm.far.r': -120, 'head.r': 0, 'thigh.near.r': 6, 'shin.near.r': 10, 'thigh.far.r': 4, 'shin.far.r': 8 }, 'expoOut'],
  [1.5, { 'root.r': 86, 'root.y': -10, 'coat.back.r': 16 }, 'quadIn'],
  [1.66, { 'root.r': 90, 'root.y': 0, 'coat.back.r': 8 }, 'sineInOut'],
  // he lies there
  [2.6, { 'root.r': 90, 'shin.near.r': 10 }, 'sineInOut'],
  [2.75, { 'shin.near.r': 40 }, 'sineInOut'],
  [2.9, { 'shin.near.r': 10, 'head.r': 0, 'neck.r': 0 }, 'backOut'],
  // the plate tilts up to the audience
  [3.3, { 'head.r': -78, 'neck.r': -12 }, 'sineInOut'],
  [3.9, { 'head.r': -80, 'neck.r': -12, 'upperarm.near.r': -40, 'upperarm.far.r': -30 }, 'sineInOut'],
  // gets up
  [4.3, { 'root.r': 50, 'root.y': -6, 'head.r': -46, 'upperarm.near.r': 10, 'upperarm.far.r': 0, 'forearm.near.r': -60, 'pelvis.y': 0 }, 'sineInOut'],
  [4.75, { 'root.r': 12, 'root.x': 290, 'pelvis.y': 70, 'head.r': -8, 'neck.r': 0, 'torso.r': 18, 'thigh.near.r': -70, 'shin.near.r': 110, 'thigh.far.r': -20, 'shin.far.r': 40 }, 'sineInOut'],
  [5.25, { ...STANDING, 'root.x': TRIP_ADVANCE, 'torso.r': -6, 'head.r': -6 }, 'backOut'],
  [5.6, { ...STANDING, 'root.x': TRIP_ADVANCE, '@ik': 1 }],
], {
  attach: { hat: [{ t: 0.6, v: null }], 'hand.near': [{ t: 0.1, v: 'hand.near#open' }, { t: 4.4, v: 'hand.near' }], 'hand.far': [{ t: 0.1, v: 'hand.far#open' }, { t: 4.4, v: 'hand.far' }] },
  tracks: {
    '@flicker': [{ t: 0, v: 0.6 }, { t: 1.3, v: 0.2 }, { t: 1.36, v: 1 }, { t: 2.4, v: 0.6 }, { t: 3.2, v: 0 }],
    '@letters': [{ t: 0, v: 1 }, { t: 1.33, v: 1.7, e: 'expoOut' }, { t: 1.7, v: 0.5 }, { t: 3.2, v: 1.1 }, { t: 4.0, v: 1 }],
  },
  events: [
    { t: 0.02, name: 'sfx', data: 'stab' }, { t: 0.15, name: 'sfx', data: 'whoosh' },
    { t: 0.48, name: 'sfx', data: 'step.ich' }, { t: 0.78, name: 'sfx', data: 'step.ich' },
    { t: 1.33, name: 'sfx', data: 'klonk' }, { t: 1.35, name: 'sfx', data: 'thud' }, { t: 1.36, name: 'impact' },
  ],
});

/** Dusts off the coat, both gloves patting. */
const brushOff: ClipDef = blocked('brushOff', 1.4, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -8, 'upperarm.far.r': 0, 'forearm.far.r': -6, 'torso.r': -3, 'head.r': 0 }, 'sineInOut'],
  [0.25, { 'upperarm.near.r': -36, 'forearm.near.r': -70, 'upperarm.far.r': -30, 'forearm.far.r': -76, 'head.r': 10, 'torso.r': 6 }, 'sineInOut'],
  [0.4, { 'forearm.near.r': -50, 'forearm.far.r': -90 }, 'sineInOut'],
  [0.55, { 'forearm.near.r': -76, 'forearm.far.r': -64 }, 'sineInOut'],
  [0.7, { 'forearm.near.r': -50, 'forearm.far.r': -90 }, 'sineInOut'],
  [0.85, { 'forearm.near.r': -76, 'forearm.far.r': -64 }, 'sineInOut'],
  [1.4, { 'upperarm.near.r': 0, 'forearm.near.r': -8, 'upperarm.far.r': 0, 'forearm.far.r': -6, 'torso.r': -5, 'head.r': -6 }],
], { events: [{ t: 0.4, name: 'sfx', data: 'swish' }, { t: 0.7, name: 'sfx', data: 'swish' }] });

/** Reaches up to open the overhead bin, on his toes. */
const reachUp: ClipDef = blocked('reachUp', 1.0, [
  [0, { 'pelvis.y': 0, 'upperarm.near.r': 0, 'forearm.near.r': -8, 'hand.near.r': 0, 'head.r': 0, 'torso.r': -3, 'foot.near.r': 0, 'foot.far.r': 0 }, 'sineInOut'],
  [0.45, { 'pelvis.y': -16, 'upperarm.near.r': -176, 'forearm.near.r': -14, 'hand.near.r': -10, 'head.r': -14, 'torso.r': -10, 'foot.near.r': 18, 'foot.far.r': 18 }, 'sineInOut'],
  [1.0, { 'pelvis.y': -18, 'upperarm.near.r': -178, 'forearm.near.r': -12, 'hand.near.r': -6, 'head.r': -16, 'torso.r': -11, 'foot.near.r': 20, 'foot.far.r': 20 }],
], { attach: { 'hand.near': [{ t: 0.2, v: 'hand.near#open' }] }, z: { 'hand.near': [{ t: 0, v: 36 }], 'forearm.near': [{ t: 0, v: 35.5 }] } });

/** Under the luggage: squatting, arms over his head, letters flickering. Holds. */
const buried: ClipDef = blocked('buried', 0.5, [
  [0, { 'pelvis.y': -16, 'upperarm.near.r': -176, 'forearm.near.r': -12, 'torso.r': -10, 'head.r': -14, 'upperarm.far.r': 0, 'forearm.far.r': -6, 'foot.near.r': 0, 'foot.far.r': 0 }, 'expoOut'],
  [0.2, { 'pelvis.y': 150, 'torso.r': 34, 'head.r': 24, 'neck.r': 8, 'upperarm.near.r': -150, 'forearm.near.r': -70, 'upperarm.far.r': -140, 'forearm.far.r': -76, 'coat.front.r': -20, 'coat.back.r': 20 }, 'sineInOut'],
  [0.5, { 'pelvis.y': 156, 'torso.r': 36, 'head.r': 26 }],
], { tracks: { '@flicker': [{ t: 0, v: 0.9 }] } });

/** Pops out of the pile, arms flung out, then holds a find up high. */
const popOut: ClipDef = blocked('popOut', 1.5, [
  [0, { 'pelvis.y': 156, 'torso.r': 36, 'head.r': 26, 'neck.r': 8, 'upperarm.near.r': -150, 'forearm.near.r': -70, 'upperarm.far.r': -140, 'forearm.far.r': -76, 'coat.front.r': -20, 'coat.back.r': 20 }, 'backIn'],
  [0.25, { 'pelvis.y': -30, 'torso.r': -14, 'head.r': -12, 'neck.r': 0, 'upperarm.near.r': -150, 'forearm.near.r': -20, 'upperarm.far.r': 130, 'forearm.far.r': 20, 'coat.front.r': 24, 'coat.back.r': -24 }, 'backOut'],
  [0.6, { 'pelvis.y': 0, 'torso.r': -6, 'head.r': -8, 'upperarm.near.r': -100, 'forearm.near.r': -42, 'upperarm.far.r': 20, 'forearm.far.r': -10, 'coat.front.r': 0, 'coat.back.r': 0 }, 'sineInOut'],
  [1.5, { 'pelvis.y': 0, 'torso.r': -7, 'head.r': -10, 'upperarm.near.r': -98, 'forearm.near.r': -44, 'upperarm.far.r': 10, 'forearm.far.r': -10 }],
], { attach: { 'hand.near': [{ t: 0.3, v: 'hand.near#fist' }] }, tracks: { '@letters': [{ t: 0.2, v: 1.5 }, { t: 0.8, v: 1.1 }] }, events: [{ t: 0.2, name: 'sfx', data: 'pop' }] });

/** Balancing on tiptoes (play on the 'arms' layer while sneaking over R-3MI's legs). */
const balance: ClipDef = {
  name: 'balance', duration: 1.6, loop: true,
  tracks: {
    'upperarm.near.r': [{ t: 0, v: -80, e: 'sineInOut' }, { t: 0.8, v: -96, e: 'sineInOut' }],
    'upperarm.far.r': [{ t: 0, v: 86, e: 'sineInOut' }, { t: 0.8, v: 70, e: 'sineInOut' }],
    'forearm.near.r': [{ t: 0, v: 10 }], 'forearm.far.r': [{ t: 0, v: -10 }],
    'head.r': [{ t: 0, v: 16 }], 'torso.r': [{ t: 0, v: 8 }],
  },
};

/** Bonked on the hat by something heavy (a falling title letter): accordion squash, spring back. */
const bonked: ClipDef = blocked('bonked', 1.1, [
  [0, { 'pelvis.y': 0, 'torso.sy': 1, 'torso.r': -3, 'head.r': 0, 'hat.y': 0, 'hat.r': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -8, 'forearm.far.r': -6, 'neck.sy': 1 }, 'expoOut'],
  [0.06, { 'pelvis.y': 70, 'torso.sy': 0.72, 'neck.sy': 0.4, 'head.r': 8, 'hat.y': 22, 'hat.r': 10, 'upperarm.near.r': -60, 'upperarm.far.r': 60, 'forearm.near.r': -40, 'forearm.far.r': 40 }, 'sineInOut'],
  [0.34, { 'pelvis.y': 60, 'torso.sy': 0.78 }, 'backOut'],
  [0.62, { 'pelvis.y': -18, 'torso.sy': 1.12, 'neck.sy': 1.3, 'head.r': -6, 'hat.y': -10, 'hat.r': -8 }, 'sineInOut'],
  [1.1, { 'pelvis.y': 0, 'torso.sy': 1, 'neck.sy': 1, 'torso.r': -3, 'head.r': 0, 'hat.y': 0, 'hat.r': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': -8, 'forearm.far.r': -6 }],
], { attach: { 'hand.near': [{ t: 0.05, v: 'hand.near#open' }, { t: 0.9, v: 'hand.near' }], 'hand.far': [{ t: 0.05, v: 'hand.far#open' }, { t: 0.9, v: 'hand.far' }] }, tracks: { '@flicker': [{ t: 0, v: 1 }, { t: 0.7, v: 0 }] } });

/** Throws something straight up (the letter, back where it belongs). */
const tossUp: ClipDef = blocked('tossUp', 0.7, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': -8, 'pelvis.y': 0, 'torso.r': -3 }, 'backIn'],
  [0.12, { 'upperarm.near.r': 10, 'forearm.near.r': -60, 'pelvis.y': 16, 'torso.r': 4 }, 'expoOut'],
  [0.3, { 'upperarm.near.r': -178, 'forearm.near.r': -4, 'pelvis.y': -14, 'torso.r': -12 }, 'sineInOut'],
  [0.7, { 'upperarm.near.r': -160, 'forearm.near.r': -10, 'pelvis.y': 0, 'torso.r': -6 }],
], { attach: { 'hand.near': [{ t: 0.25, v: 'hand.near#open' }] } });

export const ICH_CLIPS: ClipDef[] = [bonked, tossUp, idle, stand, pose, aha, chinStroke, nervous, shocked, hatTip, examine, examineUp, beat, nod, yanked, hatAdjust, pointSelf, sitDown, sit, doze, dozing, trip, brushOff, reachUp, buried, popOut, balance];
