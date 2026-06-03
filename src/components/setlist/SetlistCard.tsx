import { useNavigate } from 'react-router-dom'
import { ListMusic, Calendar, Copy, Trash2 } from 'lucide-react'
import type { Setlist } from '../../store/useSetlistStore'
import { cn } from '../../lib/utils'

interface SetlistCardProps {
  setlist: Setlist
  onDuplicate?: () => void
  onDelete?: () => void
}

export function SetlistCard({ setlist, onDuplicate, onDelete }: SetlistCardProps) {
  const navigate = useNavigate()

  const formattedDate = setlist.event_date
    ? new Date(setlist.event_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className={cn(
      'bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark overflow-hidden',
      'hover:shadow-md dark:hover:shadow-black/20 transition-all duration-150'
    )}>
      <button
        className="w-full text-left p-4"
        onClick={() => navigate(`/setlists/${setlist.id}`)}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
            <ListMusic size={18} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-jakarta text-primary-light dark:text-primary-dark">{setlist.name}</p>
            {formattedDate && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar size={11} className="text-secondary" />
                <span className="text-xs text-secondary font-jakarta">{formattedDate}</span>
              </div>
            )}
            {setlist.description && (
              <p className="text-xs text-secondary font-jakarta mt-1 truncate">{setlist.description}</p>
            )}
          </div>
        </div>
      </button>
      <div className="px-4 pb-3 flex gap-2 border-t border-border-light dark:border-border-dark pt-2">
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className="flex items-center gap-1 text-xs text-secondary font-jakarta hover:text-primary-light dark:hover:text-primary-dark transition-colors py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <Copy size={12} /> Duplica
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-xs text-red-500 font-jakarta hover:text-red-600 transition-colors py-1 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 ml-auto"
          >
            <Trash2 size={12} /> Elimina
          </button>
        )}
      </div>
    </div>
  )
}
