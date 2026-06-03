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
}

export function PerformingMode({ song, content, onClose, onNext, onPrev }: PerformingModeProps) {
  const [showControls, setShowControls] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { isScrolling, speed, setSpeed, toggle } = useAutoScroll(scrollRef)

  // Auto-hide controls after 3 s of visibility
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

  function handleContentTap() {
    setShowControls((v) => !v)
  }

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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000000',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header overlay */}
      <div
        style={{
          ...overlayStyle,
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding: '16px 16px 40px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
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

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onClick={handleContentTap}
        style={{
          flex: 1, overflowY: 'auto',
          padding: '88px 20px 120px',
          cursor: 'default',
          // Hide scrollbar
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <ChordProRenderer content={content} lyricSize={20} theme="dark" />
      </div>

      {/* Footer overlay */}
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
        {/* Prev */}
        {onPrev ? (
          <button onClick={onPrev} style={iconBtnStyle} aria-label="Precedente">
            <IconChevronLeft size={22} />
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}

        {/* Autoscroll */}
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
            type="range"
            min={0.2}
            max={5}
            step={0.2}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            style={{ flex: 1, accentColor: '#2176AE', cursor: 'pointer' }}
            aria-label="Velocità scorrimento"
          />
        </div>

        {/* Next */}
        {onNext ? (
          <button onClick={onNext} style={iconBtnStyle} aria-label="Successivo">
            <IconChevronRight size={22} />
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}
      </div>
    </div>
  )
}
