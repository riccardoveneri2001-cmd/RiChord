import { IconFileText, IconExternalLink } from '@tabler/icons-react'
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

  const isImage = song.type === 'image'

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #E0DED8', overflow: 'hidden' }}>
      {isImage ? (
        <img
          src={song.file_url}
          alt={song.title}
          style={{ width: '100%', objectFit: 'contain', maxHeight: '70vh', display: 'block' }}
        />
      ) : (
        <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#FDE8E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconFileText size={30} style={{ color: '#C0392B' }} />
          </div>

          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1C2333' }}>{song.title}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8A94A6' }}>Documento PDF</p>
          </div>

          <a
            href={song.file_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 10,
              background: '#2176AE', color: '#FFFFFF',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              fontFamily: 'inherit',
            }}
          >
            <IconExternalLink size={15} />
            Apri PDF
          </a>

          <iframe
            src={song.file_url}
            title={song.title}
            style={{
              width: '100%', height: '60vh',
              border: '0.5px solid #E0DED8', borderRadius: 10,
            }}
          />
        </div>
      )}
    </div>
  )
}
