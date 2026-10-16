import { h } from './dom';

/**
 * Dialogue presentation: comic speech bubbles anchored to the speaker's head, a typewriter with
 * character-specific pacing, punctuation pauses and *emphasised* words, V-TGM's canon English
 * line with a German subtitle, the captain's PA bar, and dialogue choices.
 *
 * Timing matters for comedy, so lines can carry a `hold` (a beat after the last character) and
 * `pre` (a pause before anyone speaks: the awkward silence).
 */
export type Who = 'ich' | 'r3mi' | 'vtgm' | 'voice' | 'pa';

export interface Line {
  who: Who;
  /** Spoken text. *word* = emphasis. For V-TGM this is English (canon). */
  text: string;
  /** German subtitle (V-TGM). */
  sub?: string;
  /** Expression for the speaker while speaking. */
  mood?: string;
  /** Clip to play when the line starts. */
  anim?: string;
  /** Silence before the bubble appears (s). */
  pre?: number;
  /** Beat after the text has fully appeared before it can be continued / auto-advances (s). */
  hold?: number;
  /** Auto-advance this many seconds after the text is complete (cutscenes). */
  auto?: number;
  /** Bubble style. */
  style?: 'thought' | 'whisper' | 'shout';
}

export const NAMES: Record<Who, string> = { ich: 'ICH', r3mi: 'R-3MI', vtgm: 'V-TGM', voice: '???', pa: 'KAPITÄN' };

/** Characters per second, per voice. ICH savours his words; R-3MI rushes when nervous. */
const CPS: Record<Who, number> = { ich: 34, r3mi: 46, vtgm: 38, voice: 30, pa: 40 };

interface Glyph { el: HTMLElement; at: number; ch: string }

interface Active {
  line: Line;
  el: HTMLElement;
  glyphs: Glyph[];
  t: number;
  end: number;
  readyAt: number;
  ready: boolean;
  resolve: () => void;
  closing: boolean;
  lastChar: number;
}

export interface DialogueDeps {
  /** Screen position of the speaker's head top, or null if not on stage. */
  anchor(who: Who): { x: number; y: number } | null;
  /** Called for every revealed character (voice blips, talk animation). */
  onChar(who: Who, ch: string, i: number): void;
  onLineStart(line: Line): void;
  onLineEnd(line: Line): void;
  /** Top/bottom screen margins currently reserved (HUD, letterbox). */
  margins(): { top: number; bottom: number };
}

export interface DialogueSettings { speed: number; reduced: boolean }

export class Dialogue {
  readonly layer = h('div', { class: 'bubbles', 'aria-live': 'polite' });
  readonly paEl = h('div', { class: 'pa', role: 'status' });
  private active: Active | null = null;
  private paActive: Active | null = null;
  private choiceEl: HTMLElement | null = null;
  private pending = 0;
  private timers: { left: number; done: () => void }[] = [];
  settings: DialogueSettings = { speed: 1, reduced: false };

  constructor(readonly root: HTMLElement, readonly deps: DialogueDeps) {
    root.append(this.layer, this.paEl);
  }

  get busy(): boolean { return !!this.active || !!this.paActive || !!this.choiceEl; }
  get speaking(): Who | null { return this.active?.line.who ?? null; }

  /** Shows a line and resolves when it is dismissed (click/tap/key or auto). */
  async say(line: Line): Promise<void> {
    if (line.who === 'pa') return this.pa(line);
    if (line.pre) await this.wait(line.pre);
    this.close();
    const shown = this.textFor(line);
    const el = h('div', { class: `bubble ${line.who}${line.style ? ' ' + line.style : ''}${this.deps.anchor(line.who) ? '' : ' offscreen'}` });
    el.append(h('span', { class: 'name', text: NAMES[line.who] }));
    const txt = h('span', { class: 'txt' });
    el.append(txt);
    const glyphs = this.build(txt, shown.text, line.who, 0);
    let end = glyphs.length ? glyphs[glyphs.length - 1].at : 0;
    if (shown.sub) {
      const sub = h('span', { class: 'sub' });
      el.append(sub);
      // the subtitle types along with the line, so reading never lags behind
      const sg = this.build(sub, shown.sub, line.who, 0, Math.max(0.6, end) / Math.max(1, shown.sub.length));
      glyphs.push(...sg.map((g) => ({ ...g, ch: '' })));
      end = Math.max(end, sg.length ? sg[sg.length - 1].at : 0);
    }
    el.append(h('span', { class: 'tail' }), h('span', { class: 'next' }));
    this.layer.append(el);
    return new Promise((resolve) => {
      this.active = { line, el, glyphs, t: 0, end, readyAt: end + (line.hold ?? 0.15), ready: false, resolve, closing: false, lastChar: -1 };
      this.deps.onLineStart(line);
      this.position();
    });
  }

