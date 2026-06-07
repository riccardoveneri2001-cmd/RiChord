import { ImageViewer } from './ImageViewer'
import type { Song } from '../../store/useLibraryStore'

interface FileCardProps {
  song: Song
  onTap?: () => void
}

export function FileCard({ song, onTap }: FileCardProps) {
  if (!song.file_url) return (
    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#8A94A6' }}>Nessun file allegato.</p>
    </div>
  )

  if (song.type === 'image') {
    return <ImageViewer src={song.file_url} alt={song.title} onTap={onTap} />
  }

  // PDF: show iframe directly, no intermediate preview
  return (
    <iframe
      src={song.file_url}
      title={song.title}
      style={{ width: '100%', height: '78vh', border: 'none', display: 'block', borderRadius: 12 }}
    />
  )
}
