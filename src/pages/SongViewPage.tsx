import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Navigate, useLocation } from 'react-router-dom'
import {
  IconArrowLeft, IconShare, IconDotsVertical,
  IconLanguage, IconTextSize, IconEdit, IconTrash,
  IconMinus, IconPlus, IconDeviceFloppy, IconDownload,
} from '@tabler/icons-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { useTranspose } from '../hooks/useTranspose'
import { usePullToRefreshBlock } from '../hooks/usePullToRefreshBlock'
import { ChordProRenderer } from '../components/song/ChordProRenderer'
import { ShareModal } from '../components/share/ShareModal'
import { BottomSheet } from '../components/ui/BottomSheet'
import { ConfirmModal } from '../components/ui/Modal'
import { downloadCho, downloadSongPdf } from '../lib/export'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────────

const DISPLAY_KEYS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']
const CHROMATIC: Record<string, number> = {
  Do: 0, 'Do#': 1, Re: 2, 'Re#': 3, Mi: 4, Fa: 5,
  'Fa#': 6, Sol: 7, 'Sol#': 8, La: 9, 'La#': 10, Si: 11,
  Reb: 1, Mib: 3, Solb: 6, Lab: 8, Sib: 10,
}
const LYRIC_SIZE_KEY = 'song-lyric-size'
const HIDE_HINT_KEY  = 'song-hide-hint'

// ── Setlist navigation state type ─────────────────────────────────────────────

interface SetlistCtx {
  setlistId: string
  setlistName: string
  songIds: string[]
  currentIndex: number
}

