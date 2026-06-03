import React, { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, IconPlus, IconMusic, IconPhoto } from '@tabler/icons-react'
import { useLibraryStore } from '../store/useLibraryStore'
import type { SongType } from '../store/useLibraryStore'
import { useAuthStore } from '../store/useAuthStore'
import { Logo } from '../components/layout/Logo'
import { SongCard } from '../components/song/SongCard'
import { BottomSheet } from '../components/ui/BottomSheet'
import { ConfirmModal } from '../components/ui/Modal'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

type FilterState =
  | { kind: 'all' }
  | { kind: 'type'; value: SongType }
  | { kind: 'tag';  value: string }

const TYPE_CHIPS: { label: string; value: SongType | 'all' }[] = [
  { label: 'Tutti',    value: 'all'      },
  { label: 'ChordPro', value: 'chordpro' },
  { label: 'PDF',      value: 'pdf'      },
  { label: 'Immagine', value: 'image'    },
]

export function LibraryPage() {
  const navigate = useNavigate()
  const { songs, loading, deleteSong, getAllTags } = useLibraryStore()
  const user = useAuthStore((s) => s.user)

  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<FilterState>({ kind: 'all' })
  const [fabOpen,  setFabOpen]  = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userTags = useMemo(() => getAllTags(), [songs])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return songs.filter((song) => {
      const matchSearch =
        !q ||
        song.title.toLowerCase().includes(q) ||
        (song.artist?.toLowerCase() ?? '').includes(q) ||
        (song.tags ?? []).some((t) => t.toLowerCase().includes(q))

      const matchFilter =
        filter.kind === 'all' ? true :
        filter.kind === 'type' ? song.type === filter.value :
        (song.tags ?? []).includes(filter.value)

      return matchSearch && matchFilter
    })
  }, [songs, search, filter])

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setFabOpen(false)
    try {
      const ext  = file.name.split('.').pop()?.toLowerCase() ?? ''
      const type: SongType = ext === 'pdf' ? 'pdf' : 'image'
      const path = `${user.id}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('song-files').upload(path, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('song-files').getPublicUrl(path)
      await useLibraryStore.getState().addSong(user.id, {
        title: file.name.replace(/\.[^.]+$/, ''),
        artist: '', content: '', key: '', tags: [], notes: '',
        type, file_url: publicUrl,
      })
      toast.success('File importato')
    } catch {
      toast.error("Errore durante l'importazione")
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function chipActive(chip: typeof TYPE_CHIPS[number]): boolean {
    if (chip.value === 'all') return filter.kind === 'all'
    return filter.kind === 'type' && filter.value === chip.value
  }

  function tagActive(tag: string): boolean {
    return filter.kind === 'tag' && filter.value === tag
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    flexShrink: 0,
    padding: '6px 14px',
    borderRadius: 20,
    border: active ? 'none' : '0.5px solid #E0DED8',
    background: active ? '#2176AE' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#8A94A6',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.15s, color 0.15s',
  })

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 20px 12px', background: '#F5F4F1' }}>
        <Logo size="sm" />

        {/* Search bar */}
        <div style={{
          marginTop: 10,
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#FFFFFF', borderRadius: 12, border: '0.5px solid #E0DED8',
          padding: '10px 14px',
        }}>
          <IconSearch size={16} style={{ color: '#8A94A6', flexShrink: 0 }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca brano, artista, tag…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: 14, color: '#1C2333',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 2px', color: '#8A94A6', fontSize: 18, lineHeight: 1,
                display: 'flex', alignItems: 'center',
              }}
              aria-label="Cancella ricerca"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Filter chips ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: '0 20px 10px',
      }}>
        {TYPE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => {
              if (chip.value === 'all') setFilter({ kind: 'all' })
              else setFilter({ kind: 'type', value: chip.value as SongType })
            }}
            style={chipStyle(chipActive(chip))}
          >
            {chip.label}
          </button>
        ))}
        {userTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter({ kind: 'tag', value: tag })}
            style={chipStyle(tagActive(tag))}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* ── Counter ────────────────────────────────────────────────────── */}
      <p style={{ margin: 0, padding: '0 20px 10px', fontSize: 12, color: '#8A94A6' }}>
        {filtered.length} {filtered.length === 1 ? 'brano' : 'brani'}
      </p>

      {/* ── List / Skeleton / Empty ────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              height: 68, borderRadius: 12,
              background: '#FFFFFF', border: '0.5px solid #E0DED8',
              opacity: 1 - i * 0.12,
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 10, textAlign: 'center',
        }}>
          <IconMusic size={40} style={{ color: '#C8CDD8' }} />
          <p style={{ margin: 0, fontSize: 15, color: '#8A94A6' }}>
            {search || filter.kind !== 'all' ? 'Nessun brano trovato' : 'Nessun brano ancora'}
          </p>
          {!search && filter.kind === 'all' && (
            <button
              onClick={() => { setFabOpen(false); navigate('/song/new') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#2176AE', fontSize: 14, fontFamily: 'inherit', padding: 0,
              }}
            >
              Aggiungi il tuo primo brano
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      {/* ── Hidden file input ──────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        style={{ display: 'none' }}
        onChange={handleFileImport}
        disabled={uploading}
      />

      {/* ── FAB ────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setFabOpen(true)}
        style={{
          position: 'fixed', bottom: 76, right: 20, zIndex: 20,
          width: 50, height: 50, borderRadius: '50%',
          background: '#2176AE', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(33,118,174,0.35)',
        }}
        aria-label="Aggiungi brano"
      >
        <IconPlus size={24} style={{ color: '#FFFFFF' }} />
      </button>

      {/* ── FAB bottom sheet ───────────────────────────────────────────── */}
      <BottomSheet open={fabOpen} onClose={() => setFabOpen(false)}>
        <div style={{ padding: '4px 0 24px' }}>
          <SheetAction
            icon={<IconMusic size={20} style={{ color: '#2176AE' }} />}
            iconBg="#E0F0FA"
            label="Crea brano ChordPro"
            onClick={() => { setFabOpen(false); navigate('/song/new') }}
          />
          <SheetAction
            icon={<IconPhoto size={20} style={{ color: '#2E7D32' }} />}
            iconBg="#E8F5E9"
            label={uploading ? 'Importazione…' : 'Importa file (PDF o immagine)'}
            onClick={() => fileInputRef.current?.click()}
          />
        </div>
      </BottomSheet>

      {/* ── Delete confirm ─────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteSong(deleteId) }}
        title="Elimina brano"
        message="Questa azione è irreversibile. I link condivisi per questo brano smetteranno di funzionare."
        confirmLabel="Elimina"
        danger
      />
    </div>
  )
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function SheetAction({ icon, iconBg, label, onClick }: {
  icon: React.ReactNode
  iconBg: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '14px 20px',
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left',
        minHeight: 44,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: '#1C2333' }}>{label}</span>
    </button>
  )
}
