import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { IconArrowLeft, IconDotsVertical, IconScan } from '@tabler/icons-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { FileCard } from '../components/file/FileCard'
import { BottomSheet } from '../components/ui/BottomSheet'
import { usePullToRefreshBlock } from '../hooks/usePullToRefreshBlock'
import { runOcr } from '../lib/ocr'
import toast from 'react-hot-toast'

// ── Setlist navigation state ──────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export function SongFilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const song = useLibraryStore((s) => s.songs.find((s) => s.id === id))
  usePullToRefreshBlock()

  const setlistCtx = isSetlistCtx(location.state) ? location.state : null

  const [uiHidden,    setUiHidden]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [ocrLoading,  setOcrLoading]  = useState(false)
  const [ocrStatus,   setOcrStatus]   = useState('')
  const [ocrText,     setOcrText]     = useState('')
  const [ocrOpen,     setOcrOpen]     = useState(false)

  // Sync bottom-nav visibility with uiHidden
  useEffect(() => {
    if (uiHidden) document.body.classList.add('ui-hidden')
    else document.body.classList.remove('ui-hidden')
    return () => document.body.classList.remove('ui-hidden')
  }, [uiHidden])

  const navigateRef = useRef(navigate)
  useEffect(() => { navigateRef.current = navigate })

  if (!song) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <p style={{ color: '#8A94A6', fontSize: 15 }}>Brano non trovato.</p>
      <button
        onClick={() => navigate(-1)}
        style={{ color: '#2176AE', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, fontSize: 14, fontFamily: 'inherit' }}
      >
        ← Indietro
      </button>
    </div>
  )

  // Setlist navigation
  function goToPrev() {
    if (!setlistCtx || setlistCtx.currentIndex <= 0) return
    const prevId = setlistCtx.songIds[setlistCtx.currentIndex - 1]
    navigate(`/song/${prevId}`, { state: { ...setlistCtx, currentIndex: setlistCtx.currentIndex - 1 }, replace: true })
  }
  function goToNext() {
    if (!setlistCtx || setlistCtx.currentIndex >= setlistCtx.songIds.length - 1) return
    const nextId = setlistCtx.songIds[setlistCtx.currentIndex + 1]
    navigate(`/song/${nextId}`, { state: { ...setlistCtx, currentIndex: setlistCtx.currentIndex + 1 }, replace: true })
  }

  // OCR
  async function handleOcr() {
    if (!song || !song.file_url) return
    setMenuOpen(false)
    setOcrLoading(true)
    setOcrStatus('Avvio…')
    try {
      const text = await runOcr(
        song.file_url,
        song.type === 'pdf' ? 'pdf' : 'image',
        setOcrStatus,
      )
      setOcrText(text)
      setOcrOpen(true)
    } catch (err) {
      console.error(err)
      toast.error('Errore durante il riconoscimento del testo')
    } finally {
      setOcrLoading(false)
      setOcrStatus('')
    }
  }

  const iconBtn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
    background: '#FFFFFF', border: '0.5px solid #E0DED8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  }

  const headerCollapsed: React.CSSProperties = {
    maxHeight: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none',
    transition: 'max-height 0.3s ease, opacity 0.3s ease',
  }
  const headerShown: React.CSSProperties = {
    maxHeight: 200, opacity: 1, overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease',
  }

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* Backdrop for menu */}
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
            background: '#F5F4F1', borderBottom: '0.5px solid #E0DED8',
            padding: '6px 16px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <button
              onClick={() => navigate(-1)}
              style={iconBtn}
              aria-label="Indietro"
            >
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

            {/* Three-dot button */}
            <button
              onClick={(e) => { if (ocrLoading) return; e.stopPropagation(); setMenuOpen(o => !o) }}
              style={iconBtn}
              aria-label="Altro"
            >
              {ocrLoading
                ? <div style={{ width: 16, height: 16, border: '2px solid #E0F0FA', borderTopColor: '#2176AE', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <IconDotsVertical size={17} style={{ color: '#1C2333' }} />
              }
            </button>
          </div>
        </div>

        {/* Dropdown — outside overflow:hidden, absolute inside sticky container */}
        {menuOpen && (
          <div
            style={{
              position: 'absolute', top: 52, right: 16, zIndex: 100,
              background: '#FFFFFF', borderRadius: 12,
              border: '0.5px solid #E0DED8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: 210, overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleOcr}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '12px 14px',
                background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                minHeight: 44,
              }}
            >
              <IconScan size={16} style={{ color: '#2176AE' }} />
              <span style={{ fontSize: 14, color: '#1C2333' }}>Converti in ChordPro</span>
            </button>
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
      </div>

      {/* OCR progress banner */}
      {ocrLoading && ocrStatus && (
        <div style={{
          background: '#E0F0FA', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 14, height: 14, border: '2px solid #B0D4EC', borderTopColor: '#2176AE', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#2176AE', fontWeight: 500 }}>{ocrStatus}</span>
        </div>
      )}

      {/* Tags */}
      {!uiHidden && (song.tags ?? []).length > 0 && (
        <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {song.tags.map((t) => (
            <span key={t} style={{
              fontSize: 12, fontWeight: 500, color: '#2176AE',
              background: '#E0F0FA', borderRadius: 20, padding: '3px 10px',
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* File content */}
      {/* For PDF: tap overlay in center triggers UI toggle */}
      <div style={{ position: 'relative' }}>
        {song.type === 'pdf' ? (
          <>
            <FileCard song={song} />
            {/* Center tap zone for toggling UI on PDFs (can't intercept iframe touches directly) */}
            <div
              style={{
                position: 'absolute',
                top: '40%', left: 0, right: 0,
                height: 80, zIndex: 2,
                background: 'transparent',
              }}
              onClick={() => setUiHidden(v => !v)}
            />
          </>
        ) : (
          <div style={{ padding: '0 16px' }}>
            <FileCard song={song} onTap={() => setUiHidden(v => !v)} />
          </div>
        )}
      </div>

      {/* OCR result editor */}
      <BottomSheet open={ocrOpen} onClose={() => { setOcrOpen(false); setOcrText('') }}>
        <div style={{ padding: '0 16px 32px' }}>
          <p style={{ textAlign: 'center', margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#1C2333' }}>
            Testo riconosciuto
          </p>
          <p style={{ textAlign: 'center', margin: '0 0 14px', fontSize: 13, color: '#8A94A6', lineHeight: 1.5 }}>
            Correggi il testo, poi salvalo come nuovo brano ChordPro.
          </p>
          <textarea
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            rows={12}
            style={{
              width: '100%', borderRadius: 10, padding: '10px 12px',
              border: '0.5px solid #E0DED8', fontSize: 14,
              fontFamily: 'monospace', resize: 'vertical', outline: 'none',
              boxSizing: 'border-box', color: '#1C2333', background: '#FFFFFF',
            }}
          />
          <button
            onClick={() => {
              setOcrOpen(false)
              navigate('/song/new', { state: { ocrContent: ocrText } })
            }}
            style={{
              marginTop: 12, width: '100%', padding: 14, borderRadius: 12,
              border: 'none', background: '#2176AE', color: '#FFFFFF',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Salva come nuovo brano
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
