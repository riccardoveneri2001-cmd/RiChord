import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconMusic, IconFileText, IconPhoto, IconChevronRight, IconTrash } from '@tabler/icons-react'
import type { Song } from '../../store/useLibraryStore'

interface SongCardProps {
  song: Song
  onDelete: (id: string) => void
}

const TYPE_CONFIG = {
  chordpro: { bg: '#E0F0FA', Icon: IconMusic,    color: '#2176AE' },
  pdf:      { bg: '#FDE8E8', Icon: IconFileText, color: '#C0392B' },
  image:    { bg: '#E8F5E9', Icon: IconPhoto,    color: '#2E7D32' },
}

const DELETE_W = 76

export function SongCard({ song, onDelete }: SongCardProps) {
  const navigate = useNavigate()
  const { bg, Icon, color } = TYPE_CONFIG[song.type]

  const cardRef  = useRef<HTMLDivElement>(null)
  const dxRef    = useRef(0)
  const startX   = useRef(0)
  const startY   = useRef(0)
  const startDx  = useRef(0)
  const dir      = useRef<'h' | 'v' | null>(null)
  const moved    = useRef(false)

  const [dx, setDx] = useState(0)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    function onStart(e: TouchEvent) {
      startX.current  = e.touches[0].clientX
      startY.current  = e.touches[0].clientY
      startDx.current = dxRef.current
      dir.current = null
      moved.current = false
      el.style.transition = 'none'
    }

    function onMove(e: TouchEvent) {
      const dx2 = e.touches[0].clientX - startX.current
      const dy2 = e.touches[0].clientY - startY.current

      if (!dir.current) {
        if (Math.abs(dx2) < 5 && Math.abs(dy2) < 5) return
        dir.current = Math.abs(dx2) >= Math.abs(dy2) ? 'h' : 'v'
      }
      if (dir.current !== 'h') return

      e.preventDefault()
      moved.current = true
      const next = Math.max(-DELETE_W, Math.min(0, startDx.current + dx2))
      dxRef.current = next
      el.style.transform = `translateX(${next}px)`
    }

    function onEnd() {
      const snap = dxRef.current < -DELETE_W / 2 ? -DELETE_W : 0
      dxRef.current = snap
      el.style.transition = 'transform 0.25s ease-out'
      el.style.transform   = `translateX(${snap}px)`
      setDx(snap)
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

  function handleClick() {
    if (moved.current || dx !== 0) { dxRef.current = 0; setDx(0); return }
    if (song.type === 'chordpro') navigate(`/song/${song.id}`)
    else navigate(`/song/${song.id}/file`)
  }

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
      {/* Delete action (behind card) */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_W,
        background: '#C0392B', borderRadius: '0 12px 12px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <button
          onClick={() => { setDx(0); dxRef.current = 0; onDelete(song.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 12px', minHeight: 44, minWidth: 44, justifyContent: 'center',
          }}
        >
          <IconTrash size={18} style={{ color: '#FFFFFF' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#FFFFFF' }}>Elimina</span>
        </button>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#FFFFFF',
          borderRadius: 12,
          border: '0.5px solid #E0DED8',
          padding: '12px 14px',
          cursor: 'pointer',
          transform: `translateX(${dx}px)`,
          willChange: 'transform',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Type icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} style={{ color }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 15, fontWeight: 500, color: '#1C2333',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {song.title}
          </p>
          {song.artist && (
            <p style={{
              margin: '2px 0 0', fontSize: 13, color: '#8A94A6',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {song.artist}
            </p>
          )}
          {song.type === 'chordpro' && song.key && (
            <span style={{
              display: 'inline-block', marginTop: 4,
              fontSize: 12, fontWeight: 500, color: '#2176AE',
              background: '#E0F0FA', borderRadius: 20, padding: '2px 8px',
            }}>
              {song.key}
            </span>
          )}
        </div>

        {/* Chevron */}
        <IconChevronRight size={16} style={{ color: '#C8CDD8', flexShrink: 0 }} />
      </div>
    </div>
  )
}
