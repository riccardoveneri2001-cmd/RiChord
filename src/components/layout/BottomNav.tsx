import { NavLink } from 'react-router-dom'
import { IconMusic, IconList, IconShare, IconUser } from '@tabler/icons-react'

const NAV_ITEMS = [
  { to: '/library', icon: IconMusic,  label: 'Libreria'  },
  { to: '/setlists', icon: IconList,  label: 'Setlist'   },
  { to: '/shared',  icon: IconShare,  label: 'Condivisi' },
  { to: '/profile', icon: IconUser,   label: 'Profilo'   },
]

export function BottomNav() {
  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-30 bg-surface"
      style={{ borderTop: '0.5px solid #E0DED8', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex pt-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center gap-0.5 min-h-[44px] justify-center"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  stroke={1.75}
                  style={{ color: isActive ? '#2176AE' : '#C8CDD8' }}
                />
                <span
                  className="font-medium"
                  style={{
                    fontSize: 10,
                    color: isActive ? '#2176AE' : '#C8CDD8',
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
