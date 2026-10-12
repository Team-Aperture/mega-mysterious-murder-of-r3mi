/**
 * ICH's case file. Each clue: what he saw, and what he concluded. The conclusions are wrong in
 * entertaining ways; one is accidentally right (team: see docs/SPOILERS_TEAM_ONLY.md).
 */
export interface Clue { id: string; title: string; obs: string; ded: string }

export const CLUES: Record<string, Clue> = {
  coffee: { id: 'coffee', title: 'Kaffeebecher, 16C', obs: 'Unberührt. Oberfläche vollkommen still. Kein Wackeln, keine Welle.', ded: 'Daraus folgt zwingend: Der Pilot ist ein Genie.' },
  window: { id: 'window', title: 'Fenster, Reihe 15', obs: 'Regen. Er läuft nach unten.', ded: 'Exakt wie erwartet. Die Physik ist auf unserer Seite.' },
  seatbelt: { id: 'seatbelt', title: 'Anschnallzeichen', obs: 'Leuchtet. Seit Stunden. Ununterbrochen.', ded: 'Jemand will uns etwas sagen. Vermutlich: anschnallen. Botschaft entschlüsselt.' },
  card: { id: 'card', title: 'Sicherheitskarte, Sitztasche 15C', obs: 'Bild 3: ein Mensch, zusammengekrümmt, Kopf auf den Knien.', ded: 'Massen-Bauchschmerz an Bord. Vertuscht als „Schutzhaltung".' },
  travelbug: { id: 'travelbug', title: 'Travel Bug, Gepäckfach 15', obs: 'Reist um die Welt, von Hand zu Hand. Lag unter einer Gummiente.', ded: 'Zufall? Ja.' },
  r3mi: { id: 'r3mi', title: 'R-3MI, Sitz 14C', obs: 'Auge: aus. Brustlicht: blinkt. Langsam. Reagiert auf nichts.', ded: 'Status: lebt. Vermutlich.' },
  screen: { id: 'screen', title: 'Bildschirm, vorne', obs: '„Flugroute wird geladen …" Seit dem Einsteigen.', ded: 'Die Technik von heute. Unglaublich gründlich.' },
};