  /** The captain's announcement (top bar, auto-advancing). */
  pa(line: Line): Promise<void> {
    const el = this.paEl;
    el.innerHTML = '';
    el.append(h('span', { class: 'who', text: 'DURCHSAGE · KAPITÄN' }));
    const txt = h('span', { class: 'txt' });
    el.append(txt);
    const glyphs = this.build(txt, line.text, 'pa', 0);
    const end = glyphs.length ? glyphs[glyphs.length - 1].at : 0;
    el.classList.add('show');
    return new Promise((resolve) => {
      this.paActive = { line, el, glyphs, t: 0, end, readyAt: end + (line.hold ?? 0.6), ready: false, resolve, closing: false, lastChar: -1 };
      this.deps.onLineStart(line);
    });
  }

  /** Presents choices; resolves with the chosen index. */
  choose(options: string[]): Promise<number> {
    this.choiceEl?.remove();
    // ignores input for a moment, so a tap meant to advance the previous line can't pick an answer
    const wrap = h('div', { class: 'choices arming', role: 'menu' });
    window.setTimeout(() => wrap.classList.remove('arming'), 400);
    return new Promise((resolve) => {
      const pick = (i: number) => {
        if (wrap.classList.contains('arming')) return;
        wrap.remove();
        this.choiceEl = null;
        document.removeEventListener('keydown', onKey, true);
        resolve(i);
      };
      let sel = 0;
      const btns = options.map((o, i) => {
        const b = h('button', { class: 'choice', role: 'menuitem' }, h('span', { class: 'k', text: `${i + 1}` }), o);
        b.addEventListener('click', (e) => { e.stopPropagation(); pick(i); });
        return b;
      });
      const mark = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
      const onKey = (e: KeyboardEvent) => {
        const n = Number(e.key);
        if (n >= 1 && n <= options.length) { e.preventDefault(); e.stopPropagation(); pick(n - 1); }
        else if (e.key === 'ArrowDown' || e.key === 's') { sel = (sel + 1) % options.length; mark(); e.preventDefault(); e.stopPropagation(); }
        else if (e.key === 'ArrowUp' || e.key === 'w') { sel = (sel - 1 + options.length) % options.length; mark(); e.preventDefault(); e.stopPropagation(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); pick(sel); }
      };
      document.addEventListener('keydown', onKey, true);
      wrap.append(...btns);
      this.root.append(wrap);
      this.choiceEl = wrap;
      mark();
    });
  }

  /** Player input: completes the typing, or continues. Returns true if it consumed the input. */
  advance(): boolean {
    const a = this.active;
    if (!a) return false;
    if (a.line.auto !== undefined && a.line.auto < 0) return true; // locked cutscene line
    if (!a.ready) {
      if (a.t < a.end) { a.t = a.end; this.reveal(a); }
      a.readyAt = Math.min(a.readyAt, a.t + 0.12);
      return true;
    }
    this.finish(a);
    return true;
  }

  close(): void {
    if (this.active) this.finish(this.active, true);
  }

  /** Drops everything on screen and pending (world reset, Lab seeking). Pending promises never resolve. */
  reset(): void {
    if (this.active) { this.active.el.remove(); this.active = null; }
    this.layer.innerHTML = '';
    this.paActive = null;
    this.paEl.classList.remove('show');
    this.choiceEl?.remove();
    this.choiceEl = null;
    this.timers = [];
    this.pending = 0;
  }

  private finish(a: Active, silent = false): void {
    if (a.closing) return;
    a.closing = true;
    if (this.active === a) this.active = null;
    a.el.classList.add('out');
    window.setTimeout(() => a.el.remove(), 180);
    this.deps.onLineEnd(a.line);
    if (!silent || true) a.resolve();
  }

