import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-slate-700 text-secondary min-w-[44px] min-h-[44px] flex items-center justify-center',
        className
      )}
      aria-label="Cambia tema"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
