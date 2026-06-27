import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0-100
  className?: string
  barClassName?: string
  height?: string
}

/** פס התקדמות אופקי מונפש */
export function ProgressBar({
  value,
  className,
  barClassName = 'bg-teal-500',
  height = 'h-2.5',
}: ProgressBarProps) {
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-cream-200', height, className)}>
      <motion.div
        className={cn('h-full rounded-full', barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
