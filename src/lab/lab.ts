import { ColorMatrixFilter, Container, Graphics, Text } from 'pixi.js';
import type { Game } from '../game/game';
import { Actor, type CharacterSpec } from '../characters/actor';
import { CHARACTERS, atlasFor, sheetFor } from '../characters/registry';
import { ichSpec } from '../characters/ich/variants';
import { atlasScale } from '../app/stage';
import { SCENES } from '../story/registry';
import { seek, type SequenceDef, type SequencePlayer } from '../story/sequence';
import { resetWorld } from '../story/scenes';
import { h } from '../ui/dom';
import './lab.css';

/**
 * Animation Lab: inspect and replay everything that moves.
 *
 *  Clips        one character, one clip: play, pause, scrub, slow motion, frame steps, loop,
 *               skeleton/pivot overlay, onion skin, silhouette, expressions, eye direction,
 *               rig-sheet export. Walk cycles follow the character over a measured floor, so
 *               foot sliding would be visible.
 *  Szenen       the cutscenes of Chapter 0 on a timeline with their labelled events. Scrubbing
 *               re-simulates from zero (deterministic), so every frame is exactly the game's.
 *  Aufstellung  all characters side by side with a height chart (model-sheet check).
 *
 * Deep links: ?lab&mode=clips&c=ich&clip=trip&t=0.6&skel=1&onion=1&sil=0&speed=0.25
 *             ?lab&mode=scenes&id=trip&t=1.2      ?lab&mode=lineup&sil=1
 */
type Mode = 'clips' | 'scenes' | 'lineup';

/** Units per metre (see world/layout.ts). */
const UNITS_PER_M = 400;
/** Cutscenes the game plays without letterbox. */
const NO_LETTERBOX = new Set(['trip', 'avalanche']);
const ONION = [-0.2, -0.1, 0.1, 0.2];
const STEP = 1 / 60;

interface Cast { key: string; label: string; spec: CharacterSpec }

function castList(): Cast[] {
  const list: Cast[] = [
    { key: 'r3mi', label: 'R-3MI', spec: CHARACTERS.r3mi },
    { key: 'vtgm', label: 'V-TGM', spec: CHARACTERS.vtgm },
    { key: 'ich', label: 'ICH · A', spec: ichSpec('a') },
  ];
  // design directions B and C appear once they are registered as their own specs
  for (const k of ['b', 'c'] as const) {
    const s = ichSpec(k);
    if (s !== list[2].spec) list.push({ key: `ich-${k}`, label: `ICH · ${k.toUpperCase()}`, spec: s });
  }
  return list;
}

export async function startLab(g: Game, params: URLSearchParams): Promise<void> {
  const lab = new Lab(g, params);
  await lab.init();
}

class Lab {
  private mode: Mode;
  private readonly casts = castList();
  // shared transport
  private t = 0;
  private dur = 1;
  private playing = true;
  private speed: number;
  private loop = true;
  private sound = false;
  // clips
  private castKey: string;
  private clip: string;
  private expr = 'neutral';
  /** Default: facing left, as in the cabin and in the canon portraits. */
  private facing: 1 | -1 = -1;
  private skel: boolean;
  private onion: boolean;
  private sil: boolean;
  private lookX = 0;
  private lookY = 0;
  private main: Actor | null = null;
  private ghosts: { a: Actor; off: number }[] = [];
  private bones: Graphics | null = null;
  // lineup
  private lineup: Actor[] = [];
  // scenes
  private sceneId: string;
  private player: SequencePlayer<Game> | null = null;
  // display
  private readonly stage = new Container();
  private readonly track = new Container();
  private readonly floor = new Graphics();
  private readonly ticks = new Container();
  private readonly chart = new Container();
  /** Lineup names and heights (in front of the floor). */
  private readonly names = new Container();
  private readonly silFilter = new ColorMatrixFilter();
  private floorRange = 2000;
  private tickFrom = Infinity;
  // dom
  private readonly root = h('div', { class: 'lab' });
  private readonly side = h('aside', { class: 'lab-side' });
  private readonly timeEl = h('div', { class: 'lab-time' });
  private readonly range = h('input', { type: 'range', min: 0, max: 1, step: 0.001, value: 0, 'aria-label': 'Zeit' }) as HTMLInputElement;
  private readonly marks = h('div', { class: 'marks' });
  private readonly readout = h('div', { class: 'readout' });
  private readonly playBtn = h('button', { class: 'lbtn play', type: 'button', 'aria-label': 'Abspielen/Pause (Leertaste)' });
  private pendingSeek: number | null = null;
  private urlTimer = 0;

