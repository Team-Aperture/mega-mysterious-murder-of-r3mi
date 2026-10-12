/**
 * ICH, design direction A „Das Namensschild" (see docs/ICH_DESIGN_DIRECTIONS.md).
 * Sheet space, facing right, three-quarter view, feet on y = 0. Height ≈ 690 units incl. hat (≈ 1.7 m).
 * Silhouette: a wide flat sign on top of a flared coat — a "T on an A".
 */
export const J = {
  pelvis: [0, -306],
  torso: [2, -336],
  neck: [6, -470],
  head: [8, -488],
  hat: [62, -628],
  hipN: [14, -292], kneeN: [24, -160], ankleN: [18, -32],
  hipF: [-16, -294], kneeF: [-10, -162], ankleF: [-16, -34],
  shN: [48, -452], elN: [58, -356], wrN: [62, -262],
  shF: [-40, -456], elF: [-48, -360], wrF: [-52, -266],
  coatF: [30, -332],
  coatB: [-28, -332],
} as const;

/** The faceplate: outer bezel rectangle and glass, in sheet space. */
export const PLATE = { cx: 10, cy: -558, w: 232, h: 140, glassW: 204, glassH: 112 } as const;

export const PAL = {
  coat: '#c7a062',
  coatShade: '#a07d45',
  coatDark: '#7a5c30',
  coatHi: '#e2c38a',
  brass: '#d1a44a',
  brassShade: '#a87e2e',
  brassHi: '#f3da92',
  glass: '#10131a',
  glassHi: '#2a3140',
  navy: '#26304a',
  navyHi: '#3c4a6b',
  navyDark: '#1a2134',
  glove: '#f4efe2',
  gloveShade: '#cfc7b4',
  shoe: '#5a3a22',
  shoeHi: '#83593a',
  spat: '#e9e2cf',
  spatShade: '#c4bca6',
  hat: '#8a5a2b',
  hatShade: '#6a4320',
  hatHi: '#b07a44',
  band: '#26304a',
  amber: '#ffb22e',
} as const;
