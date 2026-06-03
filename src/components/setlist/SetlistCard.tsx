import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconList, IconCalendar, IconCopy, IconTrash } from '@tabler/icons-react'
import type { Setlist } from '../../store/useSetlistStore'

interface SetlistCardProps {
  setlist: Setlist
  onDuplicate: () => void
  onDelete: () => void
}

const DELETE_W = 76

export function SetlistCard({ setlist, onDuplicate, onDelete }: SetlistCardProps) {
  const navigate = useNavigate()

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

  function handleCardClick() {
    if (moved.current || dx !== 0) { dxRef.current = 0; setDx(0); return }
    navigate(`/setlists/${setlist.id}`)
  }

  const formattedDate = setlist.event_date
    ? new Date(setlist.event_date + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
      {/* Delete zone */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_W,
        background: '#C0392B', borderRadius: '0 12px 12px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button
          onClick={() => { dxRef.current = 0; setDx(0); onDelete() }}
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
        style={{
          background: '#FFFFFF', borderRadius: 12,
          border: '0.5px solid #E0DED8',
          transform: `translateX(${dx}px)`,
          willChange: 'transform',
          userSelect: 'none', WebkitUserSelect: 'none',
        }}
      >
        {/* Main tappable area */}
        <button
          onClick={handleCardClick}
          style={{
            width: '100%', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontFamily: 'inherit',
          }}
        >
          {/* Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: '#EDE9FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconList size={18} style={{ color: '#5B21B6' }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: 15, fontWeight: 500, color: '#1C2333',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {setlist.name}
            </p>
            {formattedDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <IconCalendar size={11} style={{ color: '#8A94A6', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#8A94A6' }}>{formattedDate}</span>
              </div>
            )}
            {setlist.description && (
              <p style={{
                margin: '2px 0 0', fontSize: 13, color: '#8A94A6',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {setlist.description}
              </p>
            )}
          </div>
        </button>

        {/* Footer actions */}
        <div style={{
          borderTop: '0.5px solid #F0EEEB',
          padding: '6px 14px',
          display: 'flex', alignItems: 'center',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '5px 8px', borderRadius: 8,
              fontSize: 13, color: '#8A94A6', fontFamily: 'inherit',
              minHeight: 36,
            }}
          >
            <IconCopy size={13} style={{ color: '#8A94A6' }} />
            Duplica
          </button>
          <span style={{ fontSize: 12, color: '#C8CDD8', marginLeft: 'auto' }}>
            ← scorri per eliminare
          </span>
        </div>
      </div>
    </div>
  )
}
