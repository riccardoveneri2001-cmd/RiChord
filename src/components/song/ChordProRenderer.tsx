import { parseChordPro } from '../../lib/chordpro'
import { cn } from '../../lib/utils'

interface ChordProRendererProps {
  content: string
  fontSize?: 'sm' | 'md' | 'lg'
  className?: string
}

const FONT_SIZES = {
  sm: { chord: 'text-xs', lyric: 'text-sm', line: 'leading-loose' },
  md: { chord: 'text-sm', lyric: 'text-base', line: 'leading-loose' },
  lg: { chord: 'text-base', lyric: 'text-lg', line: 'leading-loose' },
}

export function ChordProRenderer({ content, fontSize = 'md', className }: ChordProRendererProps) {
  const parsed = parseChordPro(content)
  const fs = FONT_SIZES[fontSize]

  return (
    <div className={cn('font-mono whitespace-pre-wrap', className)}>
      {parsed.lines.map((line, li) => {
        const hasChords = line.tokens.some((t) => t.type === 'chord')
        const isDirective = line.tokens[0]?.type === 'directive'
        const isSection = line.tokens[0]?.type === 'section'
        const isComment = line.tokens[0]?.type === 'comment'

        if (isDirective) {
          const d = line.tokens[0]
          if (d.type !== 'directive') return null
          if (['title', 't', 'artist', 'subtitle', 'st', 'key'].includes(d.name)) return null
          return null
        }

        if (isSection) {
          const s = line.tokens[0]
          if (s.type !== 'section') return null
          return (
            <div key={li} className="mt-4 mb-1">
              <span className="text-xs font-medium font-jakarta uppercase tracking-wider text-secondary bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                {s.name}
              </span>
            </div>
          )
        }

        if (isComment) {
          const c = line.tokens[0]
          if (c.type !== 'comment') return null
          return (
            <div key={li} className="text-secondary italic text-sm font-jakarta my-1">{c.text}</div>
          )
        }

        if (line.tokens.length === 0 || (line.tokens.length === 1 && line.tokens[0].type === 'lyric' && (line.tokens[0] as { type: 'lyric'; text: string }).text.trim() === '')) {
          return <div key={li} className="h-3" />
        }

        if (!hasChords) {
          const text = line.tokens.map((t) => {
            if (t.type === 'lyric') return t.text
            if (t.type === 'chord') return t.lyric
            return ''
          }).join('')
          return (
            <div key={li} className={cn('font-mono', fs.lyric, fs.line)}>
              <span className="text-primary-light dark:text-primary-dark">{text || ' '}</span>
            </div>
          )
        }

        return (
          <div key={li} className={cn('font-mono', fs.line)}>
            <div className="flex flex-wrap items-end">
              {line.tokens.map((token, ti) => {
                if (token.type === 'chord') {
                  const lyricLen = token.lyric.length
                  const chordLen = token.chord.length
                  const width = Math.max(lyricLen, chordLen + 1)
                  return (
                    <span
                      key={ti}
                      className="inline-flex flex-col"
                      style={{ minWidth: `${width}ch` }}
                    >
                      <span className={cn('text-blue-accent font-mono font-semibold', fs.chord)}>
                        {token.chord}
                      </span>
                      <span className={cn('text-primary-light dark:text-primary-dark font-mono', fs.lyric)}>
                        {token.lyric || ' '}
                      </span>
                    </span>
                  )
                }
                if (token.type === 'lyric') {
                  return (
                    <span key={ti} className={cn('text-primary-light dark:text-primary-dark font-mono', fs.lyric)}>
                      {token.text}
                    </span>
                  )
                }
                return null
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
