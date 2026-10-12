import { Defs, capsule, circle, ellipse, fillOnly, line, mix, part, path, rr, sheet, smooth, solid, EDGE } from '../../art/svg';
import { J, PAL, PLATE } from './geo';

/**
 * ICH rig sheet, direction A „Das Namensschild" (procedural placeholder art).
 * The letters are NOT in the sheet: they are live vector shapes (ichLetters.ts) so they are
 * never mirrored, can glow and flicker, and stay crisp at any zoom.
 */
type P = [number, number];
const add = (p: readonly number[], dx: number, dy = 0): P => [p[0] + dx, p[1] + dy];

export function ichSheet(): string {
  const d = new Defs('ich');
  const parts: string[] = [];
  const far = (c: string) => mix(c, EDGE, 0.28);

  /* ---------------------------------------------------------------- faceplate */
  {
    const { cx, cy, w, h, glassW, glassH } = PLATE;
    const x = cx - w / 2, y = cy - h / 2;
    const bez = rr(x, y, w, h, 28);
    const brassGrad = d.linear('brass', 0, y, 0, y + h, [[0, PAL.brassHi], [0.18, PAL.brass], [0.8, PAL.brass], [1, PAL.brassShade]]);
    parts.push(part('plate.back',
      // plate thickness seen on the far (left) side in three-quarter view
      path(rr(x - 12, y + 6, 40, h - 12, 22), PAL.brassShade) +
      // neck mount bracket
      path(smooth([[cx - 34, y + h - 6], [cx + 30, y + h - 6], [cx + 20, y + h + 18], [cx - 22, y + h + 18]]), PAL.navyHi, { sw: 3.5 }),
      { 'data-bone': 'head' }));
    parts.push(part('plate',
      solid(d, 'bezel', bez, brassGrad, [
        fillOnly(rr(x + 8, y + 5, w - 16, 10, 5), '#ffffff', 0.35),
        fillOnly(rr(x + 6, y + h - 14, w - 12, 10, 5), PAL.brassShade, 0.7),
      ]) +
      // rivets
      [[x + 15, y + 15], [x + w - 15, y + 15], [x + 15, y + h - 15], [x + w - 15, y + h - 15]].map(([rx, ry]) =>
        path(circle(rx, ry, 5.5), PAL.brassShade, { sw: 2.5 }) + fillOnly(circle(rx - 1.5, ry - 1.5, 2), PAL.brassHi)).join('') +
      // the dark glass the letters glow behind
      path(rr(cx - glassW / 2, cy - glassH / 2, glassW, glassH, 16), d.linear('glass', 0, cy - glassH / 2, 0, cy + glassH / 2, [[0, PAL.glassHi], [0.35, PAL.glass], [1, '#07080c']]), { sw: 4 }),
      { 'data-bone': 'head' }));
    // glass reflections drawn over the letters
    parts.push(part('plate.glare',
      fillOnly(smooth([[cx - glassW / 2 + 14, cy - glassH / 2 + 6], [cx - glassW / 2 + 70, cy - glassH / 2 + 6], [cx - glassW / 2 + 30, cy + glassH / 2 - 8], [cx - glassW / 2 + 8, cy + glassH / 2 - 20]]), '#ffffff', 0.08) +
      fillOnly(rr(cx - glassW / 2 + 10, cy - glassH / 2 + 7, glassW - 20, 5, 2.5), '#ffffff', 0.12),
      { 'data-bone': 'head' }));
  }

  /* ---------------------------------------------------------------- hat (too small, on the corner) */
  {
    const [hx, hy] = J.hat;
    const crown = smooth([[hx - 34, hy - 6], [hx - 30, hy - 40], [hx - 12, hy - 52], [hx + 2, hy - 44], [hx + 16, hy - 54], [hx + 32, hy - 42], [hx + 36, hy - 6]]);
    const brim = smooth([[hx - 52, hy - 2], [hx - 30, hy - 12], [hx + 34, hy - 12], [hx + 56, hy - 4], [hx + 40, hy + 6], [hx - 40, hy + 6]]);
    parts.push(part('hat',
      solid(d, 'brim', brim, PAL.hatShade, [fillOnly(ellipse(hx, hy - 8, 46, 6), PAL.hat)]) +
      solid(d, 'crown', crown, PAL.hat, [
        fillOnly(ellipse(hx + 14, hy - 30, 14, 20), PAL.hatHi, 0.6),
        fillOnly(rr(hx - 40, hy - 20, 80, 14, 0), PAL.band),
        fillOnly(rr(hx - 40, hy - 18, 80, 3, 0), PAL.navyHi),
      ]) +
      path(rr(hx + 18, hy - 22, 8, 16, 2), PAL.amber, { sw: 2 }),
      { 'data-bone': 'hat' }));
  }

  /* ---------------------------------------------------------------- neck */
  parts.push(part('neck',
    path(rr(-12, -500, 36, 20, 6), PAL.navy, { sw: 3.5 }) +
    path(rr(-16, -484, 44, 22, 7), PAL.navyHi, { sw: 3.5 }) +
    line('M-10 -474h36', PAL.navyDark, 2.5),
    { 'data-bone': 'neck' }));

  /* ---------------------------------------------------------------- torso: trench-coat chassis */
  {
    const coat = smooth([[-54, -446], [-40, -470], [10, -476], [64, -468], [72, -440], [62, -390], [52, -342], [-40, -342], [-50, -392]]);
    const lapelL = smooth([[-12, -470], [6, -468], [8, -420], [2, -380], [-8, -420], [-22, -460]]);
    const lapelR = smooth([[16, -470], [44, -466], [30, -430], [10, -380], [12, -430]]);
    const collarL = smooth([[-30, -462], [-22, -470], [-14, -502], [-26, -508], [-36, -484]]);
    const collarR = smooth([[26, -470], [40, -470], [52, -506], [38, -512], [26, -490]]);
    parts.push(part('torso',
      solid(d, 'coat', coat, PAL.coatShade, [
        fillOnly(ellipse(22, -420, 52, 70), PAL.coat),
        fillOnly(smooth([[40, -464], [62, -458], [60, -430], [44, -446]]), PAL.coatHi, 0.7),
        fillOnly(rr(-60, -358, 140, 20, 0), PAL.coatDark, 0.5),
      ]) +
      // the navy body showing between the lapels
      path(smooth([[-4, -470], [22, -470], [12, -386], [8, -386]]), PAL.navy, { sw: 3 }) +
      solid(d, 'lapelL', lapelL, PAL.coatDark, [fillOnly(ellipse(-4, -440, 8, 24), PAL.coatShade)], { sw: 3 }) +
      solid(d, 'lapelR', lapelR, PAL.coatShade, [fillOnly(ellipse(26, -444, 9, 20), PAL.coat)], { sw: 3 }) +
      // double-breasted brass buttons
      [[-14, -414], [-12, -386], [36, -416], [34, -388]].map(([bx, by]) => path(circle(bx, by, 5.5), PAL.brass, { sw: 2.5 }) + fillOnly(circle(bx - 1.5, by - 1.5, 2), PAL.brassHi)).join('') +
      // belt and buckle
      path(rr(-44, -356, 108, 20, 6), PAL.coatDark, { sw: 3.5 }) +
      path(rr(4, -360, 26, 28, 5), PAL.brass, { sw: 3 }) + path(rr(11, -353, 12, 14, 2), PAL.coatDark, { sw: 2 }) +
      // popped collar
      solid(d, 'collarL', collarL, PAL.coatShade, [fillOnly(ellipse(-24, -490, 6, 14), PAL.coat)], { sw: 3.5 }) +
      solid(d, 'collarR', collarR, PAL.coat, [fillOnly(ellipse(40, -492, 6, 14), PAL.coatHi, 0.7)], { sw: 3.5 }),
      { 'data-bone': 'torso' }));
  }

  /* ---------------------------------------------------------------- coat skirt flaps (spring chains) */
  parts.push(part('coat.back',
    solid(d, 'coatback', smooth([[-44, -340], [4, -340], [0, -270], [-2, -196], [-56, -190], [-72, -262]]), far(PAL.coatShade), [
      fillOnly(ellipse(-30, -270, 20, 60), far(PAL.coat), 0.8),
      line('M-24 -330C-26 -280 -30 -230 -30 -196', far(PAL.coatDark), 2.5, 0.8),
    ]),
    { 'data-bone': 'coat.back' }));
  parts.push(part('coat.front',
    solid(d, 'coatfront', smooth([[-4, -340], [50, -340], [66, -262], [82, -196], [26, -188], [-8, -196], [-12, -268]]), PAL.coatShade, [
      fillOnly(ellipse(34, -276, 30, 66), PAL.coat),
      fillOnly(smooth([[52, -330], [62, -290], [56, -290]]), PAL.coatHi, 0.6),
      line('M10 -334C8 -290 6 -240 6 -194', PAL.coatDark, 2.5),
      fillOnly(rr(-14, -206, 100, 10, 4), PAL.coatDark, 0.45),
    ]),
    { 'data-bone': 'coat.front' }));

  /* ---------------------------------------------------------------- legs: navy, with spats over brown oxfords */
  const leg = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const H = side === 'near' ? J.hipN : J.hipF;
    const K = side === 'near' ? J.kneeN : J.kneeF;
    const A = side === 'near' ? J.ankleN : J.ankleF;
    const c = (x: string) => (dark ? far(x) : x);
    parts.push(part(`thigh.${side}`,
      solid(d, `thigh-${side}`, capsule(H[0], H[1], 13, K[0], K[1], 11), c(PAL.navy), [fillOnly(capsule(H[0] + 4, H[1], 4, K[0] + 4, K[1], 3), c(PAL.navyHi))], { sw: 3.5 }),
      { 'data-bone': `thigh.${side}` }));
    parts.push(part(`knee.${side}`,
      path(circle(K[0], K[1], 13), c(PAL.navyHi), { sw: 3.5 }) + fillOnly(circle(K[0] - 3, K[1] - 4, 4), c('#56658c')),
      { 'data-bone': `shin.${side}` }));
    parts.push(part(`shin.${side}`,
      solid(d, `shin-${side}`, capsule(K[0], K[1], 11, A[0], A[1], 10), c(PAL.navy), [fillOnly(capsule(K[0] + 4, K[1], 3.5, A[0] + 3, A[1], 3), c(PAL.navyHi))], { sw: 3.5 }),
      { 'data-bone': `shin.${side}` }));
    const shoe = smooth([add(A, -30, 6), add(A, -6, 0), add(A, 30, 4), add(A, 62, 16), add(A, 70, 28), add(A, 64, 32), add(A, -34, 32), add(A, -38, 20)]);
    const spat = smooth([add(A, -24, -18), add(A, 14, -20), add(A, 26, 2), add(A, 40, 14), add(A, 8, 18), add(A, -30, 18), add(A, -32, 0)]);
    parts.push(part(`foot.${side}`,
      solid(d, `shoe-${side}`, shoe, c(PAL.shoe), [
        fillOnly(rr(A[0] - 40, A[1] + 26, 116, 8, 3), c('#2a1a10')),
        fillOnly(ellipse(A[0] + 48, A[1] + 16, 12, 5), c(PAL.shoeHi), 0.9),
        fillOnly(circle(A[0] + 54, A[1] + 14, 2.5), '#ffffff', dark ? 0.2 : 0.7),
      ]) +
      solid(d, `spat-${side}`, spat, c(PAL.spatShade), [fillOnly(ellipse(A[0] + 2, A[1] - 2, 24, 16), c(PAL.spat))], { sw: 3.5 }) +
      fillOnly(circle(A[0] - 18, A[1] + 4, 2.6), c(PAL.navy)) + fillOnly(circle(A[0] - 18, A[1] + 12, 2.6), c(PAL.navy)),
      { 'data-bone': `foot.${side}` }));
  };
  leg('far');
  leg('near');

  /* ---------------------------------------------------------------- arms: coat sleeves and white gloves */
  const arm = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const S = side === 'near' ? J.shN : J.shF;
    const E = side === 'near' ? J.elN : J.elF;
    const W = side === 'near' ? J.wrN : J.wrF;
    const c = (x: string) => (dark ? far(x) : x);
    parts.push(part(`upperarm.${side}`,
      solid(d, `uarm-${side}`, capsule(S[0], S[1], 19, E[0], E[1], 16), c(PAL.coatShade), [fillOnly(capsule(S[0] + 5, S[1], 9, E[0] + 4, E[1], 7), c(PAL.coat))]) +
      solid(d, `epaulette-${side}`, rr(S[0] - 22, S[1] - 16, 44, 20, 8), c(PAL.coat), [fillOnly(rr(S[0] - 16, S[1] - 13, 30, 5, 2.5), c(PAL.coatHi), 0.7)], { sw: 3.5 }),
      { 'data-bone': `upperarm.${side}` }));
    parts.push(part(`forearm.${side}`,
      solid(d, `farm-${side}`, capsule(E[0], E[1], 16, W[0], W[1], 15), c(PAL.coatShade), [fillOnly(capsule(E[0] + 4, E[1], 7, W[0] + 4, W[1], 6), c(PAL.coat))]) +
      path(rr(W[0] - 18, W[1] - 22, 36, 16, 6), c(PAL.coatDark), { sw: 3.5 }),
      { 'data-bone': `forearm.${side}` }));
    // cartoon gloves: plump, three fingers and a thumb, rolled cuff
    const hx = W[0], hy = W[1];
    const cuff = path(rr(hx - 17, hy - 10, 34, 16, 7), c(PAL.glove), { sw: 3.5 }) + fillOnly(rr(hx - 12, hy - 6, 24, 4, 2), c(PAL.gloveShade));
    const palm = solid(d, `gpalm-${side}`, smooth([[hx - 15, hy + 4], [hx + 15, hy + 4], [hx + 19, hy + 26], [hx + 13, hy + 42], [hx - 13, hy + 42], [hx - 19, hy + 24]]), c(PAL.gloveShade), [fillOnly(ellipse(hx + 3, hy + 20, 14, 18), c(PAL.glove))], { sw: 3.5 });
    const f = (x0: number, y0: number, x1: number, y1: number, r = 8) => path(capsule(x0, y0, r, x1, y1, r * 0.92), c(PAL.glove), { sw: 3.5 });
    const thumb = f(hx + 15, hy + 14, hx + 26, hy + 34, 7.5);
    parts.push(part(`hand.${side}`,
      thumb + palm + f(hx - 9, hy + 36, hx - 11, hy + 64) + f(hx + 2, hy + 38, hx + 2, hy + 68, 8.4) + f(hx + 12, hy + 36, hx + 14, hy + 62) + cuff,
      { 'data-bone': `hand.${side}` }));
    parts.push(part(`hand.${side}#point`,
      palm + path(rr(hx - 16, hy + 30, 34, 22, 10), c(PAL.glove), { sw: 3.5 }) + f(hx + 6, hy + 36, hx + 9, hy + 86, 8) + thumb + cuff,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
    parts.push(part(`hand.${side}#fist`,
      solid(d, `gfist-${side}`, rr(hx - 18, hy, 38, 46, 16), c(PAL.gloveShade), [fillOnly(ellipse(hx + 2, hy + 18, 14, 16), c(PAL.glove))], { sw: 3.5 }) +
      line(`M${hx - 12} ${hy + 30}h24M${hx - 12} ${hy + 38}h22`, c(PAL.gloveShade), 2.5) + thumb + cuff,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
    parts.push(part(`hand.${side}#open`,
      f(hx + 15, hy + 10, hx + 36, hy + 26, 7.5) + palm +
      f(hx - 9, hy + 36, hx - 22, hy + 62) + f(hx + 1, hy + 38, hx - 1, hy + 72, 8.4) + f(hx + 11, hy + 36, hx + 22, hy + 64) + cuff,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
  };
  arm('far');
  arm('near');

  /* ---------------------------------------------------------------- props */
  {
    // magnifying glass, held in the near hand; the lens hangs along the hand axis at rest
    const [wx, wy] = J.wrN;
    const lx = wx + 4, ly = wy + 128;
    parts.push(part('magnifier',
      path(capsule(wx + 2, wy + 30, 7, wx + 3, wy + 86, 6), '#5b3a22', { sw: 3 }) +
      path(rr(wx - 6, wy + 80, 18, 14, 4), PAL.brass, { sw: 3 }) +
      path(circle(lx, ly, 38), PAL.brass, { sw: 4 }) +
      fillOnly(circle(lx, ly, 29), '#9ed3e8', 0.35) +
      fillOnly(ellipse(lx - 10, ly - 12, 12, 6), '#ffffff', 0.7) +
      `<path d="${circle(lx, ly, 29)}" fill="none" stroke="${PAL.brassShade}" stroke-width="3"/>`,
      { 'data-bone': 'hand.near', 'data-alt': 1 }));
  }

  return sheet('ich', d, parts, [-150, -700, 300, 712]);
}
