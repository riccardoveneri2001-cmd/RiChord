import React from 'react'
import { cn } from '../../lib/utils'

const TAG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
]

function tagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

interface TagProps {
  label: string
  onRemove?: () => void
  className?: string
}

export function Tag({ label, onRemove, className }: TagProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-jakarta', tagColor(label), className)}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity leading-none">&times;</button>
      )}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'gray' | 'green' | 'orange' | 'red'
  className?: string
}

export function Badge({ children, variant = 'blue', className }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-jakarta', variants[variant], className)}>
      {children}
    </span>
  )
}