  constructor(readonly g: Game, readonly params: URLSearchParams) {
    const m = params.get('mode');
    this.mode = m === 'scenes' || m === 'lineup' ? m : 'clips';
    this.castKey = this.casts.some((c) => c.key === params.get('c')) ? params.get('c')! : 'ich';
    this.clip = params.get('clip') ?? 'walk';
    this.expr = params.get('expr') ?? 'neutral';
    this.skel = params.get('skel') === '1';
    this.onion = params.get('onion') === '1';
    this.sil = params.get('sil') === '1';
    this.speed = Number(params.get('speed') ?? 1) || 1;
    if (params.get('face') === '1') this.facing = 1;
    const id = params.get('id');
    this.sceneId = id && SCENES[id] ? id : 'trip';
    if (params.has('t')) this.playing = false;
    this.t = Number(params.get('t') ?? 0) || 0;
    // silhouette: every pixel the same dark ink, alpha kept (silhouette readability check)
    this.silFilter.matrix = [0, 0, 0, 0, 0.07, 0, 0, 0, 0, 0.06, 0, 0, 0, 0, 0.11, 0, 0, 0, 1, 0];
  }

  async init(): Promise<void> {
    const g = this.g;
    g.running = false;
    g.audio.silent = true;
    document.body.classList.add('in-lab');
    g.app.stage.addChild(this.stage);
    this.stage.addChild(this.chart, this.track, this.names);
    this.track.addChild(this.floor, this.ticks);
    this.buildDom();
    this.setPlaying(this.playing);
    g.app.renderer.on('resize', () => this.layout());
    g.app.ticker.add((tk) => this.tick(Math.min(tk.deltaMS / 1000, 0.1)));
    window.addEventListener('keydown', (e) => this.onKey(e));
    await this.setMode(this.mode, true);
    (window as unknown as { __ready: boolean }).__ready = true;
  }

  /* ================================================================== DOM */
  private buildDom(): void {
    const top = h('header', { class: 'lab-top' },
      h('div', { class: 'brand' }, h('b', { text: 'ANIMATIONSLABOR' }), h('span', { class: 'badge', text: 'Platzhalter-Rigs · prozedural' })));
    const tabs = h('nav', { class: 'tabs', role: 'tablist' });
    for (const [m, label] of [['clips', 'Clips'], ['scenes', 'Szenen'], ['lineup', 'Aufstellung']] as [Mode, string][]) {
      const b = h('button', { class: 'tab', type: 'button', role: 'tab', 'data-mode': m, text: label });
      b.addEventListener('click', () => void this.setMode(m));
      tabs.append(b);
    }
    const sound = h('button', { class: 'lbtn', type: 'button', text: 'Ton: aus', 'aria-label': 'Ton an/aus' });
    sound.addEventListener('click', () => {
      this.g.audio.unlock();
      this.sound = !this.sound;
      sound.textContent = this.sound ? 'Ton: an' : 'Ton: aus';
      this.g.audio.silent = !this.sound;
    });
    const panelToggle = h('button', { class: 'lbtn', type: 'button', text: 'Steuerung', 'aria-label': 'Seitenleiste ein/aus' });
    // wide screens: the panel is open by default; narrow screens: it opens over the stage
    panelToggle.addEventListener('click', () => { this.root.classList.toggle(window.innerWidth < 760 ? 'side-open' : 'side-closed'); this.layout(); });
    const back = h('a', { class: 'lbtn', href: location.pathname, text: '← Zum Spiel' });
    top.append(tabs, h('div', { class: 'grow' }), panelToggle, sound, back);

    this.playBtn.addEventListener('click', () => this.setPlaying(!this.playing));
    const stepB = h('button', { class: 'lbtn', type: 'button', text: '◂ 1/30', 'aria-label': 'Ein Bild zurück (←)' });
    stepB.addEventListener('click', () => this.stepFrame(-1));
    const stepF = h('button', { class: 'lbtn', type: 'button', text: '1/30 ▸', 'aria-label': 'Ein Bild vor (→)' });
    stepF.addEventListener('click', () => this.stepFrame(1));
    const restart = h('button', { class: 'lbtn', type: 'button', text: '⏮', 'aria-label': 'Von vorn (Pos1)' });
    restart.addEventListener('click', () => this.seekTo(0));
    const speed = h('select', { 'aria-label': 'Tempo' }) as HTMLSelectElement;
    for (const v of [0.1, 0.25, 0.5, 1, 2]) speed.append(h('option', { value: v, text: `${v}×`, ...(v === this.speed ? { selected: true } : {}) }));
    speed.addEventListener('change', () => { this.speed = Number(speed.value); this.syncUrl(); });
    const loopIn = h('input', { type: 'checkbox', ...(this.loop ? { checked: true } : {}) }) as HTMLInputElement;
    loopIn.addEventListener('change', () => { this.loop = loopIn.checked; });
    const loop = h('label', { class: 'chk' }, loopIn, 'Schleife');
    this.range.addEventListener('input', () => {
      this.setPlaying(false);
      this.pendingSeek = Number(this.range.value) * this.dur;
    });
    const bar = h('div', { class: 'bar' }, this.range, this.marks);
    this.timeEl.append(h('div', { class: 'ctl' }, restart, stepB, this.playBtn, stepF, speed, loop, this.readout), bar);

    this.root.append(top, this.side, this.timeEl);
    // short screens (phones in landscape): the stage needs the room, the panel opens on demand
    if (window.innerHeight < 500) this.root.classList.add('side-closed');
    document.body.append(this.root);
  }

