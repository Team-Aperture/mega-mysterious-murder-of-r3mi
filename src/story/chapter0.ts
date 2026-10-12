import type { Game, Hotspot } from '../game/game';
import { CLUES_NEEDED, saveProgress, type Phase } from '../game/state';
import { CABIN, MARK, SEAT_FLOOR, rowX } from '../world/layout';
import { AVALANCHE, BIN_X, ENDING, ENTRANCE, NOCH_NICHT, OPENING, SEAT_STRUGGLE, TRIP, resetWorld, seatedState } from './scenes';
import { CLUES } from './clues';
import { Lens } from '../ui/lens';
import { CaseFile } from '../ui/casefile';
import { Hud } from '../ui/hud';

/**
 * Chapter 0: „Boarding abgeschlossen". The flow is plain async code; cutscenes are
 * deterministic sequences (see scenes.ts) so they can also be replayed in the Animation Lab.
 */
export async function runChapter(g: Game, from: Phase = g.progress.phase): Promise<void> {
  const ui = new ChapterUi(g);
  g.progress.phase = from === 'title' || from === 'done' ? 'intro' : from;
  const save = (p: Phase) => { g.progress.phase = p; saveProgress(g.progress); };
  g.audio.ambience(true);

  if (g.progress.phase === 'intro') {
    g.progress = { ...g.progress, clues: [], seen: [], tripped: false, binOpened: false, choice: -1 };
    await g.cutscene(OPENING);
    await g.cutscene(ENTRANCE);
    save('explore');
  } else {
    resetWorld(g);
  }

  if (g.progress.phase === 'explore') {
    if (from === 'explore') { g.placeInAisle(g.cast.ich, CABIN.lavDoor - 40); g.cast.ich.face(-1, true); g.cast.r3mi.setExpression('anxious', true); }
    g.audio.music('detective');
    g.cam.follow = () => ({ x: g.cast.ich.x, lead: g.cast.ich.facing * 160 + (g.cast.ich.walking ? g.cast.ich.facing * 60 : 0) });
    g.cam.ty = -430; g.cam.tz = 1;
    g.setHotspots(hotspots(g, ui, 'explore'));
    g.setControl(true);
    g.hint(g.touch
      ? 'Tippe auf den Boden, um zu gehen. Tippe auf die <b>Lupen</b>, um etwas zu untersuchen.'
      : 'Klicke auf den Boden (oder <kbd>A</kbd> / <kbd>D</kbd>), um zu gehen. Klicke Dinge an (oder <kbd>E</kbd>), um sie zu untersuchen. <kbd>Tab</kbd> zeigt alles Untersuchbare.', 9000);
    await g.until(() => g.control && g.cast.ich.x < MARK.meetIch + 380 && !g.dialogue.busy);
    g.setControl(false);
    g.hint(null);
    save('meet');
  }

  if (g.progress.phase === 'meet') {
    if (from === 'meet') resetWorld(g);
    await meeting(g);
    await g.cutscene(SEAT_STRUGGLE);
    await g.cutscene(NOCH_NICHT);
    save('investigate');
  }

  if (g.progress.phase === 'investigate') {
    if (from === 'investigate') { resetWorld(g); seatedState(g); }
    await investigation(g, ui);
    save('ending');
  }

  if (g.progress.phase === 'ending') {
    g.setHotspots([]);
    ui.hud.setClues(-1);
    await g.cutscene(ENDING);
    save('done');
    await ui.end();
  }
}

