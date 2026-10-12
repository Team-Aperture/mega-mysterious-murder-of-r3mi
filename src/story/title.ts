import type { Game } from '../game/game';
import { clearProgress, loadProgress, defaultProgress } from '../game/state';
import { h } from '../ui/dom';
import { settingsPanel } from '../ui/menus';
import { resetWorld } from './scenes';

type StartPhase = 'intro' | 'explore' | 'meet' | 'investigate' | 'ending';

/**
 * Title sequence: a split-flap departure board (FLUG 303 · VERSPÄTET → BOARDING BEENDET, never
 * "departed"), the title letters drop in with squash and stretch, ICH struts in, strikes The Pose,
 * and the last letter of MURDER falls on his hat. He throws it back. Then the menu.
 */
export async function startTitle(g: Game, opts: { skipGate?: boolean } = {}): Promise<void> {
  resetWorld(g);
  const { ich, r3mi, vtgm } = g.cast;
  r3mi.root.visible = false;
  vtgm.root.visible = false;
  g.cabin.nightLevel = 0.75;
  await g.cam.moveTo(-1020, -430, 1.12, 0);
  ich.root.visible = false;

  if (!opts.skipGate) await gate(g);
  g.audio.ambience(true, 0.7);
  g.audio.music('night');
  void g.cam.moveTo(-860, -430, 1.12, 9, 'sineInOut');

  const ui = h('div', { class: 'title' });
  const board = h('div', { class: 'board', 'aria-label': 'Abflugtafel: Flug 303' });
  const rows = ['FLUG 303        ', 'ZIEL ???        ', 'VERSPÄTET       '].map((txt) => {
    const r = h('div', { class: 'row' });
    for (const ch of txt) r.append(h('span', { class: 'flap', text: ch === ' ' ? ' ' : ch }));
    board.append(r);
    return r;
  });
  const ttl = h('div', { class: 'ttl', role: 'heading', 'aria-level': 1, 'aria-label': 'THE MEGA MYSTERIOUS MURDER OF R-3MI' });
  const line = (cls: string, text: string, green?: string) => {
    const d = h('div', { class: cls });
    const gi = green ? text.indexOf(green) : -1;
    Array.from(text).forEach((ch, i) => {
      const span = h('span', { class: 'ch', text: ch === ' ' ? ' ' : ch });
      if (gi >= 0 && i >= gi) span.classList.add('g');
      d.append(span);
    });
    return d;
  };
  const l1 = line('l1', 'THE MEGA MYSTERIOUS');
  const l2 = line('l2', 'MURDER');
  const l3 = line('l3', 'OF R-3MI', 'R-3MI');
  ttl.append(l1, l2, l3);
  const sub = h('div', { class: 'sub', text: 'A Completely Non-Canon Team_Aperture Mystery' });
  ui.append(board, ttl, sub);
  g.ui.append(ui);
  const credit = h('div', { class: 'credit', text: 'TEAM_APERTURE · PROTOTYP 0.1' });
  g.ui.append(credit);

  // any click or key jumps to the end state of the title
  let skipping = false;
  const skip = () => { skipping = true; };
  window.addEventListener('pointerdown', skip);
  window.addEventListener('keydown', skip);
  const wait = (s: number) => (skipping ? Promise.resolve() : g.wait(s));

  await wait(0.4);
  board.classList.add('show');
  g.audio.sfx('chime', { gain: 0.6 });
  await wait(1.6);
  await flipRow(g, rows[2], 'BOARDING BEENDET', () => skipping);
  await wait(0.5);
  const drop = async (el: HTMLElement, gap: number, sound = 'tick') => {
    for (const ch of Array.from(el.children) as HTMLElement[]) {
      ch.classList.add('in');
      if (!skipping) { g.audio.sfx(sound, { gain: 0.5 }); await g.wait(gap); }
    }
  };
  await drop(l1, 0.035);
  await wait(0.2);
  await drop(l2, 0.06, 'thud');
  if (!skipping && !g.settings.reducedMotion) g.cam.shake(4);
  await wait(0.25);
  await drop(l3, 0.05);
  g.audio.music('detective');

  // ICH struts in from the right (on short screens the title fills the middle, so he stops to the side)
  const stopX = g.cam.x + (window.innerHeight < 500 && window.innerWidth > window.innerHeight ? g.cam.halfW * 0.62 : 120);
  if (!skipping) {
    g.placeInAisle(ich, g.cam.x + g.cam.halfW + 220);
    ich.face(-1, true);
    ich.root.visible = true;
    await ich.walkTo(stopX);
  }
  ich.stopWalking();
  g.placeInAisle(ich, stopX);
  ich.face(-1, true);
  ich.root.visible = true;
  if (!skipping) {
    void ich.play('pose', { fade: 0.15 });
    ich.setExpression('proud');
    g.audio.sfx('sting');
    await g.wait(1.4);
  }
  if (!skipping) {
    // the last letter of MURDER loses its grip
    const r = l2.lastElementChild as HTMLElement;
    const rb = r.getBoundingClientRect();
    const top = ich.headTop();
    const head = g.cam.toScreen(top.x, top.y);
    r.classList.add('fall');
    r.style.transform = 'rotate(-12deg)';
    g.audio.sfx('creak');
    await g.wait(0.5);
    r.style.transform = `translate(${head.x - (rb.left + rb.width / 2)}px, ${head.y - rb.bottom + 10}px) rotate(28deg)`;
    await g.wait(0.52);
    g.audio.sfx('bonk');
    void ich.play('bonked', { fade: 0.03 });
    ich.setExpression('shocked');
    await g.wait(1.1);
    ich.setExpression('neutral');
    void ich.play('tossUp', { fade: 0.1 });
    await g.wait(0.25);
    g.audio.sfx('whoosh');
    r.classList.remove('fall');
    r.classList.add('back');
    r.style.transform = '';
    await g.wait(0.6);
    g.audio.sfx('pop');
    void ich.play('hatAdjust', { fade: 0.2 });
    await g.wait(1.0);
  }
  for (const el of [l1, l2, l3]) for (const ch of Array.from(el.children)) ch.classList.add('in');
  ich.idle(0.4);
  ich.setExpression('neutral');
  window.removeEventListener('pointerdown', skip);
  window.removeEventListener('keydown', skip);
  sub.classList.add('show');
  const phase = await menu(g);
  ui.remove();
  credit.remove();
  const { runChapter } = await import('./chapter0');
  await runChapter(g, phase);
}

