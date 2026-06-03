import { useState } from 'react'
import {
  IconLogout, IconDownload, IconTrash, IconEye,
  IconMoon, IconSun, IconLanguage, IconUser,
} from '@tabler/icons-react'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { useLibraryStore } from '../store/useLibraryStore'
import { useOnboardingStore } from '../store/useOnboardingStore'
import { ConfirmModal } from '../components/ui/Modal'
import { Logo } from '../components/layout/Logo'
import { supabase } from '../lib/supabase'
import { exportAllSongs } from '../lib/export'
import toast from 'react-hot-toast'

const NOTATION_KEY = 'notation-pref'

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const user              = useAuthStore((s) => s.user)
  const { signOut }       = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { songs }         = useLibraryStore()
  const { startTour }     = useOnboardingStore()

  const [newEmail,      setNewEmail]      = useState('')
  const [newPassword,   setNewPassword]   = useState('')
  const [confirmPass,   setConfirmPass]   = useState('')
  const [saving,        setSaving]        = useState(false)
  const [exporting,     setExporting]     = useState(false)
  const [deleteOpen,    setDeleteOpen]    = useState(false)
  const [focusedField,  setFocusedField]  = useState<string | null>(null)

  const [notation, setNotationState] = useState<'italian' | 'english'>(
    () => (localStorage.getItem(NOTATION_KEY) as 'italian' | 'english') ?? 'italian',
  )

  function toggleNotation() {
    const next = notation === 'italian' ? 'english' : 'italian'
    setNotationState(next)
    localStorage.setItem(NOTATION_KEY, next)
  }

  async function handleEmailChange() {
    if (!newEmail) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) toast.error(error.message)
    else { toast.success('Email aggiornata! Controlla la tua casella.'); setNewEmail('') }
    setSaving(false)
  }

  async function handlePasswordChange() {
    if (!newPassword || newPassword !== confirmPass) {
      toast.error('Le password non coincidono'); return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success('Password aggiornata'); setNewPassword(''); setConfirmPass('') }
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

  // ── Style helpers ─────────────────────────────────────────────────────────

  const inputStyle = (id: string): React.CSSProperties => ({
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `0.5px solid ${focusedField === id ? '#2176AE' : '#E0DED8'}`,
    background: '#F5F4F1', fontSize: 16, color: '#1C2333',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    WebkitAppearance: 'none',
    boxSizing: 'border-box',
  })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* Topbar */}
      <div style={{
        padding: '12px 16px 10px',
        background: '#F5F4F1',
        borderBottom: '0.5px solid #E0DED8',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Logo size="sm" />
      </div>

      {/* Avatar + name */}
      <div style={{ padding: '24px 16px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#E0F0FA',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconUser size={26} style={{ color: '#2176AE' }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#1C2333' }}>
            {user?.user_metadata?.full_name || 'Utente'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: '#8A94A6' }}>{user?.email}</p>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Account ───────────────────────────────────────────────────── */}
        <Section label="Account">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>Nuova email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nuova@email.com"
                style={inputStyle('email')}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <SmallBtn label="Aggiorna email" onClick={handleEmailChange} disabled={!newEmail || saving} loading={saving} />

            <Divider />

            <div>
              <label style={labelStyle}>Nuova password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle('pass')}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <div>
              <label style={labelStyle}>Conferma password</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
                style={inputStyle('confirm')}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <SmallBtn label="Aggiorna password" onClick={handlePasswordChange} disabled={!newPassword || saving} loading={saving} />
          </div>
        </Section>

        {/* ── Preferenze ────────────────────────────────────────────────── */}
        <Section label="Preferenze">
          {/* Dark mode */}
          <ToggleRow
            icon={theme === 'dark'
              ? <IconMoon size={18} style={{ color: '#8A94A6' }} />
              : <IconSun size={18} style={{ color: '#8A94A6' }} />}
            label={`Tema ${theme === 'dark' ? 'scuro' : 'chiaro'}`}
            on={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <Divider />
          {/* Notation */}
          <ToggleRow
            icon={<IconLanguage size={18} style={{ color: '#8A94A6' }} />}
            label={`Notazione: ${notation === 'italian' ? 'Do Re Mi' : 'A B C'}`}
            on={notation === 'italian'}
            onToggle={toggleNotation}
          />
        </Section>

        {/* ── Dati ──────────────────────────────────────────────────────── */}
        <Section label="Dati">
          <ActionRow
            icon={<IconDownload size={18} style={{ color: '#8A94A6' }} />}
            label="Esporta tutti i brani"
            subtitle="ZIP con file .cho, PDF e immagini"
            onClick={handleExport}
            disabled={exporting || songs.length === 0}
          />
          <Divider />
          <ActionRow
            icon={<IconEye size={18} style={{ color: '#8A94A6' }} />}
            label="Rivedi il tour guidato"
            onClick={startTour}
          />
        </Section>

        {/* ── Zona pericolosa ───────────────────────────────────────────── */}
        <Section label="Account" borderColor="#FDE8E8">
          <ActionRow
            icon={<IconLogout size={18} style={{ color: '#8A94A6' }} />}
            label="Esci dall'account"
            onClick={signOut}
          />
          <Divider />
          <ActionRow
            icon={<IconTrash size={18} style={{ color: '#C0392B' }} />}
            label="Elimina account"
            labelColor="#C0392B"
            subtitle="Tutti i tuoi dati verranno eliminati"
            onClick={() => setDeleteOpen(true)}
          />
        </Section>

      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Elimina account"
        message="Sei assolutamente sicuro? Tutti i tuoi brani, setlist e link condivisi verranno eliminati definitivamente. Questa azione è irreversibile."
        confirmLabel="Sì, elimina tutto"
        danger
      />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: '#8A94A6', marginBottom: 6,
}

function Section({ label, children, borderColor = '#E0DED8' }: {
  label: string
  children: React.ReactNode
  borderColor?: string
}) {
  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: `0.5px solid ${borderColor}`, padding: '14px 16px' }}>
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: '0.5px', background: '#F0EEEB', margin: '10px 0' }} />
}

