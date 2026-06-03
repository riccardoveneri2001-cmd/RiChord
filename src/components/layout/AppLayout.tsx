import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Logo } from './Logo'
import { useOfflineStore } from '../../store/useOfflineStore'
import { WifiOff } from 'lucide-react'
import { TourOverlay } from '../onboarding/TourOverlay'

export function AppLayout() {
  const isOffline = useOfflineStore((s) => s.isOffline)

  return (
    <div className="flex h-screen bg-app-light dark:bg-app-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-56 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-night-surface border-b border-border-light dark:border-border-dark shrink-0">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {isOffline && (
              <div className="flex items-center gap-1 text-xs text-orange-500 font-jakarta">
                <WifiOff size={13} />
                Offline
              </div>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <TourOverlay />
    </div>
  )
}
