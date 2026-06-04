import type { Song } from '../../store/useLibraryStore'

interface FileCardProps {
  song: Song
}

export function FileCard({ song }: FileCardProps) {
  if (!song.file_url) return (
    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#8A94A6' }}>Nessun file allegato.</p>
    </div>
  )

  if (song.type === 'image') {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #E0DED8', overflow: 'hidden' }}>
        <img
          src={song.file_url}
          alt={song.title}
          style={{ width: '100%', objectFit: 'contain', maxHeight: '70vh', display: 'block' }}
        />
      </div>
    )
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
