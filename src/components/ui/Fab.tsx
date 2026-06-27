import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FabProps {
  onClick: () => void
  label?: string
  icon?: React.ReactNode
  className?: string
}

/** כפתור פעולה צף (מעל ה-bottom nav) */
export function Fab({ onClick, label, icon, className }: FabProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.15 }}
      whileTap={{ scale: 0.92 }}
      className={cn(
        'fixed z-30 flex items-center gap-2 rounded-3xl bg-teal-500 px-5 font-bold text-white shadow-float',
        'bottom-[calc(5.75rem+var(--safe-bottom))] end-5 h-14',
        className,
      )}
    >
      {icon ?? <Plus className="h-6 w-6" strokeWidth={2.5} />}
      {label && <span>{label}</span>}
    </motion.button>
  )
}
