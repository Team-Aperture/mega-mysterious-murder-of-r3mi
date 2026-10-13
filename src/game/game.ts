import { BlurFilter, Container, Graphics, Sprite, type Application } from 'pixi.js';
import { buildAtlas, type Atlas } from '../anim/atlas';
import { Actor, type Facing } from '../characters/actor';
import { CHARACTERS, atlasFor } from '../characters/registry';
import { ichSpec } from '../characters/ich/variants';
import { Audio } from '../audio/audio';
import { clamp, Rng } from '../engine/math';
import { ease, type EaseSpec } from '../engine/ease';
import { Cabin } from '../world/cabin';
import { Camera } from '../world/camera';
import { propSheet } from '../world/propSheet';
import { CABIN, SEAT_FLOOR } from '../world/layout';
import { Dialogue, type Line, type Who } from '../ui/dialogue';
import { h } from '../ui/dom';
import { SequencePlayer, type SequenceDef } from '../story/sequence';
import { atlasScale } from '../app/stage';
import { defaultProgress, loadSettings, saveSettings, type Progress, type Settings } from './state';

/** Largest simulation step (s). */
const STEP = 1 / 30;

export type Cast = { ich: Actor; r3mi: Actor; vtgm: Actor };

export interface Hotspot {
  id: string;
  label: string;
  verb?: string;
  /** World rectangle (stage layer). */
  x: number; y: number; w: number; h: number;
  /** Where ICH stands to use it, and which way he faces. */
  standX: number;
  face?: Facing;
  active?: () => boolean;
  use: () => Promise<void>;
}

/** A loose prop that can be thrown along an arc (luggage, hats, rubber ducks). */
export interface Toss {
  s: Sprite;
  t: number;
  x0: number; y0: number; x1: number; y1: number; arc: number; dur: number; spin: number; rot0: number;
  bounce: number; e?: EaseSpec; done?: () => void; landed?: boolean; sound?: string; shake?: number;
}

/**
 * The game world and its loop. Gameplay, cutscenes and the Animation Lab all step the world
 * through `step(dt)`, so whatever the Lab replays is exactly what the game shows.
 */
export class Game {
  readonly cam = new Camera();
  cabin!: Cabin;
  props!: Atlas;
  cast!: Cast;
  readonly audio = new Audio();
  readonly ui: HTMLElement;
  dialogue!: Dialogue;
  settings: Settings = loadSettings();
  progress: Progress = defaultProgress();
  readonly rng = new Rng(14);
  readonly world = new Container();
  private seq: SequencePlayer<Game> | null = null;
  private hotspots: Hotspot[] = [];
  private controlOn = false;
  private keys = new Set<string>();
  private hover: Hotspot | null = null;
  private nearest: Hotspot | null = null;
  readonly tosses: Toss[] = [];
  /** Props that follow a bone (e.g. the Travel Bug in ICH's glove). */
  readonly attached: { s: Sprite; a: Actor; bone: string; sx: number; sy: number }[] = [];
  /** Deterministic property tweens (stepped with the world, so seeking stays exact). */
  readonly tweens: { o: Record<string, number>; k: string; from: number; to: number; t: number; dur: number; e: EaseSpec; done?: () => void }[] = [];
  private labelEl!: HTMLElement;
  private markerEls = new Map<string, HTMLElement>();
  private skipEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private talkAccentT: Record<string, number> = {};
  time = 0;
  /** While false, the loop does not step (pause menu, lab-driven stepping). */
  running = true;
  /** Hooks for the story (trip trigger etc.). */
  onTick: ((dt: number) => void) | null = null;
  paused = false;
  private timers: { left: number; done: () => void }[] = [];
  private loadingEl: HTMLElement | null = null;

  constructor(readonly app: Application, ui: HTMLElement) {
    this.ui = ui;
  }

