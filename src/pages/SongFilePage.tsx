import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { FileCard } from '../components/file/FileCard'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Tag } from '../components/ui/Badge'

export function SongFilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const song = useLibraryStore((s) => s.songs.find((s) => s.id === id))

  if (!song) return (
    <PageWrapper>
      <p className="text-secondary font-jakarta">Brano non trovato</p>
    </PageWrapper>
  )

  return (
    <PageWrapper>
      <button
        onClick={() => navigate('/library')}
        className="flex items-center gap-2 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors font-jakarta text-sm mb-4"
      >
        <ArrowLeft size={18} /> Libreria
      </button>

      <div className="mb-4">
        <h1 className="text-2xl font-display text-primary-light dark:text-primary-dark">{song.title}</h1>
        {song.artist && <p className="text-secondary font-jakarta text-sm mt-0.5">{song.artist}</p>}
        {(song.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {song.tags.map((t) => <Tag key={t} label={t} />)}
          </div>
        )}
      </div>

      <FileCard song={song} />
    </PageWrapper>
  )
}
