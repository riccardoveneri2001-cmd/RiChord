import { useState, useRef, useCallback, useEffect } from 'react'

export function useAutoScroll(containerRef: React.RefObject<HTMLElement | null>) {
  const [isScrolling, setIsScrolling] = useState(false)
  const [speed, setSpeed] = useState(1) // px per frame
  const rafRef = useRef<number | null>(null)

  const scroll = useCallback(() => {
    if (!containerRef.current) return
    containerRef.current.scrollTop += speed
    rafRef.current = requestAnimationFrame(scroll)
  }, [containerRef, speed])

  const start = useCallback(() => {
    setIsScrolling(true)
  }, [])

  const stop = useCallback(() => {
    setIsScrolling(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    if (isScrolling) stop()
    else start()
  }, [isScrolling, start, stop])

  useEffect(() => {
    if (isScrolling) {
      rafRef.current = requestAnimationFrame(scroll)
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isScrolling, scroll])

  return { isScrolling, speed, setSpeed, toggle, start, stop }
}
