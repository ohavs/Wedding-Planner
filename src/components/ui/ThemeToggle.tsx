import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'בהיר', icon: Sun },
  { value: 'dark', label: 'כהה', icon: Moon },
]

/** מתג מעבר בין מצב בהיר לכהה */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex gap-1 rounded-2xl bg-cream-100 p-1">
      {options.map((o) => {
        const active = theme === o.value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold"
          >
            {active && (
              <motion.span
                layoutId="theme-knob"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-surface shadow-soft"
              />
            )}
            <span
              className={cn(
                'relative flex items-center gap-1.5 transition-colors',
                active ? 'text-teal-600' : 'text-ink-faint',
              )}
            >
              <Icon className="h-4 w-4" />
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
