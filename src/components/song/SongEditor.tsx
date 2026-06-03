import React, { useState, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChordSelector } from './ChordSelector'
import { ChordProRenderer } from './ChordProRenderer'
import { Textarea } from '../ui/Input'

interface SongEditorProps {
  content: string
  onChange: (content: string) => void
}

// Maps an index in the "clean" line (chord markers removed) back to
// the corresponding index in the original line.
function cleanIndexToOriginalIndex(original: string, cleanIndex: number): number {
  let clean = 0
  let i = 0
  while (i < original.length) {
    if (original[i] === '[') {
      const end = original.indexOf(']', i)
      if (end !== -1) {
        i = end + 1
        continue
      }
    }
    if (clean === cleanIndex) return i
    clean++
    i++
  }
  return original.length
}

export function SongEditor({ content, onChange }: SongEditorProps) {
  const [selectorPos, setSelectorPos] = useState<{ x: number; y: number } | null>(null)
  const [insertTarget, setInsertTarget] = useState<{ lineIndex: number; charIndex: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const lines = content.split('\n')

  const handleChordInsert = useCallback(
    (chord: string) => {
      if (!insertTarget) return
      const { lineIndex, charIndex } = insertTarget
      const newLines = [...lines]
      const line = newLines[lineIndex] || ''
      const originalIndex = cleanIndexToOriginalIndex(line, charIndex)
      newLines[lineIndex] = line.slice(0, originalIndex) + `[${chord}]` + line.slice(originalIndex)
      onChange(newLines.join('\n'))
      setSelectorPos(null)
      setInsertTarget(null)
    },
    [lines, insertTarget, onChange]
  )

  const handleTextClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, lineIndex: number) => {
      const target = e.target as HTMLSpanElement
      const charIndex = parseInt(target.dataset.charIndex ?? '-1', 10)
      if (charIndex === -1) return

      const rect = target.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      setSelectorPos({
        x: Math.min(rect.left - containerRect.left, containerRect.width - 310),
        y: rect.bottom - containerRect.top + 4,
      })
      setInsertTarget({ lineIndex, charIndex })
    },
    []
  )

  const renderLine = (line: string, lineIndex: number) => {
    if (line.trim().match(/^\{[^}]+\}$/)) {
      return (
        <div key={lineIndex} className="text-secondary text-xs font-mono py-0.5 select-none italic">
          {line}
        </div>
      )
    }

    const cleanLine = line.replace(/\[[^\]]*\]/g, '')
    const hasChords = /\[[^\]]+\]/.test(line)

    return (
      <div
        key={lineIndex}
        className="font-mono py-0.5 cursor-pointer"
        onClick={(e) => handleTextClick(e, lineIndex)}
      >
        {hasChords && (
          <div className="text-xs text-blue-accent font-semibold leading-tight select-none pointer-events-none mb-0.5">
            {Array.from(line.matchAll(/\[([^\]]*)\]/g)).map((m) => m[1]).join(' ')}
          </div>
        )}
        <div className="flex flex-wrap">
          {cleanLine.split('').map((char, ci) => (
            <span
              key={ci}
              data-char-index={ci}
              className="text-sm text-primary-light dark:text-primary-dark hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-accent rounded-sm transition-colors"
              style={{ minWidth: char === ' ' ? '0.5ch' : undefined }}
            >
              {char === ' ' ? ' ' : char}
            </span>
          ))}
          {cleanLine.length === 0 && (
            <span
              data-char-index={0}
              className="inline-block w-4 h-5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-sm transition-colors"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="Testo del brano"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder="Incolla o digita il testo del brano qui…&#10;&#10;Puoi anche scrivere accordi in formato ChordPro: [Do]Questa è una [Sol]melodia"
        className="font-mono text-sm"
      />

      {/* Chord click insert panel */}
      <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3 relative" ref={containerRef}>
        <p className="text-xs text-secondary font-jakarta mb-2 font-medium">
          Tocca una lettera per inserire un accordo
        </p>
        <div className="space-y-0.5">
          {lines.map((line, li) => renderLine(line, li))}
        </div>

        <AnimatePresence>
          {selectorPos && (
            <div
              className="absolute z-50"
              style={{ left: Math.max(0, selectorPos.x), top: selectorPos.y }}
            >
              <ChordSelector
                onSelect={handleChordInsert}
                onClose={() => { setSelectorPos(null); setInsertTarget(null) }}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Live ChordPro rendered preview */}
      {content.trim() && (
        <div>
          <p className="text-xs text-secondary font-jakarta mb-2 font-medium">Anteprima</p>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-border-light dark:border-border-dark">
            <ChordProRenderer content={content} fontSize="sm" />
          </div>
        </div>
      )}
    </div>
  )
}
