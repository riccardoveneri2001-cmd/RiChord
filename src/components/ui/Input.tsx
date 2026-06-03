import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-secondary font-jakarta">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">{icon}</span>}
        <input
          className={cn(
            'w-full rounded-xl border bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark',
            'text-primary-light dark:text-primary-dark placeholder:text-secondary',
            'px-4 py-3 text-sm font-jakarta outline-none transition-all min-h-[44px]',
            'focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/20',
            icon && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-jakarta">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-secondary font-jakarta">{label}</label>}
      <textarea
        className={cn(
          'w-full rounded-xl border bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark',
          'text-primary-light dark:text-primary-dark placeholder:text-secondary',
          'px-4 py-3 text-sm font-jakarta outline-none transition-all resize-none',
          'focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/20',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-jakarta">{error}</p>}
    </div>
  )
}
