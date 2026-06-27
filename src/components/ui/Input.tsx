import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const baseField =
  'w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 text-base text-ink placeholder:text-ink-faint outline-none transition-all focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-50'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, ...props },
  ref,
) {
  if (icon) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-ink-faint">
          {icon}
        </span>
        <input ref={ref} className={cn(baseField, 'h-14 ps-11', className)} {...props} />
      </div>
    )
  }
  return <input ref={ref} className={cn(baseField, 'h-14', className)} {...props} />
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(baseField, 'resize-none py-3.5 leading-relaxed', className)}
      {...props}
    />
  )
})