  private section(title: string, ...children: (Node | string)[]): HTMLElement {
    const s = h('section', {}, h('h3', { text: title }), ...children);
    this.side.append(s);
    return s;
  }

  private toggle(label: string, on: boolean, set: (v: boolean) => void, key?: string): HTMLElement {
    const i = h('input', { type: 'checkbox', ...(on ? { checked: true } : {}), 'data-key': key }) as HTMLInputElement;
    i.addEventListener('change', () => { set(i.checked); this.syncUrl(); });
    return h('label', { class: 'chk' }, i, label, key ? h('kbd', { text: key }) : '');
  }

  private select(label: string, opts: [string, string][], value: string, set: (v: string) => void): HTMLElement {
    const sel = h('select', { 'aria-label': label }) as HTMLSelectElement;
    for (const [v, l] of opts) sel.append(h('option', { value: v, text: l, ...(v === value ? { selected: true } : {}) }));
    sel.addEventListener('change', () => set(sel.value));
    return h('label', { class: 'field' }, h('span', { text: label }), sel);
  }

  private slider(label: string, value: number, set: (v: number) => void): HTMLElement {
    const i = h('input', { type: 'range', min: -1, max: 1, step: 0.05, value }) as HTMLInputElement;
    i.addEventListener('input', () => set(Number(i.value)));
    return h('label', { class: 'field' }, h('span', { text: label }), i);
  }

  /* ================================================================== modes */
  private async setMode(m: Mode, first = false): Promise<void> {
    if (!first) this.t = 0;
    this.mode = m;
    for (const b of Array.from(this.root.querySelectorAll('.tab'))) b.classList.toggle('on', (b as HTMLElement).dataset.mode === m);
    this.root.dataset.mode = m;
    document.body.dataset.labMode = m;
    this.side.innerHTML = '';
    this.clearActors();
    document.body.classList.remove('cinematic');
    this.g.dialogue.reset();
    this.g.clearCards();
    const sceneMode = m === 'scenes';
    this.g.world.visible = sceneMode;
    this.stage.visible = !sceneMode;
    if (m === 'clips') await this.enterClips();
    else if (m === 'scenes') this.enterScenes();
    else await this.enterLineup();
    this.layout();
    this.paint();
    this.syncUrl();
  }

  private clearActors(): void {
    for (const a of [this.main, ...this.ghosts.map((x) => x.a), ...this.lineup]) a?.root.destroy({ children: true });
    this.main = null;
    this.ghosts = [];
    this.lineup = [];
    this.bones = null;
    this.chart.removeChildren().forEach((c) => c.destroy());
    this.names.removeChildren().forEach((c) => c.destroy());
    this.player = null;
  }

