import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { Logo } from '../components/layout/Logo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import toast from 'react-hot-toast'

type Mode = 'login' | 'register' | 'reset'

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/library" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) toast.error(error.message)
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) toast.error(error.message)
        else toast.success('Registrazione completata! Controlla la tua email.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) toast.error(error.message)
        else {
          toast.success('Email di recupero inviata!')
          setMode('login')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app-light dark:bg-app-dark flex flex-col">
      <header className="flex justify-end p-4">
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-primary rounded-[21px] flex items-center justify-center">
                <span className="font-display text-white text-2xl">Ri</span>
              </div>
            </div>
            <Logo size="lg" />
            <p className="text-secondary font-jakarta text-sm mt-2">La tua libreria musicale sempre pronta</p>
          </div>

          <div className="bg-white dark:bg-night-surface rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <h2 className="text-lg font-semibold font-jakarta text-primary-light dark:text-primary-dark mb-5">
              {mode === 'login' ? 'Accedi' : mode === 'register' ? 'Registrati' : 'Recupera password'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                icon={<Mail size={16} />}
                required
              />

              {mode !== 'reset' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-secondary font-jakarta">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-primary-light dark:text-primary-dark px-4 py-3 pl-10 pr-10 text-sm font-jakarta outline-none transition-all min-h-[44px] focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/20 placeholder:text-secondary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary-light dark:hover:text-primary-dark"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
                {mode === 'login' ? 'Accedi' : mode === 'register' ? 'Crea account' : 'Invia email'}
              </Button>
            </form>

            <div className="mt-5 flex flex-col gap-2 text-center">
              {mode === 'login' && (
                <>
                  <button onClick={() => setMode('reset')} className="text-xs text-secondary font-jakarta hover:text-blue-accent transition-colors">
                    Hai dimenticato la password?
                  </button>
                  <p className="text-sm text-secondary font-jakarta">
                    Non hai un account?{' '}
                    <button onClick={() => setMode('register')} className="text-blue-accent font-medium hover:underline">
                      Registrati
                    </button>
                  </p>
                </>
              )}
              {mode === 'register' && (
                <p className="text-sm text-secondary font-jakarta">
                  Hai già un account?{' '}
                  <button onClick={() => setMode('login')} className="text-blue-accent font-medium hover:underline">
                    Accedi
                  </button>
                </p>
              )}
              {mode === 'reset' && (
                <button onClick={() => setMode('login')} className="text-sm text-secondary font-jakarta hover:text-blue-accent transition-colors">
                  ← Torna al login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
