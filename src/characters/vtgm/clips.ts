import { blocked, type ClipDef } from '../../anim/clip';

/**
 * V-TGM clips. Her acting is economical: long stillness, then one precise move.
 * The eye-roll, facepalm and sigh are her signatures (see the character bible).
 */

/** Very still: a slow breath, the arms hang, the eye drifts (saccades handle the rest). */
const idle: ClipDef = {
  name: 'idle', duration: 5, loop: true,
  tracks: {
    'body.sy': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 2.5, v: 1.01, e: 'sineInOut' }],
    'body.sx': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 2.5, v: 0.996, e: 'sineInOut' }],
    'body.r': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 2.5, v: 0.8, e: 'sineInOut' }],
    'upperarm.near.r': [{ t: 0.4, v: 1, e: 'sineInOut' }, { t: 2.9, v: -1, e: 'sineInOut' }],
    'upperarm.far.r': [{ t: 0.9, v: -1, e: 'sineInOut' }, { t: 3.4, v: 1, e: 'sineInOut' }],
    'hand.near.r': [{ t: 0.6, v: 3, e: 'sineInOut' }, { t: 3.1, v: -2, e: 'sineInOut' }],
  },
};

/** Arms folded behind the sphere: she cannot fold them in front, there is no front. */
const armsBehind: ClipDef = blocked('armsBehind', 0.8, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': 0, 'upperarm.far.r': 0, 'forearm.far.r': 0, 'body.r': 0 }, 'backOut'],
  [0.45, { 'upperarm.near.r': 52, 'forearm.near.r': 88, 'hand.near.r': 30, 'upperarm.far.r': -40, 'forearm.far.r': -70, 'body.r': -3 }, 'sineInOut'],
  [0.8, { 'upperarm.near.r': 50, 'forearm.near.r': 86, 'hand.near.r': 28, 'upperarm.far.r': -38, 'forearm.far.r': -68, 'body.r': -2.5 }],
], { z: { 'forearm.near': [{ t: 0.2, v: 4 }], 'hand.near': [{ t: 0.2, v: 4 }], 'upperarm.near': [{ t: 0.2, v: 4 }] } });

/** The eye-roll: up, across the top, down. The body tips back with it. */
const eyeRoll: ClipDef = {
  name: 'eyeRoll', duration: 1.5,
  tracks: {
    '@eye.lookX': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.25, v: -0.8, e: 'sineInOut' }, { t: 0.55, v: -0.2, e: 'sineInOut' }, { t: 0.85, v: 0.8, e: 'sineInOut' }, { t: 1.2, v: 0.3, e: 'sineInOut' }, { t: 1.5, v: 0 }],
    '@eye.lookY': [{ t: 0, v: 0, e: 'sineOut' }, { t: 0.25, v: -0.5, e: 'sineInOut' }, { t: 0.55, v: -0.95, e: 'sineInOut' }, { t: 0.85, v: -0.5, e: 'sineInOut' }, { t: 1.2, v: 0.15, e: 'sineInOut' }, { t: 1.5, v: 0 }],
    '@eye.pitch': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.55, v: 0.32, e: 'sineInOut' }, { t: 1.2, v: 0, e: 'sineInOut' }],
    '@eye.yaw': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.25, v: -0.12, e: 'sineInOut' }, { t: 0.85, v: 0.12, e: 'sineInOut' }, { t: 1.3, v: 0 }],
    '@eye.open': [{ t: 0, v: 0.85 }, { t: 1.1, v: 0.85, e: 'sineInOut' }, { t: 1.5, v: 0.7 }],
    'body.r': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.55, v: -7, e: 'sineInOut' }, { t: 1.3, v: 0 }],
    'body.sy': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 0.55, v: 1.03, e: 'sineInOut' }, { t: 1.3, v: 0.98, e: 'sineInOut' }, { t: 1.5, v: 1 }],
  },
};

/** Sigh: inhale (stretch), long exhale (squash, arms droop, lid drops), re-inflate. */
const sigh: ClipDef = blocked('sigh', 2.0, [
  [0, { 'body.sy': 1, 'body.sx': 1, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'pelvis.y': 0, '@eye.open': 0.85 }, 'sineInOut'],
  [0.5, { 'body.sy': 1.05, 'body.sx': 0.98, 'pelvis.y': -4, 'upperarm.near.r': -8, 'upperarm.far.r': 8, '@eye.open': 0.9 }, 'quadOut'],
  [1.2, { 'body.sy': 0.92, 'body.sx': 1.05, 'pelvis.y': 6, 'upperarm.near.r': 6, 'upperarm.far.r': -6, 'hand.near.r': 10, '@eye.open': 0.35 }, 'sineInOut'],
  [2.0, { 'body.sy': 1, 'body.sx': 1, 'pelvis.y': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'hand.near.r': 0, '@eye.open': 0.8 }],
]);

