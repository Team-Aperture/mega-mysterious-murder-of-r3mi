import { Defs, capsule, circle, ellipse, fillOnly, line, part, path, poly, rr, sheet, smooth, solid, EDGE } from '../art/svg';

/**
 * Cabin prop sheet (procedural placeholder art, same pipeline as the characters).
 * Drawn in neutral "cabin lights on" colours; the night look comes from layer tints and
 * additive light sprites at runtime, so the same art serves the lights-on moment at the end.
 *
 * Origins: seats and sleepers at the floor point under the rear edge of the backrest (seats face
 * left); window and screen at their centre; bins and PSU at their top-left; doors at their bottom-left.
 */
export const P = {
  wall: '#d9d6cf',
  frame: '#eeece7',
  reveal: '#c4c0b8',
  shade: '#e8e4dc',
  bin: '#e5e2db',
  binShade: '#c9c5bd',
  fabric: '#2f4a8a',
  fabricHi: '#4462a8',
  fabricDark: '#22376a',
  cover: '#ece6d6',
  plastic: '#4a4f5e',
  plasticHi: '#636a7c',
  metal: '#9aa0aa',
  metalHi: '#c9ced6',
  steel: '#b9bec6',
  steelHi: '#dde1e6',
  blanket: '#6b5a8e',
  blanketHi: '#8572ad',
  blanket2: '#3f6b74',
  blanket2Hi: '#548a95',
  blanket3: '#8e5a5a',
  blanket3Hi: '#ad7272',
  skin: '#b8b2c4',
  curtain: '#3c4e86',
  curtainHi: '#5268a8',
  door: '#d7d3cb',
};

