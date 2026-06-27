import { cn } from '@/lib/utils'

interface FieldProps {
  label?: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}

/** עטיפת שדה עם תווית, רמז ושגיאה - אחיד לכל הטפסים */
export function Field({ label, hint, error, children, className }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block px-1 text-sm font-medium text-ink-soft">{label}</span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block px-1 text-xs font-medium text-coral-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block px-1 text-xs text-ink-faint">{hint}</span>
      ) : null}
    </label>
  )
}
