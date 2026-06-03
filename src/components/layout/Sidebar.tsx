import { NavLink } from 'react-router-dom'
import { Music, ListMusic, Share2, User, WifiOff } from 'lucide-react'
import { Logo } from './Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useOfflineStore } from '../../store/useOfflineStore'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/library', icon: Music, label: 'Libreria' },
  { to: '/setlists', icon: ListMusic, label: 'Setlist' },
  { to: '/shared', icon: Share2, label: 'Condivisi' },
  { to: '/profile', icon: User, label: 'Profilo' },
]

export function Sidebar() {
  const isOffline = useOfflineStore((s) => s.isOffline)

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen bg-white dark:bg-night-surface border-r border-border-light dark:border-border-dark fixed left-0 top-0 z-30">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
        <Logo size="md" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-jakarta transition-all',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-accent'
                  : 'text-secondary hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-light dark:hover:text-primary-dark'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
        {isOffline && (
          <div className="flex items-center gap-1.5 text-xs text-orange-500 font-jakarta">
            <WifiOff size={13} />
            Offline
          </div>
        )}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
