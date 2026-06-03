import { useState } from 'react'
import {
  IconMail, IconLock, IconMoon, IconMusic,
  IconDownload, IconTrash, IconChevronRight,
  IconArrowLeft, IconLogout, IconCheck,
} from '@tabler/icons-react'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { useLibraryStore } from '../store/useLibraryStore'
import { ConfirmModal } from '../components/ui/Modal'
import { supabase } from '../lib/supabase'
import { exportAllSongs } from '../lib/export'
import toast from 'react-hot-toast'

const NOTATION_KEY = 'notation-pref'
type SubScreen = null | 'email' | 'password' | 'notation'

export function ProfilePage() {
  const user          = useAuthStore((s) => s.user)
  const { signOut }   = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { songs }     = useLibraryStore()

  const [subScreen,   setSubScreen]   = useState<SubScreen>(null)
  const [newEmail,    setNewEmail]    = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [exporting,   setExporting]   = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [focused,     setFocused]     = useState<string | null>(null)

  const [notation, setNotationState] = useState<'italian' | 'english'>(
    () => (localStorage.getItem(NOTATION_KEY) as 'italian' | 'english') ?? 'italian',
  )

  function setNotation(n: 'italian' | 'english') {
    setNotationState(n)
    localStorage.setItem(NOTATION_KEY, n)
  }

  async function handleEmailChange() {
    if (!newEmail) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) toast.error(error.message)
    else { toast.success('Email aggiornata! Controlla la tua casella.'); setNewEmail(''); setSubScreen(null) }
    setSaving(false)
  }

  async function handlePasswordChange() {
    if (!newPassword || newPassword !== confirmPass) {
      toast.error('Le password non coincidono'); return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success('Password aggiornata'); setNewPassword(''); setConfirmPass(''); setSubScreen(null) }
    setSaving(false)
  }

  async function handleExport() {
    setExporting(true)
    await exportAllSongs(songs)
    setExporting(false)
  }

  function handleDeleteAccount() {
    toast.error('Contatta il supporto: support@richord.app')
    setDeleteOpen(false)
  }

  const inputStyle = (id: string): React.CSSProperties => ({
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `0.5px solid ${focused === id ? '#2176AE' : '#E0DED8'}`,
    background: '#F5F4F1', fontSize: 16, color: '#1C2333',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    WebkitAppearance: 'none',
    boxSizing: 'border-box',
  })

  // ── Sub-screen: email ────────────────────────────────────────────────────────
  if (subScreen === 'email') {
    return (
      <SubScreenShell title="Cambia email" onBack={() => setSubScreen(null)}>
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Nuova email"
            style={inputStyle('email')}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            autoFocus
          />
          <SaveButton label="Salva" onClick={handleEmailChange} disabled={!newEmail || saving} loading={saving} />
        </div>
      </SubScreenShell>
    )
  }

  // ── Sub-screen: password ─────────────────────────────────────────────────────
  if (subScreen === 'password') {
    return (
      <SubScreenShell title="Cambia password" onBack={() => setSubScreen(null)}>
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nuova password"
            style={inputStyle('pass')}
            onFocus={() => setFocused('pass')}
            onBlur={() => setFocused(null)}
            autoFocus
          />
          <input
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            placeholder="Conferma password"
            style={inputStyle('confirm')}
            onFocus={() => setFocused('confirm')}
            onBlur={() => setFocused(null)}
          />
          <SaveButton label="Salva" onClick={handlePasswordChange} disabled={!newPassword || saving} loading={saving} />
        </div>
      </SubScreenShell>
    )
  }

  // ── Sub-screen: notation ─────────────────────────────────────────────────────
  if (subScreen === 'notation') {
    return (
      <SubScreenShell title="Notazione accordi" onBack={() => setSubScreen(null)}>
        <div style={{ padding: '12px 16px' }}>
          <CardGroup>
            <NotationOption
              label="Do Re Mi"
              description="Notazione italiana"
              selected={notation === 'italian'}
              onSelect={() => setNotation('italian')}
            />
            <RowDivider />
            <NotationOption
              label="A B C"
              description="Notazione anglosassone"
              selected={notation === 'english'}
              onSelect={() => setNotation('english')}
            />
          </CardGroup>
        </div>
      </SubScreenShell>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────────
  const nameInitial = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()

  return (
    <div style={{ paddingBottom: 100, background: '#F5F4F1', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '8px 20px 20px' }}>
        <p style={{ margin: '0 0 16px', fontSize: 26, fontWeight: 700, color: '#1C2333', letterSpacing: '-0.5px' }}>
          Profilo
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
            background: '#E0F0FA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#2176AE' }}>{nameInitial}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#1C2333' }}>
              {user?.user_metadata?.full_name || 'Utente'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#8A94A6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Account */}
        <SectionGroup label="Account">
          <NavRow
            iconBg="#E0F0FA" iconColor="#2176AE"
            icon={<IconMail size={16} />}
            label="Cambia email"
            onTap={() => setSubScreen('email')}
          />
          <RowDivider />
          <NavRow
            iconBg="#E0F0FA" iconColor="#2176AE"
            icon={<IconLock size={16} />}
            label="Cambia password"
            onTap={() => setSubScreen('password')}
          />
        </SectionGroup>

        {/* Preferenze */}
        <SectionGroup label="Preferenze">
          <ToggleRow
            iconBg="#F5F4F1" iconColor="#8A94A6"
            icon={<IconMoon size={16} />}
            label="Dark mode"
            on={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <RowDivider />
          <NavRow
            iconBg="#F5F4F1" iconColor="#8A94A6"
            icon={<IconMusic size={16} />}
            label="Notazione"
            value={notation === 'italian' ? 'Do Re Mi' : 'A B C'}
            onTap={() => setSubScreen('notation')}
          />
        </SectionGroup>

        {/* Dati */}
        <SectionGroup label="Dati">
          <ActionRow
            iconBg="#E8F5E9" iconColor="#2E7D32"
            icon={<IconDownload size={16} />}
            label="Esporta tutti i brani"
            onTap={handleExport}
            disabled={exporting || songs.length === 0}
          />
        </SectionGroup>

        {/* Gestione account */}
        <SectionGroup label="Gestione account">
          <ActionRow
            iconBg="#F5F4F1" iconColor="#8A94A6"
            icon={<IconLogout size={16} />}
            label="Esci dall'account"
            onTap={signOut}
          />
          <RowDivider />
          <ActionRow
            iconBg="#FDE8E8" iconColor="#C0392B"
            icon={<IconTrash size={16} />}
            label="Elimina account"
            labelColor="#C0392B"
            onTap={() => setDeleteOpen(true)}
          />
        </SectionGroup>

      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Elimina account"
        message="Questa azione è irreversibile. Tutti i tuoi brani e setlist verranno eliminati definitivamente."
        confirmLabel="Sì, elimina tutto"
        danger
      />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SubScreenShell({ title, onBack, children }: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ paddingBottom: 100, background: '#F5F4F1', minHeight: '100vh' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#F5F4F1', borderBottom: '0.5px solid #E0DED8',
        padding: '6px 16px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: '#FFFFFF', border: '0.5px solid #E0DED8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Indietro"
        >
          <IconArrowLeft size={18} style={{ color: '#2176AE' }} />
        </button>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#1C2333' }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

function SectionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: '0 0 6px 2px', fontSize: 12, fontWeight: 500, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <div style={{ background: '#FFFFFF', borderRadius: 14, border: '0.5px solid #E0DED8', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function CardGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, border: '0.5px solid #E0DED8', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function RowDivider() {
  return <div style={{ height: '0.5px', background: '#F0EEEB', marginLeft: 58 }} />
}

function NavRow({ iconBg, iconColor, icon, label, value, onTap }: {
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  label: string
  value?: string
  onTap: () => void
}) {
  return (
    <button
      onClick={onTap}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', background: 'none', border: 'none',
        cursor: 'pointer', fontFamily: 'inherit', minHeight: 52, textAlign: 'left',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, color: '#1C2333' }}>{label}</span>
      {value && <span style={{ fontSize: 14, color: '#8A94A6', marginRight: 4 }}>{value}</span>}
      <IconChevronRight size={16} style={{ color: '#C8CDD8', flexShrink: 0 }} />
    </button>
  )
}

function ActionRow({ iconBg, iconColor, icon, label, labelColor = '#1C2333', onTap, disabled }: {
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  label: string
  labelColor?: string
  onTap: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', background: 'none', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        minHeight: 52, textAlign: 'left', opacity: disabled ? 0.45 : 1,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, color: labelColor }}>{label}</span>
    </button>
  )
}

function ToggleRow({ iconBg, iconColor, icon, label, on, onToggle }: {
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', background: 'none', border: 'none',
        cursor: 'pointer', fontFamily: 'inherit', minHeight: 52,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, color: '#1C2333', textAlign: 'left' }}>{label}</span>
      <div style={{
        width: 44, height: 26, borderRadius: 13, flexShrink: 0,
        background: on ? '#2176AE' : '#E0DED8',
        position: 'relative', transition: 'background 0.2s ease',
      }}>
        <div style={{
          position: 'absolute', top: 3,
          left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#FFFFFF', transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        }} />
      </div>
    </button>
  )
}

function NotationOption({ label, description, selected, onSelect }: {
  label: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', background: 'none', border: 'none',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', minHeight: 52,
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 15, color: '#1C2333' }}>{label}</p>
        <p style={{ margin: '1px 0 0', fontSize: 13, color: '#8A94A6' }}>{description}</p>
      </div>
      {selected && <IconCheck size={18} style={{ color: '#2176AE', flexShrink: 0 }} />}
    </button>
  )
}

function SaveButton({ label, onClick, disabled, loading }: {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '13px 20px', borderRadius: 12, border: 'none',
        background: disabled ? '#C8CDD8' : '#2176AE',
        color: '#FFFFFF', fontSize: 15, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      }}
    >
      {loading ? '…' : label}
    </button>
  )
}