function ActionRow({ icon, label, labelColor = '#1C2333', subtitle, onClick, disabled }: {
  icon: React.ReactNode
  label: string
  labelColor?: string
  subtitle?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        background: 'none', border: 'none', padding: '4px 0',
        cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
        fontFamily: 'inherit', opacity: disabled ? 0.45 : 1,
        minHeight: 44,
      }}
    >
      <div style={{ flexShrink: 0, width: 24, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 15, color: labelColor }}>{label}</p>
        {subtitle && <p style={{ margin: '1px 0 0', fontSize: 13, color: '#8A94A6' }}>{subtitle}</p>}
      </div>
    </button>
  )
}

function ToggleRow({ icon, label, on, onToggle }: {
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
        background: 'none', border: 'none', padding: '4px 0',
        cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
      }}
    >
      <div style={{ flexShrink: 0, width: 24, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span style={{ flex: 1, fontSize: 15, color: '#1C2333', textAlign: 'left' }}>{label}</span>
      {/* 44×26px pill toggle */}
      <div style={{
        width: 44, height: 26, borderRadius: 13, flexShrink: 0,
        background: on ? '#2176AE' : '#E0DED8',
        position: 'relative',
        transition: 'background 0.2s ease',
      }}>
        <div style={{
          position: 'absolute', top: 3,
          left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#FFFFFF',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        }} />
      </div>
    </button>
  )
}

function SmallBtn({ label, onClick, disabled, loading }: {
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
        padding: '10px 16px', borderRadius: 10, border: 'none',
        background: disabled ? '#C8CDD8' : '#2176AE',
        color: '#FFFFFF', fontSize: 14, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', alignSelf: 'flex-start',
      }}
    >
      {loading ? '…' : label}
    </button>
  )
}