/* ====================================================================== the meeting */
async function meeting(g: Game): Promise<void> {
  const { ich, r3mi, vtgm } = g.cast;
  g.cam.follow = null;
  g.setHotspots([]);
  document.body.classList.add('cinematic');
  g.cam.frame([vtgm.x, r3mi.x, MARK.meetIch], -440, 280, 0.85, 1.2);
  await ich.walkTo(MARK.meetIch);
  ich.face(-1);
  await g.say('ich', 'Keine Panik. ICH bin hier.', { anim: 'pose', mood: 'proud' });
  r3mi.face(1);
  void r3mi.play('flinch');
  r3mi.setExpression('panic');
  vtgm.face(1);
  await g.say('r3mi', '… Wer?', { mood: 'curious', pre: 0.4 });
  ich.idle(0.3);
  await g.say('ich', 'ICH.', { hold: 0.5 });
  await g.say('r3mi', 'Ja. Aber *wer*?');
  void ich.play('pointSelf', { fade: 0.15 });
  await g.say('ich', 'ICH.', { hold: 0.9 });
  ich.idle(0.4);
  vtgm.setExpression('deadpan');
  await g.vtgm('It’s written on his face. In font size nine hundred.', 'Es steht ihm im Gesicht. In Schriftgröße neunhundert.');
  void r3mi.play('wave');
  await g.say('r3mi', 'Oh! Hiii, ICH!', { mood: 'happy' });
  r3mi.idle(0.4);
  void ich.play('hatTip', { fade: 0.15 });
  await g.say('ich', 'Detektiv ICH. Privatermittler. Spezialgebiet: alles.', { mood: 'proud' });
  ich.idle(0.3);
  await g.vtgm('Solved any cases?', 'Schon Fälle gelöst?');

  const pick = await g.dialogue.choose(['„Hunderte."', '„Ich ermittle gerade."', '[Dramatische Pose]']);
  g.progress.choice = pick;
  if (pick === 0) {
    await g.say('ich', 'Hunderte.', { mood: 'proud', anim: 'aha' });
    ich.idle(0.3);
    await g.vtgm('Name one.', 'Nenn einen.');
    void ich.play('nervous', { fade: 0.2 });
    ich.setExpression('nervous');
    await g.say('ich', '… Den Fall des verschwundenen … Falls.', { pre: 1.1 });
    r3mi.setExpression('curious');
    await g.say('r3mi', 'Oh! Und? Wurde er gefunden?');
    await g.say('ich', 'Das ist … noch in Bearbeitung.');
    ich.idle(0.3);
    ich.setExpression('neutral');
  } else if (pick === 1) {
    void ich.play('chinStroke', { fade: 0.2 });
    await g.say('ich', 'Ich ermittle gerade.');
    await g.vtgm('In what?', 'Worin?');
    await g.say('ich', 'Das weiß ich erst, wenn ich es gefunden habe. So funktioniert Detektivarbeit.');
    ich.idle(0.3);
    void vtgm.play('eyeRoll', { layer: 'face' });
    await g.vtgm('That’s not how anything works.', 'So funktioniert gar nichts.');
  } else {
    void ich.play('pose', { fade: 0.1 });
    ich.setExpression('proud');
    g.audio.sfx('sting');
    await g.wait(2.6);
    g.audio.sfx('snore', { gain: 0.4 });
    await g.wait(1.2);
    await r3mi.play('clap');
    r3mi.idle(0.3);
    await g.vtgm('That was not an answer.', 'Das war keine Antwort.');
    await g.say('ich', 'Es war eine Haltung.');
    ich.idle(0.3);
  }
  ich.setExpression('neutral');
  r3mi.setExpression('neutral');
  await g.vtgm('So: zero.', 'Also null.');
  await g.say('ich', 'Null ist auch eine Zahl, V-TGM.', { anim: 'aha' });
  ich.idle(0.3);
  r3mi.face(-1);
  document.body.classList.remove('cinematic');
}