  private get cast(): Cast { return this.casts.find((c) => c.key === this.castKey) ?? this.casts[2]; }

  /* ------------------------------------------------------------------ clips */
  private async enterClips(): Promise<void> {
    const c = this.cast;
    const atlas = await atlasFor(c.spec, atlasScale());
    const main = new Actor(c.spec, atlas, 3);
    main.onEvent = (e) => this.g.onActorEvent(main, e);
    this.ghosts = ONION.map((off) => {
      const a = new Actor(c.spec, atlas, 3);
      a.shadow.visible = false;
      a.root.alpha = Math.abs(off) > 0.15 ? 0.16 : 0.28;
      a.light = off < 0 ? 0x6aa8ff : 0x86ffa8;
      return { a, off };
    });
    for (const gh of this.ghosts) this.track.addChild(gh.a.root);
    this.track.addChild(main.root);
    this.main = main;
    this.bones = new Graphics();
    main.body.addChild(this.bones);
    const clips = ['walk', 'sneak', ...Array.from(main.anim.clips.keys())];
    if (!clips.includes(this.clip)) this.clip = 'walk';

    this.section('Figur',
      this.select('Figur', this.casts.map((x) => [x.key, x.label]), c.key, (v) => { this.castKey = v; void this.setMode('clips'); }),
      this.select('Clip', clips.map((k) => [k, this.clipLabel(k)]), this.clip, (v) => { this.clip = v; this.t = 0; this.setPlaying(true); this.resetClip(); }),
      this.select('Ausdruck', Object.keys(c.spec.expressions).map((k) => [k, k]), c.spec.expressions[this.expr] ? this.expr : 'neutral', (v) => { this.expr = v; this.seekTo(this.t); }),
      this.select('Blickrichtung', [['1', 'nach rechts'], ['-1', 'nach links']], String(this.facing), (v) => { this.facing = v === '1' ? 1 : -1; this.seekTo(this.t); }),
    );
    this.section('Ansicht',
      this.toggle('Skelett & Drehpunkte', this.skel, (v) => { this.skel = v; this.drawBones(); }, 'S'),
      this.toggle('Zwiebelhaut ±0,1 / ±0,2 s', this.onion, (v) => { this.onion = v; this.seekTo(this.t); }, 'O'),
      this.toggle('Silhouette', this.sil, (v) => { this.sil = v; this.applySil(); }, 'B'),
    );
    this.section('Auge / Blick',
      this.slider('Blick ↔', this.lookX, (v) => { this.lookX = v; this.seekTo(this.t); }),
      this.slider('Blick ↕', this.lookY, (v) => { this.lookY = v; this.seekTo(this.t); }),
      h('p', { class: 'lab-note', text: 'Setzt einen Blickpunkt relativ zum Kopf (Pupille, Kopfneigung). Beide Regler in der Mitte = kein Blickziel.' }),
    );
    const exp = h('button', { class: 'lbtn', type: 'button', text: 'Rig-Sheet (SVG) laden' });
    exp.addEventListener('click', () => this.exportSheet(c));
    const raw = h('a', { class: 'lbtn', href: `${location.pathname}?dev=sheet&c=${encodeURIComponent(c.spec.id)}`, target: '_blank', rel: 'noopener', text: 'Rig-Sheet ansehen' });
    this.section('Asset-Pipeline', h('div', { class: 'row' }, exp, raw),
      h('p', { class: 'lab-note', text: `Teile in diesem SVG ersetzen (gleiche ids behalten) und als art/authored/${c.spec.id}.svg ablegen – das Spiel lädt es ohne Codeänderung.` }));
    this.section('Ehrlich gesagt', h('p', { class: 'lab-note', text: 'Diese Bewegung ist im Code geblockt (Keyframes, IK, Federn), die Teile sind generierte Platzhalter-Vektorgrafik. Sie zeigt Timing und Mechanik – nicht die Qualität finaler, von Hand gezeichneter Animation.' }));
    this.resetClip();
  }

  private clipLabel(k: string): string {
    if (k === 'walk') return 'walk · Gang (IK)';
    if (k === 'sneak') return 'sneak · Schleichen (IK)';
    const c = this.main?.anim.clips.get(k);
    return c ? `${k} · ${c.duration.toFixed(2)} s${c.loop ? ' ↻' : ''}` : k;
  }

