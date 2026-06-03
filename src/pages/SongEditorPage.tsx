import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Music } from 'lucide-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { useAuthStore } from '../store/useAuthStore'
import { SongEditor } from '../components/song/SongEditor'
import { TagInput } from '../components/song/TagInput'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { ConfirmModal } from '../components/ui/Modal'
import { ALL_KEYS_IT } from '../lib/transpose'
import { PageWrapper } from '../components/layout/PageWrapper'
import toast from 'react-hot-toast'

export function SongEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getSong, addSong, updateSong, getAllTags } = useLibraryStore()
  const user = useAuthStore((s) => s.user)
  const isNew = id === 'new'

  const existingSong = isNew ? null : getSong(id!)

  const [title, setTitle] = useState(existingSong?.title ?? '')
  const [artist, setArtist] = useState(existingSong?.artist ?? '')
  const [key, setKey] = useState(existingSong?.key ?? '')
  const [tags, setTags] = useState<string[]>(existingSong?.tags ?? [])
  const [notes, setNotes] = useState(existingSong?.notes ?? '')
  const [content, setContent] = useState(existingSong?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)

  const markDirty = useCallback(() => setIsDirty(true), [])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Il titolo è obbligatorio')
      return
    }
    if (!user) return
    setSaving(true)

    const data = { title: title.trim(), artist, content, key, tags, notes, type: 'chordpro' as const }

    try {
      if (isNew) {
        const song = await addSong(user.id, data)
        if (song) {
          setIsDirty(false)
          toast.success('Brano salvato')
          navigate(`/song/${song.id}`, { replace: true })
        }
      } else {
        await updateSong(id!, data)
        setIsDirty(false)
        toast.success('Brano salvato')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (isDirty) {
      setShowUnsaved(true)
    } else {
      navigate(-1)
    }
  }

  const handleDiscard = () => {
    setIsDirty(false)
    setShowUnsaved(false)
    navigate(-1)
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button onClick={handleBack} className="flex items-center gap-2 text-secondary hover:text-primary-light dark:hover:text-primary-dark transition-colors font-jakarta text-sm">
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Libreria</span>
        </button>
        <div className="flex items-center gap-1.5">
          <h1 className="text-base font-semibold font-jakarta text-primary-light dark:text-primary-dark">
            {isNew ? 'Nuovo brano' : 'Modifica brano'}
          </h1>
          {isDirty && <span className="w-2 h-2 bg-orange-400 rounded-full" title="Modifiche non salvate" />}
        </div>
        <Button size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} />
          Salva
        </Button>
      </div>

      <div className="space-y-5 max-w-2xl">
        {/* Metadata */}
        <div className="bg-white dark:bg-night-surface rounded-2xl p-5 border border-border-light dark:border-border-dark space-y-4">
          <Input
            label="Titolo *"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty() }}
            placeholder="Nome del brano"
            icon={<Music size={16} />}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Artista"
              value={artist}
              onChange={(e) => { setArtist(e.target.value); markDirty() }}
              placeholder="Autore / band"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-secondary font-jakarta">Tonalità originale</label>
              <select
                value={key}
                onChange={(e) => { setKey(e.target.value); markDirty() }}
                className="w-full rounded-xl border bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-primary-light dark:text-primary-dark px-4 py-3 text-sm font-mono outline-none transition-all min-h-[44px] focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/20"
              >
                <option value="">— Nessuna —</option>
                {ALL_KEYS_IT.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>
          <TagInput
            tags={tags}
            onChange={(t) => { setTags(t); markDirty() }}
            suggestions={getAllTags()}
          />
          <Textarea
            label="Note private"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); markDirty() }}
            placeholder="Note personali (non visibili nei link condivisi)"
            rows={3}
          />
        </div>

        {/* Editor */}
        <div className="bg-white dark:bg-night-surface rounded-2xl p-5 border border-border-light dark:border-border-dark">
          <SongEditor
            content={content}
            onChange={(c) => { setContent(c); markDirty() }}
          />
        </div>
      </div>

      <ConfirmModal
        open={showUnsaved}
        onClose={() => setShowUnsaved(false)}
        onConfirm={handleDiscard}
        title="Modifiche non salvate"
        message="Hai modifiche non salvate. Se esci perderai le modifiche. Continuare?"
        confirmLabel="Esci senza salvare"
        danger
      />
    </PageWrapper>
  )
}
