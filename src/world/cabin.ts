import { Container, FillGradient, Graphics, Sprite, Text } from 'pixi.js';
import type { Atlas } from '../anim/atlas';
import { clamp, lerp, Rng } from '../engine/math';
import { coneTexture, glowTexture } from '../characters/fx';
import type { Camera } from './camera';
import { CABIN, READING_LIGHTS, ROWS, ROW_PITCH, SEAT_FLOOR, rowX } from './layout';

/**
 * Flight 303 at night: layers, props, lights and background life.
 *
 * Fair-play note (team only, see docs/SPOILERS_TEAM_ONLY.md): everything here is consistent with
 * a plane standing on the ground. Rain runs straight down the windows, the lights outside sit on
 * the horizon and do not move (except one slow vehicle), the seatbelt signs never go off, and the
 * route screen never finishes loading.
 */
const NIGHT_ENV = 0x3d426c;
const NIGHT_FLOOR = 0x363a62;
const NIGHT_ACTOR: [number, number, number] = [0.6, 0.64, 0.92];
const WARM: [number, number, number] = [1.0, 0.84, 0.62];

export interface Light { x: number; y: number; radius: number; color: [number, number, number]; power: number; on: () => number }

export class Cabin {
  readonly root = new Container();
  readonly outside = new Container();
  readonly wall = new Container();
  readonly upper = new Container();
  readonly far = new Container();
  /** Seats, sleepers, actors and lights, sorted by zIndex. */
  readonly stage = new Container();
  readonly fg = new Container();
  /** 0 = night, 1 = cabin lights fully on. */
  lightsOn = 0;
  /** 0 = the whole cabin dimmed for the night (ending), 1 = normal night. */
  nightLevel = 1;
  readonly lights: Light[] = [];
  readonly sprites = new Map<string, Sprite>();
  readonly rng = new Rng(303);
  lavOpen = 0;
  lavOccupied = true;
  time = 0;

  private readonly rain: { g: Graphics; drops: { x: number; y: number; v: number; len: number }[] }[] = [];
  private readonly beacons: { g: Graphics; phase: number }[] = [];
  private vehicle!: Graphics;
  private screenG!: Graphics;
  private lavSign!: Text;
  private readonly sleepers: { s: Sprite; phase: number; base: number }[] = [];
  private readonly flicker: { s: Sprite; base: number }[] = [];
  private readonly coffeeLed = new Graphics();
  private readonly envLayers: Container[];

  constructor(readonly atlas: Atlas) {
    this.stage.sortableChildren = true;
    this.root.addChild(this.outside, this.wall, this.upper, this.far, this.stage, this.fg);
    this.envLayers = [this.wall, this.upper, this.far];
    this.buildOutside();
    this.buildWall();
    this.buildUpper();
    this.buildSeats();
    this.buildRear();
    this.buildFront();
    this.buildFloor();
    this.buildForeground();
  }

  /** Parallax registration. */
  attach(cam: Camera): void {
    cam.layers.push({ c: this.outside, factor: 0.14 }, { c: this.wall, factor: 1 }, { c: this.upper, factor: 1 },
      { c: this.far, factor: 1 }, { c: this.stage, factor: 1 }, { c: this.fg, factor: 1.3 });
    cam.bounds = { left: CABIN.left, right: CABIN.right };
  }

  private sprite(id: string, x: number, y: number, parent: Container, z = 0, key?: string): Sprite {
    const pt = this.atlas.parts.get(id);
    if (!pt) throw new Error(`cabin: missing prop ${id}`);
    const s = new Sprite(pt.texture);
    s.scale.set(1 / this.atlas.scale);
    s.position.set(x + pt.x, y + pt.y);
    s.zIndex = z;
    parent.addChild(s);
    if (key) this.sprites.set(key, s);
    return s;
  }

