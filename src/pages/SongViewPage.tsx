import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  IconArrowLeft, IconShare, IconDotsVertical,
  IconLanguage, IconTextSize, IconEdit, IconTrash,
  IconMinus, IconPlus, IconDeviceFloppy,
} from '@tabler/icons-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { useTranspose } from '../hooks/useTranspose'
import { ChordProRenderer } from '../components/song/ChordProRenderer'
import { ShareModal } from '../components/share/ShareModal'
import { ConfirmModal } from '../components/ui/Modal'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────────

const DISPLAY_KEYS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']
const CHROMATIC: Record<string, number> = {
  Do: 0, 'Do#': 1, Re: 2, 'Re#': 3, Mi: 4, Fa: 5,
  'Fa#': 6, Sol: 7, 'Sol#': 8, La: 9, 'La#': 10, Si: 11,
  // also accept flats from ITALIAN_NOTES
  Reb: 1, Mib: 3, Solb: 6, Lab: 8, Sib: 10,
}
const LYRIC_SIZE_KEY = 'song-lyric-size'
const HIDE_HINT_KEY  = 'song-hide-hint'

// ── Shared micro-styles ───────────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
  background: '#FFFFFF', border: '0.5px solid #E0DED8',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}

const transpBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: '#E0F0FA', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SongViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { songs, deleteSong } = useLibraryStore()
  const song = songs.find((s) => s.id === id)

  const { semitones, notation, transposedContent, transpose, toggleNotation } = useTranspose(
    song?.content ?? '',
    song?.key ?? null,
  )

  const [uiHidden,   setUiHidden]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [shareOpen,  setShareOpen]  = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [lyricSize,  setLyricSize]  = useState<number>(() => {
    const v = sessionStorage.getItem(LYRIC_SIZE_KEY)
    return v ? parseFloat(v) : 17
  })

  // Refs kept in sync for touch handlers (avoid stale closures)
  const menuOpenRef  = useRef(false)
  const lyricSizeRef = useRef(lyricSize)
  useEffect(() => { menuOpenRef.current  = menuOpen  }, [menuOpen])
  useEffect(() => { lyricSizeRef.current = lyricSize }, [lyricSize])

  // Persist lyric size across navigations
  useEffect(() => {
    sessionStorage.setItem(LYRIC_SIZE_KEY, String(lyricSize))
  }, [lyricSize])

  // Sync bottom-nav visibility with uiHidden
  useEffect(() => {
    if (uiHidden) document.body.classList.add('ui-hidden')
    else document.body.classList.remove('ui-hidden')
    return () => document.body.classList.remove('ui-hidden')
  }, [uiHidden])

  // First-time "tap to hide" hint
  useEffect(() => {
    if (localStorage.getItem(HIDE_HINT_KEY)) return
    const t = setTimeout(() => {
      toast('Tocca il contenuto per nascondere i controlli', { duration: 3500 })
      localStorage.setItem(HIDE_HINT_KEY, '1')
    }, 900)
    return () => clearTimeout(t)
  }, [])

  // Close menu on next outside click
  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(false)
    const t = setTimeout(() => {
      document.addEventListener('click', close, { capture: true, once: true })
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', close, { capture: true })
    }
  }, [menuOpen])

  // Current displayed key after transposition
  const currentKey = useMemo(() => {
    if (!song?.key) return '—'
    const base = CHROMATIC[song.key]
    if (base === undefined) return song.key
    return DISPLAY_KEYS[(base + semitones + 120) % 12]
  }, [song?.key, semitones])

  // ── Touch: pinch-to-zoom + tap-to-toggle-UI ────────────────────────────────

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    let initDist  = 0
    let initSize  = 17
    let twoFinger = false
    let tapStart  = { x: 0, y: 0, t: 0 }

    function dist(e: TouchEvent) {
      return Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      )
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        tapStart  = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
        twoFinger = false
      } else if (e.touches.length === 2) {
        twoFinger = true
        initDist  = dist(e)
        initSize  = lyricSizeRef.current
      }
    }

    function onMove(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault()
        const scale   = dist(e) / initDist
        const newSize = Math.max(12, Math.min(28, initSize * scale))
        setLyricSize(newSize)
      }
    }

    function onEnd(e: TouchEvent) {
      if (e.touches.length > 0) return
      if (twoFinger) { twoFinger = false; return }
      const dx = e.changedTouches[0].clientX - tapStart.x
      const dy = e.changedTouches[0].clientY - tapStart.y
      const dt = Date.now() - tapStart.t
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) {
        if (menuOpenRef.current) { setMenuOpen(false) }
        else { setUiHidden((v) => !v) }
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    el.addEventListener('touchend',   onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
      el.removeEventListener('touchend',   onEnd)
    }
  }, [])

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!song) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <p style={{ color: '#8A94A6', fontSize: 15 }}>Brano non trovato.</p>
      <button onClick={() => navigate('/library')} style={{ color: '#2176AE', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, fontSize: 14, fontFamily: 'inherit' }}>
        ← Libreria
      </button>
    </div>
  )

  if (song.type !== 'chordpro') return <Navigate to={`/song/${id}/file`} replace />

  // ── Render ────────────────────────────────────────────────────────────────

  const headerCollapsed: React.CSSProperties = {
    maxHeight: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none',
    transition: 'max-height 0.3s ease, opacity 0.3s ease',
  }
  const headerShown: React.CSSProperties = {
    maxHeight: 200, opacity: 1, overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease',
  }

  return (
    <div>

      {/* ── Sticky header group ─────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>

        {/* Topbar */}
        <div style={uiHidden ? headerCollapsed : headerShown}>
          <div style={{
            background: '#F5F4F1',
            borderBottom: '0.5px solid #E0DED8',
            padding: '6px 16px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>

            {/* Back */}
            <button onClick={() => navigate(-1)} style={iconBtnStyle} aria-label="Indietro">
              <IconArrowLeft size={18} style={{ color: '#2176AE' }} />
            </button>

            {/* Title + artist */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1C2333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {song.title}
              </p>
              {song.artist && (
                <p style={{ margin: 0, fontSize: 13, color: '#8A94A6' }}>{song.artist}</p>
              )}
            </div>

            {/* Share */}
            <button onClick={() => setShareOpen(true)} style={iconBtnStyle} aria-label="Condividi">
              <IconShare size={17} style={{ color: '#1C2333' }} />
            </button>

            {/* Three-dot menu button */}
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
              style={iconBtnStyle}
              aria-label="Altro"
            >
              <IconDotsVertical size={17} style={{ color: '#1C2333' }} />
            </button>
          </div>
        </div>

        {/* Dropdown — fuori dall'overflow:hidden, absolute nel container sticky */}
        {menuOpen && (
          <div
            style={{
              position: 'absolute', top: 52, right: 16, zIndex: 100,
              background: '#FFFFFF', borderRadius: 12,
              border: '0.5px solid #E0DED8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: 220, overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuRow
              icon={<IconLanguage size={16} style={{ color: '#2176AE' }} />}
              label={`Notazione: ${notation === 'italian' ? 'Do Re Mi' : 'A B C'}`}
              onClick={() => { toggleNotation(); setMenuOpen(false) }}
            />
            <MenuRow
              icon={<IconTextSize size={16} style={{ color: '#2176AE' }} />}
              label="Dimensione testo"
              onClick={() => { setLyricSize((s) => s >= 22 ? 14 : s + 4); setMenuOpen(false) }}
            />
            {semitones !== 0 && (
              <MenuRow
                icon={<IconDeviceFloppy size={16} style={{ color: '#2176AE' }} />}
                label={`Salva come "${currentKey}"`}
                onClick={() => { toast.success('Tonalità salvata'); setMenuOpen(false) }}
              />
            )}
            <MenuRow
              icon={<IconEdit size={16} style={{ color: '#2176AE' }} />}
              label="Modifica brano"
              onClick={() => { navigate(`/song/${id}/edit`); setMenuOpen(false) }}
            />
            <MenuRow
              icon={<IconTrash size={16} style={{ color: '#C0392B' }} />}
              label="Elimina"
              labelColor="#C0392B"
              onClick={() => { setDeleteOpen(true); setMenuOpen(false) }}
              last
            />
          </div>
        )}

        {/* Transposition bar */}
        <div style={uiHidden ? headerCollapsed : headerShown}>
          <div style={{
            background: '#FFFFFF',
            borderBottom: '0.5px solid #E0DED8',
            padding: '8px 16px',
            display: 'flex', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Tonalità
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <button onClick={() => transpose(-1)} style={transpBtnStyle} aria-label="Abbassa">
                <IconMinus size={16} style={{ color: '#2176AE' }} />
              </button>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1C2333', minWidth: 40, textAlign: 'center' }}>
                {currentKey}
              </span>
              <button onClick={() => transpose(1)} style={transpBtnStyle} aria-label="Alza">
                <IconPlus size={16} style={{ color: '#2176AE' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Song content ─────────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        style={{ padding: '20px 16px', minHeight: '60vh' }}
      >
        <ChordProRenderer content={transposedContent} lyricSize={lyricSize} />
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} type="song" resourceId={id!} />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { deleteSong(id!); navigate('/library', { replace: true }) }}
        title="Elimina brano"
        message="Questa azione è irreversibile. I link condivisi per questo brano smetteranno di funzionare."
        confirmLabel="Elimina"
        danger
      />
    </div>
  )
}

// ── Internal sub-components ───────────────────────────────────────────────────

function MenuRow({ icon, label, labelColor = '#1C2333', onClick, last = false }: {
  icon: React.ReactNode
  label: string
  labelColor?: string
  onClick: () => void
  last?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '12px 14px',
        background: 'none', border: 'none',
        borderBottom: last ? 'none' : '0.5px solid #F0EEEB',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        minHeight: 44,
      }}
    >
      {icon}
      <span style={{ fontSize: 14, color: labelColor }}>{label}</span>
    </button>
  )
}
