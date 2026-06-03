import { useEffect, useState } from 'react'
import { IconMusic, IconList, IconCopy, IconCheck, IconBrandWhatsapp, IconMail, IconShare } from '@tabler/icons-react'
import { BottomSheet } from '../ui/BottomSheet'
import { useLibraryStore } from '../../store/useLibraryStore'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  type: 'song' | 'setlist'
  resourceId: string
}

type Expiry = '24h' | '7d' | 'never'

const EXPIRY_OPTS: { label: string; value: Expiry }[] = [
  { label: '24 ore',   value: '24h'   },
  { label: '7 giorni', value: '7d'    },
  { label: 'Nessuna',  value: 'never' },
]

function genCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(7)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

function expiresAt(expiry: Expiry): string | null {
  if (expiry === 'never') return null
  const ms = expiry === '24h' ? 86_400_000 : 7 * 86_400_000
  return new Date(Date.now() + ms).toISOString()
}

export function ShareModal({ open, onClose, type, resourceId }: ShareModalProps) {
  const user = useAuthStore((s) => s.user)
  const song = useLibraryStore((s) => s.songs.find((s) => s.id === resourceId))

  const [expiry,   setExpiry]   = useState<Expiry>('7d')
  const [link,     setLink]     = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [copied,   setCopied]   = useState(false)

  // Generate link automatically when sheet opens
  useEffect(() => {
    if (!open || !user) return
    setLink(null)
    generateLink('7d')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Regenerate when expiry changes (only if already open)
  useEffect(() => {
    if (!open || !user) return
    generateLink(expiry)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiry])

  async function generateLink(exp: Expiry) {
    if (!user) return
    setLoading(true)
    try {
      const token = genCode()
      const { error } = await supabase.from('share_links').insert({
        user_id:     user.id,
        token,
        type,
        resource_id: resourceId,
        expires_at:  expiresAt(exp),
      })
      if (error) throw error
      setLink(`${window.location.origin}/share/${token}`)
    } catch {
      toast.error('Errore nella generazione del link')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Link copiato')
    setTimeout(() => setCopied(false), 1500)
  }

  function handleClose() {
    setLink(null)
    setCopied(false)
    onClose()
  }

  const previewIcon = type === 'song'
    ? { bg: '#E0F0FA', Icon: IconMusic,  color: '#2176AE' }
    : { bg: '#EDE9FE', Icon: IconList,   color: '#5B21B6' }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <div style={{ padding: '0 16px 32px' }}>

        {/* Title */}
        <p style={{
          textAlign: 'center', margin: '0 0 16px',
          fontSize: 13, fontWeight: 600, color: '#8A94A6',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          Condividi
        </p>

        {/* Preview card */}
        {song && (
          <div style={{
            background: '#F5F4F1', borderRadius: 12,
            padding: '12px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: previewIcon.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <previewIcon.Icon size={18} style={{ color: previewIcon.color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#1C2333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {song.title}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#8A94A6' }}>
                {[song.artist, song.key].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          </div>
        )}

        {/* Expiry selection */}
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 500, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Scadenza link
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {EXPIRY_OPTS.map((opt) => {
            const active = expiry === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setExpiry(opt.value)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10,
                  border: `0.5px solid ${active ? '#2176AE' : '#E0DED8'}`,
                  background: active ? '#E0F0FA' : '#F5F4F1',
                  color: active ? '#2176AE' : '#8A94A6',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Link box */}
        <div style={{
          background: '#F5F4F1', borderRadius: 12, border: '0.5px solid #E0DED8',
          padding: '12px 14px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <p style={{
            flex: 1, margin: 0, fontSize: 13, color: '#8A94A6',
            fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {loading ? 'Generazione…' : (link ?? '—')}
          </p>
          <button
            onClick={copyLink}
            disabled={!link || loading}
            style={{
              flexShrink: 0,
              background: !link || loading ? '#E0DED8' : '#2176AE',
              border: 'none', borderRadius: 8, padding: '7px 14px',
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#FFFFFF', fontSize: 13, fontWeight: 600,
              cursor: !link || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? 'Copiato' : 'Copia'}
          </button>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <QuickAction
            icon={<IconBrandWhatsapp size={22} style={{ color: '#25D366' }} />}
            label="WhatsApp"
            onClick={() => link && window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, '_blank')}
          />
          <QuickAction
            icon={<IconMail size={22} style={{ color: '#2176AE' }} />}
            label="Email"
            onClick={() => link && (window.location.href = `mailto:?body=${encodeURIComponent(link)}`)}
          />
          <QuickAction
            icon={<IconShare size={22} style={{ color: '#1C2333' }} />}
            label="Altro"
            onClick={async () => {
              if (!link) return
              if (navigator.share) await navigator.share({ url: link })
              else { await navigator.clipboard.writeText(link); toast.success('Link copiato') }
            }}
          />
        </div>

      </div>
    </BottomSheet>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
        minWidth: 60, minHeight: 44,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: '#F5F4F1', border: '0.5px solid #E0DED8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: '#8A94A6' }}>{label}</span>
    </button>
  )
}
