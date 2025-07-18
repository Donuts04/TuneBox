import * as Tone from "tone";

export interface SamplerInstrument {
  id: string;
  name: string;
  type: "sampler";
  urls: Record<string, string>;
  baseUrl: string;
}

export interface SynthInstrument {
  id: string;
  name: string;
  type: "synth";
  options: Tone.SynthOptions;
}

export interface AMSynthInstrument {
  id: string;
  name: string;
  type: "amSynth";
  options: Tone.AMSynthOptions;
}

export interface FMSynthInstrument {
  id: string;
  name: string;
  type: "fmSynth";
  options: Tone.FMSynthOptions;
}

export type Instrument =
  | SamplerInstrument
  | SynthInstrument
  | AMSynthInstrument
  | FMSynthInstrument;

export const INSTRUMENTS: Instrument[] = [
  {
    id: "musicBox",
    name: "Music Box",
    type: "sampler",
    urls: {
      C4: "music-box-note-c_C_major.wav",
    },
    baseUrl: "/",
  },
  {
    id: "piano",
    name: "Piano",
    type: "sampler",
    urls: {
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  },
  {
    id: "grandPiano",
    name: "Grand Piano",
    type: "sampler",
    urls: {
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      A5: "A5.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  },
  {
    id: "synth",
    name: "Synth",
    type: "synth",
    options: {
      oscillator: {
        type: "sine",
        phase: 0,
        volume: 0,
        mute: false,
        onstop: () => {},
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
        attackCurve: "linear",
        decayCurve: "linear",
        releaseCurve: "linear",
      },
      portamento: 0,
      onsilence: () => {},
      detune: 0,
      volume: 0,
      context: Tone.context,
    },
  },
  {
    id: "warmSynth",
    name: "Warm Synth",
    type: "synth",
    options: {
      oscillator: {
        type: "triangle",
        phase: 0,
        volume: 0,
        mute: false,
        onstop: () => {},
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.4,
        release: 1.5,
        attackCurve: "exponential",
        decayCurve: "exponential",
        releaseCurve: "exponential",
      },
      portamento: 0.1,
      onsilence: () => {},
      detune: -10,
      volume: 0,
      context: Tone.context,
    },
  },
  {
    id: "softPad",
    name: "Soft Pad",
    type: "synth",
    options: {
      oscillator: {
        type: "sine",
        phase: 0,
        volume: 0,
        mute: false,
        onstop: () => {},
      },
      envelope: {
        attack: 0.5,
        decay: 0.3,
        sustain: 0.2,
        release: 2,
        attackCurve: "exponential",
        decayCurve: "exponential",
        releaseCurve: "exponential",
      },
      portamento: 0.2,
      onsilence: () => {},
      detune: 5,
      volume: 0,
      context: Tone.context,
    },
  },
  {
    id: "amSynth",
    name: "AM Synth",
    type: "amSynth",
    options: {
      harmonicity: 3,
      oscillator: {
        type: "sine",
        phase: 0,
        volume: 0,
        mute: false,
        onstop: () => {},
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
        attackCurve: "linear",
        decayCurve: "linear",
        releaseCurve: "linear",
      },
      portamento: 0,
      onsilence: () => {},
      detune: 0,
      volume: 0,
      context: Tone.context,
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
        attackCurve: "linear",
        decayCurve: "linear",
        releaseCurve: "linear",
      },
      modulation: {
        type: "sine",
        phase: 0,
        volume: 0,
        mute: false,
        onstop: () => {},
      },
    },
  },
  {
    id: "fmSynth",
    name: "FM Synth",
    type: "fmSynth",
    options: {
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: {
        type: "sine",
        phase: 0,
        volume: 0,
        mute: false,
        onstop: () => {},
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
        attackCurve: "linear",
        decayCurve: "linear",
        releaseCurve: "linear",
      },
      portamento: 0,
      onsilence: () => {},
      detune: 0,
      volume: 0,
      context: Tone.context,
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
        attackCurve: "linear",
        decayCurve: "linear",
        releaseCurve: "linear",
      },
      modulation: {
        type: "sine",
        phase: 0,
        volume: 0,
        mute: false,
        onstop: () => {},
      },
    },
  },
  {
    id: "cat",
    name: "Cat",
    type: "sampler",
    urls: {
      C4: "cat.mp3",
    },
    baseUrl: "/sounds/cat/",
  },
  {
    id: "cat2",
    name: "Cat 2",
    type: "sampler",
    urls: {
      G3: "cat-meow-sound-effect_G_minor.wav",
    },
    baseUrl: "/sounds/cat/",
  },
];
