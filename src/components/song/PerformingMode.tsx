import { useCallback, useEffect, useRef, useState } from 'react'
import {
  IconX, IconPlayerPlay, IconPlayerPause,
  IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react'
import { ChordProRenderer } from './ChordProRenderer'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import type { Song } from '../../store/useLibraryStore'

interface PerformingModeProps {
  song: Song
  content: string
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
  songIndex?: number
  totalSongs?: number
  setlistName?: string
}

export function PerformingMode({
  song, content, onClose, onNext, onPrev,
  songIndex, totalSongs, setlistName,
}: PerformingModeProps) {
  const [showControls, setShowControls] = useState(true)
  const rootRef    = useRef<HTMLDivElement>(null)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const onNextRef  = useRef(onNext)
  const onPrevRef  = useRef(onPrev)
  const { isScrolling, speed, setSpeed, toggle } = useAutoScroll(scrollRef)

  // Keep callback refs current without re-registering touch handlers
  useEffect(() => { onNextRef.current = onNext }, [onNext])
  useEffect(() => { onPrevRef.current = onPrev }, [onPrev])

  // Auto-hide controls after 3 s
  useEffect(() => {
    if (!showControls) return
    const t = setTimeout(() => setShowControls(false), 3000)
    return () => clearTimeout(t)
  }, [showControls])

  // Keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' && onNext) onNext()
    if (e.key === 'ArrowLeft'  && onPrev) onPrev()
    if (e.key === ' ') { e.preventDefault(); toggle() }
  }, [onClose, onNext, onPrev, toggle])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Horizontal swipe gesture for song navigation
  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    let startX = 0, startY = 0
    let dirDecided = false, isHoriz = false

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      dirDecided = false
      isHoriz = false
    }

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      if (!dirDecided && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
        dirDecided = true
        isHoriz = Math.abs(dx) > Math.abs(dy)
      }
      if (isHoriz) e.preventDefault()
    }

    const onEnd = (e: TouchEvent) => {
      if (!isHoriz) return
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dy) < 80 && Math.abs(dx) > 60) {
        if (dx < 0) onNextRef.current?.()
        else        onPrevRef.current?.()
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

  const overlayStyle: React.CSSProperties = {
    opacity: showControls ? 1 : 0,
    pointerEvents: showControls ? 'all' : 'none',
    transition: 'opacity 0.25s ease',
  }

  const iconBtnStyle: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: 'rgba(255,255,255,0.12)', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#FFFFFF',
  }

  const isChordPro = song.type === 'chordpro'

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#000000',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header overlay */}
      <div
        style={{
          ...overlayStyle,
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding: '14px 16px 40px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Setlist context bar */}
        {setlistName && songIndex !== undefined && totalSongs !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)',
              borderRadius: 20, padding: '3px 12px',
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.02em',
            }}>
              {songIndex + 1} / {totalSongs} · {setlistName}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {song.title}
            </p>
            {song.artist && (
              <p style={{ margin: '3px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{song.artist}</p>
            )}
          </div>
          <button onClick={onClose} style={iconBtnStyle} aria-label="Chiudi">
            <IconX size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      {song.type === 'pdf' && song.file_url ? (
        <iframe
          src={song.file_url}
          title={song.title}
          style={{ flex: 1, border: 'none', display: 'block' }}
          onClick={() => setShowControls((v) => !v)}
        />
      ) : song.type === 'image' && song.file_url ? (
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          onClick={() => setShowControls((v) => !v)}
        >
          <img
            src={song.file_url}
            alt={song.title}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      ) : (
        <div
          ref={scrollRef}
          onClick={() => setShowControls((v) => !v)}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '88px 20px 120px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <ChordProRenderer content={content} lyricSize={20} theme="dark" />
        </div>
      )}

      {/* Footer overlay — only for chordpro (autoscroll controls) */}
      {isChordPro && (
        <div
          style={{
            ...overlayStyle,
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
            padding: '40px 16px 28px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onPrev ? (
            <button onClick={onPrev} style={iconBtnStyle} aria-label="Precedente">
              <IconChevronLeft size={22} />
            </button>
          ) : (
            <div style={{ width: 44 }} />
          )}

          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.1)', borderRadius: 12,
            padding: '8px 14px',
          }}>
            <button
              onClick={toggle}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', display: 'flex', alignItems: 'center', flexShrink: 0, padding: 0 }}
              aria-label={isScrolling ? 'Pausa scorrimento' : 'Avvia scorrimento'}
            >
              {isScrolling
                ? <IconPlayerPause size={18} style={{ color: '#FFFFFF' }} />
                : <IconPlayerPlay  size={18} style={{ color: '#FFFFFF' }} />
              }
            </button>
            <input
              type="range" min={0.2} max={5} step={0.2} value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              style={{ flex: 1, accentColor: '#2176AE', cursor: 'pointer' }}
              aria-label="Velocità scorrimento"
            />
          </div>

          {onNext ? (
            <button onClick={onNext} style={iconBtnStyle} aria-label="Successivo">
              <IconChevronRight size={22} />
            </button>
          ) : (
            <div style={{ width: 44 }} />
          )}
        </div>
      )}

      {/* Prev/Next overlay for non-chordpro songs */}
      {!isChordPro && (onPrev || onNext) && (
        <div
          style={{
            ...overlayStyle,
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            padding: '0 16px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onPrev
            ? <button onClick={onPrev} style={iconBtnStyle} aria-label="Precedente"><IconChevronLeft size={22} /></button>
            : <div style={{ width: 44 }} />
          }
          {onNext
            ? <button onClick={onNext} style={iconBtnStyle} aria-label="Successivo"><IconChevronRight size={22} /></button>
            : <div style={{ width: 44 }} />
          }
        </div>
      )}
    </div>
  )
}
