import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { Logo } from '../components/layout/Logo'
import toast from 'react-hot-toast'

const DEV_BYPASS_KEY = '__dev_bypass'

type Tab = 'login' | 'register'

// ── Shared style helpers ────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100svh',
    background: '#F5F4F1',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  inner: {
    width: '100%',
    maxWidth: 390,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#8A94A6',
    marginBottom: 6,
  } as React.CSSProperties,
  input: (focused: boolean): React.CSSProperties => ({
    width: '100%',
    background: '#FFFFFF',
    border: `0.5px solid ${focused ? '#2176AE' : '#E0DED8'}`,
    borderRadius: 12,
    padding: '13px 14px',
    fontSize: 16,
    color: '#1C2333',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    WebkitAppearance: 'none',
  }),
  primaryBtn: (disabled: boolean): React.CSSProperties => ({
    width: '100%',
    background: disabled ? '#C8CDD8' : '#2176AE',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    marginTop: 4,
    transition: 'background 0.15s',
  }),
}

// ── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label, type, value, onChange, placeholder, required = false, focusId, focusedId, onFocus, onBlur,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  focusId: string
  focusedId: string | null
  onFocus: (id: string) => void
  onBlur: () => void
}) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={S.input(focusedId === focusId)}
        onFocus={() => onFocus(focusId)}
        onBlur={onBlur}
      />
    </div>
  )
}

// ── Primary button ────────────────────────────────────────────────────────────

function PrimaryBtn({ label, loading }: { label: string; loading: boolean }) {
  return (
    <button type="submit" disabled={loading} style={S.primaryBtn(loading)}>
      {loading ? '…' : label}
    </button>
  )
}

// ── Google SVG ───────────────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.092 17.64 11.784 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('login')
  const [resetMode, setResetMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  // Reset
  const [resetEmail, setResetEmail] = useState('')

  if (user) return <Navigate to="/library" replace />

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })
      if (error) toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regPassword !== regConfirm) { toast.error('Le password non coincidono'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: { data: { full_name: regName } },
      })
      if (error) toast.error(error.message)
      else toast.success('Account creato — controlla la tua email')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) toast.error(error.message)
      else { toast.success('Email inviata — controlla la tua casella'); setResetMode(false) }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/library` },
    })

  // ── Reset password view ──────────────────────────────────────────────────────

  if (resetMode) {
    return (
      <div style={S.page}>
        <div style={S.inner}>
          <button
            type="button"
            onClick={() => setResetMode(false)}
            style={{ color: '#2176AE', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 28, fontFamily: 'inherit' }}
          >
            ← Torna al login
          </button>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C2333', letterSpacing: '-0.3px', margin: '0 0 8px' }}>
            Recupera password
          </h1>
          <p style={{ fontSize: 14, color: '#8A94A6', margin: '0 0 28px', lineHeight: 1.5 }}>
            Inserisci la tua email e ti invieremo un link per reimpostare la password.
          </p>

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field
              label="Email" type="email" value={resetEmail} onChange={setResetEmail}
              placeholder="nome@email.com" required
              focusId="reset-email" focusedId={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <PrimaryBtn label="Invia link di recupero" loading={loading} />
          </form>
        </div>
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Logo + tagline */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Logo size="lg" />
          <p style={{ fontSize: 15, color: '#8A94A6', margin: '8px 0 0' }}>
            La tua libreria musicale, sempre pronta.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: '0.5px solid #E0DED8',
          padding: 4,
          display: 'flex',
          marginBottom: 20,
        }}>
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'inherit',
                transition: 'background 0.2s, color 0.2s',
                background: tab === t ? '#2176AE' : 'transparent',
                color: tab === t ? '#FFFFFF' : '#8A94A6',
              }}
            >
              {t === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          ))}
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field
              label="Email" type="email" value={loginEmail} onChange={setLoginEmail}
              placeholder="nome@email.com" required
              focusId="l-email" focusedId={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <div>
              <label style={S.label}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={S.input(focused === 'l-pass')}
                onFocus={() => setFocused('l-pass')}
                onBlur={() => setFocused(null)}
              />
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  style={{ fontSize: 13, color: '#2176AE', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                  Password dimenticata?
                </button>
              </div>
            </div>
            <PrimaryBtn label="Accedi" loading={loading} />
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field
              label="Nome" type="text" value={regName} onChange={setRegName}
              placeholder="Il tuo nome" required
              focusId="r-name" focusedId={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <Field
              label="Email" type="email" value={regEmail} onChange={setRegEmail}
              placeholder="nome@email.com" required
              focusId="r-email" focusedId={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <Field
              label="Password" type="password" value={regPassword} onChange={setRegPassword}
              placeholder="••••••••" required
              focusId="r-pass" focusedId={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <Field
              label="Conferma password" type="password" value={regConfirm} onChange={setRegConfirm}
              placeholder="••••••••" required
              focusId="r-confirm" focusedId={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <PrimaryBtn label="Crea account" loading={loading} />
          </form>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#E0DED8' }} />
          <span style={{ fontSize: 13, color: '#8A94A6' }}>oppure</span>
          <div style={{ flex: 1, height: '0.5px', background: '#E0DED8' }} />
        </div>

        {/* Dev bypass — only in development builds */}
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(DEV_BYPASS_KEY, '1')
              navigate('/library')
            }}
            style={{
              width: '100%', marginTop: 28,
              background: 'none', border: '1px dashed #C8CDD8',
              borderRadius: 12, padding: '11px 0',
              fontSize: 13, color: '#8A94A6',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Entra come ospite (solo dev)
          </button>
        )}

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            background: '#FFFFFF',
            border: '0.5px solid #E0DED8',
            borderRadius: 12,
            padding: 15,
            fontSize: 15,
            fontWeight: 500,
            color: '#1C2333',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <GoogleLogo />
          Continua con Google
        </button>

      </div>
    </div>
  )
}
