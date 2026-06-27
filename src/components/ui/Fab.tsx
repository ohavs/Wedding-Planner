import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FabProps {
  onClick: () => void
  icon?: React.ReactNode
  className?: string
  'aria-label'?: string
}

/** כפתור פעולה צף עגול (צד ימin, מעל ה-bottom nav) */
export function Fab({ onClick, icon, className, ...props }: FabProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.15 }}
      whileTap={{ scale: 0.9 }}
      aria-label={props['aria-label'] ?? 'הוספה'}
      className={cn(
        'fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white shadow-float',
        'bottom-[calc(6.25rem+var(--safe-bottom))] start-5',
        className,
      )}
    >
      {icon ?? <Plus className="h-7 w-7" strokeWidth={2.5} />}
    </motion.button>
  )
}
