/**
 * Musik latar instrumental yang disintesis langsung di browser (Web Audio,
 * OfflineAudioContext). Sengaja nggak pakai file lagu: lagu populer berhak
 * cipta bisa bikin Status/Reels di-mute atau di-take down, dan bundling file
 * musik pihak ketiga punya urusan lisensi sendiri. Ini 100% buatan sendiri.
 */

export type MusicMood = "ceria" | "santai" | "semangat";

export const MUSIC_MOODS: Array<{ id: MusicMood; label: string; description: string }> = [
  { id: "ceria", label: "🎵 Ceria", description: "Pop riang, cocok promo harian" },
  { id: "santai", label: "☕ Santai", description: "Lo-fi kalem, cocok sore/malam" },
  { id: "semangat", label: "⚡ Semangat", description: "Beat cepat, cocok promo/diskon" },
];

type DrumStyle = "pop" | "lofi" | "four";

type MoodConfig = {
  bpm: number;
  /** Akor per bar (nada MIDI), diulang terus. */
  chords: number[][];
  /** Nada bass per bar (MIDI) -- satu oktaf di atas bass "beneran" supaya kedengaran di speaker HP. */
  bass: number[];
  drums: DrumStyle;
  arpWave: OscillatorType;
  padWave: OscillatorType;
  /** 0..1, dorongan 8th note kedua (swing ala lo-fi). */
  swing: number;
};

const MOODS: Record<MusicMood, MoodConfig> = {
  // C - G - Am - F
  ceria: {
    bpm: 112,
    chords: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]],
    bass: [48, 43, 45, 41],
    drums: "pop",
    arpWave: "square",
    padWave: "triangle",
    swing: 0,
  },
  // Am7 - Dm7 - G7 - Cmaj7
  santai: {
    bpm: 84,
    chords: [[57, 60, 64, 67], [57, 60, 62, 65], [55, 59, 62, 65], [55, 59, 60, 64]],
    bass: [45, 50, 43, 48],
    drums: "lofi",
    arpWave: "triangle",
    padWave: "triangle",
    swing: 0.18,
  },
  // Am - F - C - G
  semangat: {
    bpm: 124,
    chords: [[57, 60, 64], [57, 60, 65], [55, 60, 64], [55, 59, 62]],
    bass: [45, 41, 48, 43],
    drums: "four",
    arpWave: "sawtooth",
    padWave: "sawtooth",
    swing: 0,
  },
};

const SAMPLE_RATE = 44100;
const FADE_IN = 0.4;
const FADE_OUT = 1.5;

function midiToHz(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function createNoiseBuffer(ctx: BaseAudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Seed tetap supaya hasil musik selalu sama persis untuk mood yang sama.
  let seed = 1234567;
  for (let i = 0; i < data.length; i += 1) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    data[i] = (seed / 2147483648) * 2 - 1;
  }
  return buffer;
}

type Voice = { ctx: OfflineAudioContext; out: AudioNode };

function playTone(v: Voice, opts: { freq: number; start: number; dur: number; wave: OscillatorType; gain: number; attack?: number; release?: number; cutoff?: number; detune?: number }) {
  const { ctx } = v;
  const osc = ctx.createOscillator();
  osc.type = opts.wave;
  osc.frequency.value = opts.freq;
  if (opts.detune) osc.detune.value = opts.detune;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = opts.cutoff ?? 4000;

  const amp = ctx.createGain();
  const attack = opts.attack ?? 0.01;
  const release = opts.release ?? 0.1;
  const end = opts.start + opts.dur;
  amp.gain.setValueAtTime(0, opts.start);
  amp.gain.linearRampToValueAtTime(opts.gain, opts.start + attack);
  amp.gain.setValueAtTime(opts.gain, Math.max(opts.start + attack, end - release));
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(filter).connect(amp).connect(v.out);
  osc.start(opts.start);
  osc.stop(end + 0.02);
}

function playPluck(v: Voice, freq: number, start: number, wave: OscillatorType, gain: number, cutoff: number) {
  const { ctx } = v;
  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(300, cutoff / 4), start + 0.25);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
  osc.connect(filter).connect(amp).connect(v.out);
  osc.start(start);
  osc.stop(start + 0.35);
}

function playKick(v: Voice, start: number, gain: number) {
  const { ctx } = v;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, start);
  osc.frequency.exponentialRampToValueAtTime(48, start + 0.12);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
  osc.connect(amp).connect(v.out);
  osc.start(start);
  osc.stop(start + 0.35);
}

function playNoiseHit(v: Voice, noise: AudioBuffer, start: number, opts: { type: BiquadFilterType; freq: number; q?: number; decay: number; gain: number }) {
  const { ctx } = v;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type;
  filter.frequency.value = opts.freq;
  if (opts.q) filter.Q.value = opts.q;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(opts.gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + opts.decay);
  src.connect(filter).connect(amp).connect(v.out);
  src.start(start, (start * 7.31) % 0.5);
  src.stop(start + opts.decay + 0.02);
}

function playSnare(v: Voice, noise: AudioBuffer, start: number, gain: number) {
  playNoiseHit(v, noise, start, { type: "bandpass", freq: 1900, q: 0.7, decay: 0.18, gain });
  playTone(v, { freq: 190, start, dur: 0.09, wave: "triangle", gain: gain * 0.5, attack: 0.002, release: 0.08, cutoff: 2000 });
}

