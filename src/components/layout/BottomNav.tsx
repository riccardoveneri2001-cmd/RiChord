import { NavLink } from 'react-router-dom'
import { Music, ListMusic, Share2, User } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/library', icon: Music, label: 'Libreria' },
  { to: '/setlists', icon: ListMusic, label: 'Setlist' },
  { to: '/shared', icon: Share2, label: 'Condivisi' },
  { to: '/profile', icon: User, label: 'Profilo' },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-night-surface border-t border-border-light dark:border-border-dark safe-area-pb">
      <div className="flex">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-jakarta font-medium transition-colors min-h-[56px]',
                isActive ? 'text-blue-accent' : 'text-secondary'
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
