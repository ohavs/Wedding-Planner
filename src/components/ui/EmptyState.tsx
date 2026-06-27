import { motion } from 'framer-motion'
import { popIn } from '@/lib/motion'

interface EmptyStateProps {
  emoji: string
  title: string
  description?: string
  action?: React.ReactNode
}

/** מצב ריק ידידותי */
export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      variants={popIn}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center px-8 py-14 text-center"
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-4xl bg-cream-200 text-4xl">
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          {emoji}
        </motion.span>
      </div>
      <h3 className="mb-1 text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mb-5 max-w-xs text-sm text-ink-soft">{description}</p>}
      {action}
    </motion.div>
  )
}