function scheduleDrums(v: Voice, noise: AudioBuffer, style: DrumStyle, barStart: number, beat: number, swing: number) {
  const eighth = (index: number) => barStart + index * (beat / 2) + (index % 2 === 1 ? swing * (beat / 2) : 0);

  for (let i = 0; i < 8; i += 1) {
    const isOffbeat = i % 2 === 1;
    const hatGain = style === "lofi" ? 0.05 : style === "four" && isOffbeat ? 0.12 : 0.07;
    const hatDecay = style === "four" && isOffbeat ? 0.12 : 0.045;
    playNoiseHit(v, noise, eighth(i), { type: "highpass", freq: 7500, decay: hatDecay, gain: hatGain });
  }

  if (style === "four") {
    for (let b = 0; b < 4; b += 1) playKick(v, barStart + b * beat, 0.9);
  } else if (style === "pop") {
    playKick(v, barStart, 0.85);
    playKick(v, barStart + 2 * beat, 0.85);
    playKick(v, eighth(5), 0.5);
  } else {
    playKick(v, barStart, 0.6);
    playKick(v, eighth(5), 0.45);
  }

  const snareGain = style === "lofi" ? 0.18 : 0.3;
  playSnare(v, noise, barStart + beat, snareGain);
  playSnare(v, noise, barStart + 3 * beat, snareGain);
}

/**
 * Render musik latar sepanjang `durationSec`. Bar pertama intro tanpa drum,
 * lalu full band; awal & akhir diberi fade. Hasil dinormalisasi supaya puncaknya
 * aman (nggak pecah/clipping) di speaker HP.
 */
export async function renderBackgroundMusic(mood: MusicMood, durationSec: number): Promise<AudioBuffer> {
  if (typeof OfflineAudioContext === "undefined") {
    throw new Error("Browser ini nggak bisa bikin musik latar.");
  }
  const config = MOODS[mood];
  const length = Math.max(1, Math.ceil(durationSec * SAMPLE_RATE));
  const ctx = new OfflineAudioContext(2, length, SAMPLE_RATE);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.2;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(0.8, Math.min(FADE_IN, durationSec / 4));
  master.gain.setValueAtTime(0.8, Math.max(FADE_IN, durationSec - FADE_OUT));
  master.gain.linearRampToValueAtTime(0, durationSec);
  master.connect(compressor).connect(ctx.destination);

  const panLeft = ctx.createStereoPanner();
  panLeft.pan.value = -0.35;
  panLeft.connect(master);
  const panRight = ctx.createStereoPanner();
  panRight.pan.value = 0.35;
  panRight.connect(master);

  const center: Voice = { ctx, out: master };
  const left: Voice = { ctx, out: panLeft };
  const right: Voice = { ctx, out: panRight };
  const noise = createNoiseBuffer(ctx);

  const beat = 60 / config.bpm;
  const bar = beat * 4;
  const bars = Math.ceil(durationSec / bar);
  const arpPattern = [0, 1, 2, 1, 0, 2, 1, 2];

  for (let barIndex = 0; barIndex < bars; barIndex += 1) {
    const barStart = barIndex * bar;
    const chord = config.chords[barIndex % config.chords.length];
    const bassNote = config.bass[barIndex % config.bass.length];

    // Pad: akor panjang, lembut, dua lapis sedikit detune biar "lebar".
    chord.forEach((note, i) => {
      const voice = i % 2 === 0 ? left : right;
      playTone(voice, { freq: midiToHz(note), start: barStart, dur: bar, wave: config.padWave, gain: 0.045, attack: 0.08, release: 0.3, cutoff: 1600, detune: -6 });
      playTone(voice === left ? right : left, { freq: midiToHz(note), start: barStart, dur: bar, wave: config.padWave, gain: 0.03, attack: 0.08, release: 0.3, cutoff: 1600, detune: 7 });
    });

    // Arpeggio: nada akor satu oktaf ke atas, per 8th note.
    for (let i = 0; i < 8; i += 1) {
      const note = chord[arpPattern[i] % chord.length] + 12;
      const swingShift = i % 2 === 1 ? config.swing * (beat / 2) : 0;
      playPluck(i % 2 === 0 ? left : right, midiToHz(note), barStart + i * (beat / 2) + swingShift, config.arpWave, config.arpWave === "sawtooth" ? 0.07 : 0.09, 3200);
    }

    // Bass: per ketukan (semangat: per setengah ketukan supaya lebih nge-drive).
    const bassSteps = config.drums === "four" ? 8 : 4;
    const stepLen = bar / bassSteps;
    for (let s = 0; s < bassSteps; s += 1) {
      const octaveJump = config.drums === "four" && s % 2 === 1 ? 12 : 0;
      playTone(center, { freq: midiToHz(bassNote + octaveJump), start: barStart + s * stepLen, dur: stepLen * 0.9, wave: "triangle", gain: 0.22, attack: 0.005, release: 0.05, cutoff: 900 });
    }

    if (barIndex > 0) scheduleDrums(center, noise, config.drums, barStart, beat, config.swing);
  }

  const rendered = await ctx.startRendering();

  // Normalisasi puncak ke ~-2 dBFS: cukup lantang di HP, tanpa clipping.
  let peak = 0;
  for (let ch = 0; ch < rendered.numberOfChannels; ch += 1) {
    const data = rendered.getChannelData(ch);
    for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  }
  if (peak > 0) {
    const scale = 0.79 / peak;
    for (let ch = 0; ch < rendered.numberOfChannels; ch += 1) {
      const data = rendered.getChannelData(ch);
      for (let i = 0; i < data.length; i += 1) data[i] *= scale;
    }
  }
  return rendered;
}
