import { useEffect, useState } from 'react'
import { IconLink, IconCopy, IconTrash, IconClock } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { ConfirmModal } from '../components/ui/Modal'
import { Logo } from '../components/layout/Logo'
import toast from 'react-hot-toast'

interface ShareLink {
  id: string
  token: string
  type: 'song' | 'setlist'
  resource_id: string
  expires_at: string | null
  created_at: string
}

export function SharedLinksPage() {
  const user = useAuthStore((s) => s.user)
  const [links,    setLinks]    = useState<ShareLink[]>([])
  const [loading,  setLoading]  = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('share_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLinks((data ?? []) as ShareLink[])
        setLoading(false)
      })
  }, [user])

  async function deleteLink(id: string) {
    await supabase.from('share_links').delete().eq('id', id)
    setLinks((prev) => prev.filter((l) => l.id !== id))
    toast.success('Link eliminato')
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`)
    toast.success('Link copiato')
  }

  function isExpired(link: ShareLink) {
    return link.expires_at ? new Date(link.expires_at) < new Date() : false
  }

  function formatExpiry(link: ShareLink) {
    if (!link.expires_at) return 'Nessuna scadenza'
    const d = new Date(link.expires_at)
    return (isExpired(link) ? 'Scaduto il ' : 'Scade il ') +
      d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
  }

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
            {links.length} {links.length === 1 ? 'link' : 'link'}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 12, background: '#EEECE8' }} />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 32px', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: '#E0F0FA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <IconLink size={32} style={{ color: '#2176AE' }} />
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#1C2333' }}>
            Nessun link condiviso
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#8A94A6', lineHeight: 1.5, maxWidth: 260 }}>
            I link che generi dalla visualizzazione di un brano o setlist appariranno qui.
          </p>
        </div>
      ) : (
        <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {links.map((link) => {
            const expired = isExpired(link)
            return (
              <div
                key={link.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: `0.5px solid ${expired ? '#FDE8E8' : '#E0DED8'}`,
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  opacity: expired ? 0.7 : 1,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: expired ? '#FDE8E8' : '#E0F0FA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconLink size={16} style={{ color: expired ? '#C0392B' : '#2176AE' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1C2333' }}>
                      {link.type === 'song' ? 'Brano' : 'Setlist'}
                    </span>
                    {expired && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: '#C0392B',
                        background: '#FDE8E8', borderRadius: 20, padding: '1px 7px',
                      }}>
                        Scaduto
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: '0 0 4px', fontSize: 12, color: '#8A94A6',
                    fontFamily: 'monospace',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {window.location.origin}/share/{link.token}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconClock size={11} style={{ color: '#8A94A6', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#8A94A6' }}>{formatExpiry(link)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {!expired && (
                    <button
                      onClick={() => copyLink(link.token)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 11px', borderRadius: 8, border: 'none',
                        background: '#E0F0FA', color: '#2176AE',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <IconCopy size={13} />
                      Copia
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(link.id)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-label="Elimina"
                  >
                    <IconTrash size={15} style={{ color: '#C8CDD8' }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteLink(deleteId) }}
        title="Elimina link"
        message="Chi ha ricevuto questo link non potrà più visualizzare il contenuto."
        confirmLabel="Elimina"
        danger
      />
    </div>
  )
}
