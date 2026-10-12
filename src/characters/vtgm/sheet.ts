import { Defs, capsule, circle, ellipse, fillOnly, line, mix, part, path, rr, sheet, smooth, solid, EDGE } from '../../art/svg';
import { J, PAL, SPHERE, TANK } from './geo';

/**
 * V-TGM rig sheet (procedural placeholder art).
 * Model reference: Team-Aperture/anlage-ii assets/portraits/vtgm_neutral.png — one weathered
 * bone-white sphere for head and body, a huge red eye in a black bezel (live), red slit lamp on
 * top (live), dark side hubs with red rings, long ribbed black arms with big hands, short legs
 * with red bellows, red-ringed knees, heavy boots, red tank with a hose over the top.
 */
type P = [number, number];
const add = (p: readonly number[], dx: number, dy = 0): P => [p[0] + dx, p[1] + dy];

export function vtgmSheet(): string {
  const d = new Defs('vtgm');
  const parts: string[] = [];
  const far = (c: string) => mix(c, EDGE, 0.3);
  const { x: cx, y: cy, r: R } = SPHERE;

  /* ---------------------------------------------------------------- body sphere */
  {
    const sphere = circle(cx, cy, R);
    parts.push(part('body', solid(d, 'sphere', sphere, PAL.shade2, [
      fillOnly(circle(cx + 8, cy - 8, R * 0.97), PAL.shade),
      fillOnly(circle(cx + 18, cy - 18, R * 0.84), PAL.shell),
      fillOnly(ellipse(cx + 44, cy - 62, 30, 16), '#ffffff', 0.55),
      // weathering: scratches and a scuff
      line(`M${cx - 70} ${cy + 20}l18 -6M${cx - 60} ${cy + 34}l26 -4M${cx + 20} ${cy + 70}l14 8M${cx - 30} ${cy - 76}l-10 12`, PAL.shade2, 1.6, 0.8),
      fillOnly(ellipse(cx - 52, cy + 52, 18, 9), PAL.shade2, 0.35),
      // underside shadow where the hips are
      fillOnly(ellipse(cx, cy + R * 0.98, R * 0.7, 26), PAL.shade2, 0.7),
    ]) +
      // hose socket on top
      path(rr(cx - 56, cy - R - 2, 26, 18, 6), PAL.limb, { sw: 3.5 }) +
      path(ellipse(cx - 43, cy - R - 2, 12, 5), PAL.limbHi, { sw: 2 }),
    { 'data-bone': 'body' }));
  }

  /* ---------------------------------------------------------------- hubs */
  const hub = (name: string, x: number, y: number, r: number, dark: boolean) => {
    const c = (v: string) => (dark ? far(v) : v);
    return part(name,
      path(circle(x, y, r), c(PAL.limb), { sw: 4 }) +
      path(circle(x, y, r * 0.66), c(PAL.limbHi), { sw: 3 }) +
      path(circle(x, y, r * 0.3), c(PAL.limb), { sw: 2.5 }) +
      fillOnly(circle(x - r * 0.3, y - r * 0.35, r * 0.15), c(PAL.limbHi2)),
      { 'data-bone': 'body' });
  };
  parts.push(hub('hub.far', J.shF[0] + 2, J.shF[1], 33, false));
  parts.push(hub('hub.near', J.shN[0] - 4, J.shN[1] + 2, 24, true));

  /* ---------------------------------------------------------------- pelvis + bellows */
  parts.push(part('pelvis',
    path(ellipse(-2, -164, 56, 18), PAL.limb) + fillOnly(ellipse(6, -170, 34, 6), PAL.limbHi, 0.9),
    { 'data-bone': 'pelvis' }));

  /* ---------------------------------------------------------------- legs */
  const leg = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const H = side === 'near' ? J.hipN : J.hipF;
    const K = side === 'near' ? J.kneeN : J.kneeF;
    const A = side === 'near' ? J.ankleN : J.ankleF;
    const c = (x: string) => (dark ? far(x) : x);
    const bellows = [0, 1, 2].map((i) => {
      const y = H[1] - 4 + i * 13;
      return path(rr(H[0] - 21 + i, y - 6, 42 - i * 2, 12, 6), c(i % 2 ? PAL.accentHi : PAL.accent), { sw: 3 });
    }).join('');
    parts.push(part(`thigh.${side}`,
      solid(d, `thigh-${side}`, capsule(H[0], H[1] + 20, 20, K[0], K[1], 18), c(PAL.limb), [fillOnly(capsule(H[0] + 7, H[1] + 20, 7, K[0] + 6, K[1], 6), c(PAL.limbHi))]) +
      bellows,
      { 'data-bone': `thigh.${side}` }));
    parts.push(part(`knee.${side}`,
      path(circle(K[0], K[1], 20), c(PAL.limb)) +
      path(circle(K[0], K[1], 12), c(PAL.accent), { sw: 3 }) +
      path(circle(K[0], K[1], 6), c(PAL.limb), { sw: 2 }),
      { 'data-bone': `shin.${side}` }));
    parts.push(part(`shin.${side}`,
      solid(d, `shin-${side}`, capsule(K[0], K[1], 19, A[0], A[1], 17), c(PAL.limb), [
        fillOnly(capsule(K[0] + 7, K[1], 7, A[0] + 6, A[1], 6), c(PAL.limbHi)),
        fillOnly(rr(K[0] - 20, K[1] + 26, 40, 5, 2.5), c(PAL.limbHi2), 0.9),
      ]),
      { 'data-bone': `shin.${side}` }));
    const boot = smooth([add(A, -34, -10), add(A, 8, -14), add(A, 36, 0), add(A, 58, 18), add(A, 62, 30), add(A, 58, 34), add(A, -40, 34), add(A, -44, 22), add(A, -42, 2)]);
    parts.push(part(`foot.${side}`,
      solid(d, `boot-${side}`, boot, c(PAL.limb), [
        fillOnly(rr(A[0] - 48, A[1] + 24, 116, 12, 3), c('#141218')),
        fillOnly(smooth([add(A, 10, -6), add(A, 34, 4), add(A, 48, 18), add(A, 26, 10)]), c(PAL.limbHi2), 0.9),
        fillOnly(circle(A[0] - 18, A[1] + 8, 6), c(PAL.accent), 0.9),
      ]),
      { 'data-bone': `foot.${side}` }));
  };
  leg('far');
  leg('near');

  /* ---------------------------------------------------------------- arms */
  const arm = (side: 'near' | 'far') => {
    const dark = side === 'far';
    const S = side === 'near' ? J.shN : J.shF;
    const E = side === 'near' ? J.elN : J.elF;
    const W = side === 'near' ? J.wrN : J.wrF;
    const c = (x: string) => (dark ? far(x) : x);
    const ribs = (a: readonly number[], b: readonly number[], n: number, r: number) => {
      let s = '';
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        s += line(`M${x - r} ${y}h${2 * r}`, c(PAL.limbHi2), 3);
      }
      return s;
    };
    parts.push(part(`upperarm.${side}`,
      solid(d, `uarm-${side}`, capsule(S[0], S[1], 17, E[0], E[1], 15), c(PAL.limb), [fillOnly(capsule(S[0] + 6, S[1], 5, E[0] + 5, E[1], 4), c(PAL.limbHi))]) +
      ribs(S, E, 4, 15) + path(rr(S[0] - 17, S[1] + 14, 34, 9, 4.5), c(PAL.accent), { sw: 2.5 }),
      { 'data-bone': `upperarm.${side}` }));
    parts.push(part(`forearm.${side}`,
      solid(d, `farm-${side}`, capsule(E[0], E[1], 16, W[0], W[1], 14), c(PAL.limb), [fillOnly(capsule(E[0] + 6, E[1], 5, W[0] + 5, W[1], 4), c(PAL.limbHi))]) +
      ribs(E, W, 4, 14) + path(circle(E[0], E[1], 17), c(PAL.limb), { sw: 3.5 }) + path(circle(E[0], E[1], 9), c(PAL.accent), { sw: 2.5 }),
      { 'data-bone': `forearm.${side}` }));
    const hx = W[0], hy = W[1];
    const finger = (x0: number, y0: number, x1: number, y1: number, r = 9) => path(capsule(x0, y0, r, x1, y1, r - 1), c(PAL.limb), { sw: 3.5 }) +
      fillOnly(capsule(x0 + 2.5, y0, 2.6, x1 + 2.5, y1, 2.2), c(PAL.limbHi2), 0.85);
    const palm = solid(d, `palm-${side}`, rr(hx - 21, hy - 4, 42, 44, 15), c(PAL.limb), [fillOnly(ellipse(hx + 4, hy + 14, 11, 14), c(PAL.limbHi))], { sw: 3.5 });
    const thumb = finger(hx + 18, hy + 10, hx + 30, hy + 34, 8.5);
    parts.push(part(`hand.${side}`,
      thumb + palm + finger(hx - 12, hy + 36, hx - 14, hy + 64) + finger(hx + 1, hy + 38, hx + 1, hy + 70, 9.5) + finger(hx + 13, hy + 36, hx + 16, hy + 62),
      { 'data-bone': `hand.${side}` }));
    parts.push(part(`hand.${side}#open`,
      finger(hx + 18, hy + 6, hx + 40, hy + 24, 8.5) + palm +
      finger(hx - 12, hy + 34, hx - 26, hy + 66) + finger(hx + 1, hy + 38, hx - 1, hy + 76, 9.5) + finger(hx + 14, hy + 34, hx + 26, hy + 68),
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
    parts.push(part(`hand.${side}#point`,
      palm + path(rr(hx - 20, hy + 30, 42, 26, 11), c(PAL.limb), { sw: 3.5 }) + finger(hx + 8, hy + 36, hx + 12, hy + 84, 8.5) + thumb,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
    parts.push(part(`hand.${side}#fist`,
      solid(d, `fist-${side}`, rr(hx - 23, hy - 4, 48, 56, 18), c(PAL.limb), [fillOnly(rr(hx - 15, hy + 30, 34, 7, 3.5), c(PAL.limbHi2))], { sw: 3.5 }) + thumb,
      { 'data-bone': `hand.${side}`, 'data-alt': 1 }));
  };
  arm('far');
  arm('near');

  /* ---------------------------------------------------------------- tank */
  {
    const T = TANK;
    parts.push(part('tank.back',
      path(rr(T.x + T.w - 4, -330, 34, 16, 6), PAL.limb, { sw: 3.5 }) +
      path(rr(T.x + T.w - 4, -262, 34, 16, 6), PAL.limb, { sw: 3.5 }) +
      path(rr(T.x - 3, T.y, T.w + 6, T.h, 13), PAL.glass, { sw: 4 }),
      { 'data-bone': 'tank' }));
    parts.push(part('tank.front',
      fillOnly(rr(T.x + 7, T.y + 10, 9, T.h - 20, 4.5), '#ffffff', 0.34) +
      fillOnly(rr(T.x + T.w - 12, T.y + 14, 4, T.h - 30, 2), '#ffffff', 0.2) +
      `<path d="${rr(T.x - 3, T.y, T.w + 6, T.h, 13)}" fill="none" stroke="${EDGE}" stroke-width="4"/>` +
      solid(d, 'cap-top', rr(T.x - 9, T.y - 20, T.w + 18, 28, 10), PAL.limb, [fillOnly(rr(T.x - 3, T.y - 15, T.w + 6, 6, 3), PAL.limbHi2)]) +
      solid(d, 'cap-bot', rr(T.x - 9, T.y + T.h - 8, T.w + 18, 28, 10), PAL.limb, [fillOnly(rr(T.x - 3, T.y + T.h - 3, T.w + 6, 6, 3), PAL.limbHi2)]) +
      path(circle(T.x + T.w / 2, T.y - 24, 8), PAL.limbHi, { sw: 3.5 }),
      { 'data-bone': 'tank' }));
  }

  return sheet('vtgm', d, parts, [-210, -420, 380, 430]);
}
