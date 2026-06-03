import React, { useEffect, useState } from 'react'
import { BottomSheet } from './BottomSheet'

// ── Generic modal wrapper (BottomSheet-based) ─────────────────────────────────
// Used by pages not yet rewritten. Will be removed once all pages use BottomSheet directly.

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: '0 16px 32px' }}>
        {title && (
          <p style={{
            margin: '0 0 16px', textAlign: 'center',
            fontSize: 13, fontWeight: 600, color: '#8A94A6',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {title}
          </p>
        )}
        {children}
      </div>
    </BottomSheet>
  )
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmModal({
  open, onClose, onConfirm, title, message, confirmLabel = 'Conferma', danger = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!mounted) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 32px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,35,51,0.45)' }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 16,
          padding: 24,
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.2s ease',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: '#1C2333' }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#8A94A6', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => { onConfirm(); onClose() }}
            style={{
              width: '100%', padding: 13, borderRadius: 12, border: 'none',
              background: danger ? '#C0392B' : '#2176AE',
              color: '#FFFFFF', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: 13, borderRadius: 12, border: 'none',
              background: '#F5F4F1',
              color: '#1C2333', fontSize: 15, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  )
}
