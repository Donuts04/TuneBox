// utils/midiToNote.js
// export function midiToNoteName(midiNumber) {
//     const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
//     const octave = Math.floor(midiNumber / 12) - 1;
//     const noteIndex = midiNumber % 12;
//     return `${notes[noteIndex]}${octave}`;
//   }

// Optional: Convert MIDI number to frequency (Hz)
export function midiToFrequency(midiNumber: number): number {
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

export const midiToNoteName = (midiNumber: number): string => {
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const octave = Math.floor(midiNumber / 12) - 1;
  return notes[midiNumber % 12] + octave;
};

export const noteNameToMidi = (noteName: string): number | null => {
  const regex = /([A-G]#?)(\d)/;
  const match = noteName.match(regex);
  if (!match) return null;

  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const noteIndex = notes.indexOf(match[1]);
  const octave = parseInt(match[2]) + 1;
  return octave * 12 + noteIndex;
};