/* ====================================================================== the investigation */
async function investigation(g: Game, ui: ChapterUi): Promise<void> {
  const ich = g.cast.ich;
  g.audio.music('detective');
  g.cam.follow = () => ({ x: ich.x, lead: ich.facing * 160 });
  g.cam.ty = -430; g.cam.tz = 1;
  g.setHotspots(hotspots(g, ui, 'investigate'));
  ui.hud.setClues(g.progress.clues.length);
  g.setControl(true);
  g.hint(`Ermittle: Untersuche mindestens <b>${CLUES_NEEDED}</b> Dinge mit der Lupe.`, 7000);

  // R-3MI's legs are in the aisle: the first time ICH walks into them, he trips
  const legsLo = rowX(14) - 430, legsHi = rowX(14) - 150;
  let lastX = ich.x;
  g.onTick = () => {
    const x = ich.x;
    const crossing = (lastX > legsHi && x <= legsHi) || (lastX < legsLo && x >= legsLo);
    lastX = x;
    // free walking or on the way to something: either way he has to cross the legs
    if (!crossing || g.inCutscene || g.dialogue.busy) return;
    if (!g.progress.tripped) {
      g.progress.tripped = true;
      saveProgress(g.progress);
      void (async () => {
        await g.cutscene(TRIP, { setup: false, letterbox: false, skippable: false });
        g.setControl(true);
      })();
    } else if (!ich.anim.current('arms')) {
      // after that: arms out, very carefully
      void ich.play('balance', { layer: 'arms', fade: 0.15 });
      void g.wait(1.5).then(() => ich.anim.stop('arms', 0.3));
    }
  };
  await g.until(() => g.progress.clues.length >= CLUES_NEEDED && g.control && !g.dialogue.busy && !g.inCutscene);
  g.setControl(false);
  g.onTick = null;
  g.hint(null);
  // the summary
  await ich.walkTo(Math.max(ich.x, 160));
  ich.face(-1);
  void ich.play('aha', { fade: 0.2 });
  await g.say('ich', 'ICH habe genug Beweise.', { mood: 'proud' });
  ich.idle(0.3);
  await g.vtgm('Evidence of what?', 'Beweise wofür?');
  await g.say('ich', 'Das verrate ich, wenn es so weit ist.');
  await g.vtgm('So: never.', 'Also nie.');
  void ich.play('hatTip', { fade: 0.15 });
  await g.say('ich', 'Spätestens dann.');
  ich.idle(0.3);
  g.setHotspots([]);
}

/** Records a clue in the case file (once) and updates the HUD. */
function found(g: Game, ui: ChapterUi, id: string): void {
  if (!g.progress.clues.includes(id)) {
    g.progress.clues.push(id);
    saveProgress(g.progress);
    g.audio.sfx('ding');
    ui.hud.setClues(g.progress.clues.length, true);
  }
}

/** Shared examine choreography: lean in with the magnifier, show the close-up, talk. */
async function examine(g: Game, ui: ChapterUi, art: string, caption: string, lines: () => Promise<void>, pose: 'examine' | 'examineUp' = 'examine'): Promise<void> {
  const ich = g.cast.ich;
  void ich.play(pose, { fade: 0.2 });
  g.audio.sfx('swish');
  ui.lens.show(art, caption);
  await g.wait(0.5);
  try { await lines(); } finally {
    ui.lens.hide();
    ich.idle(0.3);
  }
}

/**
 * Where ICH has to stand (facing left) so his lens ends up over world x `cx`: the leaning
 * examine reaches about 335 units ahead of his feet, the raised one about 108 (measured).
 */
const lensAt = (cx: number, pose: 'examine' | 'examineUp'): number => cx + (pose === 'examine' ? 335 : 108);

