export const ITALIAN_NOTES = ['Do', 'Do#', 'Reb', 'Re', 'Re#', 'Mib', 'Mi', 'Fa', 'Fa#', 'Solb', 'Sol', 'Sol#', 'Lab', 'La', 'La#', 'Sib', 'Si']
export const ENGLISH_NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']

const CHROMATIC_IT: Record<string, number> = {
  'Do': 0, 'Do#': 1, 'Reb': 1,
  'Re': 2, 'Re#': 3, 'Mib': 3,
  'Mi': 4,
  'Fa': 5, 'Fa#': 6, 'Solb': 6,
  'Sol': 7, 'Sol#': 8, 'Lab': 8,
  'La': 9, 'La#': 10, 'Sib': 10,
  'Si': 11,
}

const CHROMATIC_EN: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
}

const SHARP_SCALE_IT = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']
const FLAT_SCALE_IT  = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si']
const SHARP_SCALE_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_SCALE_EN  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function isFlat(note: string) {
  return note.includes('b') || note.includes('♭')
}

function getNoteIndex(note: string): number {
  const itVal = CHROMATIC_IT[note]
  if (itVal !== undefined) return itVal
  const enVal = CHROMATIC_EN[note]
  if (enVal !== undefined) return enVal
  return -1
}

function transposeNoteIt(note: string, semitones: number, preferFlat = false): string {
  const idx = getNoteIndex(note)
  if (idx === -1) return note
  const newIdx = ((idx + semitones) % 12 + 12) % 12
  return preferFlat ? FLAT_SCALE_IT[newIdx] : SHARP_SCALE_IT[newIdx]
}

function transposeNoteEn(note: string, semitones: number, preferFlat = false): string {
  const idx = getNoteIndex(note)
  if (idx === -1) return note
  const newIdx = ((idx + semitones) % 12 + 12) % 12
  return preferFlat ? FLAT_SCALE_EN[newIdx] : SHARP_SCALE_EN[newIdx]
}

export function transposeChord(chord: string, semitones: number, notation: 'italian' | 'english' = 'italian'): string {
  if (semitones === 0 && notation === 'italian') return chord

  // Match Italian note pattern: Do, Re, Mi, Fa, Sol, La, Si (with optional #/b)
  const itPattern = /^(Do#?|Reb?|Re#?|Mib?|Mi|Fa#?|Solb?|Sol#?|Lab?|La#?|Sib?|Si)(.*)/
  // Match English note pattern
  const enPattern = /^([A-G][#b]?)(.*)/

  let match = chord.match(itPattern)
  if (match) {
    const root = match[1]
    const suffix = match[2]
    const preferFlat = isFlat(root)
    if (notation === 'italian') {
      return transposeNoteIt(root, semitones, preferFlat) + suffix
    } else {
      return transposeNoteEn(root, semitones, preferFlat) + suffix
    }
  }

  match = chord.match(enPattern)
  if (match) {
    const root = match[1]
    const suffix = match[2]
    const preferFlat = isFlat(root)
    if (notation === 'italian') {
      return transposeNoteIt(root, semitones, preferFlat) + suffix
    } else {
      return transposeNoteEn(root, semitones, preferFlat) + suffix
    }
  }

  return chord
}

export function convertNotation(chord: string, to: 'italian' | 'english'): string {
  return transposeChord(chord, 0, to)
}

export function itToEn(note: string): string {
  const idx = getNoteIndex(note)
  if (idx === -1) return note
  return isFlat(note) ? FLAT_SCALE_EN[idx] : SHARP_SCALE_EN[idx]
}

export function enToIt(note: string): string {
  const idx = getNoteIndex(note)
  if (idx === -1) return note
  return isFlat(note) ? FLAT_SCALE_IT[idx] : SHARP_SCALE_IT[idx]
}

export const ALL_KEYS_IT = SHARP_SCALE_IT
export const ALL_KEYS_EN = SHARP_SCALE_EN
