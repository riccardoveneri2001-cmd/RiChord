import { FileText, ExternalLink } from 'lucide-react'
import type { Song } from '../../store/useLibraryStore'

interface FileCardProps {
  song: Song
}

export function FileCard({ song }: FileCardProps) {
  if (!song.file_url) return null

  const isImage = song.type === 'image'

  return (
    <div className="bg-white dark:bg-night-surface rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
      {isImage ? (
        <div className="relative">
          <img
            src={song.file_url}
            alt={song.title}
            className="w-full object-contain max-h-[70vh]"
          />
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
            <FileText size={28} className="text-orange-500" />
          </div>
          <div>
            <p className="font-semibold font-jakarta text-primary-light dark:text-primary-dark">{song.title}</p>
            <p className="text-sm text-secondary font-jakarta mt-1">Documento PDF</p>
          </div>
          <a
            href={song.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-accent text-white px-4 py-2.5 rounded-xl text-sm font-jakarta font-medium hover:bg-blue-500 transition-colors"
          >
            <ExternalLink size={14} />
            Apri PDF
          </a>
          <iframe
            src={song.file_url}
            className="w-full h-[60vh] rounded-xl border border-border-light dark:border-border-dark"
            title={song.title}
          />
        </div>
      )}
    </div>
  )
}
