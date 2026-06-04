import React, { useEffect, useLayoutEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'
import { useLibraryStore } from './store/useLibraryStore'
import { useSetlistStore } from './store/useSetlistStore'
import { useOnboardingStore } from './store/useOnboardingStore'
import { useOfflineSync } from './hooks/useOfflineSync'
import { startKeepalive } from './lib/keepalive'
import { AppLayout } from './components/layout/AppLayout'
import { PullToRefresh } from './components/ui/PullToRefresh'
import { LoginPage } from './pages/LoginPage'
import { LibraryPage } from './pages/LibraryPage'
import { SongEditorPage } from './pages/SongEditorPage'
import { SongViewPage } from './pages/SongViewPage'
import { SongFilePage } from './pages/SongFilePage'
import { SetlistsPage } from './pages/SetlistsPage'
import { SetlistDetailPage } from './pages/SetlistDetailPage'
import { SharedLinksPage } from './pages/SharedLinksPage'
import { ProfilePage } from './pages/ProfilePage'
import { SharedPage } from './pages/SharedPage'

const DEV_BYPASS_KEY = '__dev_bypass'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (import.meta.env.DEV && sessionStorage.getItem(DEV_BYPASS_KEY)) return <>{children}</>
  if (loading) return (
    <div style={{ minHeight: '100svh', background: '#F5F4F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #2176AE', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppInit() {
  useOfflineSync()
  return null
}

export default function App() {
  const { setSession, setLoading } = useAuthStore()
  const { theme } = useThemeStore()
  const { fetchSongs } = useLibraryStore()
  const { fetchSetlists } = useSetlistStore()
  const { setDone, startTour } = useOnboardingStore()

  // Apply theme class synchronously before paint to avoid flash
  useLayoutEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') html.classList.add('dark')
    else html.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    // Init auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)

      if (session?.user) {
        fetchSongs(session.user.id)
        fetchSetlists(session.user.id)

        // Check onboarding status
        supabase
          .from('user_profiles')
          .select('onboarding_done')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error && error.code !== 'PGRST116') {
              console.error('user_profiles fetch error:', error)
            }
            if (!data?.onboarding_done) startTour()
            else setDone(true)
          })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchSongs(session.user.id)
        fetchSetlists(session.user.id)
      }
    })

    const stopKeepalive = startKeepalive()
    return () => {
      subscription.unsubscribe()
      stopKeepalive()
    }
  }, [])

  return (
    <div className={theme}>
      <PullToRefresh>
      <BrowserRouter>
        <AppInit />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/share/:token" element={<SharedPage />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/library" replace />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/song/new" element={<SongEditorPage />} />
            <Route path="/song/:id" element={<SongViewPage />} />
            <Route path="/song/:id/edit" element={<SongEditorPage />} />
            <Route path="/song/:id/file" element={<SongFilePage />} />
            <Route path="/setlists" element={<SetlistsPage />} />
            <Route path="/setlists/:id" element={<SetlistDetailPage />} />
            <Route path="/shared" element={<SharedLinksPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </PullToRefresh>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1C2333',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'inherit',
          },
        }}
      />
    </div>
  )
}
