import { Container, Graphics, type Application } from 'pixi.js';
import { Actor } from '../characters/actor';
import { CHARACTERS, atlasFor, sheetFor } from '../characters/registry';
import { atlasScale } from '../app/stage';

/**
 * Developer views used for art iteration and automated screenshots:
 *   ?dev=sheet&c=r3mi                       the raw SVG rig sheet (what an artist would edit)
 *   ?dev=pose&c=r3mi&clip=walk&t=0.4&expr=happy&face=-1   one deterministic frame, rendered by the game runtime
 * `clip=walk` walks the character across the frame; any other value plays that clip.
 */
export function showSheet(ui: HTMLElement, id: string): void {
  const spec = CHARACTERS[id];
  const { svg } = sheetFor(spec);
  ui.innerHTML = `<div style="position:fixed;inset:0;overflow:auto;background:#eae6dc;padding:20px">${svg}</div>`;
  const s = ui.querySelector('svg')!;
  s.style.height = '92vh';
  s.style.width = 'auto';
}

export async function showPose(app: Application, params: URLSearchParams): Promise<void> {
  const ids = (params.get('c') ?? 'r3mi').split(',');
  const clip = params.get('clip') ?? 'idle';
  const t = Number(params.get('t') ?? 0);
  const expr = params.get('expr') ?? 'neutral';
  const face = params.get('face') === '-1' ? -1 : 1;
  const scale = atlasScale();
  const world = new Container();
  app.stage.addChild(world);
  const floor = new Graphics();
  world.addChild(floor);
  const actors: Actor[] = [];
  for (let i = 0; i < ids.length; i++) {
    const spec = CHARACTERS[ids[i]];
    const atlas = await atlasFor(spec, scale);
    const a = new Actor(spec, atlas);
    world.addChild(a.root);
    actors.push(a);
  }
  const layout = () => {
    const W = app.screen.width, H = app.screen.height;
    const s = H / 1080;
    world.scale.set(s);
    world.position.set(W / 2, H * 0.92);
    floor.clear();
    floor.rect(-W / s, 0, (2 * W) / s, H / s).fill({ color: 0x15132a });
    floor.moveTo(-W / s, 0).lineTo(W / s, 0).stroke({ color: 0x3a3560, width: 3 });
    for (let x = -2000; x <= 2000; x += 100) floor.rect(x - 1, 0, 2, 14).fill({ color: 0x3a3560 });
  };
  layout();
  app.renderer.on('resize', layout);
  const spacing = 380;
  actors.forEach((a, i) => {
    const x0 = (i - (actors.length - 1) / 2) * spacing;
    a.simulateTo(t, () => {
      a.x = clip === 'walk' ? x0 - 400 * face : x0;
      a.face(face, true);
      a.setExpression(expr, true);
      if (clip === 'walk') void a.walkTo(x0 + 400 * face);
      else if (clip !== 'idle') void a.play(clip, { fade: 0 });
    });
  });
  const n = Number(params.get('n') ?? 0);
  if (n > 0) {
    // filmstrip: n copies of the first character at t, t+step, … laid out in a row
    const step = Number(params.get('step') ?? 0.1);
    const spec = CHARACTERS[ids[0]];
    const atlas = await atlasFor(spec, scale);
    actors.forEach((a) => a.root.removeFromParent());
    actors.length = 0;
    const W = app.screen.width / (app.screen.height / 1080);
    const cell = W / n;
    for (let i = 0; i < n; i++) {
      const a = new Actor(spec, atlas);
      world.addChild(a.root);
      a.simulateTo(t + i * step, () => {
        a.x = 0;
        a.face(face, true);
        a.setExpression(expr, true);
        if (clip === 'walk') void a.walkTo(4000 * face);
        else if (clip !== 'idle') void a.play(clip, { fade: 0 });
      });
      a.root.position.x = -W / 2 + cell * (i + 0.5);
      a.root.scale.set(Number(params.get('zoom') ?? 0.9));
      actors.push(a);
    }
  }
  (window as unknown as { __ready: boolean }).__ready = true;
  if (params.get('live') === '1') {
    app.ticker.add((tk) => { for (const a of actors) a.step(Math.min(tk.deltaMS / 1000, 1 / 20)); });
  }
}

/**
 *   ?dev=cabin&x=0&zoom=1&lights=0&clip=idle&t=1   the cabin with the three characters
 */
export async function showCabin(app: Application, params: URLSearchParams): Promise<void> {
  const { Cabin } = await import('../world/cabin');
  const { Camera } = await import('../world/camera');
  const { propSheet } = await import('../world/propSheet');
  const { buildAtlas } = await import('../anim/atlas');
  const { MARK } = await import('../world/layout');
  await loadFonts();
  const scale = atlasScale();
  const props = await buildAtlas('cabin', propSheet(), { scale: Math.min(scale, 1.6) });
  const cabin = new Cabin(props);
  const cam = new Camera();
  cabin.attach(cam);
  app.stage.addChild(cabin.root);
  cabin.lightsOn = Number(params.get('lights') ?? 0);
  cabin.lavOpen = Number(params.get('lav') ?? 0);
  const t = Number(params.get('t') ?? 1);
  const cast: [string, number][] = [['vtgm', MARK.meetVtgm], ['r3mi', MARK.meetR3mi], ['ich', MARK.meetIch]];
  const actors: Actor[] = [];
  for (const [id, x] of cast) {
    const a = new Actor(CHARACTERS[id], await atlasFor(CHARACTERS[id], scale));
    a.x = x;
    a.root.zIndex = 50;
    cabin.stage.addChild(a.root);
    actors.push(a);
  }
  actors[2].face(-1, true);
  const layout = () => { cam.resize(app.screen.width, app.screen.height); };
  layout();
  app.renderer.on('resize', layout);
  cam.x = cam.tx = Number(params.get('x') ?? 0);
  cam.zoom = cam.tz = Number(params.get('zoom') ?? 1);
  const step = (dt: number) => {
    cabin.update(dt);
    for (const a of actors) { a.light = cabin.actorLight(a.x); a.step(dt); }
    cam.update(dt);
  };
  for (let i = 0; i < Math.round(t * 60); i++) step(1 / 60);
  (window as unknown as { __ready: boolean }).__ready = true;
  if (params.get('live') === '1') app.ticker.add((tk) => step(Math.min(tk.deltaMS / 1000, 1 / 20)));
}

export async function loadFonts(): Promise<void> {
  const fonts = ['400 24px Bungee', '900 24px Nunito', '700 24px Nunito', '400 24px Nunito', '400 24px "Special Elite"', '400 24px "Luckiest Guy"'];
  await Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => undefined)));
}
