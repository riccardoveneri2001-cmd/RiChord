import { useEffect, useRef, useState } from 'react'

const THRESHOLD  = 68    // px to pull before "ready to refresh"
const MAX_PULL   = 88    // maximum visual travel (px)
const RESISTANCE = 0.45  // finger-to-indicator ratio

type Phase = 'idle' | 'pulling' | 'releasing' | 'refreshing'

const C = 2 * Math.PI * 8  // SVG arc circumference (r=8)

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullY, setPullY] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let startY    = 0
    let active    = false
    let curPull   = 0

    function onStart(e: TouchEvent) {
      if (document.body.classList.contains('ptr-disabled')) return
      if (window.scrollY > 0) return
      startY  = e.touches[0].clientY
      active  = true
      curPull = 0
    }

    function onMove(e: TouchEvent) {
      if (!active) return
      const dy = e.touches[0].clientY - startY
      if (dy <= 0) { active = false; return }
      e.preventDefault()
      curPull = Math.min(dy * RESISTANCE, MAX_PULL)
      setPullY(curPull)
      setPhase('pulling')
    }

    function onEnd() {
      if (!active) return
      active = false
      if (curPull >= THRESHOLD) {
        setPhase('refreshing')
        setPullY(THRESHOLD + 6)
        timerRef.current = setTimeout(() => window.location.reload(), 420)
      } else {
        setPhase('releasing')
        setPullY(0)
        timerRef.current = setTimeout(() => setPhase('idle'), 280)
      }
      curPull = 0
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove',  onMove,  { passive: false })
    document.addEventListener('touchend',   onEnd)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove',  onMove)
      document.removeEventListener('touchend',   onEnd)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const indicatorY  = -40 + (pullY / MAX_PULL) * 58
  const progress    = Math.min(pullY / THRESHOLD, 1)
  const ready       = pullY >= THRESHOLD
  const isReleasing = phase === 'releasing' || phase === 'refreshing'

  return (
    <>
      {/* Indicator — always a sibling of children, never a wrapper */}
      {phase !== 'idle' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          zIndex: 9999, display: 'flex', justifyContent: 'center',
          transform: `translateY(${indicatorY}px)`,
          transition: isReleasing ? 'transform 0.25s ease' : 'none',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#FFFFFF',
            border: '0.5px solid #E0DED8',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {phase === 'refreshing' ? (
              <div style={{
                width: 18, height: 18,
                border: '2px solid #E0F0FA',
                borderTopColor: '#2176AE',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#E0F0FA" strokeWidth="2" />
                <circle
                  cx="10" cy="10" r="8"
                  stroke="#2176AE" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - progress)}
                  transform="rotate(-90 10 10)"
                />
                <path
                  d={ready
                    ? 'M10 14 L10 6 M7 9 L10 6 L13 9'
                    : 'M10 6 L10 14 M7 11 L10 14 L13 11'}
                  stroke="#2176AE" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      )}
      {children}
    </>
  )
}