/** "Zum Einsteigen klicken": a gesture is needed before any audio may play. */
function gate(g: Game): Promise<void> {
  return new Promise((resolve) => {
    const el = h('div', { class: 'gate', role: 'button', tabindex: 0, 'aria-label': 'Einsteigen' },
      h('div', { class: 'lights' }, h('i', { style: 'background:#ff6f61;color:#ff6f61' }), h('i', { style: 'background:#ffb22e;color:#ffb22e' }), h('i', { style: 'background:#5dff9a;color:#5dff9a' })),
      h('div', { class: 'g1', text: 'FLUG 303 · BOARDING' }),
      h('div', { class: 'g2', text: g.touch ? 'Zum Einsteigen tippen' : 'Zum Einsteigen klicken oder eine Taste drücken' }),
      h('div', { class: 'g3', text: 'MIT TON · KOPFHÖRER EMPFOHLEN' }),
      h('div', { class: 'g4', text: '↻ Im Querformat siehst du mehr von der Kabine' }),
    );
    const go = () => {
      g.audio.unlock();
      el.style.transition = 'opacity .5s';
      el.style.opacity = '0';
      window.setTimeout(() => el.remove(), 520);
      window.removeEventListener('keydown', go);
      el.removeEventListener('pointerdown', go);
      resolve();
    };
    el.addEventListener('pointerdown', go);
    window.addEventListener('keydown', go);
    document.body.append(el);
  });
}

async function flipRow(g: Game, row: HTMLElement, target: string, fast: () => boolean): Promise<void> {
  const flaps = Array.from(row.children) as HTMLElement[];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ0123456789';
  const t = target.padEnd(flaps.length, ' ').slice(0, flaps.length);
  for (let step = 0; step < 7; step++) {
    const last = step === 6 || fast();
    flaps.forEach((f, i) => {
      f.textContent = last ? (t[i] === ' ' ? ' ' : t[i]) : chars[(i * 7 + step * 5) % chars.length];
      f.classList.remove('flip');
      void f.offsetWidth;
      f.classList.add('flip');
    });
    if (last) break;
    g.audio.sfx('tick', { gain: 0.7 });
    await g.wait(0.07);
  }
}

function menu(g: Game): Promise<StartPhase> {
  return new Promise((resolve) => {
    const saved = loadProgress();
    const canContinue = !!saved && saved.phase !== 'intro' && saved.phase !== 'done' && saved.phase !== 'title';
    const m = h('div', { class: 'menu', role: 'menu' });
    const add = (label: string, fn: () => void, ghost = false) => {
      const b = h('button', { class: `btn${ghost ? ' ghost' : ''}`, text: label, type: 'button', role: 'menuitem' });
      b.addEventListener('click', (e) => { e.stopPropagation(); g.audio.unlock(); fn(); });
      m.append(b);
      return b;
    };
    const start = (phase: StartPhase) => {
      m.classList.remove('show');
      window.setTimeout(() => m.remove(), 600);
      resolve(phase);
    };
    const fresh = () => { clearProgress(); g.progress = defaultProgress(); start('intro'); };
    const first = add(canContinue ? 'Fortsetzen' : 'Neuer Fall', () => {
      if (canContinue && saved) { g.progress = saved; start(saved.phase as StartPhase); } else fresh();
    });
    if (canContinue) add('Neuer Fall', fresh, true);
    add('Animationslabor', () => { location.href = `${location.pathname}?lab`; }, true);
    add('Einstellungen', () => settingsPanel(g), true);
    g.ui.append(m);
    requestAnimationFrame(() => { m.classList.add('show'); first.focus(); });
  });
}
