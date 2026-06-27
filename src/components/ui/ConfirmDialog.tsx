import { BottomSheet } from './BottomSheet'
import { Button } from './Button'

interface ConfirmDialogProps {
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

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  danger,
  emoji = '⚠️',
}: ConfirmDialogProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex flex-col items-center px-2 pb-2 pt-3 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-cream-200 text-3xl">
          {emoji}
        </div>
        <h3 className="mb-1 text-xl font-bold text-ink">{title}</h3>
        {description && <p className="mb-6 max-w-xs text-sm text-ink-soft">{description}</p>}
        <div className="flex w-full gap-3">
          <Button variant="secondary" fullWidth size="lg" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'primary' : 'primary'}
            fullWidth
            size="lg"
            className={danger ? 'bg-coral-500 active:bg-coral-600' : ''}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
