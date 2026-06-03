import { useNavigate, useParams } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { FileCard } from '../components/file/FileCard'

export function SongFilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const song = useLibraryStore((s) => s.songs.find((s) => s.id === id))

  if (!song) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <p style={{ color: '#8A94A6', fontSize: 15 }}>Brano non trovato.</p>
      <button
        onClick={() => navigate('/library')}
        style={{ color: '#2176AE', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, fontSize: 14, fontFamily: 'inherit' }}
      >
        ← Libreria
      </button>
    </div>
  )

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#F5F4F1', borderBottom: '0.5px solid #E0DED8',
        padding: '6px 16px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: '#FFFFFF', border: '0.5px solid #E0DED8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Indietro"
        >
          <IconArrowLeft size={18} style={{ color: '#2176AE' }} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1C2333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {song.title}
          </p>
          {song.artist && (
            <p style={{ margin: 0, fontSize: 13, color: '#8A94A6' }}>{song.artist}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      {(song.tags ?? []).length > 0 && (
        <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {song.tags.map((t) => (
            <span key={t} style={{
              fontSize: 12, fontWeight: 500, color: '#2176AE',
              background: '#E0F0FA', borderRadius: 20, padding: '3px 10px',
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* File content */}
      <div style={{ padding: '12px 16px' }}>
        <FileCard song={song} />
      </div>
    </div>
  )
}
