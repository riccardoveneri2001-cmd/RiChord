import { useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // Swipe down to close
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      startY.current = e.touches[0].clientY
      currentY.current = 0
    }

    function onTouchMove(e: TouchEvent) {
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0) {
        currentY.current = dy
        el.style.transition = 'none'
        el.style.transform = `translateY(${dy}px)`
      }
    }

    function onTouchEnd() {
      if (currentY.current > 100) {
        onClose()
      } else {
        el.style.transition = 'transform 0.25s ease-in'
        el.style.transform = 'translateY(0)'
      }
      currentY.current = 0
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onClose, mounted])

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(28,35,51,0.35)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          borderTop: '0.5px solid #E0DED8',
          willChange: 'transform',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.34,1.2,0.64,1)',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0DED8' }} />
        </div>

        {children}
      </div>
    </div>
  )
}
