import { useState, useCallback } from 'react'
import { transposeChordPro } from '../lib/chordpro'

export function useTranspose(initialContent: string, _initialKey: string | null) {
  const [semitones, setSemitones] = useState(0)
  const [notation, setNotation] = useState<'italian' | 'english'>(
    () => (localStorage.getItem('notation-pref') as 'italian' | 'english') ?? 'italian',
  )

  const transposedContent = transposeChordPro(initialContent, semitones, notation)

  const transpose = useCallback((delta: number) => {
    setSemitones((s) => ((s + delta) % 12 + 12) % 12)
  }, [])

  const setAbsolute = useCallback((target: number) => {
    setSemitones(((target) % 12 + 12) % 12)
  }, [])

  const reset = useCallback(() => setSemitones(0), [])

  const toggleNotation = useCallback(() => {
    setNotation((n) => {
      const next = n === 'italian' ? 'english' : 'italian'
      localStorage.setItem('notation-pref', next)
      return next
    })
  }, [])

  return {
    semitones,
    notation,
    transposedContent,
    transpose,
    setAbsolute,
    reset,
    toggleNotation,
    setNotation,
  }
}
