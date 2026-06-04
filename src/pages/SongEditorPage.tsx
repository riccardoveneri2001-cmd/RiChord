import { CSSProperties, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconArrowLeft, IconDeviceFloppy, IconChevronRight } from '@tabler/icons-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { supabase } from '../lib/supabase'
import { BottomSheet } from '../components/ui/BottomSheet'
import { ChordSelector } from '../components/song/ChordSelector'
import { ALL_KEYS_IT } from '../lib/transpose'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 1 | 2
type ActiveChip = 'title' | 'artist' | 'key' | 'tags' | null

interface EditorLine {
  text: string
  chords: Record<number, string>
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DIRECTIVE_RE = /^\{[^}]*\}$/

function parseToEditable(chordPro: string): EditorLine[] {
  return chordPro.split('\n')
    .filter((line) => !line.trim().match(DIRECTIVE_RE))
    .map((line) => {
      const chords: Record<number, string> = {}
      let text = ''
      let i = 0
      while (i < line.length) {
        if (line[i] === '[') {
          const end = line.indexOf(']', i)
          if (end !== -1) {
            chords[text.length] = line.slice(i + 1, end)
            i = end + 1
            continue
          }
        }
        text += line[i]
        i++
      }
      return { text, chords }
    })
}

function editableToChordPro(
  lines: EditorLine[],
  title: string, artist: string, key: string,
): string {
  const header: string[] = []
  if (title) header.push(`{title: ${title}}`)
  if (artist) header.push(`{artist: ${artist}}`)
  if (key) header.push(`{key: ${key}}`)

  const body = lines.map(({ text, chords }) => {
    const positions = Object.keys(chords).map(Number).sort((a, b) => a - b)
    if (!positions.length) return text
    let result = ''
    let pos = 0
    for (const cp of positions) {
      result += text.slice(pos, cp)
      result += `[${chords[cp]}]`
      pos = cp
    }
    return result + text.slice(pos)
  })

  return [...header, ...(header.length ? [''] : []), ...body].join('\n')
}

