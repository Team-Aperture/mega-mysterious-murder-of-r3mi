import type { Who } from '../ui/dialogue';

/**
 * WebAudio synthesiser: cabin ambience, sound effects, character "babble" voices and a small
 * noir-jazz sequencer. Placeholder audio by design (no recordings); every sound is a recipe.
 */
type Osc = OscillatorType;

const NOTE = (n: string): number => {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
  if (!m) return 0;
  const base: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  let s = base[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, s / 12);
};

export class Synth {
  readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly musicBus: GainNode;
  private readonly sfxBus: GainNode;
  private readonly voiceBus: GainNode;
  private readonly ambBus: GainNode;
  private readonly noise: AudioBuffer;
  private readonly brown: AudioBuffer;
  private ambOn = false;
  private seqTimer: number | null = null;
  private seqName: string | null = null;
  private nextBeat = 0;
  private beat = 0;
  private lastVoice = 0;
  private voicePitch = 0;

  constructor() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    this.master = c.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(comp).connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
    this.voiceBus = c.createGain(); this.voiceBus.connect(this.master);
    this.ambBus = c.createGain(); this.ambBus.connect(this.sfxBus);
    this.noise = this.makeNoise(false);
    this.brown = this.makeNoise(true);
  }

  resume(): void { if (this.ctx.state === 'suspended') void this.ctx.resume(); }

  setVolumes(music: number, sfx: number, voice: number): void {
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(music * 0.5, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(sfx, t, 0.05);
    this.voiceBus.gain.setTargetAtTime(voice * 0.6, t, 0.05);
  }

  private makeNoise(brown: boolean): AudioBuffer {
    const len = this.ctx.sampleRate * 2;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return b;
  }

  /* -------------------------------------------------------------- building blocks */
  private env(g: GainNode, t: number, a: number, peak: number, d: number, sustain = 0, hold = 0): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    if (hold > 0) g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain || 0.0001), t + a + hold + d);
  }

  private tone(type: Osc, f0: number, f1: number, t: number, dur: number, peak: number, bus: AudioNode, opts: { a?: number; filter?: number; q?: number; pan?: number; detune?: number } = {}): void {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (opts.detune) o.detune.value = opts.detune;
    const g = c.createGain();
    this.env(g, t, opts.a ?? 0.005, peak, dur);
    let node: AudioNode = o;
    if (opts.filter) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = opts.filter; f.Q.value = opts.q ?? 0.7;
      node.connect(f); node = f;
    }
    node.connect(g);
    if (opts.pan) { const p = c.createStereoPanner(); p.pan.value = opts.pan; g.connect(p).connect(bus); } else g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  private burst(t: number, dur: number, peak: number, bus: AudioNode, type: BiquadFilterType, freq: number, q = 1, freqEnd?: number, brown = false, a = 0.002): void {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = brown ? this.brown : this.noise;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = c.createGain();
    this.env(g, t, a, peak, dur);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  /* -------------------------------------------------------------- ambience */
  ambience(on: boolean, level = 1): void {
    const c = this.ctx;
    this.ambBus.gain.setTargetAtTime(on ? 0.5 * level : 0, c.currentTime, 0.6);
    if (!on || this.ambOn) return;
    this.ambOn = true;
    // the hum: brown noise, low-passed — constant, steady (an idling aircraft is very steady…)
    const s = c.createBufferSource(); s.buffer = this.brown; s.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const g = c.createGain(); g.gain.value = 0.55;
    s.connect(lp).connect(g).connect(this.ambBus); s.start();
    // a low electrical tone
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 57;
    const og = c.createGain(); og.gain.value = 0.05;
    o.connect(og).connect(this.ambBus); o.start();
    // air from the vents
    const a = c.createBufferSource(); a.buffer = this.noise; a.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2600;
    const ag = c.createGain(); ag.gain.value = 0.018;
    a.connect(hp).connect(ag).connect(this.ambBus); a.start();
    // rain on the fuselage: sparse soft ticks
    const rain = () => {
      if (!this.ambOn) return;
      const t = c.currentTime + 0.05;
      for (let i = 0; i < 3; i++) this.burst(t + Math.random() * 0.25, 0.03, 0.02 + Math.random() * 0.02, this.ambBus, 'bandpass', 3000 + Math.random() * 3000, 2);
      window.setTimeout(rain, 220 + Math.random() * 260);
    };
    rain();
  }

  /* -------------------------------------------------------------- sound effects */
  sfx(name: string, opts: { pan?: number; gain?: number } = {}): void {
    const c = this.ctx;
    const t = c.currentTime + 0.01;
    const k = opts.gain ?? 1;
    const B = this.sfxBus;
    switch (name) {
      case 'chime':
        this.tone('sine', NOTE('E6'), NOTE('E6'), t, 1.4, 0.22 * k, B, { a: 0.003 });
        this.tone('sine', NOTE('E7'), NOTE('E7'), t, 0.5, 0.05 * k, B);
        this.tone('sine', NOTE('C6'), NOTE('C6'), t + 0.45, 1.8, 0.22 * k, B, { a: 0.003 });
        this.tone('sine', NOTE('C7'), NOTE('C7'), t + 0.45, 0.6, 0.05 * k, B);
        break;
      case 'ding':
        this.tone('sine', NOTE('A6'), NOTE('A6'), t, 0.9, 0.12 * k, B);
        break;
      case 'step.ich':
        this.burst(t, 0.05, 0.16 * k, B, 'bandpass', 2400, 3, undefined, false, 0.001);
        this.tone('triangle', 900, 300, t, 0.04, 0.08 * k, B);
        break;
      case 'step.r3mi':
        this.tone('sine', 110, 55, t, 0.14, 0.26 * k, B);
        this.burst(t, 0.07, 0.06 * k, B, 'bandpass', 900, 4);
        break;
      case 'step.vtgm':
        this.tone('sine', 160, 90, t, 0.09, 0.2 * k, B);
        this.tone('sawtooth', 600, 900, t, 0.05, 0.015 * k, B, { filter: 1200 });
        break;
      case 'servo':
        this.tone('sawtooth', 220, 420, t, 0.18, 0.04 * k, B, { filter: 900, q: 6 });
        break;
      case 'bonk':
        this.tone('sine', 700, 180, t, 0.18, 0.4 * k, B);
        this.burst(t, 0.04, 0.12 * k, B, 'lowpass', 1200);
        break;
      case 'klonk':
        for (const [f, a] of [[176, 0.3], [463, 0.18], [719, 0.12], [1180, 0.06]] as const) this.tone('sine', f, f * 0.98, t, 0.6, a * k, B);
        this.burst(t, 0.05, 0.2 * k, B, 'bandpass', 1500, 1);
        break;
      case 'thud':
        this.tone('sine', 120, 45, t, 0.22, 0.42 * k, B);
        this.burst(t, 0.12, 0.12 * k, B, 'lowpass', 500, 1, 200, true);
        break;
      case 'whoosh':
        this.burst(t, 0.35, 0.16 * k, B, 'bandpass', 400, 1.5, 2400);
        break;
      case 'swish':
        this.burst(t, 0.18, 0.08 * k, B, 'bandpass', 1500, 2, 3500);
        break;
      case 'flush':
        this.burst(t, 1.6, 0.22 * k, B, 'lowpass', 2400, 0.8, 300, false, 0.05);
        for (let i = 0; i < 6; i++) this.tone('sine', 300 + Math.random() * 300, 120, t + 0.4 + i * 0.15, 0.12, 0.05 * k, B);
        break;
      case 'door':
        this.burst(t, 0.03, 0.2 * k, B, 'highpass', 3000, 1);
        this.tone('sine', 140, 70, t + 0.03, 0.2, 0.28 * k, B);
        break;
      case 'click':
        this.burst(t, 0.02, 0.2 * k, B, 'highpass', 4000, 1);
        this.tone('square', 1800, 1800, t, 0.015, 0.03 * k, B);
        break;
      case 'latch':
        this.burst(t, 0.03, 0.22 * k, B, 'bandpass', 2600, 2);
        this.tone('triangle', 500, 300, t + 0.02, 0.06, 0.08 * k, B);
        break;
      case 'creak':
        this.tone('sawtooth', 180, 140, t, 0.5, 0.03 * k, B, { filter: 700, q: 9 });
        break;
      case 'powerdown':
        this.tone('sine', 880, 55, t, 1.8, 0.16 * k, B, { a: 0.02 });
        this.tone('triangle', 440, 30, t, 1.6, 0.05 * k, B);
        break;
      case 'powerup':
        this.tone('sine', 80, 900, t, 0.5, 0.12 * k, B, { a: 0.02 });
        break;
      case 'snore': {
        this.burst(t, 0.9, 0.05 * k, B, 'lowpass', 400, 1, 250, true, 0.4);
        this.tone('sine', 900, 1300, t + 1.0, 0.5, 0.02 * k, B, { a: 0.2 });
        break;
      }
      case 'squeak':
        this.tone('sine', 900, 1700, t, 0.12, 0.18 * k, B, { a: 0.01 });
        this.tone('sine', 1600, 1100, t + 0.13, 0.1, 0.12 * k, B);
        break;
      case 'clink':
        this.tone('sine', 2100, 2100, t, 0.3, 0.1 * k, B);
        this.tone('sine', 3150, 3150, t, 0.2, 0.05 * k, B);
        break;
      case 'pop':
        this.tone('sine', 400, 1100, t, 0.07, 0.25 * k, B);
        break;
      case 'clap':
        this.burst(t, 0.06, 0.25 * k, B, 'bandpass', 1500, 1);
        break;
      case 'lightson':
        this.burst(t, 0.03, 0.3 * k, B, 'highpass', 2000, 1);
        this.tone('sawtooth', 120, 120, t + 0.03, 0.6, 0.03 * k, B, { filter: 600 });
        break;
      case 'sting': {
        const notes = ['D3', 'D3', 'Ab3'];
        notes.forEach((n, i) => {
          const tt = t + i * 0.18;
          const dur = i === 2 ? 1.1 : 0.12;
          this.tone('sawtooth', NOTE(n), NOTE(n), tt, dur, 0.16 * k, B, { filter: 1300, a: 0.01 });
          this.tone('sawtooth', NOTE(n) * 1.5, NOTE(n) * 1.5, tt, dur, 0.08 * k, B, { filter: 1300, a: 0.01 });
          this.tone('sine', NOTE(n) / 2, NOTE(n) / 2, tt, dur, 0.2 * k, B);
        });
        break;
      }
      case 'stab':
        this.tone('sawtooth', NOTE('A3'), NOTE('A3'), t, 0.5, 0.14 * k, B, { filter: 1500 });
        this.tone('sawtooth', NOTE('C#4'), NOTE('C#4'), t, 0.5, 0.1 * k, B, { filter: 1500 });
        break;
      case 'scream': {
        // a formant sweep, "AAAH", from somewhere in the dark
        const o = c.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.5); o.frequency.exponentialRampToValueAtTime(560, t + 1.6);
        const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 820; f1.Q.value = 5;
        const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1250; f2.Q.value = 6;
        const g = c.createGain(); this.env(g, t, 0.06, 0.35 * k, 1.6, 0, 0.3);
        o.connect(f1).connect(g); o.connect(f2).connect(g); g.connect(B);
        o.start(t); o.stop(t + 2.1);
        break;
      }
      case 'tick':
        this.burst(t, 0.015, 0.08 * k, B, 'highpass', 5000, 1);
        break;
      default:
        break;
    }
  }

  /* -------------------------------------------------------------- babble voices */
  voice(who: Who, ch: string, i: number): void {
    const c = this.ctx;
    const t = c.currentTime + 0.005;
    if (t - this.lastVoice < 0.045) return;
    if (!/[A-Za-zÄÖÜäöüß0-9]/.test(ch)) return;
    this.lastVoice = t;
    const vowel = /[aeiouäöüAEIOUÄÖÜ]/.test(ch);
    const code = ch.toLowerCase().charCodeAt(0);
    const V = this.voiceBus;
    switch (who) {
      case 'r3mi': {
        const f = 470 + (code % 7) * 26 + (vowel ? 40 : 0);
        this.tone('square', f, f * 1.12, t, 0.05, 0.05, V, { filter: 2600 });
        break;
      }
      case 'vtgm': {
        const f = 290 + (code % 4) * 12;
        this.tone('triangle', f, f, t, 0.06, vowel ? 0.14 : 0.09, V, { filter: 1800 });
        break;
      }
      case 'ich': {
        // pompous: slides between syllables, a little vibrato
        const target = 190 + (code % 6) * 18 + (vowel ? 22 : 0);
        const from = this.voicePitch || target;
        this.voicePitch = target;
        this.tone('sawtooth', from, target, t, 0.08, 0.07, V, { filter: 1100, q: 2, detune: Math.sin(i) * 12 });
        break;
      }
      case 'pa': {
        const f = 150 + (code % 5) * 10;
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.4;
        const g = c.createGain(); this.env(g, t, 0.01, 0.07, 0.08);
        o.connect(bp).connect(g).connect(V); o.start(t); o.stop(t + 0.12);
        if (Math.random() < 0.3) this.burst(t, 0.03, 0.02, V, 'highpass', 3000, 1);
        break;
      }
      case 'voice': {
        this.tone('sawtooth', 380 + (code % 5) * 30, 420, t, 0.07, 0.07, V, { filter: 1600, q: 3 });
        break;
      }
    }
  }

  /* -------------------------------------------------------------- music */
  music(name: string | null): void {
    if (name === this.seqName) return;
    this.seqName = name;
    if (this.seqTimer !== null) { window.clearInterval(this.seqTimer); this.seqTimer = null; }
    if (!name) return;
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.beat = 0;
    this.seqTimer = window.setInterval(() => this.schedule(), 50);
  }

  private schedule(): void {
    const c = this.ctx;
    const bpm = this.seqName === 'tension' ? 70 : 96;
    const spb = 60 / bpm;
    while (this.nextBeat < c.currentTime + 0.25) {
      this.playBeat(this.beat, this.nextBeat, spb);
      this.nextBeat += spb;
      this.beat++;
    }
  }

  /** One beat (quarter note) of the current tune. */
  private playBeat(b: number, t: number, spb: number): void {
    const M = this.musicBus;
    const bar = Math.floor(b / 4) % 4, q = b % 4;
    if (this.seqName === 'detective') {
      // walking bass in D minor
      const bass = [['D2', 'F2', 'A2', 'C3'], ['Bb1', 'D2', 'F2', 'A2'], ['G1', 'Bb1', 'D2', 'F2'], ['A1', 'C#2', 'E2', 'G2']][bar][q];
      this.tone('sine', NOTE(bass), NOTE(bass), t, spb * 0.9, 0.32, M, { a: 0.004 });
      this.tone('triangle', NOTE(bass) * 2, NOTE(bass) * 2, t, spb * 0.25, 0.05, M);
      // brushes: swish on 2 and 4, swung ticks
      if (q === 1 || q === 3) this.burst(t, spb * 0.6, 0.035, M, 'bandpass', 4500, 0.7, 2500);
      this.burst(t, 0.03, 0.03, M, 'highpass', 7000, 1);
      this.burst(t + spb * 0.66, 0.03, 0.02, M, 'highpass', 7000, 1);
      // vibraphone motif (two of every four loops)
      const loop = Math.floor(b / 16) % 4;
      if (loop === 1 || loop === 3) {
        const mel: (string | null)[][] = [['A4', 'D5', 'F5', 'E5'], ['C#5', null, 'A4', null], ['D5', 'F5', 'A5', 'G5'], ['E5', null, null, null]];
        const n = mel[bar][q];
        if (n) {
          this.tone('sine', NOTE(n), NOTE(n), t, spb * 1.6, 0.09, M, { a: 0.004 });
          this.tone('sine', NOTE(n) * 4, NOTE(n) * 4, t, spb * 0.3, 0.012, M);
        }
      }
    } else if (this.seqName === 'night') {
      // a slow, quiet pad: the cabin at night
      if (q === 0) {
        const chord = [['D3', 'A3', 'F4'], ['Bb2', 'F3', 'D4'], ['G2', 'D3', 'Bb3'], ['A2', 'E3', 'C#4']][bar];
        for (const n of chord) this.tone('triangle', NOTE(n), NOTE(n), t, spb * 4, 0.035, M, { a: 0.8, filter: 900 });
      }
    } else if (this.seqName === 'tension') {
      if (q === 0) this.tone('sine', NOTE('D2'), NOTE('D2'), t, spb * 0.8, 0.25, M);
      if (q === 2 && bar % 2 === 1) this.tone('sine', NOTE('Eb2'), NOTE('Eb2'), t, spb * 0.8, 0.2, M);
      this.burst(t, 0.02, 0.015, M, 'highpass', 6000, 1);
    }
  }
}
