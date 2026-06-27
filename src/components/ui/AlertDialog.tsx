import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { overlayVariants } from '@/lib/motion'
import { Button } from './Button'

interface AlertDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  emoji?: string
}

/** דיאלוג אישור ממורכז ומונפש — יושב מעל מגירות (bottom sheets) */
export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  danger,
  emoji = '⚠️',
}: AlertDialogProps) {
  useEffect(() => {
    if (open) {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="relative w-full max-w-sm rounded-4xl bg-surface p-6 text-center shadow-card"
          >
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
              className={cn(
                'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl text-3xl',
                danger ? 'bg-coral-100' : 'bg-cream-100',
              )}
            >
              {emoji}
            </motion.div>
            <h3 className="mb-1.5 text-xl font-extrabold text-ink">{title}</h3>
            {description && (
              <p className="mb-6 text-sm leading-relaxed text-ink-soft">{description}</p>
            )}
            <div className="mt-2 flex gap-3">
              <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
                {cancelLabel}
              </Button>
              <Button
                size="lg"
                fullWidth
                className={danger ? 'bg-coral-500 active:bg-coral-600' : ''}
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
