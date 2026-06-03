import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Play } from 'lucide-react'
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
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTap = useCallback(() => {
    setShowControls((v) => {
      if (!v) {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => setShowControls(false), 3000)
      }
      return !v
    })
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' && onNext) onNext()
    if (e.key === 'ArrowLeft' && onPrev) onPrev()
  }, [onClose, onNext, onPrev])

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/80 to-transparent"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div>
              <p className="text-white font-display text-lg leading-tight">{song.title}</p>
              {song.artist && <p className="text-white/60 font-jakarta text-sm">{song.artist}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-20 cursor-pointer"
        onClick={handleTap}
      >
        <ChordProRenderer content={content} fontSize="lg" className="text-white" />
      </div>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-5 py-4 bg-gradient-to-t from-black/80 to-transparent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {onPrev && (
              <button onClick={onPrev} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                ‹
              </button>
            )}

            {/* AutoScroll */}
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <button onClick={toggle} className="text-white">
                {isScrolling ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <input
                type="range"
                min={0.2}
                max={5}
                step={0.2}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-20 accent-blue-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {onNext && (
              <button onClick={onNext} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors ml-auto">
                ›
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
