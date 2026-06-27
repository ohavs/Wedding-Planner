import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { tapScale } from '@/lib/motion'

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'solid' | 'glass' | 'soft' | 'plain'
}

const variants = {
  solid: 'bg-teal-500 text-white shadow-soft',
  glass: 'glass text-ink shadow-soft',
  soft: 'bg-cream-200 text-ink-soft',
  plain: 'text-ink-soft',
}

export function IconButton({ variant = 'glass', className, children, ...props }: IconButtonProps) {
  return (
    <motion.button
      whileTap={tapScale}
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