/** Facepalm: the big hand covers the eye, holds, slides down a little. */
const facepalm: ClipDef = blocked('facepalm', 2.2, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': 0, 'hand.near.r': 0, 'body.r': 0, 'body.sy': 1 }, 'backIn'],
  [0.3, { 'upperarm.near.r': -118, 'forearm.near.r': -132, 'hand.near.r': -20, 'body.r': 6, 'body.sy': 0.97 }, 'expoOut'],
  [0.42, { 'upperarm.near.r': -116, 'forearm.near.r': -137, 'hand.near.r': -26, 'body.r': 9, 'body.sy': 0.95 }, 'sineInOut'],
  [1.6, { 'upperarm.near.r': -112, 'forearm.near.r': -128, 'hand.near.r': -18, 'body.r': 7, 'body.sy': 0.96 }, 'sineInOut'],
  [2.2, { 'upperarm.near.r': 0, 'forearm.near.r': 0, 'hand.near.r': 0, 'body.r': 0, 'body.sy': 1 }],
], {
  attach: { 'hand.near': [{ t: 0.15, v: 'hand.near#open' }, { t: 1.9, v: 'hand.near' }] },
  z: { 'hand.near': [{ t: 0.12, v: 40 }, { t: 2.0, v: 31 }], 'forearm.near': [{ t: 0.12, v: 39 }, { t: 2.0, v: 30 }] },
  tracks: { '@eye.open': [{ t: 0, v: 0.8 }, { t: 0.35, v: 0.3 }, { t: 1.9, v: 0.3 }, { t: 2.2, v: 0.7 }] },
});

/** Points with the near hand (deadpan: the body does not move at all). */
const point: ClipDef = blocked('point', 0.8, [
  [0, { 'upperarm.near.r': 0, 'forearm.near.r': 0, 'hand.near.r': 0 }, 'quadOut'],
  [0.22, { 'upperarm.near.r': -78, 'forearm.near.r': -10, 'hand.near.r': -6 }, 'sineInOut'],
  [0.8, { 'upperarm.near.r': -76, 'forearm.near.r': -10, 'hand.near.r': -4 }],
], { attach: { 'hand.near': [{ t: 0.08, v: 'hand.near#point' }] } });

/** A small hop (onto a seat or an armrest): crouch, launch, tuck, land with a squash. */
const hop: ClipDef = blocked('hop', 0.9, [
  [0, { 'root.y': 0, 'pelvis.y': 0, 'body.sy': 1, 'body.sx': 1, 'thigh.near.r': 0, 'shin.near.r': 0, 'thigh.far.r': 0, 'shin.far.r': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, '@ik': 1 }, 'quadOut'],
  [0.18, { 'pelvis.y': 18, 'body.sy': 0.9, 'body.sx': 1.08, 'upperarm.near.r': 24, 'upperarm.far.r': -24 }, 'expoOut'],
  [0.2, { '@ik': 0 }, 'step'],
  [0.42, { 'root.y': -70, 'pelvis.y': -6, 'body.sy': 1.1, 'body.sx': 0.94, 'thigh.near.r': -30, 'shin.near.r': 50, 'thigh.far.r': -26, 'shin.far.r': 46, 'upperarm.near.r': -40, 'upperarm.far.r': 40 }, 'quadIn'],
  [0.64, { 'root.y': 0, 'pelvis.y': 0, 'body.sy': 1.02, 'body.sx': 0.99, 'thigh.near.r': 0, 'shin.near.r': 0, 'thigh.far.r': 0, 'shin.far.r': 0, '@ik': 0 }, 'step'],
  [0.66, { '@ik': 1, 'pelvis.y': 14, 'body.sy': 0.88, 'body.sx': 1.1, 'upperarm.near.r': 16, 'upperarm.far.r': -16 }, 'backOut'],
  [0.9, { 'pelvis.y': 0, 'body.sy': 1, 'body.sx': 1, 'upperarm.near.r': 0, 'upperarm.far.r': 0 }],
]);

/** Speaking accent (additive): a small, exact tilt. */
const nod: ClipDef = {
  name: 'nod', duration: 0.5,
  tracks: {
    'body.r': [{ t: 0, v: 0, e: 'quadOut' }, { t: 0.14, v: 3.5, e: 'sineInOut' }, { t: 0.32, v: -1, e: 'sineInOut' }, { t: 0.5, v: 0 }],
  },
};

/** Startle: stretches up tall, arms out. */
const startle: ClipDef = blocked('startle', 1.0, [
  [0, { 'body.sy': 1, 'body.sx': 1, 'pelvis.y': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0 }, 'expoOut'],
  [0.1, { 'body.sy': 1.12, 'body.sx': 0.92, 'pelvis.y': -14, 'upperarm.near.r': -50, 'upperarm.far.r': 50, 'forearm.near.r': -30, 'forearm.far.r': 30 }, 'sineInOut'],
  [0.45, { 'body.sy': 1.04, 'body.sx': 0.98, 'pelvis.y': -4 }, 'sineInOut'],
  [1.0, { 'body.sy': 1, 'body.sx': 1, 'pelvis.y': 0, 'upperarm.near.r': 0, 'upperarm.far.r': 0, 'forearm.near.r': 0, 'forearm.far.r': 0 }],
], { attach: { 'hand.near': [{ t: 0.05, v: 'hand.near#open' }, { t: 0.8, v: 'hand.near' }], 'hand.far': [{ t: 0.05, v: 'hand.far#open' }, { t: 0.8, v: 'hand.far' }] } });

