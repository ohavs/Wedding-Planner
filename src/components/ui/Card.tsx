import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeUp, tapScale } from '@/lib/motion'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  interactive?: boolean
  animate?: boolean
}

/** כרטיס משטח לבן מעוגל - אבן הבניין הבסיסית */
export function Card({ interactive, animate = true, className, children, ...props }: CardProps) {
  return (
    <motion.div
      variants={animate ? fadeUp : undefined}
      whileTap={interactive ? tapScale : undefined}
      className={cn(
        'rounded-3xl bg-white p-4 shadow-card',
        interactive && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