function hotspots(g: Game, ui: ChapterUi, phase: 'explore' | 'investigate'): Hotspot[] {
  const { ich, vtgm } = g.cast;
  const inv = phase === 'investigate';
  const seenOnce = (id: string) => { if (!g.progress.seen.includes(id)) { g.progress.seen.push(id); saveProgress(g.progress); } };
  const list: Hotspot[] = [
    {
      id: 'coffee', label: 'Kaffeebecher', x: rowX(15) + 98, y: SEAT_FLOOR - 352, w: 50, h: 60, standX: lensAt(rowX(15) + 123, 'examine'), face: -1,
      use: async () => {
        if (!inv) { await g.say('ich', 'Ein Kaffee. Fremdes Eigentum. Noch.'); return; }
        await examine(g, ui, 'coffee', 'KAFFEE · 16C', async () => {
          await g.say('ich', 'Ein Kaffee. Unberührt. Die Oberfläche: vollkommen still. Kein Wackeln. Keine Welle.');
          void ich.play('aha', { fade: 0.2 });
          await g.say('ich', 'Daraus folgt zwingend:', { hold: 0.6 });
          await g.say('ich', '… Dieser Pilot ist ein *Genie*.', { pre: 0.8, mood: 'proud' });
          vtgm.look = { x: rowX(13) - 148, y: -566 };
          await g.vtgm('Hm.', 'Hm.', { hold: 0.6 });
          vtgm.look = null;
          ich.setExpression('neutral');
        });
        found(g, ui, 'coffee');
      },
    },
    {
      id: 'window', label: 'Fenster', x: rowX(15) - 196, y: -644, w: 96, h: 156, standX: lensAt(rowX(15) - 148, 'examineUp'), face: -1,
      use: async () => {
        if (!inv) { await g.say('ich', 'Draußen ist es dunkel. Typisch für die Nacht.'); return; }
        await examine(g, ui, 'window', 'FENSTER · 15', async () => {
          await g.say('ich', 'Regen. Er läuft nach unten.', { hold: 1.0 });
          await g.say('ich', 'Exakt wie erwartet. Die Physik ist auf unserer Seite.', { pre: 0.6 });
        }, 'examineUp');
        found(g, ui, 'window');
      },
    },
    {
      id: 'seatbelt', label: 'Anschnallzeichen', x: rowX(15) - 30, y: -704, w: 64, h: 40, standX: lensAt(rowX(15) + 2, 'examineUp'), face: -1,
      use: async () => {
        if (!inv) { await g.say('ich', 'Ein Lämpchen. Es leuchtet. Ich behalte es im Auge.'); return; }
        await examine(g, ui, 'seatbelt', 'ANSCHNALLZEICHEN', async () => {
          await g.say('ich', 'Das Anschnallzeichen. Es leuchtet. Seit Stunden.');
          void ich.play('chinStroke', { fade: 0.2 });
          await g.say('ich', 'Jemand will uns etwas sagen.', { hold: 0.6 });
          await g.say('ich', 'Vermutlich: anschnallen.', { pre: 0.7 });
        }, 'examineUp');
        found(g, ui, 'seatbelt');
      },
    },
    {
      id: 'card', label: 'Sicherheitskarte', x: rowX(14) + 18, y: SEAT_FLOOR - 318, w: 34, h: 60, standX: lensAt(rowX(14) + 35, 'examine'), face: -1,
      active: () => inv,
      use: async () => {
        await examine(g, ui, 'card', 'SITZTASCHE · 15C', async () => {
          await g.say('ich', 'Notfallanweisungen. Bild drei: Ein Mensch, zusammengekrümmt, Kopf auf den Knien.');
          await g.say('ich', 'Alle Passagiere auf dieser Karte haben Bauchschmerzen. Eine *Epidemie*.', { mood: 'shocked' });
          await g.vtgm('That’s the brace position.', 'Das ist die Schutzhaltung.');
          await g.say('ich', 'Das sagen sie alle.', { mood: 'neutral' });
        });
        found(g, ui, 'card');
      },
    },
    {
      id: 'travelbug', label: 'Gepäckfach 15', x: rowX(15) - 262, y: CABIN.binTop, w: 300, h: 180, standX: BIN_X, face: -1,
      active: () => inv && !g.progress.binOpened,
      use: async () => {
        g.progress.binOpened = true;
        await g.cutscene(AVALANCHE, { setup: false, letterbox: false });
        ui.lens.show('travelbug', 'TRAVEL BUG');
        await g.wait(1.6);
        ui.lens.hide();
        found(g, ui, 'travelbug');
      },
    },
    {
      id: 'r3mi', label: 'R-3MI', x: rowX(14) - 330, y: -760, w: 300, h: 560, standX: rowX(14) + 40, face: -1,
      active: () => inv,
      use: async () => {
        await examine(g, ui, 'r3mi', 'R-3MI · 14C', async () => {
          await g.say('ich', 'R-3MI. Auge: aus. Brustlicht: blinkt. Langsam.');
          await g.say('ich', 'Er lebt. Vermutlich.', { hold: 0.6 });
          await g.say('ich', 'Ich notiere: *lebt*.', { pre: 0.4 });
        });
        found(g, ui, 'r3mi');
      },
    },
    {
      id: 'screen', label: 'Bildschirm', x: CABIN.bulkhead - 180, y: -722, w: 260, h: 164, standX: lensAt(CABIN.bulkhead - 50, 'examineUp'), face: -1,
      use: async () => {
        if (!inv) { await g.say('ich', 'Ein Bildschirm. Er lädt. Ich auch, gewissermaßen.'); return; }
        await examine(g, ui, 'screen', 'BILDSCHIRM', async () => {
          await g.say('ich', '„Flugroute wird geladen." Seit wir eingestiegen sind.');
          await g.say('ich', 'Die Technik von heute. Unglaublich *gründlich*.');
        }, 'examineUp');
        found(g, ui, 'screen');
      },
    },
    // flavour only
    {
      id: 'vtgm', label: 'V-TGM', verb: 'Sprechen', x: rowX(13) - 230, y: -560, w: 200, h: 320, standX: rowX(13) - 520, face: 1,
      active: () => inv,
      use: async () => {
        seenOnce('vtgm');
        void vtgm.play('toCamera', { layer: 'face' });
        await g.vtgm('Don’t.', 'Lass es.');
        await g.say('ich', 'Ich habe noch gar nichts gesagt.');
        await g.vtgm('Keep it that way.', 'Dabei bleibt’s.');
      },
    },
    {
      id: 'trolley', label: 'Servierwagen', x: CABIN.trolley - 70, y: -390, w: 140, h: 360, standX: CABIN.trolley - 130, face: 1,
      use: async () => {
        seenOnce('trolley');
        void ich.play('chinStroke', { fade: 0.2 });
        await g.say('ich', 'Ein Servierwagen. Bremsen angezogen. Er plant also nicht zu fliehen.');
        await g.say('ich', 'Noch nicht.');
        ich.idle(0.3);
      },
    },
    {
      id: 'exit', label: 'Notausgang', x: CABIN.exitDoor - 60, y: -800, w: 230, h: 760, standX: CABIN.exitDoor + 40, face: 1,
      use: async () => { seenOnce('exit'); await g.say('ich', 'Der Notausgang. Nur für Notfälle.'); await g.say('ich', 'Ich notiere: Es gibt Notfälle.'); },
    },
    {
      id: 'lav', label: 'Toilette', x: CABIN.lavDoor, y: -780, w: 200, h: 740, standX: CABIN.lavDoor - 40, face: 1,
      use: async () => { seenOnce('lav'); await g.say('ich', 'Das stille Örtchen. Mein Büro.'); },
    },
    {
      id: 'reader', label: 'Lesender Passagier', x: rowX(11) - 200, y: -480, w: 200, h: 300, standX: rowX(11) + 20, face: -1,
      use: async () => {
        seenOnce('reader');
        await g.say('ich', 'Er liest. Um diese Uhrzeit.');
        void ich.play('chinStroke', { fade: 0.2 });
        await g.say('ich', 'Höchst verdächtig.');
        ich.idle(0.3);
      },
    },
  ];
  return list;
}

/* ====================================================================== chapter UI */
class ChapterUi {
  readonly lens: Lens;
  readonly hud: Hud;
  readonly casefile: CaseFile;
  constructor(readonly g: Game) {
    this.lens = new Lens(g.ui);
    this.casefile = new CaseFile(g, () => g.progress.clues.map((id) => CLUES[id]).filter(Boolean));
    this.hud = new Hud(g, this.casefile);
  }
  async end(): Promise<void> {
    const { endScreen } = await import('../ui/menus');
    await endScreen(this.g);
  }
}