  /* ------------------------------------------------------------------ setup */
  async load(onProgress: (k: number, label: string) => void): Promise<void> {
    const scale = atlasScale();
    let done = 0;
    const total = 4;
    const step = (label: string) => onProgress(++done / total, label);
    const ichS = ichSpec(this.settings.ichDesign);
    this.props = await buildAtlas('cabin', propSheet(), { scale: Math.min(1.6, scale) });
    step('Kabine');
    const [ichA, r3A, vtA] = [await atlasFor(ichS, scale), await atlasFor(CHARACTERS.r3mi, scale), await atlasFor(CHARACTERS.vtgm, scale)];
    step('Figuren');
    this.cabin = new Cabin(this.props);
    this.cabin.attach(this.cam);
    this.world.addChild(this.cabin.root);
    this.app.stage.addChild(this.world);
    this.cast = {
      ich: new Actor(ichS, ichA, 3),
      r3mi: new Actor(CHARACTERS.r3mi, r3A, 5),
      vtgm: new Actor(CHARACTERS.vtgm, vtA, 9),
    };
    for (const a of Object.values(this.cast)) {
      a.root.zIndex = 50;
      this.cabin.stage.addChild(a.root);
      a.onEvent = (e) => this.onActorEvent(a, e);
    }
    step('Bühne');
    this.buildUi();
    this.applySettings();
    this.resize();
    this.app.renderer.on('resize', () => this.resize());
    step('Fertig');
  }

