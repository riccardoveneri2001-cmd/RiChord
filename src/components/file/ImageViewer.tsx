import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  alt: string
}

export function ImageViewer({ src, alt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ scale: 1, x: 0, y: 0 })
  const [display, setDisplay] = useState({ scale: 1, x: 0, y: 0 })
  const lastTapRef = useRef(0)

  // Disable viewport zoom while this component is mounted
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    const original = meta?.content ?? ''
    if (meta) meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    return () => { if (meta) meta.content = original }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function apply(t: { scale: number; x: number; y: number }) {
      transformRef.current = t
      setDisplay({ ...t })
    }

    function pinchDist(e: TouchEvent) {
      return Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      )
    }

    let initDist = 0
    let initScale = 1
    let initX = 0, initY = 0
    let panStartX = 0, panStartY = 0
    let twoFinger = false

    const onStart = (e: TouchEvent) => {
      e.preventDefault()
      const t = transformRef.current
      if (e.touches.length === 2) {
        twoFinger = true
        initDist  = pinchDist(e)
        initScale = t.scale
        initX     = t.x
        initY     = t.y
      } else {
        twoFinger  = false
        panStartX  = e.touches[0].clientX
        panStartY  = e.touches[0].clientY
        initX      = t.x
        initY      = t.y

        // Double-tap: toggle zoom
        const now = Date.now()
        if (now - lastTapRef.current < 300) {
          apply(t.scale > 1.5 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 })
        }
        lastTapRef.current = now
      }
    }

    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      const t = transformRef.current
      if (e.touches.length === 2 && twoFinger) {
        const s = Math.max(1, Math.min(6, initScale * (pinchDist(e) / initDist)))
        apply({ scale: s, x: initX, y: initY })
      } else if (e.touches.length === 1 && !twoFinger && t.scale > 1) {
        const dx = e.touches[0].clientX - panStartX
        const dy = e.touches[0].clientY - panStartY
        apply({ scale: t.scale, x: initX + dx, y: initY + dy })
      }
    }

    const onEnd = () => {
      const t = transformRef.current
      if (t.scale < 1.05) apply({ scale: 1, x: 0, y: 0 })
    }

    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    el.addEventListener('touchend',   onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
      el.removeEventListener('touchend',   onEnd)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '75vh',
        overflow: 'hidden', touchAction: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F5F4F1', borderRadius: 12,
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          maxWidth: '100%', maxHeight: '100%',
          objectFit: 'contain', display: 'block',
          transform: `translate(${display.x}px, ${display.y}px) scale(${display.scale})`,
          transformOrigin: 'center center',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
