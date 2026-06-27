import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { overlayVariants, sheetVariants } from '@/lib/motion'
import { AlertDialog } from './AlertDialog'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** האם יש שינויים שלא נשמרו - יציאה תבקש אישור */
  dirty?: boolean
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  dirty = false,
  className,
}: BottomSheetProps) {
  const [askDiscard, setAskDiscard] = useState(false)

  // נעילת גלילה כשפתוח
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // איפוס בקשת היציאה כשהמגירה נסגרת
  useEffect(() => {
    if (!open) setAskDiscard(false)
  }, [open])

  const requestClose = () => {
    if (dirty) setAskDiscard(true)
    else onClose()
  }

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              variants={overlayVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={requestClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              variants={sheetVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) requestClose()
              }}
              className={cn(
                'relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-4xl bg-cream shadow-card',
                className,
              )}
            >
              {/* ידית גרירה */}
              <div className="flex shrink-0 cursor-grab justify-center pb-1 pt-3 active:cursor-grabbing">
                <div className="h-1.5 w-12 rounded-full bg-cream-200" />
              </div>
              {title && (
                <h2 className="shrink-0 px-6 pb-2 pt-1 text-center text-xl font-bold text-ink">
                  {title}
                </h2>
              )}
              <div
                className="hide-scrollbar overflow-y-auto px-5 pb-[calc(1.5rem+var(--safe-bottom))] pt-2"
                style={{ overscrollBehavior: 'contain' }}
              >
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog
        open={askDiscard}
        onClose={() => setAskDiscard(false)}
        onConfirm={onClose}
        emoji="📝"
        title="לצאת בלי לשמור?"
        description="יש שינויים שלא נשמרו. אם תצאו עכשיו הם יאבדו."
        confirmLabel="יציאה"
        cancelLabel="המשך עריכה"
        danger
      />
    </>,
    document.body,
  )
}
