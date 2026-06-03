import { useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Maximize2, Share2, Minus, Plus, ChevronDown, RotateCcw } from 'lucide-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { useOfflineStore } from '../store/useOfflineStore'
import { useTranspose } from '../hooks/useTranspose'
import { ChordProRenderer } from '../components/song/ChordProRenderer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Tag } from '../components/ui/Badge'
import { PerformingMode } from '../components/song/PerformingMode'
import { ShareModal } from '../components/share/ShareModal'
import { ALL_KEYS_IT } from '../lib/transpose'

type FontSize = 'sm' | 'md' | 'lg'

export function SongViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const librarySong = useLibraryStore((s) => s.songs.find((s) => s.id === id))
  const offlineSong = useOfflineStore((s) => s.offlineSongs.find((s) => s.id === id))
  const song = librarySong ?? offlineSong

  const { semitones, notation, transposedContent, transpose, reset, toggleNotation } = useTranspose(
    song?.content ?? '',
    song?.key ?? null
  )

  const [fontSize, setFontSize] = useState<FontSize>('md')
  const [performing, setPerforming] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  if (!song) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-secondary font-jakarta">Brano non trovato</p>
          <Button variant="ghost" onClick={() => navigate('/library')} className="mt-4">← Libreria</Button>
        </div>
      </PageWrapper>
    )
  }

  if (song.type !== 'chordpro') {
    return <Navigate to={`/song/${id}/file`} replace />
  }

  const fontSizes: FontSize[] = ['sm', 'md', 'lg']
  const fontTextSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button onClick={() => navigate('/library')} className="flex items-center gap-2 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors font-jakarta text-sm">
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Libreria</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareOpen(true)}
            className="p-2 rounded-xl text-secondary hover:text-blue-accent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={() => navigate(`/song/${id}/edit`)}
            className="p-2 rounded-xl text-secondary hover:text-primary-light dark:hover:text-primary-dark hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={() => setPerforming(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-accent text-white text-sm font-jakarta hover:bg-blue-500 transition-colors"
          >
            <Maximize2 size={15} />
            <span className="hidden sm:inline">Esegui</span>
          </button>
        </div>
      </div>

      {/* Song info */}
      <div className="mb-5">
        <h1 className="text-2xl font-display text-primary-light dark:text-primary-dark">{song.title}</h1>
        {song.artist && <p className="text-secondary font-jakarta text-sm mt-0.5">{song.artist}</p>}
        {(song.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {song.tags.map((t) => <Tag key={t} label={t} />)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark p-4 mb-5 flex flex-wrap gap-4 items-center">
        {/* Transpose */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary font-jakarta">Tonalità</span>
          <button onClick={() => transpose(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors">
            <Minus size={14} />
          </button>
          <div className="relative">
            <select
              value={semitones}
              onChange={() => {}}
              className="appearance-none bg-blue-50 dark:bg-blue-900/20 text-blue-accent font-mono text-sm px-3 py-1 rounded-lg border-0 outline-none cursor-pointer pr-6"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const key = song.key ? ALL_KEYS_IT[(ALL_KEYS_IT.indexOf(song.key) + i) % 12] : `+${i}`
                return <option key={i} value={i}>{i === 0 ? (song.key || '—') : key}</option>
              })}
            </select>
            <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-blue-accent pointer-events-none" />
          </div>
          <button onClick={() => transpose(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors">
            <Plus size={14} />
          </button>
          {semitones !== 0 && (
            <button onClick={reset} className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors">
              <RotateCcw size={13} />
            </button>
          )}
        </div>

        {/* Notation toggle */}
        <button
          onClick={toggleNotation}
          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm font-mono text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors"
        >
          {notation === 'italian' ? 'Do→C' : 'C→Do'}
        </button>

        {/* Font size */}
        <div className="flex items-center gap-1 ml-auto">
          {fontSizes.map((fs) => (
            <button
              key={fs}
              onClick={() => setFontSize(fs)}
              className={`px-2 py-1 rounded-lg font-mono transition-colors ${fontTextSizes[fs]} ${
                fontSize === fs
                  ? 'bg-blue-accent text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-secondary hover:text-primary-light dark:hover:text-primary-dark'
              }`}
            >
              A
            </button>
          ))}
        </div>
      </div>

      {/* Renderer */}
      <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark p-5">
        <ChordProRenderer content={transposedContent} fontSize={fontSize} />
      </div>

      {performing && (
        <PerformingMode
          song={song}
          content={transposedContent}
          onClose={() => setPerforming(false)}
        />
      )}

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} type="song" resourceId={id!} />
    </PageWrapper>
  )
}
