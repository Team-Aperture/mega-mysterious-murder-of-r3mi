import type { Game } from '../game/game';
import { clearProgress, CLUES_NEEDED, type Settings } from '../game/state';
import { CLUES } from '../story/clues';
import { h } from './dom';

/** A modal overlay with a focus-trapped panel; resolves when closed. */
function overlay(panel: HTMLElement, onClose?: () => void): () => void {
  const ov = h('div', { class: 'overlay' }, panel);
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); onClose?.(); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  document.body.append(ov);
  (panel.querySelector('button, select, input') as HTMLElement | null)?.focus();
  return close;
}

export function pauseMenu(g: Game): void {
  if (document.querySelector('.overlay')) return;
  const wasControl = g.control;
  g.setControl(false);
  g.paused = true;
  const panel = h('div', { class: 'panel', role: 'dialog', 'aria-label': 'Pause' }, h('h2', { text: 'PAUSE' }));
  const btns = h('div', { class: 'btns' });
  const add = (label: string, fn: () => void, ghost = false) => {
    const b = h('button', { class: `btn${ghost ? ' ghost' : ''}`, text: label, type: 'button' });
    b.addEventListener('click', fn);
    btns.append(b);
  };
  const close = overlay(panel, () => { g.paused = false; if (wasControl && !g.inCutscene) g.setControl(true); });
  add('Weiter', () => close());
  add('Einstellungen', () => { close(); settingsPanel(g); }, true);
  add('Animationslabor', () => { location.href = `${location.pathname}?lab`; }, true);
  add('Kapitel neu starten', () => { clearProgress(); location.href = location.pathname; }, true);
  panel.append(h('p', { style: 'color:var(--ink-dim);font:600 13px var(--font-ui);margin:0', text: 'Fortschritt wird automatisch gespeichert.' }), btns);
}

export function settingsPanel(g: Game, onClose?: () => void): void {
  const s = g.settings;
  const wasControl = g.control;
  g.setControl(false);
  g.paused = true;
  const panel = h('div', { class: 'panel', role: 'dialog', 'aria-label': 'Einstellungen' }, h('h2', { text: 'EINSTELLUNGEN' }));
  const row = (label: string, hint: string, control: HTMLElement) => panel.append(h('div', { class: 'row' }, h('div', {}, label, h('small', { text: hint })), control));
  const slider = (k: keyof Pick<Settings, 'music' | 'sfx' | 'voice'>) => {
    const i = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[k], 'aria-label': k });
    i.addEventListener('input', () => { s[k] = Number(i.value); g.applySettings(); });
    return i;
  };
  const select = <K extends keyof Settings>(k: K, opts: [string, string][], parse: (v: string) => Settings[K], after?: () => void) => {
    const sel = h('select', {});
    for (const [v, l] of opts) sel.append(h('option', { value: v, text: l, ...(String(s[k]) === v ? { selected: true } : {}) }));
    sel.addEventListener('change', () => { s[k] = parse(sel.value); g.applySettings(); after?.(); });
    return sel;
  };
  row('Musik', '', slider('music'));
  row('Effekte', '', slider('sfx'));
  row('Stimmen', 'Synthetisches „Gebrabbel" der Figuren', slider('voice'));
  row('Textgeschwindigkeit', '', select('textSpeed', [['0.7', 'Langsam'], ['1', 'Normal'], ['1.5', 'Schnell'], ['2.2', 'Sehr schnell']], Number));
  row('ICH-Entwurf', 'Drei Designrichtungen zur Auswahl (lädt neu)', select('ichDesign', [['a', 'A · Das Namensschild'], ['b', 'B · Der Aktenschrank'], ['c', 'C · Das Periskop']], (v) => v as 'a' | 'b' | 'c', () => { location.reload(); }));
  row('Bewegung reduzieren', 'Weniger Kamerafahrten, kein Wackeln', select('reducedMotion', [['false', 'Aus'], ['true', 'An']], (v) => v === 'true'));
  const done = h('button', { class: 'btn', text: 'Fertig', type: 'button' });
  panel.append(h('div', { class: 'btns' }, done));
  const close = overlay(panel, () => { g.paused = false; if (wasControl && !g.inCutscene) g.setControl(true); onClose?.(); });
  done.addEventListener('click', () => close());
}

export function endScreen(g: Game): Promise<void> {
  return new Promise((resolve) => {
    const found = g.progress.clues.length;
    const total = Object.keys(CLUES).length;
    const panel = h('div', { class: 'panel', role: 'dialog', 'aria-label': 'Ende von Kapitel 0' },
      h('h2', { text: 'ENDE VON KAPITEL 0' }),
      h('p', { style: 'font:700 15px/1.45 var(--font-ui);margin:0 0 10px', text: 'Ein Prototyp. Danke fürs Mitfliegen auf Flug 303.' }),
      h('div', { class: 'row' }, 'Beweise in der Fallakte', h('b', { text: `${found} von ${total}` })),
      h('div', { class: 'row' }, 'Über R-3MIs Beine gestolpert', h('b', { text: g.progress.tripped ? 'ja (beabsichtigt)' : 'nein' })),
      h('div', { class: 'row' }, 'Gepäckfach 15 geöffnet', h('b', { text: g.progress.binOpened ? 'ja' : 'noch nicht' })),
      h('p', { style: 'color:var(--ink-dim);font:600 13px var(--font-ui);margin:12px 0 0', text: found < total ? `Es gibt noch ${total - found} weitere Dinge, die ICH falsch deuten kann.` : 'ICH hat alles gründlich missverstanden.' }),
    );
    const btns = h('div', { class: 'btns' });
    const add = (label: string, fn: () => void, ghost = false) => {
      const b = h('button', { class: `btn${ghost ? ' ghost' : ''}`, text: label, type: 'button' });
      b.addEventListener('click', fn);
      btns.append(b);
    };
    add('Nochmal spielen', () => { clearProgress(); location.href = location.pathname; });
    add('Animationslabor', () => { location.href = `${location.pathname}?lab`; }, true);
    add('Hauptmenü', () => { location.href = location.pathname; }, true);
    panel.append(btns);
    overlay(panel, () => resolve());
    void CLUES_NEEDED;
  });
}
