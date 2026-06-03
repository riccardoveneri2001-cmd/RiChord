import { useState } from 'react'
import { Copy, Link, Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import toast from 'react-hot-toast'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  type: 'song' | 'setlist'
  resourceId: string
}

type Expiry = '24h' | '7d' | 'never'

const EXPIRY_LABELS: Record<Expiry, string> = {
  '24h': '24 ore',
  '7d': '7 giorni',
  'never': 'Nessuna scadenza',
}

export function ShareModal({ open, onClose, type, resourceId }: ShareModalProps) {
  const user = useAuthStore((s) => s.user)
  const [expiry, setExpiry] = useState<Expiry>('7d')
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateLink = async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = crypto.randomUUID()
      const expiresAt = expiry === 'never' ? null :
        expiry === '24h' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() :
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const { error } = await supabase.from('share_links').insert({
        user_id: user.id,
        token,
        type,
        resource_id: resourceId,
        expires_at: expiresAt,
      })

      if (error) throw error

      const url = `${window.location.origin}/share/${token}`
      setLink(url)
    } catch {
      toast.error('Errore nella generazione del link')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Link copiato!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setLink(null)
    setCopied(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Condividi" size="sm">
      {!link ? (
        <div className="space-y-4">
          <p className="text-sm text-secondary font-jakarta">
            Genera un link pubblico per condividere {type === 'song' ? 'questo brano' : 'questa setlist'}.
            Chi riceve il link può visualizzare senza account.
          </p>

          <div>
            <label className="text-sm font-medium text-secondary font-jakarta block mb-2">Scadenza</label>
            <div className="flex flex-col gap-2">
              {(Object.keys(EXPIRY_LABELS) as Expiry[]).map((e) => (
                <label key={e} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="expiry"
                    value={e}
                    checked={expiry === e}
                    onChange={() => setExpiry(e)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm font-jakarta text-primary-light dark:text-primary-dark">
                    {EXPIRY_LABELS[e]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={generateLink} loading={loading} className="w-full">
            <Link size={15} />
            Genera link
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-secondary font-jakarta">Link generato! Copialo e condividilo.</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-secondary truncate">
              {link}
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-blue-accent text-white hover:bg-blue-500 transition-colors"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <p className="text-xs text-secondary font-jakarta">
            Scadenza: {EXPIRY_LABELS[expiry]}
          </p>
          <button
            onClick={() => setLink(null)}
            className="text-sm text-secondary font-jakarta hover:text-blue-accent transition-colors"
          >
            Genera un altro link
          </button>
        </div>
      )}
    </Modal>
  )
}
