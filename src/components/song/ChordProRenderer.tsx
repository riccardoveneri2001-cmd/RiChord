import { parseChordPro } from '../../lib/chordpro'

interface ChordProRendererProps {
  content: string
  lyricSize?: number // default 17, range 12-28
  theme?: 'light' | 'dark'
}

export function ChordProRenderer({ content, lyricSize = 17, theme = 'light' }: ChordProRendererProps) {
  const parsed = parseChordPro(content)
  const chordSize = Math.max(10, lyricSize - 2)
  const chordColor = theme === 'dark' ? '#93C5FD' : '#2176AE'
  const lyricColor = theme === 'dark' ? '#FFFFFF' : '#1C2333'

  return (
    <div>
      {parsed.lines.map((line, li) => {
        const firstToken = line.tokens[0]

        // Directives (title, key, etc.) — skip silently
        if (firstToken?.type === 'directive') return null

        // Section header (Strofa, Ritornello, Bridge…)
        if (firstToken?.type === 'section') {
          const s = firstToken
          if (s.type !== 'section') return null
          return (
            <div key={li} style={{ marginTop: 20, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: chordColor,
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {s.name}
              </span>
            </div>
          )
        }

        // Comment
        if (firstToken?.type === 'comment') {
          const c = firstToken
          if (c.type !== 'comment') return null
          return (
            <p key={li} style={{ margin: '4px 0', fontSize: lyricSize - 2, color: theme === 'dark' ? '#94A3B8' : '#8A94A6', fontStyle: 'italic' }}>
              {c.text}
            </p>
          )
        }

        // Empty line
        const isEmpty =
          line.tokens.length === 0 ||
          (line.tokens.length === 1 &&
            line.tokens[0].type === 'lyric' &&
            (line.tokens[0] as { type: 'lyric'; text: string }).text.trim() === '')
        if (isEmpty) return <div key={li} style={{ height: Math.round(lyricSize * 0.9) }} />

        const hasChords = line.tokens.some((t) => t.type === 'chord')

        // Line with no chords — plain lyric
        if (!hasChords) {
          const text = line.tokens
            .map((t) => (t.type === 'lyric' ? t.text : t.type === 'chord' ? t.lyric : ''))
            .join('')
          return (
            <div key={li} style={{ lineHeight: 1.6, marginBottom: 2 }}>
              <span style={{ fontSize: lyricSize, fontWeight: 400, color: lyricColor, whiteSpace: 'pre' }}>
                {text || ' '}
              </span>
            </div>
          )
        }

        // Line with chords — inline-flex columns
        return (
          <div key={li} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 4 }}>
            {line.tokens.map((token, ti) => {
              if (token.type === 'chord') {
                return (
                  <span key={ti} style={{ display: 'inline-flex', flexDirection: 'column' }}>
                    <span style={{
                      fontSize: chordSize, fontWeight: 700, color: chordColor,
                      whiteSpace: 'pre', lineHeight: 1.3,
                    }}>
                      {token.chord}
                    </span>
                    <span style={{
                      fontSize: lyricSize, fontWeight: 400, color: '#1C2333',
                      whiteSpace: 'pre', lineHeight: 1.6,
                    }}>
                      {token.lyric || ' '}
                    </span>
                  </span>
                )
              }
              if (token.type === 'lyric') {
                return (
                  <span key={ti} style={{
                    fontSize: lyricSize, fontWeight: 400, color: '#1C2333',
                    whiteSpace: 'pre', lineHeight: 1.6, alignSelf: 'flex-end',
                  }}>
                    {token.text}
                  </span>
                )
              }
              return null
            })}
          </div>
        )
      })}
    </div>
  )
}
