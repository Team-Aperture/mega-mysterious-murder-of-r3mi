import type { Game } from '../game/game';
import { CLUES_NEEDED } from '../game/state';
import type { CaseFile } from './casefile';
import { h } from './dom';
import { pauseMenu } from './menus';

const ICON = {
  file: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10l4 4v14H5z"/><path d="M8 11h8M8 15h8M8 7h4"/></svg>',
  menu: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  sound: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>',
  mute: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>',
  lens: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/></svg>',
};

/** Top bar: case file, clue counter, markers toggle, sound, menu. Hidden during cutscenes. */
export class Hud {
  readonly el = h('div', { class: 'hud' });
  private readonly clues = h('div', { class: 'clues', role: 'status' });
  private readonly sound: HTMLButtonElement;

  constructor(readonly g: Game, casefile: CaseFile) {
    const file = h('button', { class: 'hbtn', type: 'button', 'aria-label': 'Fallakte öffnen (F)' });
    file.innerHTML = `${ICON.file}<span class="lbl">Fallakte</span>`;
    file.addEventListener('click', () => casefile.open());
    const marks = h('button', { class: 'hbtn', type: 'button', 'aria-label': 'Untersuchbares zeigen (Tab)' });
    marks.innerHTML = ICON.lens;
    marks.addEventListener('click', () => document.body.classList.toggle('markers'));
    this.sound = h('button', { class: 'hbtn', type: 'button', 'aria-label': 'Ton an/aus (M)' });
    this.sound.addEventListener('click', () => this.toggleSound());
    const menu = h('button', { class: 'hbtn', type: 'button', 'aria-label': 'Menü (Esc)' });
    menu.innerHTML = `${ICON.menu}<span class="lbl">Menü</span>`;
    menu.addEventListener('click', () => pauseMenu(g));
    this.el.append(file, this.clues, h('div', { class: 'spacer' }), marks, this.sound, menu);
    g.ui.append(this.el);
    this.setClues(-1);
    this.paintSound();
    g.onKeyHook = (e) => {
      if (e.key === 'Escape' && !document.querySelector('.overlay')) { pauseMenu(g); return true; }
      if ((e.key === 'f' || e.key === 'F') && !document.querySelector('.overlay')) { casefile.open(); return true; }
      if (e.key === 'm' || e.key === 'M') { this.toggleSound(); return true; }
      return false;
    };
    // on touch screens the markers are the only way to discover hotspots
    if (g.touch) document.body.classList.add('markers');
  }

  setClues(n: number, pulse = false): void {
    if (n < 0) { this.clues.style.display = 'none'; return; }
    this.clues.style.display = '';
    this.clues.textContent = n >= CLUES_NEEDED ? `Hinweise ${n} ✓` : `Hinweise ${n}/${CLUES_NEEDED}`;
    this.clues.classList.toggle('done', n >= CLUES_NEEDED);
    if (pulse) this.clues.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'cubic-bezier(.2,1.6,.4,1)' });
  }

  private toggleSound(): void {
    this.g.settings.muted = !this.g.settings.muted;
    this.g.applySettings();
    this.paintSound();
  }
  private paintSound(): void { this.sound.innerHTML = this.g.settings.muted ? ICON.mute : ICON.sound; }
}
