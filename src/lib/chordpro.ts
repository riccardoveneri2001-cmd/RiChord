import { transposeChord } from './transpose'

export type ChordProToken =
  | { type: 'chord'; chord: string; lyric: string }
  | { type: 'lyric'; text: string }
  | { type: 'directive'; name: string; value: string }
  | { type: 'comment'; text: string }
  | { type: 'section'; name: string }

export type ChordProLine = {
  tokens: ChordProToken[]
  raw: string
}

export type ParsedChordPro = {
  title: string
  artist: string
  key: string
  lines: ChordProLine[]
}

const DIRECTIVE_RE = /^\{([^:}]+)(?::([^}]*))?\}$/

function parseLine(line: string): ChordProLine {
  const tokens: ChordProToken[] = []

  const directive = line.trim().match(DIRECTIVE_RE)
  if (directive) {
    const name = directive[1].trim().toLowerCase()
    const value = (directive[2] ?? '').trim()
    if (['chorus', 'verse', 'bridge', 'outro', 'intro', 'pre-chorus'].includes(value.toLowerCase()) ||
        name === 'start_of_chorus' || name === 'end_of_chorus' ||
        name === 'start_of_verse' || name === 'end_of_verse') {
      return { tokens: [{ type: 'section', name: value || name }], raw: line }
    }
    return { tokens: [{ type: 'directive', name, value }], raw: line }
  }

  if (line.trim().startsWith('#')) {
    return { tokens: [{ type: 'comment', text: line.trim().slice(1).trim() }], raw: line }
  }

  let i = 0
  let lyricBuf = ''

  while (i < line.length) {
    if (line[i] === '[') {
      const end = line.indexOf(']', i)
      if (end !== -1) {
        const chord = line.slice(i + 1, end)
        i = end + 1
        const lyricStart = i
        while (i < line.length && line[i] !== '[') i++
        const lyric = line.slice(lyricStart, i)
        if (lyricBuf) {
          tokens.push({ type: 'lyric', text: lyricBuf })
          lyricBuf = ''
        }
        tokens.push({ type: 'chord', chord, lyric })
        continue
      }
    }
    lyricBuf += line[i]
    i++
  }

  if (lyricBuf) {
    tokens.push({ type: 'lyric', text: lyricBuf })
  }

  return { tokens, raw: line }
}

export function parseChordPro(text: string): ParsedChordPro {
  const lines = text.split('\n')
  const parsed: ParsedChordPro = { title: '', artist: '', key: '', lines: [] }

  for (const line of lines) {
    const parsedLine = parseLine(line)
    for (const token of parsedLine.tokens) {
      if (token.type === 'directive') {
        if (token.name === 'title' || token.name === 't') parsed.title = token.value
        else if (token.name === 'artist' || token.name === 'subtitle' || token.name === 'st') parsed.artist = token.value
        else if (token.name === 'key') parsed.key = token.value
      }
    }
    parsed.lines.push(parsedLine)
  }

  return parsed
}

export function transposeChordPro(text: string, semitones: number, notation: 'italian' | 'english' = 'italian'): string {
  const lines = text.split('\n')
  return lines.map(line => {
    const parsedLine = parseLine(line)
    let result = ''
    let i = 0
    while (i < line.length) {
      if (line[i] === '[') {
        const end = line.indexOf(']', i)
        if (end !== -1) {
          const chord = line.slice(i + 1, end)
          const transposed = transposeChord(chord, semitones, notation)
          result += `[${transposed}]`
          i = end + 1
          continue
        }
      }
      result += line[i]
      i++
    }
    // Update key directive
    if (parsedLine.tokens[0]?.type === 'directive') {
      const d = parsedLine.tokens[0]
      if (d.type === 'directive' && d.name === 'key') {
        const newKey = transposeChord(d.value, semitones, notation)
        return `{key: ${newKey}}`
      }
    }
    return result
  }).join('\n')
}

export function convertChordProNotation(text: string, to: 'italian' | 'english'): string {
  return transposeChordPro(text, 0, to)
}

export function textToChordPro(title: string, artist: string, key: string, text: string): string {
  const lines: string[] = []
  if (title) lines.push(`{title: ${title}}`)
  if (artist) lines.push(`{artist: ${artist}}`)
  if (key) lines.push(`{key: ${key}}`)
  lines.push('')
  lines.push(...text.split('\n'))
  return lines.join('\n')
}

export function chordProToText(chordpro: string): string {
  const lines = chordpro.split('\n')
  return lines
    .filter(l => !l.trim().match(DIRECTIVE_RE))
    .map(l => l.replace(/\[[^\]]*\]/g, ''))
    .join('\n')
    .trim()
}

export function extractChords(text: string): string[] {
  const matches = text.match(/\[([^\]]+)\]/g) ?? []
  return [...new Set(matches.map(m => m.slice(1, -1)))]
}