function buildChordRow(text: string, chords: Record<number, string>): string {
  const positions = Object.keys(chords).map(Number).sort((a, b) => a - b)
  if (!positions.length) return ''
  let result = ''
  let printPos = 0
  for (const textPos of positions) {
    const chord = chords[textPos]
    const targetPos = Math.max(textPos, printPos)
    result += ' '.repeat(targetPos - printPos)
    result += chord
    printPos = targetPos + chord.length
  }
  return result
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SongEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getSong, addSong, updateSong, getAllTags } = useLibraryStore()
  const isNew = !id || id === 'new'
  const existing = isNew ? null : getSong(id!)

  const [step, setStep]             = useState<Step>(1)
  const [activeChip, setActiveChip] = useState<ActiveChip>(null)
  const [isDirty, setIsDirty]       = useState(false)
  const [unsavedOpen, setUnsavedOpen] = useState(false)
  const [saving, setSaving]         = useState(false)

  // Metadata
  const [title, setTitle]   = useState(existing?.title ?? '')
  const [artist, setArtist] = useState(existing?.artist ?? '')
  const [key, setKey]       = useState(existing?.key ?? '')
  const [tags, setTags]     = useState<string[]>(existing?.tags ?? [])

  // Step 1: raw ChordPro text
  const [content, setContent] = useState(existing?.content ?? '')

  // Step 2: parsed lines + selection
  const [editorLines, setEditorLines]   = useState<EditorLine[]>([])
  const [activeLine, setActiveLine]     = useState<number | null>(null)
  const [activePos, setActivePos]       = useState<number | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)

  const markDirty = () => setIsDirty(true)

  // ── Save helpers ──────────────────────────────────────────────────────────

  function getFinalContent() {
    return step === 2 ? editableToChordPro(editorLines, title, artist, key) : content
  }

  async function performSave(): Promise<{ ok: boolean; newId?: string }> {
    if (!title.trim()) { toast.error('Il titolo è obbligatorio'); return { ok: false } }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Sessione scaduta, effettua di nuovo il login'); return { ok: false } }
      const data = {
        title: title.trim(), artist, content: getFinalContent(),
        key, tags, notes: existing?.notes ?? '', type: 'chordpro' as const,
      }
      if (isNew) {
        const song = await addSong(user.id, data)
        if (song) { setIsDirty(false); toast.success('Brano salvato'); return { ok: true, newId: song.id } }
        return { ok: false }
      } else {
        await updateSong(id!, data)
        setIsDirty(false); toast.success('Brano salvato'); return { ok: true }
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    const { ok, newId } = await performSave()
    if (ok && newId) navigate(`/song/${newId}`, { replace: true })
  }

  async function handleSaveAndExit() {
    setUnsavedOpen(false)
    const { ok, newId } = await performSave()
    if (!ok) return
    if (newId) navigate(`/song/${newId}`, { replace: true })
    else navigate(-1)
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function handleBack() {
    if (step === 2) {
      setContent(editableToChordPro(editorLines, title, artist, key))
      setStep(1)
      return
    }
    if (isDirty) setUnsavedOpen(true)
    else navigate(-1)
  }

  function goToStep2() {
    setEditorLines(parseToEditable(content))
    setActiveChip(null)
    setStep(2)
  }

  // ── Chord editing ─────────────────────────────────────────────────────────

  function openSelector(lineIdx: number, charPos: number) {
    setActiveLine(lineIdx)
    setActivePos(charPos)
    setSelectorOpen(true)
  }

  function handleInsertChord(chord: string) {
    if (activeLine === null || activePos === null) return
    setEditorLines((prev) => {
      const next = [...prev]
      next[activeLine] = {
        ...next[activeLine],
        chords: { ...next[activeLine].chords, [activePos]: chord },
      }
      return next
    })
    markDirty()
  }

  function handleDeleteChord() {
    if (activeLine === null || activePos === null) return
    setEditorLines((prev) => {
      const next = [...prev]
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [activePos]: _removed, ...rest } = next[activeLine].chords
      next[activeLine] = { ...next[activeLine], chords: rest }
      return next
    })
    markDirty()
  }

  const activeChord =
    activeLine !== null && activePos !== null
      ? editorLines[activeLine]?.chords[activePos]
      : undefined

  // ── Shared styles ─────────────────────────────────────────────────────────

  const iconBtn: CSSProperties = {
    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
    background: '#FFFFFF', border: '0.5px solid #E0DED8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  }

  const chipStyle = (active: boolean): CSSProperties => ({
    flexShrink: 0, padding: '6px 13px', borderRadius: 20,
    border: `0.5px solid ${active ? '#2176AE' : '#E0DED8'}`,
    background: active ? '#E0F0FA' : '#FFFFFF',
    color: active ? '#2176AE' : '#8A94A6',
    fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
    cursor: 'pointer',
  })

  const canGoStep2 = title.trim().length > 0 && content.trim().length > 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#F5F4F1', borderBottom: '0.5px solid #E0DED8',
        padding: '6px 16px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button onClick={handleBack} style={iconBtn} aria-label="Indietro">
          <IconArrowLeft size={18} style={{ color: '#2176AE' }} />
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1C2333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isNew ? 'Nuovo brano' : 'Modifica brano'}
          </p>
          {isDirty && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E67E22', flexShrink: 0 }} />
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 34, paddingLeft: 12, paddingRight: 14, borderRadius: 8,
            border: 'none', background: '#2176AE', color: '#FFFFFF',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}
        >
          <IconDeviceFloppy size={15} />
          {saving ? '…' : 'Salva'}
        </button>
      </div>

      {/* ── Step 1: Testo ───────────────────────────────────────────────────── */}
      {step === 1 && (
        <>
          {/* Chip bar */}
          <div style={{
            overflowX: 'auto', padding: '10px 16px',
            display: 'flex', gap: 8,
            borderBottom: '0.5px solid #E0DED8',
          }}>
            <button style={chipStyle(activeChip === 'title')} onClick={() => setActiveChip(activeChip === 'title' ? null : 'title')}>
              {title ? `Titolo: ${title.slice(0, 12)}${title.length > 12 ? '…' : ''}` : 'Titolo *'}
            </button>
            <button style={chipStyle(activeChip === 'artist')} onClick={() => setActiveChip(activeChip === 'artist' ? null : 'artist')}>
              {artist ? `${artist.slice(0, 12)}${artist.length > 12 ? '…' : ''}` : 'Artista'}
            </button>
            <button style={chipStyle(activeChip === 'key')} onClick={() => setActiveChip(activeChip === 'key' ? null : 'key')}>
              {key ? `Tonalità: ${key}` : 'Tonalità'}
            </button>
            <button style={chipStyle(activeChip === 'tags')} onClick={() => setActiveChip(activeChip === 'tags' ? null : 'tags')}>
              {tags.length > 0 ? `Tag (${tags.length})` : 'Tag'}
            </button>
          </div>

          {/* Expanded chip panel */}
          {activeChip && (
            <div style={{ padding: '12px 16px', background: '#FFFFFF', borderBottom: '0.5px solid #E0DED8' }}>
              {activeChip === 'title' && (
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); markDirty() }}
                  placeholder="Titolo del brano *"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0DED8', fontSize: 15, color: '#1C2333', background: '#F5F4F1', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              )}
              {activeChip === 'artist' && (
                <input
                  autoFocus
                  value={artist}
                  onChange={(e) => { setArtist(e.target.value); markDirty() }}
                  placeholder="Artista / band"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #E0DED8', fontSize: 15, color: '#1C2333', background: '#F5F4F1', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              )}
              {activeChip === 'key' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setKey(''); markDirty() }}
                    style={{ padding: '5px 13px', borderRadius: 20, border: `0.5px solid ${key === '' ? '#2176AE' : '#E0DED8'}`, background: key === '' ? '#E0F0FA' : '#F5F4F1', color: key === '' ? '#2176AE' : '#8A94A6', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    —
                  </button>
                  {ALL_KEYS_IT.map((k) => (
                    <button
                      key={k}
                      onClick={() => { setKey(k); markDirty() }}
                      style={{ padding: '5px 13px', borderRadius: 20, border: `0.5px solid ${key === k ? '#2176AE' : '#E0DED8'}`, background: key === k ? '#E0F0FA' : '#F5F4F1', color: key === k ? '#2176AE' : '#8A94A6', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}
              {activeChip === 'tags' && (
                <TagChipEditor
                  tags={tags}
                  onChange={(t) => { setTags(t); markDirty() }}
                  suggestions={getAllTags()}
                />
              )}
            </div>
          )}

          {/* Textarea */}
          <div style={{ padding: '16px 16px 0' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 500, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Testo ChordPro
            </p>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); markDirty() }}
              placeholder={'[Do]Scrivi il [Sol]testo con gli accordi\n\nUsa [Accordo] prima della sillaba'}
              rows={20}
              style={{
                width: '100%', minHeight: 280,
                padding: '12px', borderRadius: 12,
                border: '0.5px solid #E0DED8', background: '#FFFFFF',
                fontSize: 15, fontFamily: 'monospace', color: '#1C2333',
                lineHeight: 1.7, resize: 'vertical', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Avanti */}
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={goToStep2}
              disabled={!canGoStep2}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: canGoStep2 ? '#2176AE' : '#C8CDD8',
                color: '#FFFFFF', fontSize: 15, fontWeight: 600,
                cursor: canGoStep2 ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              Posiziona accordi
              <IconChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* ── Step 2: Accordi ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <>
          {/* Step indicator */}
          <div style={{
            padding: '8px 16px', background: '#FFFFFF',
            borderBottom: '0.5px solid #E0DED8',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 12, color: '#2E7D32', fontWeight: 500 }}>✓ Testo</span>
            <div style={{ width: 20, height: 1, background: '#E0DED8' }} />
            <span style={{ fontSize: 12, color: '#2176AE', fontWeight: 600 }}>• Accordi</span>
          </div>

          {/* Hint */}
          <div style={{ margin: '12px 16px 4px', padding: '10px 12px', background: '#E0F0FA', borderRadius: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#2176AE', lineHeight: 1.4 }}>
              Tocca una parola per aggiungere o modificare un accordo. Le parole con accordo sono evidenziate.
            </p>
          </div>

          {/* Lines */}
          <div style={{ padding: '8px 16px 16px' }}>
            {editorLines.map((line, li) => (
              <EditorLineRow
                key={li}
                line={line}
                onTap={(pos) => openSelector(li, pos)}
              />
            ))}
          </div>
        </>
      )}

      {/* Unsaved changes sheet */}
      <BottomSheet open={unsavedOpen} onClose={() => setUnsavedOpen(false)}>
        <div style={{ padding: '0 16px 32px' }}>
          <p style={{ textAlign: 'center', margin: '0 0 6px', fontSize: 17, fontWeight: 600, color: '#1C2333' }}>
            Modifiche non salvate
          </p>
          <p style={{ textAlign: 'center', margin: '0 0 20px', fontSize: 14, color: '#8A94A6', lineHeight: 1.5 }}>
            Vuoi salvare le modifiche prima di uscire?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleSaveAndExit}
              style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: '#2176AE', color: '#FFFFFF', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Salva e esci
            </button>
            <button
              onClick={() => { setUnsavedOpen(false); navigate(-1) }}
              style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: '#FDE8E8', color: '#C0392B', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Esci senza salvare
            </button>
            <button
              onClick={() => setUnsavedOpen(false)}
              style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: '#F5F4F1', color: '#1C2333', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Annulla
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Chord selector */}
      <ChordSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onInsert={handleInsertChord}
        onDelete={activeChord ? handleDeleteChord : undefined}
        existingChord={activeChord}
      />
    </div>
  )
}

// ── EditorLineRow ──────────────────────────────────────────────────────────────

function EditorLineRow({ line, onTap }: {
  line: EditorLine
  onTap: (charPos: number) => void
}) {
  const { text, chords } = line
  const chordRow = buildChordRow(text, chords)

  if (!text.trim()) return <div style={{ height: 14 }} />

  // Split into word + whitespace tokens preserving positions
  const tokens: { text: string; start: number; isWord: boolean }[] = []
  const re = /\S+|\s+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    tokens.push({ text: m[0], start: m.index, isWord: /\S/.test(m[0]) })
  }

  return (
    <div style={{ marginBottom: 10 }}>
      {chordRow && (
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#2176AE', fontWeight: 700, whiteSpace: 'pre', lineHeight: 1.4 }}>
          {chordRow}
        </div>
      )}
      <div style={{ fontFamily: 'monospace', fontSize: 15, color: '#1C2333', lineHeight: 1.6, whiteSpace: 'pre' }}>
        {tokens.map((tok) => (
          <span
            key={tok.start}
            onClick={() => tok.isWord && onTap(tok.start)}
            style={{
              cursor: tok.isWord ? 'pointer' : 'default',
              background: tok.isWord && chords[tok.start] !== undefined
                ? 'rgba(33,118,174,0.12)'
                : 'transparent',
              borderRadius: 3,
              display: 'inline',
            }}
          >
            {tok.text}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── TagChipEditor ──────────────────────────────────────────────────────────────

function TagChipEditor({ tags, onChange, suggestions }: {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
}) {
  const [input, setInput] = useState('')

  function add(tag: string) {
    const t = tag.trim()
    if (!t || tags.includes(t) || tags.length >= 5) return
    onChange([...tags, t])
    setInput('')
  }

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
  )

  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => onChange(tags.filter((x) => x !== t))}
              style={{ padding: '4px 10px', borderRadius: 20, background: '#E0F0FA', color: '#2176AE', fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
            >
              {t} ×
            </button>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) } }}
        placeholder={tags.length >= 5 ? 'Max 5 tag' : 'Aggiungi tag…'}
        disabled={tags.length >= 5}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '0.5px solid #E0DED8', fontSize: 14, color: '#1C2333', background: '#F5F4F1', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
      {filtered.length > 0 && input && (
        <div style={{ marginTop: 4, background: '#FFFFFF', border: '0.5px solid #E0DED8', borderRadius: 10, overflow: 'hidden' }}>
          {filtered.slice(0, 5).map((s) => (
            <button
              key={s}
              onMouseDown={() => add(s)}
              style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '0.5px solid #F0EEEB', fontSize: 14, color: '#1C2333', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
