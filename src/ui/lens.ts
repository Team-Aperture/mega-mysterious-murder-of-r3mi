import { h } from './dom';

/**
 * The magnifier close-up shown while ICH examines something: a brass lens with a small
 * illustration. These are the clue images; they must be readable at phone size.
 */
const ART: Record<string, string> = {
  coffee: `
    <rect width="200" height="200" fill="#1a1420"/>
    <ellipse cx="100" cy="112" rx="80" ry="34" fill="#efe9dc" stroke="#1b1620" stroke-width="5"/>
    <ellipse cx="100" cy="108" rx="66" ry="25" fill="#3a2414"/>
    <ellipse cx="78" cy="101" rx="20" ry="5" fill="#6a4428" opacity=".8"/>
    <ellipse cx="100" cy="108" rx="66" ry="25" fill="none" stroke="#120c08" stroke-width="3"/>
    <path d="M40 150h120" stroke="#ffe7b3" stroke-width="3" stroke-dasharray="6 6" opacity=".7"/>
    <text x="100" y="172" fill="#ffe7b3" font-family="Nunito, sans-serif" font-weight="900" font-size="13" text-anchor="middle">KEINE WELLE</text>`,
  window: `
    <defs><linearGradient id="lw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0d26"/><stop offset=".62" stop-color="#2a2440"/><stop offset=".66" stop-color="#07070d"/></linearGradient></defs>
    <rect width="200" height="200" fill="url(#lw)"/>
    <g fill="#ffb35c">${Array.from({ length: 14 }, (_, i) => `<circle cx="${10 + i * 14}" cy="${130 + (i % 3)}" r="2.4"/>`).join('')}</g>
    <g fill="#6a9cff">${Array.from({ length: 7 }, (_, i) => `<circle cx="${18 + i * 28}" cy="142" r="2.2"/>`).join('')}</g>
    <g stroke="#cfe0ff" stroke-width="2.5" stroke-linecap="round" opacity=".85">
      <path d="M40 30v30M90 60v34M150 20v26M120 110v30M60 120v22M170 90v30"/>
    </g>
    <g fill="#e8f2ff"><circle cx="40" cy="62" r="4"/><circle cx="90" cy="96" r="4"/><circle cx="150" cy="48" r="4"/><circle cx="120" cy="142" r="4"/><circle cx="60" cy="144" r="4"/><circle cx="170" cy="122" r="4"/></g>
    <text x="100" y="185" fill="#ffe7b3" font-family="Nunito, sans-serif" font-weight="900" font-size="13" text-anchor="middle">↓ NACH UNTEN ↓</text>`,
  seatbelt: `
    <rect width="200" height="200" fill="#1f1d28"/>
    <rect x="30" y="62" width="140" height="76" rx="14" fill="#2a1a06" stroke="#1b1620" stroke-width="5"/>
    <rect x="48" y="92" width="38" height="16" rx="5" fill="#ffb22e"/>
    <rect x="114" y="92" width="38" height="16" rx="5" fill="#ffb22e"/>
    <rect x="86" y="86" width="28" height="28" rx="5" fill="none" stroke="#ffb22e" stroke-width="5"/>
    <circle cx="100" cy="100" r="78" fill="#ffb22e" opacity=".08"/>
    <text x="100" y="168" fill="#ffe7b3" font-family="Nunito, sans-serif" font-weight="900" font-size="13" text-anchor="middle">SEIT STUNDEN AN</text>`,
  card: `
    <rect width="200" height="200" fill="#f2efe6"/>
    <rect x="12" y="12" width="176" height="28" fill="#c0322c"/>
    <text x="100" y="32" fill="#fff" font-family="Nunito, sans-serif" font-weight="900" font-size="14" text-anchor="middle">SICHERHEIT · 3</text>
    <g fill="none" stroke="#2a2d36" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="78" cy="88" r="13"/>
      <path d="M86 100c18 10 30 26 34 46M120 146l22 2M88 104c-4 18 4 34 18 40"/>
      <path d="M60 160h90M70 160v-40h-12"/>
    </g>
    <text x="100" y="186" fill="#2a2d36" font-family="Nunito, sans-serif" font-weight="900" font-size="12" text-anchor="middle">„SCHUTZHALTUNG"</text>`,
  travelbug: `
    <rect width="200" height="200" fill="#202634"/>
    <rect x="40" y="62" width="120" height="76" rx="12" fill="#c9ced6" stroke="#1b1620" stroke-width="5"/>
    <circle cx="62" cy="100" r="8" fill="#7d838d" stroke="#1b1620" stroke-width="3"/>
    <circle cx="118" cy="100" r="22" fill="#3a3e48" stroke="#1b1620" stroke-width="4"/>
    <circle cx="118" cy="100" r="9" fill="#9aa0aa"/>
    <path d="M62 92C44 70 30 56 14 50" stroke="#9aa0aa" stroke-width="5" fill="none"/>
    <text x="100" y="168" fill="#ffe7b3" font-family="Nunito, sans-serif" font-weight="900" font-size="13" text-anchor="middle">TB · REIST</text>`,
  r3mi: `
    <rect width="200" height="200" fill="#151a17"/>
    <path d="M30 40h140l-10 130H40z" fill="#c9c5bb" stroke="#1b1620" stroke-width="5"/>
    <rect x="88" y="70" width="24" height="70" rx="12" fill="#14161a" stroke="#1b1620" stroke-width="4"/>
    <rect x="93" y="76" width="14" height="58" rx="7" fill="#7dffae"/>
    <circle cx="100" cy="105" r="48" fill="#2ecf62" opacity=".18"/>
    <text x="100" y="186" fill="#ffe7b3" font-family="Nunito, sans-serif" font-weight="900" font-size="13" text-anchor="middle">BLINKT · LANGSAM</text>`,
  screen: `
    <rect width="200" height="200" fill="#2a2b33"/>
    <rect x="22" y="40" width="156" height="110" rx="8" fill="#0c1424" stroke="#1b1620" stroke-width="5"/>
    <text x="100" y="80" fill="#9fd2ff" font-family="Nunito, sans-serif" font-weight="900" font-size="13" text-anchor="middle">FLUGROUTE WIRD</text>
    <text x="100" y="98" fill="#9fd2ff" font-family="Nunito, sans-serif" font-weight="900" font-size="13" text-anchor="middle">GELADEN …</text>
    <g fill="#9fd2ff">${Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `<circle cx="${100 + Math.cos(a) * 14}" cy="${124 + Math.sin(a) * 14}" r="3" opacity="${(i + 1) / 8}"/>`; }).join('')}</g>
    <text x="100" y="180" fill="#ffe7b3" font-family="Nunito, sans-serif" font-weight="900" font-size="13" text-anchor="middle">SEIT DEM EINSTEIGEN</text>`,
};

export class Lens {
  readonly el = h('div', { class: 'lens', 'aria-hidden': 'true' });
  constructor(root: HTMLElement) { root.append(this.el); }
  show(id: string, caption = ''): void {
    this.el.innerHTML = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${ART[id] ?? ''}</svg>${caption ? `<div class="cap">${caption}</div>` : ''}`;
    requestAnimationFrame(() => this.el.classList.add('show'));
  }
  hide(): void { this.el.classList.remove('show'); }
}