export function propSheet(): string {
  const d = new Defs('cabin');
  const parts: string[] = [];

  /* ---------------------------------------------------------------- seat (profile, facing left) */
  {
    const back = smooth([[-46, -150], [16, -150], [40, -300], [54, -440], [44, -470], [8, -476], [-14, -462], [-22, -420], [-34, -300]]);
    const cushion = rr(-196, -178, 196, 50, 20);
    parts.push(part('seat.base',
      // frame and legs
      path(rr(-176, -122, 168, 14, 6), P.metal, { sw: 3.5 }) +
      path(rr(-160, -112, 12, 112, 4), P.metal, { sw: 3 }) + path(rr(-44, -112, 12, 112, 4), P.metal, { sw: 3 }) +
      path(rr(-170, -10, 24, 10, 3), P.plastic, { sw: 2.5 }) + path(rr(-50, -10, 24, 10, 3), P.plastic, { sw: 2.5 }) +
      // life-vest pouch under the cushion
      path(rr(-150, -108, 100, 26, 8), P.fabricDark, { sw: 3 }) +
      solid(d, 'cushion', cushion, P.fabricDark, [fillOnly(rr(-190, -176, 186, 24, 12), P.fabric), fillOnly(rr(-180, -172, 120, 6, 3), P.fabricHi, 0.8)]),
      {}));
    // backrest (reclines around its bottom pivot), with seat pocket and folded tray on the rear face
    parts.push(part('seat.rest',
      solid(d, 'backrest', back, P.fabricDark, [
        fillOnly(smooth([[-40, -160], [6, -160], [30, -300], [40, -436], [8, -456], [-16, -440], [-28, -300]]), P.fabric),
        fillOnly(smooth([[-30, -300], [-20, -420], [-10, -430], [-18, -300]]), P.fabricHi, 0.6),
      ]) +
      solid(d, 'cover', smooth([[-20, -470], [12, -478], [30, -470], [22, -396], [-8, -392], [-22, -420]]), P.cover, [fillOnly(rr(-16, -470, 30, 6, 3), '#ffffff', 0.7)], { sw: 3 }) +
      path(smooth([[18, -420], [42, -416], [46, -300], [30, -300]]), P.plastic, { sw: 3 }) +
      path(rr(34, -428, 12, 10, 3), P.plasticHi, { sw: 2.5 }) +
      path(smooth([[22, -290], [40, -292], [44, -186], [24, -184]]), P.fabricDark, { sw: 3 }) +
      path(rr(26, -312, 14, 34, 2), '#f2efe6', { sw: 2.5 }),
      {}));
    parts.push(part('seat.front',
      // aisle-side armrest and the side frame under it
      path(smooth([[-174, -238], [-30, -244], [-12, -236], [-14, -218], [-176, -214], [-186, -224]]), P.plastic, { sw: 3.5 }) +
      fillOnly(rr(-168, -238, 140, 5, 2.5), P.plasticHi, 0.9) +
      path(rr(-176, -218, 18, 92, 6), P.plastic, { sw: 3 }) +
      path(rr(-182, -132, 176, 16, 6), P.plasticHi, { sw: 3 }) +
      path(circle(-30, -228, 5), '#2a2d36', { sw: 2 }),
      {}));
    // lowered tray table (to the right of the backrest, for the passenger behind)
    parts.push(part('seat.tray',
      path(rr(30, -300, 150, 14, 4), P.plastic, { sw: 3.5 }) + fillOnly(rr(36, -298, 136, 4, 2), P.plasticHi) +
      path(rr(30, -306, 16, 22, 4), P.plasticHi, { sw: 3 }),
      {}));
  }

  /* ---------------------------------------------------------------- sleeping passengers (anonymous) */
  const sleeper = (id: string, col: string, hi: string, extra: string) => {
    const mound = smooth([[-196, -176], [-170, -230], [-120, -262], [-60, -300], [-20, -330], [6, -320], [10, -250], [0, -176]]);
    return part(id,
      // pillow against the headrest
      path(ellipse(-6, -392, 26, 34), '#e9e4d8', { sw: 3 }) +
      // head (a smooth anonymous robot head, turned away)
      path(ellipse(-22, -368, 40, 44), P.skin, { sw: 3.5 }) + fillOnly(ellipse(-32, -380, 18, 12), '#ffffff', 0.35) +
      extra +
      // blanket
      solid(d, `blanket-${id}`, mound, col, [fillOnly(smooth([[-150, -240], [-70, -290], [-30, -318], [-60, -270], [-140, -222]]), hi, 0.8), line('M-150 -210C-100 -240 -60 -270 -40 -290', '#00000033', 3)]),
      {});
  };
  parts.push(sleeper('sleeper.a', P.blanket, P.blanketHi, path(capsule(-20, -410, 3, -12, -446, 2.5), P.plastic, { sw: 2 }) + path(circle(-12, -450, 6), '#e0463c', { sw: 2 })));
  parts.push(sleeper('sleeper.b', P.blanket2, P.blanket2Hi, path(rr(-64, -386, 52, 16, 7), '#2a2d36', { sw: 2.5 })));
  parts.push(sleeper('sleeper.c', P.blanket3, P.blanket3Hi, path(smooth([[-58, -392], [-30, -412], [10, -396], [8, -376], [-56, -374]]), '#5a7a3a', { sw: 3 })));
  // a reader (insomniac with a tablet glow), the only one awake
  parts.push(part('reader',
    path(ellipse(-6, -392, 26, 34), '#e9e4d8', { sw: 3 }) +
    path(ellipse(-40, -370, 38, 42), P.skin, { sw: 3.5 }) +
    solid(d, 'reader-blanket', smooth([[-196, -176], [-160, -220], [-90, -246], [-40, -290], [0, -300], [6, -176]]), P.blanket2, [fillOnly(ellipse(-100, -230, 50, 14), P.blanket2Hi, 0.8)]) +
    path(rr(-122, -318, 50, 34, 5), '#1c1e26', { sw: 3 }) + fillOnly(rr(-118, -314, 42, 26, 3), '#bfe4ff', 0.95) +
    path(capsule(-60, -300, 9, -110, -296, 8), P.skin, { sw: 3 }),
    {}));

  /* ---------------------------------------------------------------- window (glass is a hole) */
  {
    const outer = rr(-66, -96, 132, 192, 46);
    const inner = rr(-48, -78, 96, 156, 34);
    parts.push(part('window',
      `<path d="${outer}${inner}" fill-rule="evenodd" fill="${P.frame}" stroke="${EDGE}" stroke-width="3.5"/>` +
      `<path d="${rr(-56, -86, 112, 172, 40)}${inner}" fill-rule="evenodd" fill="${P.reveal}"/>` +
      `<path d="${inner}" fill="none" stroke="${EDGE}" stroke-width="3"/>` +
      fillOnly(rr(-60, -90, 10, 120, 5), '#ffffff', 0.5),
      {}));
    for (const k of [0.45, 0.8]) {
      const h = 156 * k;
      parts.push(part(`window.shade${Math.round(k * 100)}`,
        `<g clip-path="url(#${d.clip('win-inner', inner)})">` +
        path(rr(-48, -78, 96, h, 0), P.shade, { sw: 0, stroke: 'none' }) +
        line(`M-48 ${-78 + h - 2}H48`, EDGE, 3) +
        [0.25, 0.5, 0.75].map((t) => line(`M-48 ${-78 + h * t}H48`, '#c9c4ba', 1.5)).join('') +
        path(rr(-12, -78 + h - 6, 24, 10, 4), P.reveal, { sw: 2.5 }) + '</g>',
        {}));
    }
  }

  /* ---------------------------------------------------------------- overhead bin + door + interior */
  {
    const W = 300, H = 180;
    parts.push(part('bin',
      solid(d, 'bin', rr(0, 0, W, H, [0, 0, 26, 26]), P.binShade, [fillOnly(rr(0, 0, W, H - 30, 0), P.bin), fillOnly(rr(6, 8, W - 12, 8, 4), '#ffffff', 0.5)]) +
      line(`M10 ${H - 34}H${W - 10}`, '#a8a39a', 2.5) +
      path(rr(W / 2 - 34, H - 58, 68, 18, 9), '#a8a39a', { sw: 3 }) + fillOnly(rr(W / 2 - 28, H - 54, 56, 6, 3), '#d6d2ca') +
      line(`M${W - 2} 6V${H - 6}`, '#a8a39a', 2.5),
      {}));
    parts.push(part('bin.door',
      solid(d, 'bindoor', rr(0, 0, W, H - 16, [0, 0, 24, 24]), P.binShade, [fillOnly(rr(0, 0, W, H - 44, 0), P.bin), fillOnly(rr(6, 8, W - 12, 8, 4), '#ffffff', 0.5)]) +
      path(rr(W / 2 - 34, H - 72, 68, 18, 9), '#a8a39a', { sw: 3 }),
      {}));
    parts.push(part('bin.interior',
      path(rr(0, 0, W, H, [0, 0, 26, 26]), '#2a2b33') +
      fillOnly(rr(8, 10, W - 16, H - 20, 18), '#1d1e24') +
      // luggage stuffed in, ready to fall
      path(rr(18, 40, 120, 120, 14), '#7a3b3b', { sw: 3.5 }) + path(rr(150, 70, 128, 90, 30), '#3b5a7a', { sw: 3.5 }) +
      path(rr(110, 20, 90, 54, 20), '#5a7a3a', { sw: 3.5 }),
      {}));
  }

  /* ---------------------------------------------------------------- passenger service unit */
  {
    const W = 300;
    parts.push(part('psu',
      path(rr(0, 0, W, 34, 8), '#cfcbc3', { sw: 3 }) +
      [70, 120].map((x) => path(ellipse(x, 18, 15, 9), '#f3f0e8', { sw: 2.5 }) + fillOnly(ellipse(x - 4, 15, 6, 3), '#ffffff')).join('') +
      [170, 200].map((x) => path(circle(x, 17, 9), '#b8b3aa', { sw: 2.5 }) + fillOnly(circle(x, 17, 3), '#4a4f5e')).join('') +
      // sign panel (the lit icons are live)
      path(rr(226, 7, 58, 22, 5), '#2a2b33', { sw: 2.5 }) +
      path(circle(30, 17, 7), '#e0e0e0', { sw: 2.5 }),
      {}));
  }

  /* ---------------------------------------------------------------- foreground: opposite seat tops */
  parts.push(part('fg.seat',
    path(smooth([[-120, 120], [-110, -10], [-90, -60], [-40, -78], [40, -80], [96, -60], [116, -10], [124, 120]]), '#141628', { sw: 0, stroke: 'none' }) +
    fillOnly(smooth([[-80, -54], [0, -70], [70, -60], [40, -50], [-40, -46]]), '#24284a', 0.9),
    {}));

  /* ---------------------------------------------------------------- galley */
  parts.push(part('galley',
    solid(d, 'galley', rr(0, -640, 380, 640, 8), P.steel, [
      ...[0, 1, 2].map((i) => fillOnly(rr(10, -620 + i * 120, 170, 106, 6), P.steelHi)),
      ...[0, 1, 2].map((i) => fillOnly(rr(200, -620 + i * 120, 170, 106, 6), P.steelHi)),
      fillOnly(rr(0, -270, 380, 18, 0), '#8e949e'),
      ...[0, 1, 2, 3].map((i) => fillOnly(rr(10 + i * 92, -240, 84, 220, 6), '#c3c8cf')),
    ]) +
    [0, 1, 2].map((i) => path(rr(80, -560 + i * 120, 30, 10, 4), '#7d838d', { sw: 2.5 }) + path(rr(270, -560 + i * 120, 30, 10, 4), '#7d838d', { sw: 2.5 })).join('') +
    [0, 1, 2, 3].map((i) => path(rr(36 + i * 92, -140, 32, 12, 5), '#7d838d', { sw: 2.5 })).join(''),
    {}));
  parts.push(part('coffeemaker',
    path(rr(0, -110, 90, 110, 10), '#3a3e48') + path(rr(10, -96, 70, 40, 6), '#1c1e26', { sw: 3 }) +
    path(rr(26, -48, 38, 34, 6), '#5b4a3a', { sw: 3 }) + fillOnly(rr(30, -40, 30, 10, 3), '#7a5232'),
    {}));
  parts.push(part('trolley',
    solid(d, 'trolley', rr(-60, -330, 120, 300, 10), P.steel, [
      fillOnly(rr(-54, -320, 108, 90, 6), P.steelHi), fillOnly(rr(-54, -220, 108, 90, 6), P.steelHi), fillOnly(rr(-54, -120, 108, 80, 6), P.steelHi),
    ]) +
    path(rr(-70, -350, 140, 20, 8), '#7d838d', { sw: 3 }) +
    path(circle(-38, -16, 16), '#2a2d36', { sw: 3 }) + path(circle(38, -16, 16), '#2a2d36', { sw: 3 }) +
    path(rr(-16, -300, 32, 10, 4), '#d8443c', { sw: 2.5 }),
    {}));
  const curtain = (id: string, w: number, h: number, folds: number) => {
    let s = path(rr(0, -h, w, h, 6), P.curtain, { sw: 3.5 });
    for (let i = 1; i < folds; i++) {
      const x = (w * i) / folds;
      s += line(`M${x} ${-h + 8}C${x - 6} ${-h * 0.6} ${x + 6} ${-h * 0.3} ${x} -6`, '#2a3762', 4);
      s += line(`M${x + 8} ${-h + 10}C${x + 2} ${-h * 0.6} ${x + 12} ${-h * 0.3} ${x + 8} -8`, P.curtainHi, 2.5, 0.7);
    }
    s += path(rr(-4, -h - 14, w + 8, 16, 6), P.metal, { sw: 3 });
    return part(id, s, {});
  };
  parts.push(curtain('curtain', 150, 760, 5));
  parts.push(curtain('curtain.narrow', 90, 760, 3));

  /* ---------------------------------------------------------------- doors */
  parts.push(part('exitdoor',
    solid(d, 'exitdoor', rr(0, -760, 230, 760, 30), P.door, [fillOnly(rr(10, -740, 210, 720, 24), '#e2dfd8')]) +
    `<path d="${rr(74, -600, 84, 120, 34)}" fill="#141626" stroke="${EDGE}" stroke-width="3.5"/>` +
    path(rr(66, -608, 100, 136, 40), 'none', { sw: 6, stroke: '#c4c0b8' }) +
    path(smooth([[60, -380], [190, -400], [196, -380], [64, -360]]), '#d8443c', { sw: 3 }) +
    path(rr(160, -410, 24, 50, 8), '#9aa0aa', { sw: 3 }) +
    path(rr(30, -240, 170, 60, 10), '#c9c5bd', { sw: 3 }),
    {}));
  parts.push(part('lavdoor',
    solid(d, 'lavdoor', rr(0, -740, 200, 740, 18), P.door, [fillOnly(rr(8, -730, 92, 720, 12), '#e4e1da'), fillOnly(rr(104, -730, 88, 720, 12), '#dedad3')]) +
    line('M100 -730V-10', '#b9b5ad', 3) +
    path(rr(150, -410, 30, 14, 5), '#9aa0aa', { sw: 3 }) +
    path(rr(56, -560, 90, 30, 6), '#2a2b33', { sw: 3 }),
    {}));
  parts.push(part('lav.inside',
    path(rr(0, -740, 200, 740, 18), '#eef6ff') +
    fillOnly(rr(20, -700, 160, 20, 10), '#ffffff') +
    path(rr(30, -360, 140, 30, 10), '#d8dde4', { sw: 3 }) + path(ellipse(100, -300, 56, 40), '#e8edf2', { sw: 3 }) +
    path(rr(120, -620, 60, 120, 10), '#c9d6e4', { sw: 3 }),
    {}));

  /* ---------------------------------------------------------------- front bulkhead: route screen */
  parts.push(part('screen',
    path(rr(-130, -82, 260, 164, 14), '#2a2b33') + path(rr(-116, -68, 232, 136, 8), '#0c1424', { sw: 3 }),
    {}));

  /* ---------------------------------------------------------------- loose props (gags, investigation) */
  parts.push(part('cup',
    path(poly([[-18, -46], [18, -46], [14, 0], [-14, 0]]), '#f2efe6', { sw: 3 }) + path(ellipse(0, -46, 18, 5), '#3a2414', { sw: 2.5 }) +
    fillOnly(ellipse(-4, -47, 8, 2), '#6a4428') + path(rr(-16, -30, 32, 10, 3), '#c0322c', { sw: 2 }),
    {}));
  parts.push(part('suitcase',
    solid(d, 'suitcase', rr(-60, -50, 120, 100, 14), '#7a3b3b', [fillOnly(rr(-54, -44, 108, 30, 10), '#9a4d4d')]) +
    path(rr(-22, -64, 44, 16, 6), '#3a2a2a', { sw: 3 }) + line('M-60 0H60', '#5a2a2a', 3),
    {}));
  parts.push(part('duffel',
    solid(d, 'duffel', rr(-66, -38, 132, 76, 36), '#3b5a7a', [fillOnly(rr(-58, -32, 116, 22, 11), '#4f74a0')]) +
    line('M-40 -30C-20 -60 20 -60 40 -30', '#22344a', 5) + line('M-60 0H60', '#22344a', 2.5),
    {}));
  parts.push(part('backpack',
    solid(d, 'backpack', rr(-40, -48, 80, 96, 26), '#5a7a3a', [fillOnly(rr(-30, -10, 60, 44, 12), '#46612d')]) +
    path(rr(-20, -60, 40, 14, 6), '#3a5024', { sw: 3 }),
    {}));
  parts.push(part('pillow',
    path(smooth([[-46, -20], [0, -30], [46, -20], [50, 16], [0, 26], [-50, 16]]), '#e9e4d8', { sw: 3.5 }) + fillOnly(ellipse(-8, -6, 26, 8), '#ffffff', 0.6),
    {}));
  parts.push(part('duck',
    path(ellipse(0, 0, 24, 18), '#ffd23a', { sw: 3 }) + path(circle(14, -18, 12), '#ffd23a', { sw: 3 }) +
    path(poly([[24, -18], [36, -14], [24, -10]]), '#ff8a2a', { sw: 2.5 }) + fillOnly(circle(17, -21, 2.6), EDGE),
    {}));
  parts.push(part('travelbug',
    path(rr(-26, -16, 52, 32, 6), '#c9ced6', { sw: 3 }) + path(circle(-18, 0, 4), '#7d838d', { sw: 2 }) +
    path(circle(4, 0, 9), '#3a3e48', { sw: 2 }) + fillOnly(circle(4, 0, 4), '#9aa0aa') +
    line('M-18 -4C-30 -20 -40 -30 -50 -30', '#9aa0aa', 3),
    {}));
  parts.push(part('card',
    path(rr(-30, -44, 60, 88, 4), '#f2efe6', { sw: 3 }) + path(rr(-24, -38, 48, 18, 2), '#c0322c', { sw: 0, stroke: 'none' }) +
    [0, 1, 2].map((i) => fillOnly(rr(-22, -12 + i * 16, 44, 8, 2), '#9aa0aa')).join(''),
    {}));

  return sheet('cabin', d, parts, [-260, -1000, 1000, 1200]);
}
