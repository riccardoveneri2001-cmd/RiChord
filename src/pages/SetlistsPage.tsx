import { useEffect, useState } from 'react'
import { Plus, ListMusic } from 'lucide-react'
import { useSetlistStore } from '../store/useSetlistStore'
import { useAuthStore } from '../store/useAuthStore'
import { SetlistCard } from '../components/setlist/SetlistCard'
import { SetlistCardSkeleton } from '../components/ui/Skeleton'
import { PageWrapper, PageHeader } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { Input, Textarea } from '../components/ui/Input'

export function SetlistsPage() {
  const user = useAuthStore((s) => s.user)
  const { setlists, loading, fetchSetlists, createSetlist, deleteSetlist, duplicateSetlist } = useSetlistStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) fetchSetlists(user.id)
  }, [user])

  const handleCreate = async () => {
    if (!name.trim() || !user) return
    setSaving(true)
    await createSetlist(user.id, { name: name.trim(), event_date: date || null, description: desc || null })
    setCreateOpen(false)
    setName(''); setDate(''); setDesc('')
    setSaving(false)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Setlist"
        subtitle={`${setlists.length} setlist`}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={15} />
            <span className="hidden sm:inline">Nuova setlist</span>
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SetlistCardSkeleton key={i} />)}
        </div>
      ) : setlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-3xl flex items-center justify-center mb-5">
            <ListMusic size={32} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-display text-primary-light dark:text-primary-dark mb-2">Nessuna setlist</h3>
          <p className="text-sm text-secondary font-jakarta mb-6 max-w-xs">
            Crea la tua prima setlist per organizzare i brani di un evento.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> Crea setlist
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {setlists.map((sl) => (
            <SetlistCard
              key={sl.id}
              setlist={sl}
              onDuplicate={() => duplicateSetlist(sl.id)}
              onDelete={() => setDeleteId(sl.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuova setlist">
        <div className="space-y-4">
          <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Messa domenica, Concerto estate" />
          <Input label="Data evento" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Textarea label="Descrizione" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Note opzionali sull'evento" />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Annulla</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!name.trim()}>Crea</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteSetlist(deleteId)}
        title="Elimina setlist"
        message="Vuoi eliminare questa setlist? I brani al suo interno non verranno eliminati."
        confirmLabel="Elimina"
        danger
      />
    </PageWrapper>
  )
}
