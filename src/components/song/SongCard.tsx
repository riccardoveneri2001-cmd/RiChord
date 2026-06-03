import { useNavigate } from 'react-router-dom'
import { Music, FileText, Image } from 'lucide-react'
import { Tag } from '../ui/Badge'
import type { Song } from '../../store/useLibraryStore'
import { cn } from '../../lib/utils'

interface SongCardProps {
  song: Song
  className?: string
}

const TYPE_ICONS = {
  chordpro: { icon: Music, color: 'text-blue-accent', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  pdf: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  image: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
}

export function SongCard({ song, className }: SongCardProps) {
  const navigate = useNavigate()
  const { icon: Icon, color, bg } = TYPE_ICONS[song.type]

  const handleClick = () => {
    if (song.type === 'chordpro') {
      navigate(`/song/${song.id}`)
    } else {
      navigate(`/song/${song.id}/file`)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left bg-white dark:bg-night-surface rounded-2xl p-4 flex gap-3 items-start',
        'hover:shadow-md dark:hover:shadow-black/20 transition-all duration-150 active:scale-[0.99]',
        'border border-border-light dark:border-border-dark',
        className
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark truncate">
          {song.title}
        </p>
        {song.artist && (
          <p className="text-xs text-secondary font-jakarta truncate mt-0.5">{song.artist}</p>
        )}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {song.key && (
            <span className="text-xs font-mono text-blue-accent bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md">
              {song.key}
            </span>
          )}
          {(song.tags ?? []).slice(0, 4).map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
          {(song.tags ?? []).length > 4 && (
            <span className="text-xs text-secondary font-jakarta">+{song.tags.length - 4}</span>
          )}
        </div>
      </div>
    </button>
  )
}
