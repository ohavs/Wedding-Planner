import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

/** תגית סטטוס קטנה */
export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        'bg-cream-200 text-ink-soft',
        className,
      )}
    >
      {children}
    </span>
  )
}