  /* ------------------------------------------------------------------ outside */
  private buildOutside(): void {
    const sky = new Graphics();
    const grad = new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
      colorStops: [{ offset: 0, color: '#05071a' }, { offset: 0.55, color: '#141a40' }, { offset: 0.72, color: '#2a2440' }, { offset: 0.78, color: '#3a2a35' }, { offset: 0.8, color: '#07070d' }, { offset: 1, color: '#040408' }] });
    sky.rect(-3000, -1000, 6000, 700).fill(grad);
    this.outside.addChild(sky);
    // stars (a few, still)
    const stars = new Graphics();
    for (let i = 0; i < 90; i++) stars.circle(this.rng.range(-2800, 2800), this.rng.range(-980, -640), this.rng.range(0.8, 2)).fill({ color: 0xdfe6ff, alpha: this.rng.range(0.3, 0.9) });
    // a thin moon
    stars.circle(260, -760, 24).fill({ color: 0xf4f0dc });
    stars.circle(272, -766, 22).fill({ color: 0x0c1030 });
    this.outside.addChild(stars);
    // horizon lights: sodium-orange and white points, sitting ON the horizon line (apron / taxiway)
    const lights = new Graphics();
    for (let i = 0; i < 160; i++) {
      const x = this.rng.range(-2900, 2900);
      const y = -541 + this.rng.range(-3, 14);
      const warm = this.rng.next() < 0.7;
      lights.circle(x, y, this.rng.range(1.2, 2.8)).fill({ color: warm ? 0xffb35c : 0xe8f0ff, alpha: this.rng.range(0.5, 1) });
    }
    // a row of blue taxiway edge lights, closer, a little lower
    for (let x = -2900; x < 2900; x += 70) lights.circle(x + this.rng.range(-8, 8), -514, 2.2).fill({ color: 0x6a9cff, alpha: 0.9 });
    this.outside.addChild(lights);
    const haze = new Sprite(glowTexture());
    haze.anchor.set(0.5);
    haze.tint = 0xff9a4a;
    haze.alpha = 0.18;
    haze.blendMode = 'add';
    haze.scale.set(5200 / 64, 240 / 64);
    haze.position.set(0, -540);
    this.outside.addChild(haze);
    // slow red obstruction beacons
    for (const [x, ph] of [[-900, 0], [420, 1.3], [1500, 2.1]] as const) {
      const g = new Graphics();
      g.position.set(x, -560);
      this.outside.addChild(g);
      this.beacons.push({ g, phase: ph });
    }
    // one vehicle (a tug) crawling along the apron, very slowly
    this.vehicle = new Graphics();
    this.outside.addChild(this.vehicle);
  }

  /* ------------------------------------------------------------------ wall with windows */
  private buildWall(): void {
    const wall = new Graphics();
    const top = CABIN.binBottom - 20, bot = SEAT_FLOOR;
    wall.rect(CABIN.left, top, CABIN.right - CABIN.left, bot - top).fill({ color: 0xd9d6cf });
    // window holes
    for (const n of ROWS) wall.roundRect(rowX(n) - 196, CABIN.windowY - 78, 96, 156, 34).cut();
    this.wall.addChild(wall);
    // panel seams and a dado line
    const seams = new Graphics();
    for (const n of ROWS) seams.moveTo(rowX(n) - 20, top + 10).lineTo(rowX(n) - 20, bot - 10);
    seams.stroke({ color: 0xb2ada4, width: 3 });
    seams.moveTo(CABIN.left, -430).lineTo(CABIN.right, -430).stroke({ color: 0xc4bfb6, width: 6 });
    seams.rect(CABIN.left, top, CABIN.right - CABIN.left, 30).fill({ color: 0xc9c5bd });
    this.wall.addChild(seams);
    for (const n of ROWS) {
      const wx = rowX(n) - 148, wy = CABIN.windowY;
      // rain on the glass: straight down (no airflow over the fuselage…)
      const g = new Graphics();
      g.position.set(wx, wy);
      this.wall.addChild(g);
      const drops = Array.from({ length: 7 }, () => ({ x: this.rng.range(-40, 40), y: this.rng.range(-74, 74), v: this.rng.range(6, 22), len: this.rng.range(6, 20) }));
      this.rain.push({ g, drops });
      this.sprite('window', wx, wy, this.wall);
      if (n === 12 || n === 17) this.sprite('window.shade80', wx, wy, this.wall);
      if (n === 10 || n === 15) this.sprite('window.shade45', wx, wy, this.wall);
      // cool moonlight falling through the window onto the seats
      const shaft = new Sprite(coneTexture());
      shaft.anchor.set(0.5, 0);
      shaft.tint = 0x8fb0ff;
      shaft.alpha = n === 12 || n === 17 ? 0.03 : 0.08;
      shaft.blendMode = 'add';
      shaft.position.set(wx, wy - 40);
      shaft.rotation = 0.35;
      shaft.scale.set(160 / 128, 520 / 256);
      this.far.addChild(shaft);
    }
  }

  /* ------------------------------------------------------------------ bins, PSUs, ceiling, signs */
  private buildUpper(): void {
    const ceil = new Graphics();
    ceil.rect(CABIN.left, -1100, CABIN.right - CABIN.left, 230).fill({ color: 0xe9e6df });
    ceil.rect(CABIN.left, -896, CABIN.right - CABIN.left, 14).fill({ color: 0xbdb8ae });
    this.upper.addChild(ceil);
    // cove mood lighting (a violet LED strip)
    const strip = new Graphics();
    strip.rect(CABIN.left, -892, CABIN.right - CABIN.left, 6).fill({ color: 0xb48cff });
    this.upper.addChild(strip);
    const cove = new Sprite(glowTexture());
    cove.anchor.set(0.5);
    cove.tint = 0x8a5cff;
    cove.alpha = 0.55;
    cove.blendMode = 'add';
    cove.scale.set((CABIN.right - CABIN.left) / 64 * 1.2, 120 / 64);
    cove.position.set((CABIN.left + CABIN.right) / 2, -886);
    this.upper.addChild(cove);
    this.flicker.push({ s: cove, base: 0.55 });
    for (const n of ROWS) {
      const x0 = rowX(n) - 262;
      this.sprite('bin', x0, CABIN.binTop, this.upper, 0, `bin.${n}`);
      this.sprite('psu', x0, CABIN.binBottom, this.upper, 0, `psu.${n}`);
      const label = new Text({ text: `${n}  ABC`, style: { fontFamily: 'Bungee', fontSize: 22, fill: 0x8f8a80, letterSpacing: 2 }, resolution: 2 });
      label.anchor.set(0.5);
      label.position.set(rowX(n) - 112, CABIN.binBottom - 18);
      this.upper.addChild(label);
      // the seatbelt sign: always on
      const sign = new Graphics();
      seatbeltIcon(sign);
      sign.position.set(x0 + 255, CABIN.binBottom + 18);
      this.upper.addChild(sign);
      const sg = new Sprite(glowTexture());
      sg.anchor.set(0.5);
      sg.tint = 0xffa21a;
      sg.alpha = 0.6;
      sg.blendMode = 'add';
      sg.scale.set(70 / 64, 40 / 64);
      sg.position.set(x0 + 255, CABIN.binBottom + 18);
      this.upper.addChild(sg);
      // reading lights
      const pw = READING_LIGHTS[n] ?? 0;
      if (pw > 0) {
        const lx = x0 + 70;
        const conesp = new Sprite(coneTexture());
        conesp.anchor.set(0.5, 0);
        conesp.tint = 0xffd49a;
        conesp.alpha = 0.32 * pw;
        conesp.blendMode = 'add';
        conesp.position.set(lx, CABIN.binBottom + 26);
        conesp.scale.set(260 / 128, 560 / 256);
        conesp.zIndex = 40;
        this.stage.addChild(conesp);
        this.flicker.push({ s: conesp, base: conesp.alpha });
        const bulb = new Sprite(glowTexture());
        bulb.anchor.set(0.5);
        bulb.tint = 0xffe2b0;
        bulb.blendMode = 'add';
        bulb.alpha = 0.9 * pw;
        bulb.scale.set(48 / 64, 26 / 64);
        bulb.position.set(lx, CABIN.binBottom + 20);
        this.upper.addChild(bulb);
        this.lights.push({ x: lx, y: -300, radius: 210, color: WARM, power: 0.55 * pw, on: () => this.nightLevel });
      }
    }
    // the open bin (row 15) for the avalanche gag: interior under the door, door on a hinge
    const n = 15, x0 = rowX(n) - 262;
    const interior = this.sprite('bin.interior', x0, CABIN.binTop, this.upper, 0, 'bin.15.interior');
    interior.visible = false;
    const door = this.sprite('bin.door', 0, 0, this.upper, 0, 'bin.15.door');
    door.visible = false;
    (door as Sprite & { hinge?: [number, number] }).hinge = [x0, CABIN.binTop];
  }

  /** Opens bin 15 by `k` (0..1): the door swings up around its top hinge. */
  setBinOpen(k: number): void {
    const door = this.sprites.get('bin.15.door')!;
    const bin = this.sprites.get('bin.15')!;
    const interior = this.sprites.get('bin.15.interior')!;
    const open = k > 0.001;
    bin.visible = !open;
    interior.visible = open;
    door.visible = open;
    const pt = this.atlas.parts.get('bin.door')!;
    const [hx, hy] = (door as Sprite & { hinge: [number, number] }).hinge;
    const ang = -k * 1.95;
    // rotate the door sprite (top-left at the hinge, drawn from (pt.x, pt.y))
    door.rotation = ang;
    const ox = pt.x, oy = pt.y;
    door.position.set(hx + ox * Math.cos(ang) - oy * Math.sin(ang), hy + ox * Math.sin(ang) + oy * Math.cos(ang));
  }

  /* ------------------------------------------------------------------ seats and passengers */
  private buildSeats(): void {
    const sleeperFor: Record<number, string | null> = { 10: 'sleeper.b', 11: 'reader', 12: 'sleeper.a', 13: null, 14: null, 15: null, 16: 'sleeper.c', 17: 'sleeper.b' };
    for (const n of ROWS) {
      const x = rowX(n);
      // implied window/middle seats behind the aisle seat (smaller, darker, a step back)
      {
        const k = 1;
        for (const id of ['seat.base', 'seat.rest']) {
          const s = this.sprite(id, x + 34, SEAT_FLOOR - 46, this.far);
          s.scale.set(0.9 / this.atlas.scale);
          s.tint = 0x7a7fa6;
        }
        if (n % 3 !== 1) {
          const id = ['sleeper.a', 'sleeper.b', 'sleeper.c'][(n * 7 + k) % 3];
          const p = this.sprite(id, x + 34, SEAT_FLOOR - 46, this.far);
          p.scale.set(0.9 / this.atlas.scale);
          p.tint = 0x6a6f96;
          this.sleepers.push({ s: p, phase: this.rng.range(0, 6), base: p.scale.y });
        }
      }
      this.sprite('seat.base', x, SEAT_FLOOR, this.stage, 10, `seat.${n}.base`);
      const rest = this.sprite('seat.rest', x, SEAT_FLOOR, this.stage, 11, `seat.${n}.rest`);
      this.pivotSprite(rest, x, SEAT_FLOOR - 150);
      this.sprite('seat.front', x, SEAT_FLOOR, this.stage, 30, `seat.${n}.front`);
      const who = sleeperFor[n];
      if (who) {
        const p = this.sprite(who, x, SEAT_FLOOR, this.stage, 20, `pax.${n}`);
        this.sleepers.push({ s: p, phase: this.rng.range(0, 6), base: p.scale.y });
        if (who === 'reader') {
          this.lights.push({ x: x - 100, y: -320, radius: 120, color: [0.7, 0.85, 1.0], power: 0.25, on: () => this.nightLevel });
        }
      }
    }
    // a lowered tray on the back of 15 (for 16C) with a cup of coffee on it
    this.sprite('seat.tray', rowX(15), SEAT_FLOOR, this.stage, 31, 'tray.15');
    this.sprite('cup', rowX(15) + 120, SEAT_FLOOR - 300, this.stage, 32, 'cup');
  }

  /** Moves a sprite's origin to a world pivot (so it can rotate around it) without moving its art. */
  private pivotSprite(s: Sprite, px: number, py: number): void {
    const k = this.atlas.scale;
    s.pivot.set((px - s.position.x) * k, (py - s.position.y) * k);
    s.position.set(px, py);
  }

  /** Reclines row n's backrest (degrees, positive = top moves back towards the row behind). */
  setRecline(n: number, deg: number): void {
    const s = this.sprites.get(`seat.${n}.rest`);
    if (s) s.rotation = (deg * Math.PI) / 180;
  }

  /* ------------------------------------------------------------------ galley, exit, lavatory */
  private buildRear(): void {
    const floorY = SEAT_FLOOR;
    // bulkhead wall behind the galley
    const g = new Graphics();
    g.rect(CABIN.galleyCurtain, CABIN.binTop, CABIN.right - CABIN.galleyCurtain, floorY - CABIN.binTop).fill({ color: 0xd2cfc8 });
    this.far.addChild(g);
    this.sprite('galley', CABIN.galleyCurtain + 90, floorY, this.far);
    this.sprite('coffeemaker', CABIN.coffeeMaker, floorY - 270, this.far);
    this.coffeeLed.position.set(CABIN.coffeeMaker + 70, floorY - 360);
    this.far.addChild(this.coffeeLed);
    this.sprite('exitdoor', CABIN.exitDoor - 60, floorY, this.far);
    const exitSign = new Container();
    const box = new Graphics().roundRect(-110, -26, 220, 52, 8).fill({ color: 0x0f3a1f }).stroke({ color: 0x1b1620, width: 4 });
    const t = new Text({ text: 'AUSGANG · EXIT', style: { fontFamily: 'Bungee', fontSize: 24, fill: 0x6dff9e }, resolution: 2 });
    t.anchor.set(0.5);
    exitSign.addChild(box, t);
    exitSign.position.set(CABIN.exitDoor + 55, CABIN.binTop + 60);
    this.upper.addChild(exitSign);
    const eg = new Sprite(glowTexture());
    eg.anchor.set(0.5); eg.tint = 0x2ecf62; eg.alpha = 0.5; eg.blendMode = 'add';
    eg.scale.set(420 / 64, 140 / 64);
    eg.position.copyFrom(exitSign.position);
    this.upper.addChild(eg);
    this.lights.push({ x: CABIN.exitDoor + 55, y: -600, radius: 300, color: [0.6, 1.0, 0.7], power: 0.18, on: () => 1 });
    // galley curtain, mostly pulled aside
    this.sprite('curtain.narrow', CABIN.galleyCurtain, floorY, this.far);
    // trolley, brakes on
    this.sprite('trolley', CABIN.trolley, floorY + 10, this.stage, 12, 'trolley');
    // lavatory: bright inside (seen when the door opens), the door, the sign
    const inside = this.sprite('lav.inside', CABIN.lavDoor, floorY, this.far, 0, 'lav.inside');
    inside.visible = false;
    this.sprite('lavdoor', CABIN.lavDoor, floorY, this.far, 0, 'lav.door');
    this.lavSign = new Text({ text: 'BESETZT', style: { fontFamily: 'Bungee', fontSize: 20, fill: 0xff6f61 }, resolution: 2 });
    this.lavSign.anchor.set(0.5);
    this.lavSign.position.set(CABIN.lavDoor + 101, floorY - 545);
    this.far.addChild(this.lavSign);
    this.lights.push({ x: CABIN.lavDoor + 100, y: -400, radius: 340, color: [0.85, 0.95, 1.25], power: 1.1, on: () => this.lavOpen });
    const lavGlow = new Sprite(coneTexture());
    lavGlow.anchor.set(0.5, 0);
    lavGlow.tint = 0xdff0ff;
    lavGlow.blendMode = 'add';
    lavGlow.alpha = 0;
    lavGlow.rotation = 0.0;
    lavGlow.scale.set(700 / 128, 900 / 256);
    lavGlow.position.set(CABIN.lavDoor + 60, -760);
    lavGlow.zIndex = 41;
    this.stage.addChild(lavGlow);
    this.sprites.set('lav.glow', lavGlow);
  }

  /* ------------------------------------------------------------------ front bulkhead */
  private buildFront(): void {
    const g = new Graphics();
    g.rect(CABIN.left, CABIN.binTop, CABIN.bulkhead - CABIN.left + 60, SEAT_FLOOR - CABIN.binTop).fill({ color: 0xd2cfc8 });
    g.rect(CABIN.bulkhead + 40, CABIN.binTop, 20, SEAT_FLOOR - CABIN.binTop).fill({ color: 0xb2ada4 });
    this.far.addChild(g);
    this.sprite('curtain', CABIN.bulkhead - 120, SEAT_FLOOR, this.far);
    this.sprite('screen', CABIN.bulkhead - 50, -640, this.far);
    this.screenG = new Graphics();
    this.screenG.position.set(CABIN.bulkhead - 50, -640);
    this.far.addChild(this.screenG);
    const msg = new Text({ text: 'FLUGROUTE WIRD\nGELADEN …', style: { fontFamily: 'Nunito', fontWeight: '900', fontSize: 20, fill: 0x9fd2ff, align: 'center', lineHeight: 24 }, resolution: 2 });
    msg.anchor.set(0.5);
    msg.position.set(CABIN.bulkhead - 50, -616);
    this.far.addChild(msg);
  }

  /* ------------------------------------------------------------------ floor */
  private buildFloor(): void {
    const g = new Graphics();
    g.rect(CABIN.left, SEAT_FLOOR, CABIN.right - CABIN.left, 600).fill({ color: 0x2a3352 });
    for (let x = CABIN.left; x < CABIN.right; x += 80) g.rect(x, SEAT_FLOOR + 8, 40, 3).fill({ color: 0x344068 });
    g.rect(CABIN.left, SEAT_FLOOR - 4, CABIN.right - CABIN.left, 8).fill({ color: 0x1e2440 });
    const floor = new Container();
    floor.addChild(g);
    floor.zIndex = 0;
    floor.tint = NIGHT_FLOOR;
    this.stage.addChild(floor);
    this.sprites.set('floor', floor as unknown as Sprite);
    // emergency floor path lights along the seat line
    for (let x = CABIN.left + 40; x < CABIN.right; x += 90) {
      const s = new Sprite(glowTexture());
      s.anchor.set(0.5); s.tint = 0xffd9a0; s.alpha = 0.35; s.blendMode = 'add';
      s.scale.set(30 / 64, 12 / 64);
      s.position.set(x, SEAT_FLOOR + 2);
      s.zIndex = 1;
      this.stage.addChild(s);
    }
  }

  private buildForeground(): void {
    for (let x = CABIN.left * 1.3; x < CABIN.right * 1.3; x += ROW_PITCH * 1.3) {
      const s = this.sprite('fg.seat', x, 175, this.fg);
      s.tint = 0x2a2c48;
    }
  }

  /* ------------------------------------------------------------------ runtime */

  /** Colour for characters at world x: the night ambience plus nearby lights. */
  actorLight(x: number, y = -350): number {
    const lit = this.lightsOn;
    let r = NIGHT_ACTOR[0] * this.nightAmbient(), g = NIGHT_ACTOR[1] * this.nightAmbient(), b = NIGHT_ACTOR[2] * this.nightAmbient();
    for (const l of this.lights) {
      const on = l.on();
      if (on <= 0) continue;
      const d = Math.hypot((x - l.x) / l.radius, (y - l.y) / (l.radius * 2));
      if (d >= 1) continue;
      const k = (1 - d * d) * l.power * on;
      r += l.color[0] * k; g += l.color[1] * k; b += l.color[2] * k;
    }
    r = lerp(r, 1, lit); g = lerp(g, 1, lit); b = lerp(b, 1, lit);
    const c = (v: number) => Math.round(clamp(v, 0, 1) * 255);
    return (c(r) << 16) | (c(g) << 8) | c(b);
  }

  private nightAmbient(): number { return 0.42 + 0.58 * this.nightLevel; }

  setLavSign(occupied: boolean): void {
    this.lavOccupied = occupied;
    this.lavSign.text = occupied ? 'BESETZT' : 'FREI';
    this.lavSign.style.fill = occupied ? 0xff6f61 : 0x6dff9e;
  }

  update(dt: number): void {
    this.time += dt;
    const t = this.time;
    const env = mixColor(mixColor(0x15172e, NIGHT_ENV, this.nightLevel), 0xffffff, this.lightsOn);
    for (const l of this.envLayers) l.tint = env;
    for (const s of this.sprites.values()) {
      if (s.parent === this.stage && s.zIndex >= 10 && s.zIndex <= 32) s.tint = env;
    }
    const floor = this.sprites.get('floor');
    if (floor) floor.tint = mixColor(mixColor(0x111326, NIGHT_FLOOR, this.nightLevel), 0xffffff, this.lightsOn * 0.8);
    for (const sl of this.sleepers) {
      if (sl.s.parent === this.stage) sl.s.tint = env;
      // slow breathing under the blankets
      sl.s.scale.y = sl.base * (1 + Math.sin(t * 1.4 + sl.phase) * 0.006);
    }
    // rain trickles straight down
    for (const w of this.rain) {
      const g = w.g;
      g.clear();
      g.roundRect(-48, -78, 96, 156, 34).fill({ color: 0x9fb8ff, alpha: 0.06 });
      for (const dr of w.drops) {
        dr.y += dr.v * dt * (0.6 + 0.4 * Math.sin(t * 2 + dr.x));
        if (dr.y > 76) { dr.y = -74; dr.x = this.rng.range(-40, 40); dr.v = this.rng.range(6, 22); }
        g.moveTo(dr.x, dr.y - dr.len).lineTo(dr.x, dr.y).stroke({ color: 0xcfe0ff, width: 1.6, alpha: 0.45 });
        g.circle(dr.x, dr.y, 2.2).fill({ color: 0xe8f2ff, alpha: 0.75 });
      }
    }
    for (const b of this.beacons) {
      const on = (Math.sin(t * 1.6 + b.phase) + 1) / 2;
      b.g.clear();
      b.g.circle(0, 0, 3).fill({ color: 0xff3b2e, alpha: 0.25 + 0.75 * on * on });
      b.g.circle(0, 0, 10).fill({ color: 0xff3b2e, alpha: 0.12 * on });
    }
    // the tug: crawls along the apron once every ~50 s
    const vx = -2600 + ((t * 26) % 5200);
    this.vehicle.clear();
    this.vehicle.circle(vx, -528, 2.4).fill({ color: 0xfff2c0 }).circle(vx + 10, -528, 2.4).fill({ color: 0xfff2c0 });
    this.vehicle.circle(vx - 14, -530, 2).fill({ color: 0xffa21a, alpha: (Math.sin(t * 9) + 1) / 2 });
    // route screen spinner (never finishes)
    const sg = this.screenG;
    sg.clear();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 3;
      sg.circle(Math.cos(a) * 16, 30 + Math.sin(a) * 16, 3).fill({ color: 0x9fd2ff, alpha: ((i / 8) + (t * 3) % 1) % 1 });
    }
    // coffee maker LED
    this.coffeeLed.clear().circle(0, 0, 4).fill({ color: Math.sin(t * 2) > 0 ? 0x5dff9a : 0x1f6b3a });
    // reading lights and cove: a barely-there flicker
    for (const f of this.flicker) f.s.alpha = f.base * this.nightLevel * (0.97 + 0.03 * Math.sin(t * 13 + f.base * 50) * Math.sin(t * 3.1));
    // lavatory light
    const lg = this.sprites.get('lav.glow')!;
    lg.alpha = 0.45 * this.lavOpen;
    this.sprites.get('lav.inside')!.visible = this.lavOpen > 0.01;
  }
}

function seatbeltIcon(g: Graphics): void {
  g.roundRect(-22, -10, 44, 20, 5).fill({ color: 0x2a1a06 });
  g.roundRect(-16, -3, 12, 6, 2).fill({ color: 0xffb22e });
  g.roundRect(4, -3, 12, 6, 2).fill({ color: 0xffb22e });
  g.roundRect(-5, -5, 10, 10, 2).stroke({ color: 0xffb22e, width: 2 });
}

export function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
}
