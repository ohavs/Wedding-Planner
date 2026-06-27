import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tapScale } from '@/lib/motion'

type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'sun'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-teal-500 text-white shadow-float active:bg-teal-600',
  sun: 'bg-gradient-to-l from-sun-400 to-sun-300 text-white shadow-glow',
  secondary: 'bg-white text-teal-600 border border-teal-100 shadow-soft',
  soft: 'bg-teal-50 text-teal-600',
  ghost: 'bg-transparent text-ink-soft',
  danger: 'bg-coral-100 text-coral-600',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm rounded-2xl',
  md: 'h-12 px-5 text-[15px] rounded-2xl',
  lg: 'h-14 px-6 text-base rounded-3xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled || loading ? undefined : tapScale}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </motion.button>
  )
}