  update(dt: number): void {
    const a = this.active;
    if (a && !a.closing) {
      a.t += dt * this.settings.speed;
      this.reveal(a);
      if (!a.ready && a.t >= a.readyAt) { a.ready = true; a.el.classList.add('ready'); }
      if (a.ready && a.line.auto !== undefined && a.line.auto >= 0 && a.t >= a.readyAt + a.line.auto) this.finish(a);
    }
    const p = this.paActive;
    if (p && !p.closing) {
      p.t += dt * this.settings.speed;
      this.reveal(p);
      if (p.t >= p.readyAt + (p.line.auto ?? 1.2)) {
        p.closing = true;
        this.paActive = null;
        this.paEl.classList.remove('show');
        this.deps.onLineEnd(p.line);
        p.resolve();
      }
    }
    if (this.pending > 0) this.pending = Math.max(0, this.pending - dt);
    if (this.timers.length) {
      const due = this.timers.filter((t) => (t.left -= dt * this.settings.speed) <= 0);
      if (due.length) { this.timers = this.timers.filter((t) => t.left > 0); for (const t of due) t.done(); }
    }
    this.position();
  }

  /** Waits in dialogue time, stepped by update() (so cutscene seeking stays consistent). */
  private wait(s: number): Promise<void> {
    return new Promise((r) => { this.timers.push({ left: s, done: r }); });
  }

  /** V-TGM always speaks English, with the German line as a subtitle (team decision, canon). */
  private textFor(line: Line): { text: string; sub?: string } {
    return { text: line.text, sub: line.sub };
  }

  /** Builds per-character spans with reveal times (punctuation pauses, *emphasis*). */
  private build(parent: HTMLElement, text: string, who: Who, t0: number, fixedStep?: number): Glyph[] {
    const out: Glyph[] = [];
    let t = t0;
    const cps = CPS[who];
    let shout: HTMLElement | null = null;
    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === '*') {
        if (shout) { shout = null; } else { shout = h('span', { class: 'shout' }); parent.append(shout); }
        continue;
      }
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.visibility = 'hidden';
      (shout ?? parent).append(span);
      out.push({ el: span, at: t, ch });
      if (fixedStep !== undefined) { t += fixedStep; continue; }
      t += (shout ? 1.6 : 1) / cps;
      const next = chars[i + 1];
      if (ch === '…') t += 0.45;
      else if ((ch === '.' || ch === '!' || ch === '?') && (next === ' ' || next === undefined || next === '\n')) t += 0.32;
      else if (ch === ',' || ch === ';' || ch === ':') t += 0.13;
      else if (ch === '—' || ch === '–') t += 0.22;
    }
    return out;
  }

  private reveal(a: Active): void {
    for (let i = a.lastChar + 1; i < a.glyphs.length; i++) {
      const g = a.glyphs[i];
      if (g.at > a.t) break;
      g.el.style.visibility = 'visible';
      a.lastChar = i;
      if (g.ch && g.ch.trim()) this.deps.onChar(a.line.who, g.ch, i);
    }
  }

  /**
   * Keeps the bubble above its speaker's head, inside the screen. If there is no room above
   * (R-3MI is 2.2 m tall in a 2.25 m cabin), the bubble moves beside the head instead of
   * covering the face.
   */
  private position(): void {
    const a = this.active;
    if (!a) return;
    const el = a.el;
    const W = window.innerWidth, H = window.innerHeight;
    const m = this.deps.margins();
    const bw = el.offsetWidth, bh = el.offsetHeight;
    const anc = this.deps.anchor(a.line.who);
    let ax = W / 2, ay = m.top + bh + 40;
    if (anc) { ax = anc.x; ay = anc.y - 16; }
    let left = ax - bw * 0.4;
    left = Math.max(10, Math.min(W - bw - 10, left));
    let top = ay - bh - 24;
    let side: '' | 'left' | 'right' = '';
    if (top < m.top + 18 && anc) {
      // beside the head: on whichever side has more room
      const room = (W - ax) > ax ? 'right' : 'left';
      side = room;
      top = Math.max(m.top + 18, Math.min(H - m.bottom - bh - 10, anc.y + 30 - bh * 0.3));
      left = room === 'right' ? ax + 70 : ax - 70 - bw;
      left = Math.max(10, Math.min(W - bw - 10, left));
    } else if (top < m.top + 18) top = m.top + 18;
    top = Math.min(top, H - m.bottom - bh - 10);
    const tx = Math.max(22, Math.min(bw - 22, ax - left));
    el.style.setProperty('--tx', `${tx}px`);
    el.style.setProperty('--ty', `${Math.max(18, Math.min(bh - 18, (anc ? anc.y + 30 : 0) - top))}px`);
    el.classList.toggle('side-left', side === 'right');
    el.classList.toggle('side-right', side === 'left');
    el.classList.remove('below');
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }
}
