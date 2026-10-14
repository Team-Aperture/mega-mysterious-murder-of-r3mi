import { Defs, capsule, circle, ellipse, fillOnly, line, mix, part, path, poly, rr, sheet, smooth, solid, EDGE } from '../../art/svg';
import { CAB, JB, LENS_B, PAL_B as PAL, PLATE_B } from './geoB';

/**
 * ICH rig sheet, direction B „Der Aktenschrank" (procedural placeholder art).
 * An olive office-steel filing cabinet in oblique three-quarter view: drawer fronts face the
 * viewer, the side panel and the lid recede up and to the left (the far side).
 * The letters are NOT in the sheet: they are live vector shapes (ichLetters.ts), so they are
 * never mirrored and can glow and flicker behind the label holder's celluloid window.
 */
type P = [number, number];
const add = (p: readonly number[], dx: number, dy = 0): P => [p[0] + dx, p[1] + dy];

export function ichSheetB(): string {
  const d = new Defs('ich-b');
  const parts: string[] = [];
  const far = (c: string) => mix(c, EDGE, 0.28);
  const { x0, x1, cx, top, bottom, dx, dy } = CAB;
  const W = x1 - x0;

  /** Side panel strip of the cabinet between two front-edge heights (oblique, to the left). */
  const sidePanel = (y0: number, y1: number): P[] => [[x0, y0], [x0 + dx, y0 + dy], [x0 + dx, y1 + dy], [x0, y1]];

  /** Small brass label holder with a pencilled card, and a chrome cup pull under it. */
  const hardware = (y0: number, id: string): string => {
    const ly = y0 + 22, py = y0 + 64;
    return path(rr(cx - 36, ly, 72, 30, 5), PAL.brass, { sw: 3.5 }) +
      fillOnly(rr(cx - 32, ly + 2, 64, 4, 2), PAL.brassHi, 0.8) +
      path(rr(cx - 28, ly + 6, 56, 18, 2), PAL.card, { sw: 2 }) +
      line(`M${cx - 22} ${ly + 12}h30M${cx - 22} ${ly + 18}h40`, PAL.cardInk, 2) +
      fillOnly(circle(cx - 31, ly + 15, 2.2), PAL.brassShade) + fillOnly(circle(cx + 31, ly + 15, 2.2), PAL.brassShade) +
      solid(d, `pull-${id}`, rr(cx - 42, py, 84, 24, 12), PAL.chromeShade, [
        fillOnly(rr(cx - 42, py, 84, 12, 6), PAL.chrome),
        fillOnly(rr(cx - 32, py + 3, 40, 4, 2), PAL.chromeHi, 0.9),
      ], { sw: 3.5 }) +
      path(rr(cx - 30, py + 13, 60, 7, 3.5), PAL.gap, { sw: 2 });
  };

  /** A drawer front: pressed steel with a bevel, a darker lower edge and a pressed inner border. */
  const drawerFront = (id: string, y0: number, y1: number, inner: string[] = []): string =>
    solid(d, `front-${id}`, rr(x0, y0, W, y1 - y0, 6), PAL.olive, [
      fillOnly(rr(x0, y1 - 16, W, 16, 0), PAL.oliveShade, 0.85),
      fillOnly(rr(x0, y0, 14, y1 - y0, 0), PAL.oliveShade, 0.45),
      fillOnly(rr(x0 + 8, y0 + 4, W - 16, 7, 3.5), PAL.oliveHi, 0.75),
      fillOnly(smooth([[x1 - 40, y0 + 12], [x1 - 14, y0 + 12], [x1 - 22, y0 + 52], [x1 - 34, y0 + 40]]), PAL.oliveHi, 0.25),
      `<path d="${rr(x0 + 8, y0 + 8, W - 16, y1 - y0 - 16, 4)}" fill="none" stroke="${PAL.oliveShade}" stroke-width="2.5"/>`,
      ...inner,
    ]);

  /* ---------------------------------------------------------------- head: the top drawer section */
  {
    const [y0, y1] = CAB.drawers[0];
    const seam = CAB.seam;
    const lid: P[] = [[x0, top], [x1, top], [x1 + dx, top + dy], [x0 + dx, top + dy]];
    parts.push(part('plate.back',
      // side panel of the top section (far side, in shadow)
      solid(d, 'side-top', poly(sidePanel(top, seam)), PAL.oliveShade, [
        fillOnly(poly([[x0 + dx, top + dy], [x0 + dx + 10, top + dy + 4], [x0 + dx + 10, seam + dy + 4], [x0 + dx, seam + dy]]), PAL.oliveDark, 0.5),
        line(`M${x0 + dx * 0.5} ${top + dy * 0.5 + 10}V${seam + dy * 0.5 - 8}`, PAL.oliveDark, 2, 0.6),
      ]) +
      // the lid
      solid(d, 'lid', poly(lid), PAL.oliveLid, [
        fillOnly(poly([[x0, top], [x1, top], [x1 - 4, top - 4], [x0 - 4, top - 4]]), PAL.oliveHi, 0.9),
        line(`M${x0 + dx * 0.5 + 14} ${top + dy * 0.5}H${x1 + dx * 0.5 - 14}`, PAL.oliveShade, 2, 0.7),
      ]),
      { 'data-bone': 'head' }));

    const { cx: pcx, cy: pcy, w, h, glassW, glassH } = PLATE_B;
    const bx = pcx - w / 2, by = pcy - h / 2;
    const brassGrad = d.linear('holder', 0, by, 0, by + h, [[0, PAL.brassHi], [0.2, PAL.brass], [0.8, PAL.brass], [1, PAL.brassShade]]);
    parts.push(part('plate',
      drawerFront('top', y0, y1) +
      // the big brass label holder (card slot open at the top, two screws)
      solid(d, 'holder', rr(bx, by, w, h, 12), brassGrad, [
        fillOnly(rr(bx + 8, by + 4, w - 16, 8, 4), '#ffffff', 0.3),
        fillOnly(rr(bx + 6, by + h - 12, w - 12, 8, 4), PAL.brassShade, 0.7),
      ]) +
      [[bx + 13, pcy], [bx + w - 13, pcy]].map(([sx, sy]) =>
        path(circle(sx, sy, 5), PAL.brassShade, { sw: 2.5 }) + line(`M${sx - 3} ${sy - 3}l6 6`, PAL.brassHi, 1.6)).join('') +
      path(rr(pcx - glassW / 2, pcy - glassH / 2, glassW, glassH, 8), d.linear('card', 0, pcy - glassH / 2, 0, pcy + glassH / 2, [[0, PAL.glassHi], [0.35, PAL.glass], [1, '#07080c']]), { sw: 4 }) +
      // the card slot notch at the top of the holder
      fillOnly(rr(pcx - 26, by + 1, 52, 4, 2), PAL.brassShade),
      { 'data-bone': 'head' }));
    // celluloid window reflections, over the letters
    const gx = pcx - glassW / 2, gy = pcy - glassH / 2;
    parts.push(part('plate.glare',
      fillOnly(poly([[gx + 16, gy + 5], [gx + 52, gy + 5], [gx + 24, gy + glassH - 5], [gx + 6, gy + glassH - 5], [gx + 6, gy + glassH - 18]]), '#ffffff', 0.08) +
      fillOnly(poly([[gx + 62, gy + 5], [gx + 72, gy + 5], [gx + 44, gy + glassH - 5], [gx + 34, gy + glassH - 5]]), '#ffffff', 0.05) +
      fillOnly(rr(gx + 10, gy + 6, glassW - 20, 4, 2), '#ffffff', 0.12),
      { 'data-bone': 'head' }));
  }

  /* ---------------------------------------------------------------- hat: flat cap, ear flaps folded up, too small */
  {
    const [hx, hy] = JB.hat;
    const crown = smooth([[hx - 46, hy + 4], [hx - 46, hy - 18], [hx - 30, hy - 34], [hx + 4, hy - 40], [hx + 36, hy - 32], [hx + 60, hy - 14], [hx + 66, hy - 2], [hx + 44, hy + 6]]);
    const peak = smooth([[hx + 26, hy + 2], [hx + 60, hy - 6], [hx + 82, hy - 2], [hx + 80, hy + 6], [hx + 54, hy + 10], [hx + 26, hy + 9]]);
    const flap = rr(hx - 26, hy - 26, 30, 22, [4, 4, 10, 10]);
    parts.push(part('hat',
      solid(d, 'peak', peak, PAL.capDark, [fillOnly(ellipse(hx + 58, hy - 1, 22, 4), PAL.capShade)]) +
      solid(d, 'crown', crown, PAL.capShade, [
        fillOnly(ellipse(hx + 6, hy - 22, 46, 20), PAL.cap),
        fillOnly(ellipse(hx - 10, hy - 30, 22, 6), PAL.capHi, 0.6),
        // corduroy ribs
        line(`M${hx - 30} ${hy - 24}Q${hx} ${hy - 34} ${hx + 40} ${hy - 22}M${hx - 36} ${hy - 12}Q${hx} ${hy - 22} ${hx + 50} ${hy - 10}`, PAL.capShade, 2, 0.7),
        // band
        fillOnly(rr(hx - 50, hy - 4, 120, 12, 0), PAL.capDark, 0.85),
      ]) +
      // ear flap folded up, snapped shut with a brass press stud
      solid(d, 'flap', flap, PAL.capShade, [fillOnly(rr(hx - 26, hy - 26, 30, 7, 3), PAL.capHi, 0.5)], { sw: 3.5 }) +
      line(`M${hx - 21} ${hy - 20}v10q0 6 6 6h10q6 0 6 -6v-10`, PAL.capDark, 1.6, 0.8) +
      path(circle(hx - 11, hy - 20, 3.6), PAL.brass, { sw: 2 }) +
      // button on top
      path(ellipse(hx - 2, hy - 40, 8, 4), PAL.capShade, { sw: 3 }),
      { 'data-bone': 'hat' }));
  }

  /* ---------------------------------------------------------------- neck: bellows in the head hinge */
  {
    const s = CAB.seam, r = 17;
    parts.push(part('neck',
      path(poly([[x1 - 2, s - r], [x1 - 2, s + r], [x0, s + r], [x0 + dx + 2, s + r + dy], [x0 + dx + 2, s - r + dy], [x0, s - r]]), '#24271c', { sw: 3.5 }) +
      line([-10, -4, 2, 8].map((o) => `M${x0 + dx + 6} ${s + o + dy}L${x0} ${s + o}H${x1 - 6}`).join(''), '#3d4230', 2.5),
      { 'data-bone': 'neck' }));
  }

  /* ---------------------------------------------------------------- torso: carcass and middle drawer */
  {
    const [y0, y1] = CAB.drawers[1];
    const [, b0] = CAB.drawers[2];
    const [p0, p1] = CAB.plinth;
    parts.push(part('torso',
      // side panel from the head hinge down to the floor
      solid(d, 'side', poly(sidePanel(CAB.seam, bottom)), PAL.oliveShade, [
        fillOnly(poly([[x0 + dx, CAB.seam + dy], [x0 + dx + 10, CAB.seam + dy + 4], [x0 + dx + 10, bottom + dy], [x0 + dx, bottom + dy]]), PAL.oliveDark, 0.5),
        fillOnly(poly([[x0 - 6, CAB.seam], [x0, CAB.seam], [x0, bottom], [x0 - 6, bottom - 2]]), PAL.olive, 0.45),
        // pressed stiffening ribs
        line(`M${x0 + dx * 0.5} ${CAB.seam + dy * 0.5 + 16}V${b0 + dy * 0.5 - 10}`, PAL.oliveDark, 2, 0.55),
        fillOnly(poly(sidePanel(p0, bottom)), PAL.oliveDark, 0.7),
      ]) +
      // dark carcass in the drawer gaps
      fillOnly(rr(x0, CAB.drawers[0][1] - 4, W, CAB.drawers[1][0] - CAB.drawers[0][1] + 8, 0), PAL.gap) +
      path(rr(x0, y1 - 2, W, CAB.drawers[2][0] - y1 + 4, 0), PAL.gap, { sw: 2 }) +
      drawerFront('mid', y0, y1, [hardware(y0, 'mid')]) +
      // the plinth under the bottom drawer, recessed
      path(rr(x0 + 8, p0 - 2, W - 16, p1 - p0 + 2, [0, 0, 4, 4]), PAL.oliveDark, { sw: 3.5 }) +
      fillOnly(rr(x0 + 10, p0, W - 20, 6, 0), PAL.gap, 0.8),
      { 'data-bone': 'torso' }));
  }

  /* ---------------------------------------------------------------- coat.front: the bottom drawer (rattles) */
  {
    const [y0, y1] = CAB.drawers[2];
    // the drawer box behind its front, hidden in the carcass until the drawer slides out
    const rim: P[] = [[x0, y0], [x1, y0], [x1 + dx, y0 + dy], [x0 + dx, y0 + dy]];
    const wall: P[] = [[x0, y0], [x0, y1], [x0 + dx, y1 + dy], [x0 + dx, y0 + dy]];
    parts.push(part('coat.front',
      path(poly(wall), PAL.oliveDark, { sw: 3 }) +
      path(poly(rim), '#191b12', { sw: 3 }) +
      // file folders inside, their tabs just below the rim
      [[x0 + 12, PAL.manila], [x0 + 70, PAL.folderRed], [x0 + 128, PAL.manila], [x0 + 176, PAL.folderTeal]].map(([fx, c], i) =>
        path(rr((fx as number) + dx * 0.4, y0 + dy * 0.4 - 3 - (i % 2) * 3, 28, 12, [3, 3, 0, 0]), c as string, { sw: 2.5 })).join('') +
      drawerFront('bot', y0, y1, [hardware(y0, 'bot')]),
      { 'data-bone': 'coat.front' }));
  }

  /* ---------------------------------------------------------------- coat.back: folder tabs poking out of the top drawer */
  {
    const [bx, by] = JB.coatB;
    const folder = (ox: number, h: number, wd: number, tabX: number, c: string, sh: string, rot: number) =>
      `<g transform="rotate(${rot} ${bx + ox} ${by})">` +
      solid(d, `folder-${ox}`, poly([[bx + ox, by + 10], [bx + ox, by - h], [bx + ox + tabX, by - h], [bx + ox + tabX + 4, by - h - 12], [bx + ox + tabX + 26, by - h - 12], [bx + ox + tabX + 30, by - h], [bx + ox + wd, by - h], [bx + ox + wd, by + 10]]), c, [
        fillOnly(rr(bx + ox, by - h + 8, wd, h + 4, 0), sh, 0.6),
        line(`M${bx + ox + 6} ${by - h + 6}H${bx + ox + wd - 6}`, '#ffffff', 2, 0.35),
      ], { sw: 3.5 }) + '</g>';
    parts.push(part('coat.back',
      folder(-46, 30, 50, 4, PAL.manila, PAL.manilaShade, -8) +
      folder(-14, 38, 54, 18, PAL.folderRed, mix(PAL.folderRed, EDGE, 0.25), 3) +
      folder(26, 26, 50, 10, PAL.folderTeal, mix(PAL.folderTeal, EDGE, 0.25), 9) +
      // a loose sheet
      `<g transform="rotate(-16 ${bx - 20} ${by})">` + path(rr(bx - 30, by - 44, 24, 54, 2), '#f6f2e6', { sw: 3 }) +
      line(`M${bx - 25} ${by - 36}h14M${bx - 25} ${by - 28}h12M${bx - 25} ${by - 20}h14`, PAL.cardInk, 1.6) + '</g>',
      { 'data-bone': 'coat.back' }));
  }

  /* ---------------------------------------------------------------- legs: stubby rods, chunky shoes */
  const leg = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const H = side === 'near' ? JB.hipN : JB.hipF;
    const K = side === 'near' ? JB.kneeN : JB.kneeF;
    const A = side === 'near' ? JB.ankleN : JB.ankleF;
    const c = (x: string) => (dark ? far(x) : x);
    parts.push(part(`thigh.${side}`,
      path(circle(H[0], H[1], 15), c(PAL.joint), { sw: 3.5 }) +
      solid(d, `thigh-${side}`, capsule(H[0], H[1], 11, K[0], K[1], 10), c(PAL.rod), [fillOnly(capsule(H[0] + 4, H[1], 3.5, K[0] + 4, K[1], 3), c(PAL.rodHi))], { sw: 3.5 }),
      { 'data-bone': `thigh.${side}` }));
    parts.push(part(`knee.${side}`,
      path(circle(K[0], K[1], 13.5), c(PAL.joint), { sw: 3.5 }) + fillOnly(circle(K[0] - 3, K[1] - 4, 4.5), c(PAL.rodHi)) + fillOnly(circle(K[0] + 1, K[1] + 1, 3), c(PAL.rodDark)),
      { 'data-bone': `shin.${side}` }));
    parts.push(part(`shin.${side}`,
      solid(d, `shin-${side}`, capsule(K[0], K[1], 10, A[0], A[1], 9.5), c(PAL.rod), [fillOnly(capsule(K[0] + 4, K[1], 3, A[0] + 3, A[1], 3), c(PAL.rodHi))], { sw: 3.5 }),
      { 'data-bone': `shin.${side}` }));
    // boxy shoe with a thick sole, toe to the right
    const shoe = smooth([add(A, -24, -8), add(A, 8, -12), add(A, 30, -2), add(A, 50, 6), add(A, 60, 18), add(A, 58, 30), add(A, -30, 30), add(A, -32, 8)], true, 0.6);
    parts.push(part(`foot.${side}`,
      solid(d, `shoe-${side}`, shoe, c(PAL.shoe), [
        fillOnly(ellipse(A[0] + 34, A[1] + 8, 16, 7), c(PAL.shoeHi), 0.9),
        fillOnly(circle(A[0] + 40, A[1] + 6, 2.6), '#ffffff', dark ? 0.2 : 0.6),
        line(`M${A[0] + 10} ${A[1] - 4}l10 12M${A[0] + 2} ${A[1] - 2}l10 12`, c(PAL.sole), 2.2),
      ]) +
      path(rr(A[0] - 36, A[1] + 26, 98, 12, 4), c(PAL.sole), { sw: 3 }) +
      path(rr(A[0] - 15, A[1] - 16, 30, 14, 5), c(PAL.joint), { sw: 3 }),
      { 'data-bone': `foot.${side}` }));
  };
  leg('far');
  leg('near');

  /* ---------------------------------------------------------------- arms: short jointed rods, white gloves */
  const G = 0.86; // gloves a little smaller than A's
  const arm = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const S = side === 'near' ? JB.shN : JB.shF;
    const E = side === 'near' ? JB.elN : JB.elF;
    const Wr = side === 'near' ? JB.wrN : JB.wrF;
    const c = (x: string) => (dark ? far(x) : x);
    parts.push(part(`upperarm.${side}`,
      solid(d, `uarm-${side}`, capsule(S[0], S[1], 8.5, E[0], E[1], 8), c(PAL.rod), [fillOnly(capsule(S[0] + 3, S[1], 2.6, E[0] + 3, E[1], 2.4), c(PAL.rodHi))], { sw: 3.5 }) +
      // the bolt-on shoulder mount
      path(circle(S[0], S[1], 15), c(PAL.joint), { sw: 3.5 }) + path(circle(S[0], S[1], 7), c(PAL.rod), { sw: 2.5 }) +
      fillOnly(circle(S[0] - 2, S[1] - 2, 2.4), c(PAL.rodHi)),
      { 'data-bone': `upperarm.${side}` }));
    parts.push(part(`forearm.${side}`,
      solid(d, `farm-${side}`, capsule(E[0], E[1], 8, Wr[0], Wr[1], 7.5), c(PAL.rod), [fillOnly(capsule(E[0] + 3, E[1], 2.4, Wr[0] + 3, Wr[1], 2.2), c(PAL.rodHi))], { sw: 3.5 }) +
      path(circle(E[0], E[1], 11), c(PAL.joint), { sw: 3.5 }) + fillOnly(circle(E[0] - 2, E[1] - 3, 3.5), c(PAL.rodHi)),
      { 'data-bone': `forearm.${side}` }));
    // A-style cartoon gloves: plump, three fingers and a thumb, rolled cuff
    const hx = Wr[0], hy = Wr[1];
    const q = (v: number) => v * G;
    const cuff = path(rr(hx - q(17), hy - q(10), q(34), q(16), 7), c(PAL.glove), { sw: 3.5 }) + fillOnly(rr(hx - q(12), hy - q(6), q(24), 4, 2), c(PAL.gloveShade));
    const palm = solid(d, `gpalm-${side}`, smooth([[hx - q(15), hy + q(4)], [hx + q(15), hy + q(4)], [hx + q(19), hy + q(26)], [hx + q(13), hy + q(42)], [hx - q(13), hy + q(42)], [hx - q(19), hy + q(24)]]), c(PAL.gloveShade), [fillOnly(ellipse(hx + q(3), hy + q(20), q(14), q(18)), c(PAL.glove))], { sw: 3.5 });
    const f = (a: number, b: number, e: number, g: number, r = 8) => path(capsule(hx + q(a), hy + q(b), q(r), hx + q(e), hy + q(g), q(r) * 0.92), c(PAL.glove), { sw: 3.5 });
    const thumb = f(15, 14, 26, 34, 7.5);
    parts.push(part(`hand.${side}`,
      thumb + palm + f(-9, 36, -11, 64) + f(2, 38, 2, 68, 8.4) + f(12, 36, 14, 62) + cuff,
      { 'data-bone': `hand.${side}` }));
    parts.push(part(`hand.${side}#point`,
      palm + path(rr(hx - q(16), hy + q(30), q(34), q(22), 9), c(PAL.glove), { sw: 3.5 }) + f(6, 36, 9, 86, 8) + thumb + cuff,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
    parts.push(part(`hand.${side}#fist`,
      solid(d, `gfist-${side}`, rr(hx - q(18), hy, q(38), q(46), 14), c(PAL.gloveShade), [fillOnly(ellipse(hx + q(2), hy + q(18), q(14), q(16)), c(PAL.glove))], { sw: 3.5 }) +
      line(`M${hx - q(12)} ${hy + q(30)}h${q(24)}M${hx - q(12)} ${hy + q(38)}h${q(22)}`, c(PAL.gloveShade), 2.5) + thumb + cuff,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
    parts.push(part(`hand.${side}#open`,
      f(15, 10, 36, 26, 7.5) + palm +
      f(-9, 36, -22, 62) + f(1, 38, -1, 72, 8.4) + f(11, 36, 22, 64) + cuff,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
  };
  arm('far');
  arm('near');

  /* ---------------------------------------------------------------- props */
  {
    // brass magnifying glass in the near hand; the lens hangs along the hand axis at rest
    const [wx, wy] = JB.wrN;
    const [lx, ly] = LENS_B;
    parts.push(part('magnifier',
      path(capsule(wx + 2, wy + 26, 6.5, wx + 3, wy + 76, 5.5), '#5b3a22', { sw: 3 }) +
      path(rr(wx - 6, wy + 70, 18, 13, 4), PAL.brass, { sw: 3 }) +
      path(circle(lx, ly, 34), PAL.brass, { sw: 4 }) +
      fillOnly(circle(lx, ly, 26), '#9ed3e8', 0.35) +
      fillOnly(ellipse(lx - 9, ly - 11, 11, 5.5), '#ffffff', 0.7) +
      `<path d="${circle(lx, ly, 26)}" fill="none" stroke="${PAL.brassShade}" stroke-width="3"/>`,
      { 'data-bone': 'hand.near', 'data-alt': 1 }));
  }

  return sheet('ich-b', d, parts, [-190, -720, 400, 732]);
}
