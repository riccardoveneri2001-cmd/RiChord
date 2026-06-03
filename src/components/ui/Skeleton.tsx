import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg', className)} />
}

export function SongCardSkeleton() {
  return (
    <div className="bg-white dark:bg-night-surface rounded-2xl p-4 flex gap-3">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-1.5 mt-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SetlistCardSkeleton() {
  return (
    <div className="bg-white dark:bg-night-surface rounded-2xl p-4 space-y-2">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
