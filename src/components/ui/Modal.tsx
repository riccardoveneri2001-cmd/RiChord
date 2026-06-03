import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative w-full rounded-2xl bg-white dark:bg-night-surface shadow-2xl z-10 overflow-hidden',
              sizes[size]
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
                <h2 className="text-lg font-semibold font-jakarta text-primary-light dark:text-primary-dark">{title}</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                  <X size={18} className="text-secondary" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Conferma', danger }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-secondary font-jakarta mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-jakarta text-secondary hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          Annulla
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-jakarta font-medium text-white transition-colors',
            danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-accent hover:bg-blue-500'
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
