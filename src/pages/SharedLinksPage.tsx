import { useEffect, useState } from 'react'
import { Link2, Trash2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { PageWrapper, PageHeader } from '../components/layout/PageWrapper'
import { ConfirmModal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
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
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
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

  const deleteLink = async (id: string) => {
    await supabase.from('share_links').delete().eq('id', id)
    setLinks((prev) => prev.filter((l) => l.id !== id))
    toast.success('Link eliminato')
  }

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`)
    toast.success('Link copiato!')
  }

  const isExpired = (link: ShareLink) =>
    link.expires_at ? new Date(link.expires_at) < new Date() : false

  return (
    <PageWrapper>
      <PageHeader title="Link condivisi" subtitle="Gestisci i link che hai generato" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mb-5">
            <Link2 size={32} className="text-secondary" />
          </div>
          <h3 className="text-lg font-display text-primary-light dark:text-primary-dark mb-2">Nessun link condiviso</h3>
          <p className="text-sm text-secondary font-jakarta max-w-xs">
            I link che generi dalla visualizzazione di un brano o setlist appariranno qui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className={`bg-white dark:bg-night-surface rounded-2xl border p-4 flex items-start gap-3 ${
                isExpired(link)
                  ? 'border-red-200 dark:border-red-900/30 opacity-60'
                  : 'border-border-light dark:border-border-dark'
              }`}
            >
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                <Link2 size={15} className="text-blue-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-jakarta font-medium text-primary-light dark:text-primary-dark capitalize">
                    {link.type === 'song' ? 'Brano' : 'Setlist'}
                  </span>
                  {isExpired(link) && (
                    <span className="text-xs text-red-500 font-jakarta">Scaduto</span>
                  )}
                </div>
                <p className="text-xs font-mono text-secondary truncate mt-0.5">{window.location.origin}/share/{link.token}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={11} className="text-secondary" />
                  <span className="text-xs text-secondary font-jakarta">
                    {link.expires_at
                      ? `Scade: ${new Date(link.expires_at).toLocaleDateString('it-IT')}`
                      : 'Nessuna scadenza'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isExpired(link) && (
                  <button
                    onClick={() => copyLink(link.token)}
                    className="px-2.5 py-1.5 text-xs font-jakarta text-blue-accent bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    Copia
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(link.id)}
                  className="p-1.5 text-secondary hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteLink(deleteId)}
        title="Elimina link"
        message="Eliminando questo link, chi lo ha ricevuto non potrà più visualizzare il contenuto."
        confirmLabel="Elimina"
        danger
      />
    </PageWrapper>
  )
}