  private buildUi(): void {
    this.ui.append(h('div', { class: 'vignette' }), h('div', { class: 'letterbox top' }), h('div', { class: 'letterbox bottom' }));
    this.dialogue = new Dialogue(this.ui, {
      anchor: (who) => this.anchorFor(who),
      onChar: (who, ch, i) => this.onChar(who, ch, i),
      onLineStart: (line) => this.onLineStart(line),
      onLineEnd: (line) => this.onLineEnd(line),
      margins: () => {
        const cin = document.body.classList.contains('cinematic');
        const lb = cin ? Math.min(window.innerHeight * 0.09, 70) : 0;
        return { top: Math.max(lb, 60), bottom: lb };
      },
    });
    this.labelEl = h('div', { class: 'hotlabel' });
    this.skipEl = h('button', { class: 'skip', text: 'Überspringen ▸▸', type: 'button' });
    this.skipEl.addEventListener('click', (e) => { e.stopPropagation(); this.skipCutscene(); });
    this.hintEl = h('div', { class: 'hint' });
    this.ui.append(this.labelEl, this.skipEl, this.hintEl);
    const canvas = this.app.canvas;
    canvas.addEventListener('pointerdown', (e) => this.onPointer(e));
    canvas.addEventListener('pointermove', (e) => this.onMove(e));
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => this.keys.clear());
    // tapping a bubble also advances
    this.ui.addEventListener('pointerdown', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('.bubble')) { this.audio.unlock(); this.dialogue.advance(); }
    });
  }

  applySettings(): void {
    const s = this.settings;
    this.audio.volumes = { music: s.music, sfx: s.sfx, voice: s.voice };
    this.audio.muted = s.muted;
    this.audio.apply();
    this.dialogue.settings = { speed: s.textSpeed, vtgmGerman: s.vtgmGerman, reduced: s.reducedMotion };
    document.body.classList.toggle('reduced', s.reducedMotion);
    saveSettings(s);
  }

  resize(): void {
    this.cam.resize(this.app.screen.width, this.app.screen.height);
    // touch screens always show the hotspot markers (there is no hover)
    document.body.classList.toggle('touch', matchMedia('(pointer: coarse)').matches);
  }

  /* ------------------------------------------------------------------ the loop */
  start(): void {
    this.app.ticker.add((tk) => {
      if (!this.running || this.paused) return;
      // fixed substeps: slow devices keep real-time pace instead of running in slow motion,
      // and springs/ropes never see a step larger than 1/30 s (a stalled tab is capped at 0.25 s)
      const real = Math.min(tk.deltaMS / 1000, 0.25);
      const n = Math.max(1, Math.ceil(real / STEP - 1e-6));
      for (let i = 0; i < n; i++) this.frame(real / n);
    });
  }

  frame(dt: number): void {
    if (this.seq) {
      this.seq.update(dt);
      if (this.seq.done) this.seq = null;
    }
    this.playerInput(dt);
    this.step(dt);
    this.onTick?.(dt);
    this.updateHotspotUi();
  }

  /** Advances everything by dt (deterministic given the same inputs). */
  step(dt: number): void {
    this.time += dt;
    // game-clock waits advance with the world, so skipping and Lab seeking keep them in step
    if (this.timers.length) {
      const due = this.timers.filter((t) => (t.left -= dt) <= 0);
      if (due.length) { this.timers = this.timers.filter((t) => t.left > 0); for (const t of due) t.done(); }
    }
    this.cabin.update(dt);
    for (const a of Object.values(this.cast)) {
      a.light = this.cabin.actorLight(a.x, a.y - 300);
      a.talk = Math.max(0, a.talk - dt * 9);
      a.step(dt);
    }
    this.stepTosses(dt);
    this.stepTweens(dt);
    for (const at of this.attached) {
      const p = at.a.worldPoint(at.bone, at.sx, at.sy);
      at.s.position.set(p.x, p.y);
    }
    this.cam.update(dt);
    this.dialogue.update(dt);
    this.stepTalkAccents(dt);
    this.stepCards(dt);
  }

  /* ------------------------------------------------------------------ cutscenes */
  cutscene(def: SequenceDef<Game>, opts: { skippable?: boolean; setup?: boolean; letterbox?: boolean } = {}): Promise<void> {
    this.setControl(false);
    if (opts.letterbox !== false) document.body.classList.add('cinematic');
    this.skipEl.classList.toggle('on', opts.skippable !== false);
    const player = new SequencePlayer<Game>(def, this as Game, opts.setup !== false);
    this.seq = player;
    return player.finished.then(() => {
      document.body.classList.remove('cinematic');
      this.skipEl.classList.remove('on');
    });
  }

  skipCutscene(): void {
    if (!this.seq) return;
    const s = this.seq;
    this.audio.silent = true;
    this.dialogue.close();
    s.skip((dt) => this.step(dt));
    this.audio.silent = false;
    this.dialogue.close();
    this.seq = null;
  }

  get inCutscene(): boolean { return !!this.seq; }

  /* ------------------------------------------------------------------ dialogue helpers */
  say(who: Who, text: string, o: Partial<Line> = {}): Promise<void> {
    return this.dialogue.say({ who, text, ...o });
  }
  /** V-TGM speaks English (canon) with a German subtitle. */
  vtgm(text: string, sub: string, o: Partial<Line> = {}): Promise<void> {
    return this.dialogue.say({ who: 'vtgm', text, sub, ...o });
  }
  /** Fire-and-forget line for cutscenes (auto-advances). */
  line(who: Who, text: string, o: Partial<Line> & { sub?: string } = {}): void {
    void this.dialogue.say({ who, text, auto: o.auto ?? 0.9, hold: o.hold ?? 0.25, ...o });
  }

  private anchorFor(who: Who): { x: number; y: number } | null {
    if (who === 'voice' || who === 'pa') return null;
    const a = this.cast[who as keyof Cast];
    if (!a) return null;
    const p = a.headTop();
    const s = this.cam.toScreen(p.x, p.y);
    if (s.x < -40 || s.x > this.cam.viewW + 40) return null;
    return s;
  }

  private onChar(who: Who, ch: string, i: number): void {
    this.audio.blip(who, ch, i);
    const a = this.cast[who as keyof Cast];
    if (a && /[aeiouäöüyAEIOUÄÖÜ]/.test(ch)) a.talk = 1;
  }

  private onLineStart(line: Line): void {
    const a = this.cast[line.who as keyof Cast];
    if (!a) return;
    a.talking = true;
    if (line.mood) a.setExpression(line.mood);
    if (line.anim) void a.play(line.anim, { fade: 0.15 });
    this.talkAccentT[line.who] = 0.25 + this.rng.next() * 0.3;
  }

  private onLineEnd(line: Line): void {
    const a = this.cast[line.who as keyof Cast];
    if (a) a.talking = false;
  }

  /** Small speaking accents (head nods, a hand beat) while a character is talking. */
  private stepTalkAccents(dt: number): void {
    for (const [id, a] of Object.entries(this.cast)) {
      if (!a.talking) continue;
      const t = (this.talkAccentT[id] ?? 1) - dt;
      if (t <= 0) {
        const clip = id !== 'vtgm' && this.rng.next() < 0.3 && a.anim.has('beat') ? 'beat' : 'nod';
        if (a.anim.has(clip)) void a.anim.play(clip, { layer: 'accent', additive: true, fade: 0.08 });
        this.talkAccentT[id] = 0.9 + this.rng.next() * 0.9;
      } else this.talkAccentT[id] = t;
    }
  }

  /* ------------------------------------------------------------------ props */
  spawnProp(id: string, x: number, y: number, z = 60): Sprite {
    const pt = this.props.parts.get(id)!;
    const s = new Sprite(pt.texture);
    s.anchor.set(-pt.x / pt.w, -pt.y / pt.h);
    s.scale.set(1 / this.props.scale);
    s.position.set(x, y);
    s.zIndex = z;
    s.label = 'prop';
    this.cabin.stage.addChild(s);
    return s;
  }

  /** A sprite of one part of an actor's sheet, placed so that sheet point (px, py) sits at (x, y). */
  spawnPart(a: Actor, id: string, px: number, py: number, x: number, y: number, z = 60): Sprite {
    const pt = a.view.atlas.parts.get(id)!;
    const s = new Sprite(pt.texture);
    s.label = 'prop';
    s.anchor.set((px - pt.x) / pt.w, (py - pt.y) / pt.h);
    s.scale.set((a.facingScale() < 0 ? -1 : 1) * a.scale / a.view.atlas.scale, a.scale / a.view.atlas.scale);
    s.position.set(x, y);
    s.zIndex = z;
    this.cabin.stage.addChild(s);
    return s;
  }

  /** An unidentified figure passing in the dark foreground. Deliberately ambiguous. */
  shadowFigure(): Graphics {
    const g = new Graphics();
    g.filters = [new BlurFilter({ strength: 10, quality: 2 })];
    // head, a tall body, one arm carrying something small and boxy
    g.ellipse(0, -620, 70, 82).fill({ color: 0x05050b });
    g.roundRect(-70, -560, 140, 460, 50).fill({ color: 0x05050b });
    g.roundRect(54, -470, 34, 240, 16).fill({ color: 0x05050b });
    g.roundRect(60, -250, 60, 44, 8).fill({ color: 0x05050b });
    g.alpha = 0.92;
    this.cabin.fg.addChild(g);
    return g;
  }

  attach(s: Sprite, a: Actor, bone: string, sx: number, sy: number): void { this.attached.push({ s, a, bone, sx, sy }); }
  detach(s: Sprite): void { const i = this.attached.findIndex((x) => x.s === s); if (i >= 0) this.attached.splice(i, 1); }

  toss(t: Omit<Toss, 't' | 'rot0'>): Toss {
    const o: Toss = { ...t, t: 0, rot0: t.s.rotation };
    this.tosses.push(o);
    return o;
  }

  private stepTosses(dt: number): void {
    for (const o of this.tosses) {
      if (o.landed && o.bounce <= 0) continue;
      o.t += dt;
      const k = clamp(o.t / o.dur);
      const e = ease(o.e ?? 'linear')(k);
      const x = o.x0 + (o.x1 - o.x0) * e;
      const y = o.y0 + (o.y1 - o.y0) * (o.e ? e : k * k) - Math.sin(k * Math.PI) * o.arc;
      o.s.position.set(x, y);
      o.s.rotation = o.rot0 + o.spin * k;
      if (k >= 1 && !o.landed) {
        o.landed = true;
        if (o.sound) this.audio.sfx(o.sound);
        if (o.shake && !this.settings.reducedMotion) this.cam.shake(o.shake);
        if (o.bounce > 0) {
          // a small hop, then rest
          const b = o.bounce;
          o.bounce = 0;
          this.toss({ s: o.s, x0: o.x1, y0: o.y1, x1: o.x1 + o.spin * 6, y1: o.y1, arc: b, dur: 0.22, spin: o.spin * 0.15, bounce: 0, done: o.done });
          o.done = undefined;
        } else o.done?.();
      }
    }
    for (let i = this.tosses.length - 1; i >= 0; i--) if (this.tosses[i].landed && this.tosses[i].bounce <= 0) this.tosses.splice(i, 1);
  }

  /** Tweens numeric properties of any object (actor.x, actor.y, a sprite's alpha…). */
  tween<T extends object>(obj: T, to: Partial<Record<keyof T, number>>, dur: number, e: EaseSpec = 'sineInOut'): Promise<void> {
    const o = obj as unknown as Record<string, number>;
    const keys = Object.keys(to);
    return new Promise((resolve) => {
      let left = keys.length;
      if (!left) { resolve(); return; }
      for (const k of keys) {
        // a new tween on the same property replaces the old one
        for (let i = this.tweens.length - 1; i >= 0; i--) if (this.tweens[i].o === o && this.tweens[i].k === k) this.tweens.splice(i, 1);
        this.tweens.push({ o, k, from: o[k], to: (to as Record<string, number>)[k], t: 0, dur: Math.max(1e-4, dur), e, done: () => { if (--left === 0) resolve(); } });
      }
    });
  }

  private stepTweens(dt: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt;
      const k = clamp(tw.t / tw.dur);
      tw.o[tw.k] = tw.from + (tw.to - tw.from) * ease(tw.e)(k);
      if (k >= 1) { this.tweens.splice(i, 1); tw.done?.(); }
    }
  }

  /* ------------------------------------------------------------------ actor events → sound */
  /** Footsteps, clip sound events and impacts (also used by the Animation Lab's own actors). */
  onActorEvent(a: Actor, e: { name: string; data?: unknown }): void {
    if (e.name === 'step') {
      const sx = this.cam.toScreen(a.x, 0).x / Math.max(1, this.cam.viewW) * 2 - 1;
      this.audio.sfx(`step.${a.id.startsWith('ich') ? 'ich' : a.id}`, { pan: clamp(sx, -0.8, 0.8), gain: a.id === 'r3mi' ? 0.8 : 0.7 });
    } else if (e.name === 'sfx') this.audio.sfx(String(e.data));
    else if (e.name === 'impact' && !this.settings.reducedMotion) this.cam.shake(5);
  }

  /* ------------------------------------------------------------------ player control */
  setControl(on: boolean): void {
    this.controlOn = on;
    if (!on) { this.keys.clear(); this.labelEl.classList.remove('show'); }
    document.body.classList.toggle('playing', on);
  }
  get control(): boolean { return this.controlOn; }
  get touch(): boolean { return matchMedia('(pointer: coarse)').matches; }

  /** Current hotspots (read-only; used by tests and the Lab). */
  get hotspotList(): readonly Hotspot[] { return this.hotspots; }

  setHotspots(list: Hotspot[]): void {
    this.hotspots = list;
    for (const el of this.markerEls.values()) el.remove();
    this.markerEls.clear();
    for (const hs of list) {
      const el = h('div', { class: 'marker' });
      this.ui.append(el);
      this.markerEls.set(hs.id, el);
    }
  }

  hint(text: string | null, ms = 6000): void {
    if (!text) { this.hintEl.classList.remove('show'); return; }
    this.hintEl.innerHTML = text;
    this.hintEl.classList.add('show');
    window.clearTimeout((this.hintEl as unknown as { _t: number })._t);
    (this.hintEl as unknown as { _t: number })._t = window.setTimeout(() => this.hintEl.classList.remove('show'), ms);
  }

  private walkBounds(): [number, number] { return [CABIN.bulkhead + 40, CABIN.lavDoor - 40]; }

  private hitHotspot(px: number, py: number): Hotspot | null {
    const w = this.cam.toWorld(px, py);
    const pad = matchMedia('(pointer: coarse)').matches ? 40 : 10;
    let best: Hotspot | null = null;
    let bestA = Infinity;
    for (const hs of this.hotspots) {
      if (hs.active && !hs.active()) continue;
      if (w.x >= hs.x - pad && w.x <= hs.x + hs.w + pad && w.y >= hs.y - pad && w.y <= hs.y + hs.h + pad) {
        const a = hs.w * hs.h;
        if (a < bestA) { best = hs; bestA = a; }
      }
    }
    return best;
  }

  private onPointer(e: PointerEvent): void {
    this.audio.unlock();
    if (this.dialogue.advance()) return;
    if (!this.controlOn || this.paused) return;
    const hs = this.hitHotspot(e.clientX, e.clientY);
    if (hs) { void this.useHotspot(hs); return; }
    const w = this.cam.toWorld(e.clientX, e.clientY);
    const [lo, hi] = this.walkBounds();
    void this.cast.ich.walkTo(clamp(w.x, lo, hi));
  }

  private onMove(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    this.hover = this.controlOn ? this.hitHotspot(e.clientX, e.clientY) : null;
    this.app.canvas.style.cursor = this.hover ? 'zoom-in' : this.controlOn ? 'pointer' : 'default';
    if (this.hover) {
      this.labelEl.textContent = `${this.hover.verb ?? 'Untersuchen'}: ${this.hover.label}`;
      this.labelEl.style.left = `${e.clientX}px`;
      this.labelEl.style.top = `${e.clientY - 18}px`;
      this.labelEl.classList.add('show');
    } else this.labelEl.classList.remove('show');
  }

  onKeyHook: ((e: KeyboardEvent) => boolean) | null = null;

  private onKey(e: KeyboardEvent, down: boolean): void {
    if (down) this.audio.unlock();
    if (down && this.onKeyHook?.(e)) return;
    const k = e.key;
    if (down && (k === 'Enter' || k === ' ' || k === 'e' || k === 'E')) {
      if (this.dialogue.advance()) { e.preventDefault(); return; }
      if (this.controlOn && this.nearest) { e.preventDefault(); void this.useHotspot(this.nearest); return; }
    }
    if (k === 'Tab' && down) { e.preventDefault(); document.body.classList.toggle('markers'); return; }
    if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(k)) {
      e.preventDefault();
      const key = k.toLowerCase().replace('arrow', '');
      const norm = key === 'a' ? 'left' : key === 'd' ? 'right' : key;
      if (down) this.keys.add(norm); else this.keys.delete(norm);
    }
  }

  private playerInput(_dt: number): void {
    if (!this.controlOn) return;
    const ich = this.cast.ich;
    const dir = (this.keys.has('right') ? 1 : 0) - (this.keys.has('left') ? 1 : 0);
    if (dir !== 0) {
      const [lo, hi] = this.walkBounds();
      // keep a target a stride ahead while the key is held
      void ich.walkTo(clamp(ich.x + dir * 260, lo, hi));
      (this as unknown as { held: boolean }).held = true;
    } else if ((this as unknown as { held: boolean }).held) {
      (this as unknown as { held: boolean }).held = false;
      if (ich.walking) void ich.walkTo(ich.x + ich.facing * 60);
    }
  }

  async useHotspot(hs: Hotspot): Promise<void> {
    if (!this.controlOn) return;
    this.setControl(false);
    this.labelEl.classList.remove('show');
    const ich = this.cast.ich;
    await ich.walkTo(hs.standX);
    // something interrupted the walk (R-3MI's legs, mostly): the cutscene hands control back itself
    if (this.inCutscene) return;
    if (hs.face) ich.face(hs.face);
    try {
      await hs.use();
    } finally {
      if (!this.inCutscene) this.setControl(true);
    }
  }

  private updateHotspotUi(): void {
    const ich = this.cast.ich;
    let best: Hotspot | null = null, bd = 300;
    for (const hs of this.hotspots) {
      const on = this.controlOn && (!hs.active || hs.active());
      const el = this.markerEls.get(hs.id)!;
      el.classList.toggle('on', on);
      el.classList.toggle('seen', this.progress.clues.includes(hs.id) || this.progress.seen.includes(hs.id));
      if (on) {
        const p = this.cam.toScreen(hs.x + hs.w / 2, hs.y + hs.h / 2);
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        const d = Math.abs(hs.standX - ich.x);
        if (d < bd) { bd = d; best = hs; }
      }
    }
    this.nearest = best;
  }

  /* ------------------------------------------------------------------ helpers for scripts */
  /** Waits on the game clock (stops while paused, keeps pace with the game loop). */
  wait(s: number): Promise<void> {
    return new Promise((resolve) => { this.timers.push({ left: s, done: resolve }); });
  }

  until(cond: () => boolean): Promise<void> {
    return new Promise((resolve) => {
      const fn = () => { if (cond()) { this.app.ticker.remove(fn); resolve(); } };
      this.app.ticker.add(fn);
    });
  }

  /** Title card on the game clock (so replays and skips show exactly the same thing). */
  card(t1: string, t2 = '', o: { black?: boolean; comic?: boolean; ms?: number } = {}): Promise<void> {
    const el = h('div', { class: `card${o.black ? ' black' : ''}${o.comic ? ' comic' : ''}` }, h('div', { class: 'inner' }, h('div', { class: 't1', text: t1 }), h('div', { class: 't2', text: t2 })));
    this.ui.append(el);
    el.classList.add('show');
    const hold = (o.ms ?? 2200) / 1000;
    return new Promise((r) => {
      this.cards.push({ el, t: 0, hold, done: r });
    });
  }
  private readonly cards: { el: HTMLElement; t: number; hold: number; done: () => void }[] = [];
  private stepCards(dt: number): void {
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const c = this.cards[i];
      c.t += dt;
      if (c.t >= c.hold) c.el.classList.remove('show');
      if (c.t >= c.hold + 0.6) { c.el.remove(); this.cards.splice(i, 1); c.done(); }
    }
  }
  clearCards(): void { for (const c of this.cards.splice(0)) { c.el.remove(); c.done(); } }

  /** Standing in the aisle (z in front of seats) vs sitting in a row (between backrest and armrest). */
  placeInAisle(a: Actor, x: number): void { a.x = x; a.y = 0; a.root.zIndex = 50; }
  placeInSeat(a: Actor, seatX: number, front = false): void { a.x = seatX; a.y = SEAT_FLOOR; a.root.zIndex = front ? 35 : 25; }

  showLoading(k: number, label: string): void {
    if (!this.loadingEl) {
      this.loadingEl = h('div', { class: 'loading' });
      document.body.append(this.loadingEl);
    }
    this.loadingEl.innerHTML = `<div class="lt">FLUG 303 · BOARDING</div><div class="lb"><i style="width:${Math.round(k * 100)}%"></i></div><div class="ll">${label}</div>`;
  }
  hideLoading(): void { this.loadingEl?.remove(); this.loadingEl = null; }
}
