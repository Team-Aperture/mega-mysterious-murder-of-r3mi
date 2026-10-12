import type { Game } from '../game/game';
import type { Clue } from '../story/clues';
import { h } from './dom';

/** ICH's case file: typewritten, earnest, and wrong. */
export class CaseFile {
  constructor(readonly g: Game, readonly entries: () => Clue[]) {}

  open(): void {
    if (document.querySelector('.overlay.cf')) return;
    const wasControl = this.g.control;
    this.g.setControl(false);
    this.g.paused = true;
    const list = this.entries();
    const paper = h('div', { class: 'casefile', role: 'dialog', 'aria-label': 'Fallakte' },
      h('div', { class: 'stamp', text: 'STRENG GEHEIM' }),
      h('h2', { text: 'FALLAKTE · FLUG 303' }),
      h('div', { class: 'meta', text: 'Ermittler: ICH  ·  Opfer: keines (noch)  ·  Verdächtige: alle' }),
    );
    if (!list.length) paper.append(h('p', { class: 'empty', text: 'Noch keine Beweise. Ein guter Detektiv wartet, bis die Beweise zu ihm kommen. (Oder: mit der Lupe etwas untersuchen.)' }));
    for (const c of list) {
      paper.append(h('div', { class: 'entry' },
        h('b', { text: c.title }),
        h('div', { class: 'obs', text: `Beobachtung: ${c.obs}` }),
        h('div', { class: 'ded', text: `Schlussfolgerung: ${c.ded}` })));
    }
    const close = h('button', { class: 'btn close', text: 'Akte schließen', type: 'button' });
    paper.append(close);
    const ov = h('div', { class: 'overlay cf' }, paper);
    const done = () => {
      ov.remove();
      this.g.paused = false;
      if (wasControl) this.g.setControl(true);
      document.removeEventListener('keydown', onKey, true);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') { e.preventDefault(); e.stopPropagation(); done(); } };
    close.addEventListener('click', done);
    ov.addEventListener('pointerdown', (e) => { if (e.target === ov) done(); });
    document.addEventListener('keydown', onKey, true);
    document.body.append(ov);
    close.focus();
  }
}
