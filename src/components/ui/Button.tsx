import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-jakarta font-medium rounded-xl transition-all duration-150 select-none'

  const variants = {
    primary: 'bg-blue-accent text-white hover:bg-blue-500 active:scale-95',
    secondary: 'bg-surface-dark dark:bg-surface-dark bg-gray-100 text-primary-light dark:text-primary-dark border border-border-light dark:border-border-dark hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95',
    ghost: 'text-primary-light dark:text-primary-dark hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[52px]',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-50 pointer-events-none', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
