import React, { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Upload, Music, X } from 'lucide-react'
import { useLibraryStore } from '../store/useLibraryStore'
import type { SongType } from '../store/useLibraryStore'
import { useAuthStore } from '../store/useAuthStore'
import { SongCard } from '../components/song/SongCard'
import { SongCardSkeleton } from '../components/ui/Skeleton'
import { PageWrapper, PageHeader } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ConfirmModal } from '../components/ui/Modal'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function LibraryPage() {
  const navigate = useNavigate()
  const { songs, loading, deleteSong } = useLibraryStore()
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<SongType | 'all'>('all')
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return songs.filter((song) => {
      const matchesSearch =
        !q ||
        song.title.toLowerCase().includes(q) ||
        (song.artist?.toLowerCase() ?? '').includes(q) ||
        (song.tags ?? []).some((t) => t.toLowerCase().includes(q))
      const matchesType = typeFilter === 'all' || song.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [songs, search, typeFilter])

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const type: SongType = ext === 'pdf' ? 'pdf' : 'image'
      const path = `${user.id}/${Date.now()}_${file.name}`

      const { error: uploadError } = await supabase.storage.from('song-files').upload(path, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('song-files').getPublicUrl(path)

      await useLibraryStore.getState().addSong(user.id, {
        title: file.name.replace(/\.[^.]+$/, ''),
        artist: '',
        content: '',
        key: '',
        tags: [],
        notes: '',
        type,
        file_url: publicUrl,
      })
      toast.success('File importato')
    } catch {
      toast.error('Errore durante l\'importazione')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const TYPE_LABELS: Record<string, string> = { all: 'Tutti', chordpro: 'ChordPro', pdf: 'PDF', image: 'Immagini' }

  return (
    <PageWrapper>
      <PageHeader
        title="Libreria"
        subtitle={`${songs.length} bran${songs.length === 1 ? 'o' : 'i'}`}
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileImport}
              disabled={uploading}
            />
            <Button
              variant="secondary"
              size="sm"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Importa</span>
            </Button>
            <Button size="sm" onClick={() => navigate('/song/new')}>
              <Plus size={15} />
              <span className="hidden sm:inline">Nuovo brano</span>
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Cerca per titolo, artista o tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="p-3 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', 'chordpro', 'pdf', 'image'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium font-jakarta whitespace-nowrap transition-colors ${
              typeFilter === t
                ? 'bg-blue-accent text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-secondary hover:text-primary-light dark:hover:text-primary-dark'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SongCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-5">
            <Music size={32} className="text-blue-accent" />
          </div>
          <h3 className="text-lg font-display text-primary-light dark:text-primary-dark mb-2">
            {search ? 'Nessun risultato' : 'Libreria vuota'}
          </h3>
          <p className="text-sm text-secondary font-jakarta mb-6 max-w-xs">
            {search
              ? `Nessun brano trovato per "${search}"`
              : 'Aggiungi il tuo primo brano o importa un PDF o immagine.'}
          </p>
          {!search && (
            <Button onClick={() => navigate('/song/new')}>
              <Plus size={15} />
              Aggiungi il tuo primo brano
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteSong(deleteId)}
        title="Elimina brano"
        message="Questa azione è irreversibile. Sei sicuro di voler eliminare questo brano?"
        confirmLabel="Elimina"
        danger
      />
    </PageWrapper>
  )
}