  private resetClip(): void {
    const a = this.main;
    if (!a) return;
    const c = a.anim.clips.get(this.clip);
    const walking = this.clip === 'walk' || this.clip === 'sneak';
    this.dur = walking ? 3.2 : c ? c.duration + (c.loop ? 0 : 0.6) : 2;
    this.marks.innerHTML = '';
    for (const e of c?.def.events ?? []) this.addMark(e.t, `${e.name}${e.data !== undefined ? ': ' + String(e.data) : ''}`);
    this.seekTo(Math.min(this.t, this.dur));
  }

  private setupClip(a: Actor): () => void {
    return () => {
      a.x = 0; a.y = 0;
      a.face(this.facing, true);
      a.setExpression(a.spec.expressions[this.expr] ? this.expr : 'neutral', true);
      if (this.clip === 'walk' || this.clip === 'sneak') void a.walkTo(this.facing * 100000, { style: this.clip });
      else if (this.clip !== a.spec.idle) void a.play(this.clip, { fade: 0 });
      if (this.lookX || this.lookY) a.look = { x: this.facing * (220 + this.lookX * 700), y: -a.spec.height * 0.9 + this.lookY * 600 };
    };
  }

  private clipSeek(t: number): void {
    const a = this.main;
    if (!a) return;
    const was = this.g.audio.silent;
    this.g.audio.silent = true;
    a.simulateTo(t, this.setupClip(a), STEP);
    for (const gh of this.ghosts) {
      const tt = t + gh.off;
      gh.a.root.visible = this.onion && tt >= 0;
      if (gh.a.root.visible) gh.a.simulateTo(tt, this.setupClip(gh.a), STEP);
    }
    this.g.audio.silent = was;
  }

  private clipStep(dt: number): void {
    const a = this.main;
    if (!a) return;
    for (let left = dt; left > 1e-6; left -= STEP) {
      const h = Math.min(STEP, left);
      a.step(h);
      for (const gh of this.ghosts) if (gh.a.root.visible) gh.a.step(h);
    }
    // a ghost whose time was still "before zero" joins once it is reached
    for (const gh of this.ghosts) {
      if (this.onion && !gh.a.root.visible && this.t + gh.off >= 0) {
        gh.a.root.visible = true;
        gh.a.simulateTo(this.t + gh.off, this.setupClip(gh.a), STEP);
      }
    }
  }

  private applySil(): void {
    const actors = this.mode === 'lineup' ? this.lineup : [this.main, ...this.ghosts.map((x) => x.a)];
    for (const a of actors) if (a) a.view.root.filters = this.sil ? [this.silFilter] : [];
  }

  /** Bones as lines from parent pivot to child pivot, pivots as dots (in character space). */
  private drawBones(): void {
    const b = this.bones, a = this.main;
    if (!b || !a) return;
    b.clear();
    if (!this.skel) return;
    const sk = a.sk;
    const k = 1 / (this.stage.scale.x * a.scale);
    for (let i = 0; i < sk.size; i++) {
      const w = sk.world[i], p = sk.parent[i];
      if (p >= 0) b.moveTo(sk.world[p].tx, sk.world[p].ty).lineTo(w.tx, w.ty).stroke({ color: 0x3ee6ff, width: 2.4 * k, alpha: 0.9 });
    }
    for (let i = 0; i < sk.size; i++) {
      const w = sk.world[i];
      const leg = /thigh|shin|foot|leg/.test(sk.def.bones[i].name);
      b.circle(w.tx, w.ty, 4.5 * k).fill({ color: leg ? 0xff6fd8 : 0xffb22e }).stroke({ color: 0x10101a, width: 1.2 * k });
    }
  }

