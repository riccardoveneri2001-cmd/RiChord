import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

const NOTES_IT = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']
const ACCIDENTALS = ['♮', '#', '♭'] as const
type Accidental = typeof ACCIDENTALS[number]

const VARIANTS = ['m', '7', 'm7', 'maj7', 'sus2', 'sus4', 'dim', 'aug', '+5'] as const

interface ChordSelectorProps {
  onSelect: (chord: string) => void
  onClose: () => void
}

export function ChordSelector({ onSelect, onClose }: ChordSelectorProps) {
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [accidental, setAccidental] = useState<Accidental>('♮')

  const buildRoot = (note: string, acc: Accidental) => {
    if (acc === '#') return `${note}#`
    if (acc === '♭') return `${note}b`
    return note
  }

  const handleNoteClick = (note: string) => {
    setSelectedNote(note)
  }

  const handleVariantClick = (variant: string) => {
    const root = buildRoot(selectedNote!, accidental)
    onSelect(`${root}${variant}`)
    onClose()
  }

  const handleConfirmBase = () => {
    const root = buildRoot(selectedNote!, accidental)
    onSelect(root)
    onClose()
  }

  return (
    <motion.div
      className="bg-white dark:bg-night-surface rounded-2xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden"
      style={{ width: 300 }}
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.15 }}
    >
      <AnimatePresence mode="wait">
        {!selectedNote ? (
          <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs text-secondary font-jakarta font-medium uppercase tracking-wide mb-2">Seleziona nota</p>
              {/* Accidental toggle */}
              <div className="flex gap-1 mb-3">
                {ACCIDENTALS.map((acc) => (
                  <button
                    key={acc}
                    onClick={() => setAccidental(acc)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-sm font-mono font-medium transition-colors min-h-[36px]',
                      accidental === acc
                        ? 'bg-blue-accent text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-secondary hover:bg-gray-200 dark:hover:bg-slate-600'
                    )}
                  >
                    {acc}
                  </button>
                ))}
              </div>
              {/* Notes grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {NOTES_IT.map((note) => (
                  <button
                    key={note}
                    onClick={() => handleNoteClick(note)}
                    className="py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-sm font-mono font-medium text-primary-light dark:text-primary-dark hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-accent transition-colors min-h-[44px]"
                  >
                    {buildRoot(note, accidental)}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 border-t border-border-light dark:border-border-dark">
              <button onClick={onClose} className="w-full py-2 text-sm text-secondary font-jakarta hover:text-primary-light dark:hover:text-primary-dark transition-colors">
                Annulla
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="variants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-secondary hover:text-primary-light dark:hover:text-primary-dark text-xs font-jakarta transition-colors"
                >
                  ← Indietro
                </button>
                <span className="text-sm font-mono font-semibold text-blue-accent">
                  {buildRoot(selectedNote, accidental)}
                </span>
              </div>
              <p className="text-xs text-secondary font-jakarta font-medium uppercase tracking-wide mb-2">Variante (opzionale)</p>
              <div className="grid grid-cols-3 gap-1.5">
                {VARIANTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => handleVariantClick(v)}
                    className="py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-sm font-mono font-medium text-primary-light dark:text-primary-dark hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-accent transition-colors min-h-[44px]"
                  >
                    {buildRoot(selectedNote, accidental)}{v}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 border-t border-border-light dark:border-border-dark">
              <button
                onClick={handleConfirmBase}
                className="w-full py-2.5 bg-blue-accent text-white rounded-xl text-sm font-jakarta font-medium hover:bg-blue-500 transition-colors min-h-[44px]"
              >
                Usa solo {buildRoot(selectedNote, accidental)}
              </button>
              <button onClick={onClose} className="w-full py-2 text-sm text-secondary font-jakarta hover:text-primary-light dark:hover:text-primary-dark transition-colors mt-1">
                Annulla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
