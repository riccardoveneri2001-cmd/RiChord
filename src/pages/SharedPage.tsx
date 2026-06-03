import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IconMinus, IconPlus, IconRotate, IconPlayerPlay } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { ChordProRenderer } from '../components/song/ChordProRenderer'
import { useTranspose } from '../hooks/useTranspose'
import { PerformingMode } from '../components/song/PerformingMode'
import { Logo } from '../components/layout/Logo'
import type { Song } from '../store/useLibraryStore'

// ── Types ──────────────────────────────────────────────────────────────────────

type SharedData =
  | { type: 'song'; song: Song }
  | { type: 'setlist'; setlist: { name: string; songs: Song[] } }

// ── Key display helpers (same as SongViewPage) ────────────────────────────────

const DISPLAY_KEYS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']
const CHROMATIC: Record<string, number> = {
  Do: 0, 'Do#': 1, Re: 2, 'Re#': 3, Mi: 4, Fa: 5,
  'Fa#': 6, Sol: 7, 'Sol#': 8, La: 9, 'La#': 10, Si: 11,
  Reb: 1, Mib: 3, Solb: 6, Lab: 8, Sib: 10,
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SharedPage() {
  const { token } = useParams<{ token: string }>()
  const navigate   = useNavigate()
  const [data,      setData]      = useState<SharedData | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [performing, setPerforming] = useState(false)

  useEffect(() => {
    async function load() {
      if (!token) { setError('Token non valido'); setLoading(false); return }

      const { data: link, error: linkErr } = await supabase
        .from('share_links')
        .select('*')
        .eq('token', token)
        .single()

      if (linkErr || !link) { setError('Link non trovato'); setLoading(false); return }
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        setError('Questo link è scaduto'); setLoading(false); return
      }

      if (link.type === 'song') {
        const { data: song } = await supabase
          .from('songs')
          .select('id, title, artist, content, key, tags, type, file_url')
          .eq('id', link.resource_id)
          .single()
        if (!song) { setError('Brano non trovato'); setLoading(false); return }
        setData({ type: 'song', song: { ...song, notes: null, user_id: '', created_at: '', updated_at: '' } as Song })
      } else {
        const { data: sl } = await supabase
          .from('setlists').select('name').eq('id', link.resource_id).single()
        const { data: slSongs } = await supabase
          .from('setlist_songs').select('song_id, position')
          .eq('setlist_id', link.resource_id).order('position')
        const songIds = (slSongs ?? []).map((s: { song_id: string }) => s.song_id)
        const { data: songData } = await supabase
          .from('songs').select('id, title, artist, content, key, tags, type, file_url')
          .in('id', songIds)
        const ordered = songIds
          .map((sid: string) => songData?.find((s: { id: string }) => s.id === sid))
          .filter(Boolean) as Song[]
        setData({ type: 'setlist', setlist: { name: sl?.name ?? '', songs: ordered } })
      }
      setLoading(false)
    }
    load()
  }, [token])

  const song = data?.type === 'song' ? data.song : undefined
  const { semitones, notation, transposedContent, transpose, reset, toggleNotation } = useTranspose(
    song?.content ?? '',
    song?.key ?? null,
  )

  const currentKey = useMemo(() => {
    if (!song?.key) return '—'
    const base = CHROMATIC[song.key]
    if (base === undefined) return song.key
    return DISPLAY_KEYS[(base + semitones + 120) % 12]
  }, [song?.key, semitones])

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100svh', background: '#F5F4F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #2176AE', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error) return (
    <div style={{ minHeight: '100svh', background: '#F5F4F1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: 24 }}>
        <Logo size="lg" />
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#1C2333' }}>{error}</p>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#8A94A6' }}>
        Il link potrebbe essere scaduto o non valido.
      </p>
      <button
        onClick={() => navigate('/login')}
        style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#2176AE', color: '#FFFFFF', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Vai a RiChord
      </button>
    </div>
  )

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100svh', background: '#F5F4F1', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        background: '#FFFFFF', borderBottom: '0.5px solid #E0DED8',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Logo size="sm" />
        <span style={{
          fontSize: 12, fontWeight: 500, color: '#2176AE',
          background: '#E0F0FA', borderRadius: 20, padding: '3px 10px',
        }}>
          Visualizzazione condivisa
        </span>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, padding: '20px 16px 0', maxWidth: 680, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* ── Song view ────────────────────────────────────────────────── */}
        {data?.type === 'song' && song && (
          <>
            {/* Title / artist / tags */}
            <div style={{ marginBottom: 16 }}>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1C2333', letterSpacing: '-0.3px' }}>
                {song.title}
              </h1>
              {song.artist && (
                <p style={{ margin: '0 0 8px', fontSize: 14, color: '#8A94A6' }}>{song.artist}</p>
              )}
              {(song.tags ?? []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {song.tags.map((t) => (
                    <span key={t} style={{ fontSize: 12, fontWeight: 500, color: '#2176AE', background: '#E0F0FA', borderRadius: 20, padding: '3px 10px' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Transposition + controls bar */}
            <div style={{
              background: '#FFFFFF', borderRadius: 12,
              border: '0.5px solid #E0DED8',
              padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              {/* Key */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tonalità
                </span>
                <button onClick={() => transpose(-1)} style={transpBtnStyle} aria-label="Abbassa">
                  <IconMinus size={14} style={{ color: '#2176AE' }} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1C2333', minWidth: 36, textAlign: 'center', fontFamily: 'monospace' }}>
                  {currentKey}
                </span>
                <button onClick={() => transpose(1)} style={transpBtnStyle} aria-label="Alza">
                  <IconPlus size={14} style={{ color: '#2176AE' }} />
                </button>
                {semitones !== 0 && (
                  <button onClick={reset} style={{ ...transpBtnStyle, background: 'none', border: 'none' }} aria-label="Ripristina">
                    <IconRotate size={14} style={{ color: '#8A94A6' }} />
                  </button>
                )}
              </div>

              {/* Notation */}
              <button
                onClick={toggleNotation}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none',
                  background: '#F5F4F1', color: '#8A94A6',
                  fontSize: 13, fontWeight: 500, fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
              >
                {notation === 'italian' ? 'Do → C' : 'C → Do'}
              </button>

              {/* Esegui */}
              <button
                onClick={() => setPerforming(true)}
                style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, border: 'none',
                  background: '#2176AE', color: '#FFFFFF',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <IconPlayerPlay size={14} />
                Esegui
              </button>
            </div>

            {/* Chord renderer */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #E0DED8', padding: '16px', marginBottom: 20 }}>
              <ChordProRenderer content={transposedContent} lyricSize={17} />
            </div>
          </>
        )}

        {/* ── Setlist view ──────────────────────────────────────────────── */}
        {data?.type === 'setlist' && data.setlist && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#1C2333', letterSpacing: '-0.3px' }}>
              {data.setlist.name}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {data.setlist.songs.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    background: '#FFFFFF', borderRadius: 12,
                    border: '0.5px solid #E0DED8',
                    padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#8A94A6', minWidth: 20, textAlign: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#1C2333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </p>
                    {s.artist && (
                      <p style={{ margin: '1px 0 0', fontSize: 13, color: '#8A94A6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.artist}
                      </p>
                    )}
                  </div>
                  {s.key && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2176AE', background: '#E0F0FA', borderRadius: 6, padding: '2px 8px', fontFamily: 'monospace', flexShrink: 0 }}>
                      {s.key}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer CTA */}
      <footer style={{
        background: '#FFFFFF', borderTop: '0.5px solid #E0DED8',
        padding: '14px 16px', textAlign: 'center',
      }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#8A94A6' }}>
          Crea la tua libreria musicale, gratuitamente.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '11px 24px', borderRadius: 12, border: 'none',
            background: '#2176AE', color: '#FFFFFF',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Registrati su RiChord
        </button>
      </footer>

      {/* Performing mode */}
      {performing && song && (
        <PerformingMode
          song={song}
          content={transposedContent}
          onClose={() => setPerforming(false)}
        />
      )}
    </div>
  )
}

// ── Shared micro-styles ───────────────────────────────────────────────────────

const transpBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8,
  background: '#E0F0FA', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}