/* ------------------------------------------------------------------ seated in 13C
 * Root stands on the cushion. She sits with her legs sticking straight out and swinging:
 * her feet do not reach the floor, which is the whole point.
 */
const SEATED: Record<string, number> = {
  '@ik': 0, 'pelvis.y': 134, 'thigh.near.r': -84, 'shin.near.r': 76, 'foot.near.r': 8, 'thigh.far.r': -82, 'shin.far.r': 74, 'foot.far.r': 8,
  'upperarm.near.r': -36, 'forearm.near.r': -48, 'hand.near.r': -10, 'upperarm.far.r': -20, 'forearm.far.r': -30,
};
const sitDangle: ClipDef = {
  name: 'sitDangle', duration: 2.4, loop: true,
  tracks: {
    ...Object.fromEntries(Object.entries(SEATED).map(([k, v]) => [k, [{ t: 0, v }]])),
    'shin.near.r': [{ t: 0, v: 64, e: 'sineInOut' }, { t: 1.2, v: 88, e: 'sineInOut' }],
    'shin.far.r': [{ t: 0, v: 86, e: 'sineInOut' }, { t: 1.2, v: 62, e: 'sineInOut' }],
    'body.sy': [{ t: 0, v: 1, e: 'sineInOut' }, { t: 1.2, v: 1.008, e: 'sineInOut' }],
  },
};
/** Sits down onto the cushion (from standing on it). */
const sitDown: ClipDef = blocked('sitDown', 0.6, [
  [0, { '@ik': 0, 'pelvis.y': 0, 'thigh.near.r': 0, 'shin.near.r': 0, 'thigh.far.r': 0, 'shin.far.r': 0, 'body.sy': 1, 'body.sx': 1 }, 'quadIn'],
  [0.3, { ...SEATED, 'body.sy': 0.9, 'body.sx': 1.06 }, 'backOut'],
  [0.6, { ...SEATED, 'body.sy': 1, 'body.sx': 1 }],
]);
/** Standing on her seat facing backwards, peeking over the headrest (hand on top of it). */
const peek: ClipDef = blocked('peek', 0.7, [
  [0, { '@ik': 1, 'pelvis.y': 10, 'body.sy': 0.94, 'upperarm.near.r': 0, 'forearm.near.r': 0 }, 'backOut'],
  [0.35, { 'pelvis.y': -16, 'body.sy': 1.04, 'upperarm.near.r': -128, 'forearm.near.r': -36, 'hand.near.r': -30 }, 'sineInOut'],
  [0.7, { 'pelvis.y': -14, 'body.sy': 1.02, 'upperarm.near.r': -126, 'forearm.near.r': -38, 'hand.near.r': -28 }],
], { tracks: { '@eye.pitch': [{ t: 0, v: 0 }, { t: 0.35, v: -0.12 }] } });
/** Reaches back for the recline button on the armrest, presses it. */
const reclineReach: ClipDef = blocked('reclineReach', 1.3, [
  [0, SEATED, 'sineInOut'],
  [0.45, { ...SEATED, 'upperarm.near.r': 84, 'forearm.near.r': -6, 'hand.near.r': 6, 'body.r': -6 }, 'quadIn'],
  [0.55, { 'upperarm.near.r': 92, 'hand.near.r': 18 }, 'quadOut'],
  [0.75, { 'upperarm.near.r': 84, 'hand.near.r': 6 }, 'sineInOut'],
  [1.3, { ...SEATED }],
], { events: [{ t: 0.55, name: 'sfx', data: 'click' }], z: { 'forearm.near': [{ t: 0, v: 30 }], 'hand.near': [{ t: 0, v: 31 }] } });
/** Deadpan to the audience: the eye turns to the camera and holds. */
const toCamera: ClipDef = {
  name: 'toCamera', duration: 3.4,
  tracks: { '@eye.yaw': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.35, v: -0.3 }], '@eye.lookX': [{ t: 0, v: 0 }], '@eye.open': [{ t: 0, v: 0.8 }] },
};
/** Looks back over her "shoulder": the whole sphere rolls, the eye slides round to the back. */
const lookBack: ClipDef = {
  name: 'lookBack', duration: 3.6,
  tracks: {
    '@eye.yaw': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.5, v: -1.05, e: 'sineInOut' }, { t: 3.0, v: -1.0, e: 'sineInOut' }, { t: 3.6, v: 0 }],
    '@eye.lookX': [{ t: 0, v: 0 }],
    'body.r': [{ t: 0, v: 0, e: 'sineInOut' }, { t: 0.5, v: -5, e: 'sineInOut' }, { t: 3.0, v: -4, e: 'sineInOut' }, { t: 3.6, v: 0 }],
  },
};

export const VTGM_CLIPS: ClipDef[] = [idle, armsBehind, eyeRoll, sigh, facepalm, point, hop, nod, startle, sitDangle, sitDown, peek, reclineReach, toCamera, lookBack];
