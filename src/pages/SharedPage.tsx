import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChordProRenderer } from '../components/song/ChordProRenderer'
import { useTranspose } from '../hooks/useTranspose'
import { PerformingMode } from '../components/song/PerformingMode'
import { Logo } from '../components/layout/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Button } from '../components/ui/Button'
import { Tag } from '../components/ui/Badge'
import { Minus, Plus, Maximize2, RotateCcw } from 'lucide-react'
import type { Song } from '../store/useLibraryStore'

type SharedData = {
  type: 'song' | 'setlist'
  song?: Song
  setlist?: { name: string; songs: Song[] }
}

export function SharedPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<SharedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [performing, setPerforming] = useState(false)

  useEffect(() => {
    async function load() {
      if (!token) { setError('Token non valido'); setLoading(false); return }

      const { data: link, error: linkErr } = await supabase
        .from('share_links')
        .select('*')
        .eq('token', token)
        .single()

      if (linkErr || !link) { setError('Link non trovato o scaduto'); setLoading(false); return }

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
          .from('setlists')
          .select('name')
          .eq('id', link.resource_id)
          .single()
        const { data: slSongs } = await supabase
          .from('setlist_songs')
          .select('song_id, position')
          .eq('setlist_id', link.resource_id)
          .order('position')

        const songIds = (slSongs ?? []).map((s: { song_id: string }) => s.song_id)
        const { data: songData } = await supabase
          .from('songs')
          .select('id, title, artist, content, key, tags, type, file_url')
          .in('id', songIds)

        const orderedSongs = songIds
          .map((sid: string) => songData?.find((s: { id: string }) => s.id === sid))
          .filter(Boolean) as Song[]

        setData({ type: 'setlist', setlist: { name: sl?.name ?? '', songs: orderedSongs } })
      }
      setLoading(false)
    }
    load()
  }, [token])

  const song = data?.type === 'song' ? data.song : data?.setlist?.songs[0]
  const { semitones, notation, transposedContent, transpose, reset, toggleNotation } = useTranspose(
    song?.content ?? '',
    song?.key ?? null
  )

  if (loading) return (
    <div className="min-h-screen bg-app-light dark:bg-app-dark flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-accent border-t-transparent rounded-full" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-app-light dark:bg-app-dark flex flex-col items-center justify-center p-4 text-center">
      <Logo size="md" className="mb-6" />
      <h2 className="text-lg font-display text-primary-light dark:text-primary-dark mb-2">{error}</h2>
      <p className="text-sm text-secondary font-jakarta mb-6">Il link potrebbe essere scaduto o non valido.</p>
      <Button onClick={() => navigate('/')}>Vai a RiChord</Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-app-light dark:bg-app-dark flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-night-surface border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-accent font-jakarta font-medium px-2 py-0.5 rounded-full">
            Visualizzazione condivisa
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {data?.type === 'song' && song && (
          <>
            <div className="mb-4">
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary font-jakarta">Tonalità</span>
                <button onClick={() => transpose(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-mono text-blue-accent bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                  {semitones === 0 ? (song.key || '—') : `+${semitones}`}
                </span>
                <button onClick={() => transpose(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors">
                  <Plus size={14} />
                </button>
                {semitones !== 0 && (
                  <button onClick={reset} className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors">
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
              <button onClick={toggleNotation} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm font-mono text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors">
                {notation === 'italian' ? 'Do→C' : 'C→Do'}
              </button>
              <button onClick={() => setPerforming(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-accent text-white text-sm font-jakarta hover:bg-blue-500 transition-colors ml-auto">
                <Maximize2 size={14} /> Esegui
              </button>
            </div>

            <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark p-5">
              <ChordProRenderer content={transposedContent} fontSize="md" />
            </div>
          </>
        )}

        {data?.type === 'setlist' && data.setlist && (
          <>
            <h1 className="text-2xl font-display text-primary-light dark:text-primary-dark mb-5">{data.setlist.name}</h1>
            <div className="space-y-2">
              {data.setlist.songs.map((s, i) => (
                <div key={s.id} className="bg-white dark:bg-night-surface rounded-xl border border-border-light dark:border-border-dark flex items-center gap-3 p-3">
                  <span className="text-xs text-secondary font-jakarta w-5 text-center">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark">{s.title}</p>
                    {s.artist && <p className="text-xs text-secondary font-jakarta">{s.artist}</p>}
                  </div>
                  {s.key && <span className="text-xs font-mono text-blue-accent bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">{s.key}</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="bg-white dark:bg-night-surface border-t border-border-light dark:border-border-dark px-4 py-4 text-center">
        <p className="text-sm text-secondary font-jakarta mb-2">Crea la tua libreria gratuitamente</p>
        <Button size="sm" onClick={() => navigate('/login')}>Registrati su RiChord</Button>
      </footer>

      {performing && song && (
        <PerformingMode song={song} content={transposedContent} onClose={() => setPerforming(false)} />
      )}
    </div>
  )
}
