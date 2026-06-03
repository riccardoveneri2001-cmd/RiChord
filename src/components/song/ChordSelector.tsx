import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'

const NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']
const ALTS = ['♮', '#', '♭'] as const
type Alt = typeof ALTS[number]
const VARIANTS: string[] = ['', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', 'dim', 'aug']
const VARIANT_LABELS = ['Magg.', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', 'dim', 'aug']

interface ChordSelectorProps {
  open: boolean
  onClose: () => void
  onInsert: (chord: string) => void
  onDelete?: () => void
  existingChord?: string
}

function buildNote(note: string, alt: Alt) {
  if (alt === '#') return `${note}#`
  if (alt === '♭') return `${note}b`
  return note
}

export function ChordSelector({ open, onClose, onInsert, onDelete, existingChord }: ChordSelectorProps) {
  const [note, setNote] = useState<string | null>(null)
  const [alt, setAlt] = useState<Alt>('♮')
  const [variant, setVariant] = useState(0)

  const root = note ? buildNote(note, alt) : null
  const chord = root ? `${root}${VARIANTS[variant]}` : null

  function reset() { setNote(null); setAlt('♮'); setVariant(0) }
  function handleClose() { reset(); onClose() }

  function handleInsert() {
    if (!chord) return
    onInsert(chord)
    reset()
    onClose()
  }

  function handleDelete() {
    onDelete?.()
    reset()
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <div style={{ padding: '0 16px 32px' }}>
        <p style={{
          textAlign: 'center', margin: '0 0 12px',
          fontSize: 13, fontWeight: 600, color: '#8A94A6',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          Seleziona accordo
        </p>

        {/* Preview */}
        <div style={{ textAlign: 'center', marginBottom: 14, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 30, fontWeight: 700, fontFamily: 'monospace', color: chord ? '#2176AE' : '#C8CDD8' }}>
            {chord ?? (existingChord ? existingChord : '—')}
          </span>
        </div>

        {/* Note grid — 7 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 8 }}>
          {NOTES.map((n) => {
            const active = note === n
            return (
              <button
                key={n}
                onClick={() => setNote(n)}
                style={{
                  padding: '9px 0', borderRadius: 10, border: 'none',
                  background: active ? '#2176AE' : '#F5F4F1',
                  color: active ? '#FFFFFF' : '#1C2333',
                  fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
                  cursor: 'pointer', minHeight: 44,
                }}
              >
                {n}
              </button>
            )
          })}
        </div>

        {/* Alteration row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {ALTS.map((a) => {
            const active = alt === a
            return (
              <button
                key={a}
                onClick={() => setAlt(a)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 10, border: 'none',
                  background: active ? '#E0F0FA' : '#F5F4F1',
                  color: active ? '#2176AE' : '#8A94A6',
                  fontSize: 16, fontWeight: 600, fontFamily: 'monospace',
                  cursor: 'pointer', minHeight: 40,
                }}
              >
                {a}
              </button>
            )
          })}
        </div>

        {/* Variant scroll */}
        <div style={{ overflowX: 'auto', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
            {VARIANT_LABELS.map((label, i) => {
              const active = variant === i
              const display = root && i > 0 ? `${root}${VARIANTS[i]}` : label
              return (
                <button
                  key={i}
                  onClick={() => setVariant(i)}
                  style={{
                    flexShrink: 0, padding: '7px 13px', borderRadius: 10,
                    border: `0.5px solid ${active ? '#2176AE' : '#E0DED8'}`,
                    background: active ? '#E0F0FA' : '#FFFFFF',
                    color: active ? '#2176AE' : '#8A94A6',
                    fontSize: 13, fontWeight: 500, fontFamily: 'monospace',
                    cursor: 'pointer', minHeight: 40,
                  }}
                >
                  {display}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleInsert}
            disabled={!chord}
            style={{
              width: '100%', padding: 13, borderRadius: 12, border: 'none',
              background: chord ? '#2176AE' : '#C8CDD8',
              color: '#FFFFFF', fontSize: 15, fontWeight: 600,
              cursor: chord ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >
            Inserisci
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              style={{
                width: '100%', padding: 13, borderRadius: 12, border: 'none',
                background: '#FDE8E8', color: '#C0392B', fontSize: 15, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Elimina accordo
            </button>
          )}
          <button
            onClick={handleClose}
            style={{
              width: '100%', padding: 13, borderRadius: 12, border: 'none',
              background: '#F5F4F1', color: '#1C2333', fontSize: 15, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Annulla
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
