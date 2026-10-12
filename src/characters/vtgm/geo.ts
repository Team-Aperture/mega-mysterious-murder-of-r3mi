/**
 * V-TGM joint layout in sheet space (facing right, three-quarter view, feet on y = 0).
 * Height ≈ 380 units ≈ 0.95 m.
 *
 * Measured on the canon portrait (anlage-ii vtgm_neutral.png, standing height ≈ 855 px,
 * scale 0.444 units/px): sphere ≈ 55 % of the height, eye bezel ≈ 0.56 of the sphere radius,
 * eye ≈ 0.29 rad right of centre, side hub on the back-left silhouette, hands at knee level,
 * big boots, tank larger than the sphere's radius.
 */
export const SPHERE = { x: 0, y: -270, r: 108 } as const;
export const EYE_YAW = 0.3;
export const EYE_PITCH = 0.0;

export const J = {
  pelvis: [0, -160],
  body: [0, -172],
  hipN: [26, -148], kneeN: [32, -88], ankleN: [24, -32],
  hipF: [-30, -150], kneeF: [-34, -90], ankleF: [-38, -34],
  shN: [94, -222], elN: [110, -156], wrN: [116, -96],
  shF: [-106, -246], elF: [-120, -180], wrF: [-126, -116],
  tank: [-96, -292],
} as const;

export const TANK = { x: -152, y: -352, w: 50, h: 116 } as const;

export const PAL = {
  shell: '#ded9d0',
  shade: '#b0aaa0',
  shade2: '#8f897f',
  limb: '#232028',
  limbHi: '#37333d',
  limbHi2: '#4d4855',
  accent: '#c0322c',
  accentHi: '#e0463c',
  glass: '#3a1a1c',
} as const;