function isSetlistCtx(s: unknown): s is SetlistCtx {
  return (
    typeof s === 'object' && s !== null &&
    'setlistId' in s && 'setlistName' in s && 'songIds' in s && 'currentIndex' in s
  )
}

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
  const location = useLocation()
  const { songs, deleteSong } = useLibraryStore()
  const song = songs.find((s) => s.id === id)
  usePullToRefreshBlock()

  const setlistCtx = isSetlistCtx(location.state) ? location.state : null

  const { semitones, notation, transposedContent, transpose, toggleNotation } = useTranspose(
    song?.content ?? '',
    song?.key ?? null,
  )

  const [uiHidden,   setUiHidden]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [sizeOpen,   setSizeOpen]   = useState(false)
  const [shareOpen,  setShareOpen]  = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [lyricSize,  setLyricSize]  = useState<number>(() => {
    const v = sessionStorage.getItem(LYRIC_SIZE_KEY)
    return v ? parseFloat(v) : 17
  })

  // Refs kept in sync for touch handlers (avoid stale closures)
  const menuOpenRef    = useRef(false)
  const lyricSizeRef   = useRef(lyricSize)
  const setlistCtxRef  = useRef(setlistCtx)
  const navigateRef    = useRef(navigate)
  useEffect(() => { menuOpenRef.current   = menuOpen  }, [menuOpen])
  useEffect(() => { lyricSizeRef.current  = lyricSize }, [lyricSize])
  useEffect(() => { setlistCtxRef.current = setlistCtx })
  useEffect(() => { navigateRef.current   = navigate  })

  // Persist lyric size
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

  // Current displayed key after transposition
  const currentKey = useMemo(() => {
    if (!song?.key) return '—'
    const base = CHROMATIC[song.key]
    if (base === undefined) return song.key
    return DISPLAY_KEYS[(base + semitones + 120) % 12]
  }, [song?.key, semitones])

  // Setlist navigation helpers
  function goToPrev() {
    const ctx = setlistCtxRef.current
    const nav = navigateRef.current
    if (!ctx || ctx.currentIndex <= 0) return
    const prevId = ctx.songIds[ctx.currentIndex - 1]
    nav(`/song/${prevId}`, { state: { ...ctx, currentIndex: ctx.currentIndex - 1 }, replace: true })
  }
  function goToNext() {
    const ctx = setlistCtxRef.current
    const nav = navigateRef.current
    if (!ctx || ctx.currentIndex >= ctx.songIds.length - 1) return
    const nextId = ctx.songIds[ctx.currentIndex + 1]
    nav(`/song/${nextId}`, { state: { ...ctx, currentIndex: ctx.currentIndex + 1 }, replace: true })
  }

  // ── Touch: pinch-to-zoom + tap-to-toggle-UI + horizontal swipe navigation ──

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    let initDist  = 0
    let initSize  = 17
    let twoFinger = false
    let tapStart  = { x: 0, y: 0, t: 0 }
    let swipeDir: 'h' | 'v' | null = null

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
        swipeDir  = null
      } else if (e.touches.length === 2) {
        twoFinger = true
        swipeDir  = null
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
        return
      }
      if (e.touches.length === 1 && !twoFinger) {
        const dx = e.touches[0].clientX - tapStart.x
        const dy = e.touches[0].clientY - tapStart.y
        if (!swipeDir && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
          swipeDir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
        }
        if (swipeDir === 'h') e.preventDefault()
      }
    }

    function onEnd(e: TouchEvent) {
      if (e.touches.length > 0) return
      if (twoFinger) { twoFinger = false; return }
      const dx = e.changedTouches[0].clientX - tapStart.x
      const dy = e.changedTouches[0].clientY - tapStart.y
      const dt = Date.now() - tapStart.t

      // Horizontal swipe: setlist navigation
      if (swipeDir === 'h' && Math.abs(dx) > 60 && setlistCtxRef.current) {
        const ctx = setlistCtxRef.current
        const nav = navigateRef.current
        if (dx < 0 && ctx.currentIndex < ctx.songIds.length - 1) {
          const nextId = ctx.songIds[ctx.currentIndex + 1]
          nav(`/song/${nextId}`, { state: { ...ctx, currentIndex: ctx.currentIndex + 1 }, replace: true })
        } else if (dx > 0 && ctx.currentIndex > 0) {
          const prevId = ctx.songIds[ctx.currentIndex - 1]
          nav(`/song/${prevId}`, { state: { ...ctx, currentIndex: ctx.currentIndex - 1 }, replace: true })
        }
        swipeDir = null
        return
      }

      swipeDir = null

      // Tap: toggle UI or close menu
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
      <button onClick={() => navigate(-1)} style={{ color: '#2176AE', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, fontSize: 14, fontFamily: 'inherit' }}>
        ← Indietro
      </button>
    </div>
  )

  if (song.type !== 'chordpro') return <Navigate to={`/song/${id}/file`} replace state={location.state} />

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

      {/* Backdrop — closes menu when tapping outside the dropdown */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9 }}
          onClick={() => setMenuOpen(false)}
        />
      )}

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

            <button onClick={() => navigate(-1)} style={iconBtnStyle} aria-label="Indietro">
              <IconArrowLeft size={18} style={{ color: '#2176AE' }} />
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1C2333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {song.title}
              </p>
              {song.artist && (
                <p style={{ margin: 0, fontSize: 13, color: '#8A94A6' }}>{song.artist}</p>
              )}
            </div>

            <button onClick={() => setShareOpen(true)} style={iconBtnStyle} aria-label="Condividi">
              <IconShare size={17} style={{ color: '#1C2333' }} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
              style={iconBtnStyle}
              aria-label="Altro"
            >
              <IconDotsVertical size={17} style={{ color: '#1C2333' }} />
            </button>
          </div>
        </div>

        {/* Dropdown */}
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
              onClick={() => { setMenuOpen(false); setSizeOpen(true) }}
            />
            <MenuRow
              icon={<IconDownload size={16} style={{ color: '#2176AE' }} />}
              label="Esporta come .cho"
              onClick={() => { downloadCho(song); setMenuOpen(false) }}
            />
            <MenuRow
              icon={<IconDownload size={16} style={{ color: '#2176AE' }} />}
              label="Esporta come PDF"
              onClick={() => { downloadSongPdf(song); setMenuOpen(false) }}
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

        {/* Setlist navigation bar */}
        {setlistCtx && (
          <div style={uiHidden ? headerCollapsed : headerShown}>
            <div style={{
              background: '#E0F0FA',
              padding: '4px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <button
                onClick={goToPrev}
                disabled={setlistCtx.currentIndex === 0}
                style={{
                  background: 'none', border: 'none', padding: '2px 8px',
                  fontSize: 18, lineHeight: 1, cursor: 'pointer',
                  color: setlistCtx.currentIndex === 0 ? '#B0CEDE' : '#2176AE',
                }}
                aria-label="Brano precedente"
              >
                ‹
              </button>
              <span style={{
                flex: 1, fontSize: 12, fontWeight: 500, color: '#2176AE',
                textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {setlistCtx.currentIndex + 1} / {setlistCtx.songIds.length} · {setlistCtx.setlistName}
              </span>
              <button
                onClick={goToNext}
                disabled={setlistCtx.currentIndex === setlistCtx.songIds.length - 1}
                style={{
                  background: 'none', border: 'none', padding: '2px 8px',
                  fontSize: 18, lineHeight: 1, cursor: 'pointer',
                  color: setlistCtx.currentIndex === setlistCtx.songIds.length - 1 ? '#B0CEDE' : '#2176AE',
                }}
                aria-label="Brano successivo"
              >
                ›
              </button>
            </div>
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

      <BottomSheet open={sizeOpen} onClose={() => setSizeOpen(false)}>
        <div style={{ padding: '0 16px 32px' }}>
          <p style={{ textAlign: 'center', margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1C2333' }}>
            Dimensione testo
          </p>
          {([['Piccolo', 14], ['Medio', 17], ['Grande', 22]] as const).map(([label, size]) => (
            <button
              key={label}
              onClick={() => { setLyricSize(size); setSizeOpen(false) }}
              style={{
                width: '100%', padding: '14px 16px', marginBottom: 8,
                borderRadius: 12, border: `1.5px solid ${lyricSize === size ? '#2176AE' : '#E0DED8'}`,
                background: lyricSize === size ? '#E0F0FA' : '#FFFFFF',
                color: lyricSize === size ? '#2176AE' : '#1C2333',
                fontSize: 15, fontWeight: lyricSize === size ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              {label}
              <span style={{ float: 'right', fontSize: 13, opacity: 0.5 }}>{size}px</span>
            </button>
          ))}
        </div>
      </BottomSheet>

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