  private exportSheet(c: Cast): void {
    const { svg } = sheetFor(c.spec);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const link = h('a', { href: url, download: `${c.spec.id}-rig-sheet.svg` });
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* ------------------------------------------------------------------ lineup */
  private async enterLineup(): Promise<void> {
    const scale = atlasScale();
    let x = -(this.casts.length - 1) * 230;
    for (const c of this.casts) {
      const a = new Actor(c.spec, await atlasFor(c.spec, scale), 3);
      const x0 = x;
      this.track.addChild(a.root);
      a.simulateTo(1, () => { a.x = x0; a.face(this.facing, true); a.setExpression(c.spec.expressions[this.expr] ? this.expr : 'neutral', true); });
      this.lineup.push(a);
      x += 460;
    }
    this.dur = 1;
    this.marks.innerHTML = '';
    this.section('Aufstellung',
      this.toggle('Silhouette', this.sil, (v) => { this.sil = v; this.applySil(); }, 'B'),
      this.select('Blickrichtung', [['1', 'nach rechts'], ['-1', 'nach links']], String(this.facing), (v) => { this.facing = v === '1' ? 1 : -1; void this.setMode('lineup'); }),
      this.select('Ausdruck (wo vorhanden)', ['neutral', 'happy', 'anxious', 'deadpan', 'proud', 'shocked'].map((k) => [k, k]), this.expr, (v) => { this.expr = v; void this.setMode('lineup'); }),
      h('p', { class: 'lab-note', text: 'Maßstab wie im Spiel (400 Einheiten = 1 m), gemessen bis zur Kopfoberkante.' }),
    );
    this.section('Kanon-Check', h('p', { class: 'lab-note', text: 'R-3MI: groß, grünes Auge, Tank hoch auf dem Rücken, drei Schläuche; Ringscheibe an Schulter und Ellbogen seines LINKEN Arms, unter dem Tank (auch beim Umdrehen). V-TGM: klein, rotes Auge, Kugelkopf. ICH: Namensschild mit riesigem „ICH" – nie gespiegelt. Details: docs/CHARACTER_BIBLE.md.' }));
    this.applySil();
    this.drawChart();
  }

  private drawChart(): void {
    this.chart.removeChildren().forEach((c) => c.destroy());
    this.names.removeChildren().forEach((c) => c.destroy());
    const gfx = new Graphics();
    this.chart.addChild(gfx);
    const w = (this.casts.length + 0.4) * 460;
    for (let u = 100; u <= 1100; u += 100) {
      const major = u % 400 === 0;
      gfx.moveTo(-w / 2, -u).lineTo(w / 2, -u).stroke({ color: major ? 0x6a63a8 : 0x2e2a52, width: major ? 3 : 1.5 });
      const label = new Text({ text: `${(u / UNITS_PER_M).toFixed(2).replace('.', ',')} m`, style: { fontFamily: 'Nunito', fontWeight: '800', fontSize: 22, fill: major ? 0xb9b3e6 : 0x6a6496 } });
      label.position.set(-w / 2 + 6, -u - 28);
      this.chart.addChild(label);
    }
    for (const a of this.lineup) {
      const top = a.headTop();
      gfx.moveTo(a.x - 150, top.y).lineTo(a.x + 150, top.y).stroke({ color: 0xffb22e, width: 3 });
      const name = new Text({ text: `${a.spec.name}\n${(-top.y / UNITS_PER_M).toFixed(2).replace('.', ',')} m`, style: { fontFamily: 'Nunito', fontWeight: '900', fontSize: 30, fill: 0xf4eedc, align: 'center', lineHeight: 34 } });
      name.anchor.set(0.5, 0);
      name.position.set(a.x, 30);
      this.names.addChild(name);
    }
  }

  /* ------------------------------------------------------------------ scenes */
  private enterScenes(): void {
    const list = h('div', { class: 'scenes' });
    for (const [id, def] of Object.entries(SCENES)) {
      const b = h('button', { class: `scene${id === this.sceneId ? ' on' : ''}`, type: 'button' },
        h('b', { text: def.title }), h('span', { text: `${def.duration.toFixed(1).replace('.', ',')} s · ${def.events.filter((e) => e.label).length} Marken` }));
      b.addEventListener('click', () => { this.sceneId = id; void this.setMode('scenes').then(() => this.setPlaying(true)); });
      list.append(b);
    }
    this.section('Zwischensequenzen', list);
    this.section('Außerdem', h('a', { class: 'lbtn', href: location.pathname, text: 'Titelsequenz im Spiel ansehen' }),
      h('p', { class: 'lab-note', text: 'Die Titelsequenz ist DOM-Animation (Abflugtafel, Buchstaben) und läuft nur im Spiel selbst.' }));
    this.section('So funktioniert es', h('p', { class: 'lab-note', text: 'Jede Szene ist ein deterministischer Ablauf (Setup + zeitgesteuerte Ereignisse). Zurückspulen simuliert von null an neu – jedes Bild ist das aus dem Spiel. Marken auf der Zeitleiste springen zum Ereignis.' }));
    const def = SCENES[this.sceneId];
    this.dur = def.duration;
    this.marks.innerHTML = '';
    for (const e of def.events) if (e.label) this.addMark(e.t, e.label);
    document.body.classList.toggle('cinematic', !NO_LETTERBOX.has(def.id));
    this.t = Math.min(this.t, this.dur);
    this.sceneSeek(this.t, true);
  }

  private sceneSeek(t: number, full: boolean): void {
    const g = this.g;
    const def = SCENES[this.sceneId] as SequenceDef<Game>;
    const was = g.audio.silent;
    g.audio.silent = true;
    const p = this.player;
    if (!full && p) {
      // forward: keep simulating from where we are
      this.sceneStep(t - p.t);
    } else {
      this.player = seek(def, g, () => resetWorld(g), (dt) => g.step(dt), t, 1 / 30);
    }
    g.audio.silent = was;
  }

  private sceneStep(dt: number): void {
    const p = this.player;
    if (!p) return;
    for (let left = dt; left > 1e-6; left -= 1 / 30) {
      const h = Math.min(1 / 30, left);
      p.update(h);
      this.g.step(h);
    }
  }

  /* ================================================================== transport */
  private addMark(t: number, label: string): void {
    const m = h('button', { class: 'mark', type: 'button', title: `${t.toFixed(2)} s · ${label}`, 'aria-label': `${label} (${t.toFixed(2)} s)`, style: `left:${(t / Math.max(0.001, this.dur)) * 100}%` });
    m.addEventListener('click', () => { this.setPlaying(false); this.seekTo(t); });
    this.marks.append(m);
  }

  private seekTo(t: number): void {
    this.t = Math.max(0, Math.min(this.dur, t));
    if (this.mode === 'clips') { this.clipSeek(this.t); this.drawBones(); this.applySil(); }
    else if (this.mode === 'scenes') this.sceneSeek(this.t, !this.player || this.t < this.player.t);
    this.paint();
    this.syncUrl();
  }

  private stepFrame(dir: 1 | -1): void {
    this.setPlaying(false);
    if (dir > 0 && this.mode !== 'lineup') {
      const dt = Math.min(1 / 30, this.dur - this.t);
      this.t += dt;
      if (this.mode === 'clips') { this.clipStep(dt); this.drawBones(); } else this.sceneStep(dt);
      this.paint();
      this.syncUrl();
      return;
    }
    this.seekTo(this.t + dir / 30);
  }

  private setPlaying(on: boolean): void {
    this.playing = on;
    this.playBtn.textContent = on ? '❚❚' : '▶';
    this.root.classList.toggle('is-playing', on);
    this.syncUrl();
  }

  private tick(real: number): void {
    if (this.pendingSeek !== null) {
      const t = this.pendingSeek;
      this.pendingSeek = null;
      this.seekTo(t);
    }
    if (this.mode === 'lineup') {
      if (this.playing) for (const a of this.lineup) a.step(real);
      return;
    }
    if (!this.playing) return;
    const dt = real * this.speed;
    if (this.t + dt >= this.dur) {
      if (this.loop) this.seekTo(0);
      else { this.setPlaying(false); this.paint(); }
      return;
    }
    this.t += dt;
    if (this.mode === 'clips') { this.clipStep(dt); this.drawBones(); } else this.sceneStep(dt);
    this.paint();
  }

  private paint(): void {
    this.range.value = String(this.t / Math.max(0.001, this.dur));
    let label = '';
    if (this.mode === 'scenes') {
      for (const e of SCENES[this.sceneId].events) if (e.label && e.t <= this.t + 1e-6) label = e.label;
    } else if (this.mode === 'clips') label = this.clipLabel(this.clip);
    this.readout.textContent = this.mode === 'lineup' ? 'Leerlauf (Atmen, Blinzeln)' : `${this.t.toFixed(2)} / ${this.dur.toFixed(2)} s${label ? '  ·  ' + label : ''}`;
    this.follow();
  }

  private onKey(e: KeyboardEvent): void {
    const el = e.target as HTMLElement;
    if (el.tagName === 'SELECT') return;
    if (e.key === ' ') { e.preventDefault(); this.setPlaying(!this.playing); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (e.shiftKey) this.seekTo(this.t + 1); else this.stepFrame(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (e.shiftKey) this.seekTo(this.t - 1); else this.stepFrame(-1); }
    else if (e.key === 'Home') this.seekTo(0);
    else if (this.mode === 'clips' && (e.key === 's' || e.key === 'S')) { this.skel = !this.skel; this.drawBones(); this.refreshChecks(); }
    else if (this.mode === 'clips' && (e.key === 'o' || e.key === 'O')) { this.onion = !this.onion; this.seekTo(this.t); this.refreshChecks(); }
    else if (this.mode !== 'scenes' && (e.key === 'b' || e.key === 'B')) { this.sil = !this.sil; this.applySil(); this.refreshChecks(); }
  }

  private refreshChecks(): void {
    const state: Record<string, boolean> = { S: this.skel, O: this.onion, B: this.sil };
    for (const i of Array.from(this.side.querySelectorAll('input[data-key]')) as HTMLInputElement[]) i.checked = state[i.dataset.key!] ?? i.checked;
    this.syncUrl();
  }

  /* ================================================================== layout */
  private layout(): void {
    const W = this.g.app.screen.width, H = this.g.app.screen.height;
    const narrow = W < 760;
    const sideW = narrow || this.root.classList.contains('side-closed') ? 0 : 300;
    const top = 56, bottom = narrow ? 112 : 84;
    const usableH = Math.max(120, H - top - bottom);
    const zoom = this.mode === 'lineup'
      ? Math.min(usableH / 1250, (W - sideW) / ((this.casts.length + 0.6) * 460))
      : usableH * 0.8 / Math.max(700, (this.main ? this.main.spec.height * this.main.scale : 900));
    this.stage.scale.set(zoom);
    this.stage.position.set((W - sideW) / 2, top + usableH * (this.mode === 'lineup' ? 0.86 : 0.93));
    const span = 400000;
    this.floor.clear();
    this.floor.rect(-span, 0, span * 2, 3000).fill({ color: 0x15132a });
    this.floor.moveTo(-span, 0).lineTo(span, 0).stroke({ color: 0x4a4380, width: 3 });
    this.floorRange = (W / zoom) * 0.75;
    this.tickFrom = Infinity;
    this.follow();
    if (this.mode === 'clips') this.drawBones();
  }

  /** Floor ticks every 25 cm (metres taller), redrawn as the walker moves along. */
  private drawTicks(cx: number): void {
    const from = Math.floor((cx - this.floorRange) / 400) * 400;
    if (from === this.tickFrom) return;
    this.tickFrom = from;
    this.ticks.removeChildren().forEach((c) => c.destroy());
    const t = new Graphics();
    for (let x = from; x <= cx + this.floorRange + 400; x += 100) {
      const m = x % 400 === 0;
      t.rect(x - 1.5, 0, 3, m ? 26 : 12).fill({ color: m ? 0x8079c4 : 0x4a4380 });
    }
    this.ticks.addChild(t);
  }

  /** Clips: the view follows a walking character, so the floor scrolls under the planted feet. */
  private follow(): void {
    const cx = this.mode === 'clips' && this.main ? this.main.x : 0;
    this.track.position.x = -cx;
    this.drawTicks(cx);
  }

  private syncUrl(): void {
    window.clearTimeout(this.urlTimer);
    this.urlTimer = window.setTimeout(() => {
      const q: string[] = ['lab', `mode=${this.mode}`];
      if (this.mode === 'clips') {
        q.push(`c=${this.castKey}`, `clip=${encodeURIComponent(this.clip)}`);
        if (this.expr !== 'neutral') q.push(`expr=${this.expr}`);
        if (this.skel) q.push('skel=1');
        if (this.onion) q.push('onion=1');
      }
      if (this.mode === 'scenes') q.push(`id=${this.sceneId}`);
      if (this.sil && this.mode !== 'scenes') q.push('sil=1');
      if (this.facing === 1 && this.mode !== 'scenes') q.push('face=1');
      if (this.speed !== 1) q.push(`speed=${this.speed}`);
      if (!this.playing && this.mode !== 'lineup') q.push(`t=${this.t.toFixed(2)}`);
      history.replaceState(null, '', `${location.pathname}?${q.join('&')}`);
    }, 250);
  }
}
