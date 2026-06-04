import { useEffect, useState } from 'react'
import { IconList, IconPlus } from '@tabler/icons-react'
import { useSetlistStore } from '../store/useSetlistStore'
import { useAuthStore } from '../store/useAuthStore'
import { SetlistCard } from '../components/setlist/SetlistCard'
import { BottomSheet } from '../components/ui/BottomSheet'
import { ConfirmModal } from '../components/ui/Modal'
import { Logo } from '../components/layout/Logo'

export function SetlistsPage() {
  const user = useAuthStore((s) => s.user)
  const { setlists, loading, fetchSetlists, createSetlist, deleteSetlist, duplicateSetlist } = useSetlistStore()

  const [createOpen, setCreateOpen]   = useState(false)
  const [deleteId,   setDeleteId]     = useState<string | null>(null)
  const [name,       setName]         = useState('')
  const [date,       setDate]         = useState('')
  const [desc,       setDesc]         = useState('')
  const [saving,     setSaving]       = useState(false)
  const [focused,    setFocused]      = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchSetlists(user.id)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!name.trim() || !user) return
    setSaving(true)
    await createSetlist(user.id, {
      name: name.trim(),
      event_date: date || null,
      description: desc || null,
    })
    setSaving(false)
    setCreateOpen(false)
    setName(''); setDate(''); setDesc('')
  }

  function openCreate() { setName(''); setDate(''); setDesc(''); setCreateOpen(true) }

  const inputStyle = (id: string) => ({
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `0.5px solid ${focused === id ? '#2176AE' : '#E0DED8'}`,
    background: '#F5F4F1', fontSize: 16, color: '#1C2333',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    WebkitAppearance: 'none' as const,
    boxSizing: 'border-box' as const,
  })

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: '#8A94A6', marginBottom: 6,
  } as const

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* Topbar */}
      <div style={{
        padding: '12px 16px 10px',
        background: '#F5F4F1',
        borderBottom: '0.5px solid #E0DED8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo size="sm" />
        {!loading && (
          <span style={{ fontSize: 13, color: '#8A94A6' }}>
            {setlists.length} {setlists.length === 1 ? 'setlist' : 'setlist'}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 12, background: '#EEECE8', animation: 'pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : setlists.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: '#E0F0FA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <IconList size={32} style={{ color: '#2176AE' }} />
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600, color: '#1C2333' }}>
            Nessuna setlist
          </p>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#8A94A6', lineHeight: 1.5, maxWidth: 260 }}>
            Crea la tua prima setlist per organizzare i brani di un evento.
          </p>
          <button
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '12px 22px', borderRadius: 12, border: 'none',
              background: '#2176AE', color: '#FFFFFF',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <IconPlus size={17} />
            Nuova setlist
          </button>
        </div>
      ) : (
        <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label="Nuova setlist"
        style={{
          position: 'fixed', bottom: 88, right: 20, zIndex: 20,
          width: 52, height: 52, borderRadius: '50%',
          background: '#2176AE', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(33,118,174,0.35)',
        }}
      >
        <IconPlus size={22} style={{ color: '#FFFFFF' }} />
      </button>

      {/* Create BottomSheet */}
      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)}>
        <div style={{ padding: '0 16px 32px' }}>
          <p style={{
            textAlign: 'center', margin: '0 0 20px',
            fontSize: 13, fontWeight: 600, color: '#8A94A6',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Nuova setlist
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="es. Messa domenica, Concerto estate"
                style={inputStyle('name')}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div>
              <label style={labelStyle}>Data evento</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle('date')}
                onFocus={() => setFocused('date')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div>
              <label style={labelStyle}>Descrizione</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Note opzionali sull'evento"
                rows={2}
                style={{
                  ...inputStyle('desc'),
                  resize: 'none', lineHeight: 1.5,
                  minHeight: 72,
                }}
                onFocus={() => setFocused('desc')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={!name.trim() || saving}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: !name.trim() || saving ? '#C8CDD8' : '#2176AE',
                color: '#FFFFFF', fontSize: 16, fontWeight: 600,
                cursor: !name.trim() || saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginTop: 4,
              }}
            >
              {saving ? '…' : 'Crea setlist'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteSetlist(deleteId) }}
        title="Elimina setlist"
        message="Vuoi eliminare questa setlist? I brani al suo interno non verranno eliminati."
        confirmLabel="Elimina"
        danger
      />
    </div>
  )
}
