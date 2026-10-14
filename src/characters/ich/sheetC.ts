import { Defs, capsule, circle, ellipse, fillOnly, line, mix, n, part, path, poly, rr, sheet, smooth, solid, EDGE } from '../../art/svg';
import { JC, PAL_C as PAL, PLATE_C as PLATE, SCOPE } from './geoC';

/**
 * ICH rig sheet, direction C „Das Periskop" (procedural placeholder art).
 * A square sign on a telescopic mast that comes out of the brass collar of a small plum cape cone,
 * a sand-coloured wide-brim hat far too big for him (it rests on the plate's corners), thin limbs,
 * coil-spring shins, white gloves and big shoes. The letters are NOT in the sheet: they are live
 * vector shapes (ichLetters.ts), so they are never mirrored and stay crisp.
 */
type P = [number, number];
const add = (p: readonly number[], dx: number, dy = 0): P => [p[0] + dx, p[1] + dy];

export function ichSheetC(): string {
  const d = new Defs('ich-c');
  const parts: string[] = [];
  const far = (c: string) => mix(c, EDGE, 0.28);

  /* ---------------------------------------------------------------- faceplate: a square sign */
  {
    const { cx, cy, w, h, glassW, glassH, r } = PLATE;
    const x = cx - w / 2, y = cy - h / 2;
    const [mx, my] = JC.head;
    parts.push(part('plate.back',
      // plate thickness seen on the far (left) side in three-quarter view
      path(rr(x - 12, y + 8, 40, h - 16, 24), PAL.brassShade) +
      // the mount: a yoke under the plate and the ball joint on top of the telescope
      path(smooth([[cx - 30, y + h - 8], [cx + 26, y + h - 8], [mx + 14, my - 2], [mx - 14, my - 2]]), PAL.steelShade, { sw: 3.5 }) +
      solid(d, 'mount', circle(mx, my, 13), PAL.brassShade, [fillOnly(circle(mx - 3, my - 3, 8), PAL.brass), fillOnly(circle(mx - 5, my - 6, 3), PAL.brassHi)], { sw: 3.5 }),
      { 'data-bone': 'head' }));
    const brassGrad = d.linear('brass', 0, y, 0, y + h, [[0, PAL.brassHi], [0.16, PAL.brass], [0.82, PAL.brass], [1, PAL.brassShade]]);
    parts.push(part('plate',
      solid(d, 'bezel', rr(x, y, w, h, r), brassGrad, [
        fillOnly(rr(x + 10, y + 5, w - 20, 9, 4.5), '#ffffff', 0.35),
        fillOnly(rr(x + 8, y + h - 13, w - 16, 9, 4.5), PAL.brassShade, 0.7),
      ]) +
      // rivets in the four corners
      [[x + 14, y + 14], [x + w - 14, y + 14], [x + 14, y + h - 14], [x + w - 14, y + h - 14]].map(([rx, ry]) =>
        path(circle(rx, ry, 5), PAL.brassShade, { sw: 2.5 }) + fillOnly(circle(rx - 1.5, ry - 1.5, 1.8), PAL.brassHi)).join('') +
      // the dark glass the letters glow behind
      path(rr(cx - glassW / 2, cy - glassH / 2, glassW, glassH, 18), d.linear('glass', 0, cy - glassH / 2, 0, cy + glassH / 2, [[0, PAL.glassHi], [0.35, PAL.glass], [1, '#07080c']]), { sw: 4 }),
      { 'data-bone': 'head' }));
    // glass reflections drawn over the letters
    parts.push(part('plate.glare',
      fillOnly(smooth([[cx - glassW / 2 + 12, cy - glassH / 2 + 6], [cx - glassW / 2 + 56, cy - glassH / 2 + 6], [cx - glassW / 2 + 22, cy + glassH / 2 - 8], [cx - glassW / 2 + 7, cy + glassH / 2 - 22]]), '#ffffff', 0.08) +
      fillOnly(rr(cx - glassW / 2 + 12, cy - glassH / 2 + 6, glassW - 24, 5, 2.5), '#ffffff', 0.12),
      { 'data-bone': 'head' }));
  }

  /* ---------------------------------------------------------------- hat: wide brim, far too big */
  {
    const [hx, hy] = JC.hat;
    // the brim rests on the plate's two top corners and droops beyond them on both sides
    const brim = smooth([
      [hx - 154, hy + 18], [hx - 128, hy - 2], [hx - 70, hy - 12], [hx, hy - 14], [hx + 74, hy - 12], [hx + 134, hy - 2],
      [hx + 160, hy + 16], [hx + 148, hy + 22], [hx + 118, hy + 8], [hx + 60, hy + 2], [hx, hy + 1], [hx - 60, hy + 2], [hx - 118, hy + 8], [hx - 146, hy + 24],
    ]);
    const crown = smooth([[hx - 74, hy - 6], [hx - 70, hy - 36], [hx - 48, hy - 54], [hx - 10, hy - 48], [hx + 28, hy - 58], [hx + 62, hy - 46], [hx + 76, hy - 6]]);
    parts.push(part('hat',
      `<g transform="rotate(-3 ${hx} ${hy})">` +
      solid(d, 'brim', brim, PAL.hatShade, [
        fillOnly(ellipse(hx + 2, hy - 6, 136, 9), PAL.hat),
        fillOnly(ellipse(hx - 70, hy - 7, 40, 3.5), PAL.hatHi, 0.8),
        // where the plate's corners push into the brim from below
        line(`M${n(PLATE.cx - PLATE.w / 2 + 6)} ${n(hy + 2)}q4 -8 12 -9M${n(PLATE.cx + PLATE.w / 2 - 6)} ${n(hy + 2)}q-4 -8 -12 -9`, PAL.hatShade, 2.5),
      ]) +
      solid(d, 'crown', crown, PAL.hat, [
        fillOnly(ellipse(hx + 34, hy - 34, 20, 26), PAL.hatShade, 0.55),
        fillOnly(ellipse(hx - 36, hy - 36, 16, 12), PAL.hatHi, 0.75),
        line(`M${hx - 10} ${hy - 48}C${hx - 6} ${hy - 36} ${hx - 4} ${hy - 28} ${hx - 2} ${hy - 22}`, PAL.hatShade, 3),
        fillOnly(rr(hx - 80, hy - 24, 160, 17, 0), PAL.hatBand),
        fillOnly(rr(hx - 80, hy - 22, 160, 3, 0), PAL.plumHi),
      ]) +
      path(rr(hx + 36, hy - 26, 18, 20, 4), PAL.brass, { sw: 2.5 }) + path(rr(hx + 41, hy - 21, 8, 10, 2), PAL.hatBand, { sw: 2 }) +
      '</g>',
      { 'data-bone': 'hat' }));
  }

  /* ---------------------------------------------------------------- neck: the sliding tubes of the telescope */
  const SX = 7;
  const tube = (name: string, y0: number, y1: number, rad: number) =>
    solid(d, name, rr(SX - rad, y0, rad * 2, y1 - y0, 3), PAL.steel, [
      fillOnly(rr(SX + rad * 0.35, y0, rad * 0.65, y1 - y0, 0), PAL.steelShade),
      fillOnly(rr(SX - rad * 0.62, y0, rad * 0.4, y1 - y0, 0), PAL.steelHi, 0.8),
    ], { sw: 3.5 });
  const ring = (name: string, y: number, rad: number) =>
    solid(d, name, rr(SX - rad, y - 6, rad * 2, 12, 5), PAL.brass, [fillOnly(rr(SX - rad + 3, y - 5, rad * 2 - 6, 3, 1.5), PAL.brassHi), fillOnly(rr(SX + rad * 0.4, y - 6, rad, 12, 0), PAL.brassShade, 0.7)], { sw: 3 });
  {
    const [r0, r1, r2] = SCOPE.r;
    // ribs on the lowest sliding tube: more of them show as the mast slides up
    const ribs: string[] = [];
    for (let y = SCOPE.ring1 + 18; y < SCOPE.bottom - 6; y += 18) ribs.push(`M${SX - r0 + 2} ${y}h${r0 * 2 - 4}`);
    parts.push(part('neck',
      tube('scope-top', SCOPE.top, SCOPE.ring2 + 8, r2) +
      tube('scope-mid', SCOPE.ring2, SCOPE.ring1 + 8, r1) +
      ring('ring2', SCOPE.ring2, r1 + 4) +
      tube('scope-low', SCOPE.ring1, SCOPE.bottom, r0) +
      line(ribs.join(''), PAL.steelDark, 2.5, 0.8) +
      ring('ring1', SCOPE.ring1, r0 + 4),
      { 'data-bone': 'neck' }));
  }

  /* ---------------------------------------------------------------- torso: the top of the cape cone */
  {
    // one plum cone with the two lower halves (below): the mantle has no outline along its
    // bottom edge, so at rest the three pieces read as a single cape
    const side: P[] = [[-70, -296], [-66, -324], [-56, -358], [-38, -388], [-14, -400], [28, -400], [46, -386], [66, -358], [78, -322], [80, -296]];
    const mantle = smooth([...side, [60, -286], [20, -280], [-30, -286]]);
    const cy = SCOPE.collar;
    // front lip of the brass collar ring the telescope comes out of
    const collar = `M${-19} ${cy}A26 7 0 0 0 ${33} ${cy}V${cy + 12}A26 7 0 0 1 ${-19} ${cy + 12}Z`;
    parts.push(part('torso',
      solid(d, 'mantle', mantle, PAL.plumShade, [
        fillOnly(ellipse(24, -326, 62, 62), PAL.plum),
        fillOnly(smooth([[-30, -384], [-6, -394], [-10, -372], [-46, -350]]), PAL.plumHi, 0.8),
        fillOnly(smooth([[48, -384], [68, -360], [60, -354], [44, -374]]), PAL.plumHi, 0.6),
        line('M10 -382C12 -352 18 -318 22 -284', PAL.plumDark, 2.5, 0.7),
        line('M-68 -298C-30 -290 20 -284 78 -298', PAL.plumDark, 2.5, 0.45),
      ], { stroke: 'none' }) +
      line(smooth(side, false), EDGE, 4.5) +
      // the fixed outer tube of the telescope, standing in the collar
      tube('scope-base', SCOPE.base, cy + 4, SCOPE.baseR) +
      ring('ring0', SCOPE.base, SCOPE.baseR + 4) +
      solid(d, 'collar', collar, PAL.brass, [fillOnly(rr(-20, cy + 6, 54, 8, 0), PAL.brassShade, 0.7), fillOnly(ellipse(-4, cy + 4, 10, 2.5), PAL.brassHi)], { sw: 3.5 }) +
      // the clasp
      path(circle(26, -374, 8), PAL.brass, { sw: 3 }) + fillOnly(circle(24, -376, 3), PAL.brassHi) +
      line('M26 -366C26 -352 24 -340 22 -330', PAL.brassShade, 2.5),
      { 'data-bone': 'torso' }));
  }

  /* ---------------------------------------------------------------- the two halves of the cape (spring chains) */
  parts.push(part('coat.back',
    solid(d, 'capeback', smooth([[-60, -320], [10, -320], [8, -270], [6, -222], [-50, -214], [-104, -226], [-84, -272]]), far(PAL.plumShade), [
      fillOnly(ellipse(-44, -266, 30, 50), far(PAL.plum), 0.85),
      line('M-34 -306C-40 -280 -46 -250 -50 -220', far(PAL.plumDark), 2.5, 0.8),
      fillOnly(rr(-114, -234, 134, 22, 0), far(PAL.trim)),
      fillOnly(rr(-114, -234, 134, 3, 0), far(PAL.trimShade)),
    ]),
    { 'data-bone': 'coat.back' }));
  parts.push(part('coat.front',
    solid(d, 'capefront', smooth([[-16, -320], [70, -320], [90, -274], [110, -228], [62, -216], [14, -214], [-22, -220], [-24, -274]]), PAL.plumShade, [
      fillOnly(ellipse(42, -268, 38, 56), PAL.plum),
      fillOnly(smooth([[58, -306], [78, -278], [72, -272], [54, -294]]), PAL.plumHi, 0.7),
      // the gold lining shows along the front opening
      fillOnly(smooth([[68, -316], [90, -272], [112, -230], [100, -228], [80, -274]]), PAL.lining, 0.9),
      line('M14 -308C12 -280 10 -250 8 -218', PAL.plumDark, 2.5),
      line('M42 -306C48 -282 54 -254 58 -220', PAL.plumDark, 2, 0.6),
      fillOnly(rr(-30, -234, 150, 22, 0), PAL.trim),
      fillOnly(rr(-30, -234, 150, 3, 0), PAL.trimShade),
    ]),
    { 'data-bone': 'coat.front' }));

  /* ---------------------------------------------------------------- legs: thin, coil-spring shins, big shoes */
  const leg = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const H = side === 'near' ? JC.hipN : JC.hipF;
    const K = side === 'near' ? JC.kneeN : JC.kneeF;
    const A = side === 'near' ? JC.ankleN : JC.ankleF;
    const c = (x: string) => (dark ? far(x) : x);
    parts.push(part(`thigh.${side}`,
      solid(d, `thigh-${side}`, capsule(H[0], H[1], 9, K[0], K[1], 8), c(PAL.steel), [fillOnly(capsule(H[0] - 3, H[1], 2.5, K[0] - 3, K[1], 2), c(PAL.steelHi))], { sw: 3.5 }),
      { 'data-bone': `thigh.${side}` }));
    parts.push(part(`knee.${side}`,
      path(circle(K[0], K[1], 11), c(PAL.brass), { sw: 3.5 }) + fillOnly(circle(K[0] - 3, K[1] - 3, 4), c(PAL.brassHi)),
      { 'data-bone': `shin.${side}` }));
    // the shin is a coil spring around a thin rod
    const len = Math.hypot(A[0] - K[0], A[1] - K[1]);
    const ux = (A[0] - K[0]) / len, uy = (A[1] - K[1]) / len;
    const px = -uy, py = ux;
    const coil: P[] = [];
    const turns = 9;
    const s0 = 10, s1 = len - 12;
    for (let i = 0; i <= turns * 2; i++) {
      const s = s0 + ((s1 - s0) * i) / (turns * 2);
      const side2 = i % 2 === 0 ? -1 : 1;
      coil.push([K[0] + ux * s + px * 11 * side2, K[1] + uy * s + py * 11 * side2]);
    }
    const coilD = poly(coil, false);
    parts.push(part(`shin.${side}`,
      path(capsule(K[0], K[1], 5, A[0], A[1], 5), c(PAL.steelDark), { sw: 3 }) +
      `<path d="${coilD}" fill="none" stroke="${EDGE}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="${coilD}" fill="none" stroke="${c(PAL.steelHi)}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`,
      { 'data-bone': `shin.${side}` }));
    const shoe = smooth([add(A, -36, 6), add(A, -12, -6), add(A, 30, -4), add(A, 70, 6), add(A, 94, 20), add(A, 90, 32), add(A, -36, 32), add(A, -44, 18)]);
    parts.push(part(`foot.${side}`,
      solid(d, `shoe-${side}`, shoe, c(PAL.shoeShade), [
        fillOnly(ellipse(A[0] + 26, A[1] + 10, 56, 18), c(PAL.shoe)),
        fillOnly(rr(A[0] - 46, A[1] + 25, 150, 10, 3), c(PAL.sole)),
        fillOnly(ellipse(A[0] + 62, A[1] + 10, 16, 6), c(PAL.shoeHi), 0.9),
        fillOnly(circle(A[0] + 70, A[1] + 8, 2.6), '#ffffff', dark ? 0.2 : 0.7),
        line(`M${A[0] + 8} ${A[1] - 2}l14 4M${A[0] + 12} ${A[1] + 6}l14 2`, c(PAL.glove), 3),
      ]) +
      // brass ankle cuff where the spring meets the shoe
      path(rr(A[0] - 14, A[1] - 12, 28, 12, 4), c(PAL.brass), { sw: 3 }),
      { 'data-bone': `foot.${side}` }));
  };
  leg('far');
  leg('near');

  /* ---------------------------------------------------------------- arms: thin tubes, brass joints, white gloves */
  const arm = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const S = side === 'near' ? JC.shN : JC.shF;
    const E = side === 'near' ? JC.elN : JC.elF;
    const W = side === 'near' ? JC.wrN : JC.wrF;
    const c = (x: string) => (dark ? far(x) : x);
    parts.push(part(`upperarm.${side}`,
      solid(d, `uarm-${side}`, capsule(S[0], S[1], 9, E[0], E[1], 8), c(PAL.steel), [fillOnly(capsule(S[0] - 3, S[1], 2.5, E[0] - 3, E[1], 2), c(PAL.steelHi))], { sw: 3.5 }) +
      // a plum shoulder cap: the arm comes out from under the mantle
      solid(d, `scap-${side}`, smooth([add(S, -16, 6), add(S, -12, -12), add(S, 4, -16), add(S, 17, -8), add(S, 16, 8), add(S, 0, 14)]), c(PAL.plum), [fillOnly(ellipse(S[0] - 4, S[1] - 8, 8, 4), c(PAL.plumHi))], { sw: 3.5 }),
      { 'data-bone': `upperarm.${side}` }));
    parts.push(part(`forearm.${side}`,
      solid(d, `farm-${side}`, capsule(E[0], E[1], 8, W[0], W[1], 7), c(PAL.steel), [fillOnly(capsule(E[0] - 3, E[1], 2, W[0] - 3, W[1], 2), c(PAL.steelHi))], { sw: 3.5 }) +
      path(circle(E[0], E[1], 10), c(PAL.brass), { sw: 3 }) + fillOnly(circle(E[0] - 3, E[1] - 3, 3.5), c(PAL.brassHi)),
      { 'data-bone': `forearm.${side}` }));
    // cartoon gloves (as A): plump, three fingers and a thumb, rolled cuff
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
    // brass magnifier in the near fist; the lens hangs along the hand axis at rest
    const [wx, wy] = JC.wrN;
    const lx = wx + 4, ly = wy + 128;
    parts.push(part('magnifier',
      path(capsule(wx + 2, wy + 30, 7, wx + 3, wy + 86, 6), PAL.plumDark, { sw: 3 }) +
      path(rr(wx - 5, wy + 52, 16, 8, 3), PAL.brass, { sw: 2.5 }) +
      path(rr(wx - 6, wy + 80, 18, 14, 4), PAL.brass, { sw: 3 }) +
      path(circle(lx, ly, 38), PAL.brass, { sw: 4 }) +
      fillOnly(circle(lx, ly, 29), '#9ed3e8', 0.35) +
      fillOnly(ellipse(lx - 10, ly - 12, 12, 6), '#ffffff', 0.7) +
      `<path d="${circle(lx, ly, 29)}" fill="none" stroke="${PAL.brassShade}" stroke-width="3"/>`,
      { 'data-bone': 'hand.near', 'data-alt': 1 }));
  }

  return sheet('ich-c', d, parts, [-180, -770, 360, 790]);
}
