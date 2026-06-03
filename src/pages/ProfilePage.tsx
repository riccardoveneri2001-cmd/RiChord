import { useState } from 'react'
import { LogOut, Download, Trash2, Eye, Moon, Sun } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { useLibraryStore } from '../store/useLibraryStore'
import { useOnboardingStore } from '../store/useOnboardingStore'
import { PageWrapper, PageHeader } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ConfirmModal } from '../components/ui/Modal'
import { supabase } from '../lib/supabase'
import { exportAllSongs } from '../lib/export'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { signOut } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { songs } = useLibraryStore()
  const { startTour } = useOnboardingStore()

  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleEmailChange = async () => {
    if (!newEmail) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) toast.error(error.message)
    else { toast.success('Email aggiornata! Controlla la tua casella.'); setNewEmail('') }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Le password non coincidono')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success('Password aggiornata'); setNewPassword(''); setConfirmPassword('') }
    setSaving(false)
  }

  const handleExport = async () => {
    setExporting(true)
    await exportAllSongs(songs)
    setExporting(false)
  }

  const handleDeleteAccount = async () => {
    // Sign out first, then trigger deletion via edge function or Supabase admin
    toast.error('Contatta il supporto per eliminare l\'account: support@richord.app')
    setDeleteOpen(false)
  }

  return (
    <PageWrapper>
      <PageHeader title="Profilo" />

      <div className="max-w-lg space-y-4">
        {/* Account info */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark p-5">
          <h2 className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark mb-4">Account</h2>
          <div className="mb-4">
            <p className="text-xs text-secondary font-jakarta mb-1">Email attuale</p>
            <p className="text-sm font-jakarta text-primary-light dark:text-primary-dark">{user?.email}</p>
          </div>
          <div className="space-y-3">
            <Input
              label="Nuova email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuova@email.com"
            />
            <Button size="sm" onClick={handleEmailChange} loading={saving} disabled={!newEmail}>
              Aggiorna email
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark p-5">
          <h2 className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark mb-4">Password</h2>
          <div className="space-y-3">
            <Input
              label="Nuova password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="Conferma password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button size="sm" onClick={handlePasswordChange} loading={saving} disabled={!newPassword}>
              Aggiorna password
            </Button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark p-5 space-y-3">
          <h2 className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark mb-4">Preferenze</h2>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={16} className="text-secondary" /> : <Sun size={16} className="text-secondary" />}
              <span className="text-sm font-jakarta text-primary-light dark:text-primary-dark">
                Tema {theme === 'dark' ? 'scuro' : 'chiaro'}
              </span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-accent' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </button>
        </div>

        {/* Tour */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark p-5">
          <h2 className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark mb-4">Aiuto</h2>
          <button
            onClick={startTour}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye size={16} className="text-secondary" />
            <span className="text-sm font-jakarta text-primary-light dark:text-primary-dark">Rivedi il tour guidato</span>
          </button>
        </div>

        {/* Data */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark p-5 space-y-2">
          <h2 className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark mb-4">Dati</h2>

          <button
            onClick={handleExport}
            disabled={exporting || songs.length === 0}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Download size={16} className="text-secondary" />
            <div className="text-left">
              <p className="text-sm font-jakarta text-primary-light dark:text-primary-dark">Esporta tutti i brani</p>
              <p className="text-xs text-secondary font-jakarta">ZIP con .cho, PDF e immagini</p>
            </div>
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-red-200 dark:border-red-900/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold font-jakarta text-red-500 mb-4">Zona pericolosa</h2>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut size={16} className="text-secondary" />
            <span className="text-sm font-jakarta text-primary-light dark:text-primary-dark">Esci dall'account</span>
          </button>

          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <Trash2 size={16} className="text-red-500" />
            <div className="text-left">
              <p className="text-sm font-jakarta text-red-500">Elimina account</p>
              <p className="text-xs text-secondary font-jakarta">Tutti i tuoi dati verranno eliminati</p>
            </div>
          </button>
        </div>
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
    </PageWrapper>
  )
}
