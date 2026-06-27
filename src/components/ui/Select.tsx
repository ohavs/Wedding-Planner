import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tapScale } from '@/lib/motion'
import { BottomSheet } from './BottomSheet'

export interface SelectOption {
  value: string
  label: string
  emoji?: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  title?: string
  className?: string
}

/** Select בסגנון מובייל - נפתח כמגירה תחתונה גדולה ונוחה למגע */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'בחרו...',
  title,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <>
      <motion.button
        type="button"
        whileTap={tapScale}
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-14 w-full items-center justify-between rounded-2xl border border-cream-200 bg-cream-50 px-4 text-base outline-none transition-colors focus:border-teal-300',
          className,
        )}
      >
        <span className={cn('flex items-center gap-2', !selected && 'text-ink-faint')}>
          {selected?.emoji && <span className="text-lg">{selected.emoji}</span>}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-5 w-5 text-ink-faint" />
      </motion.button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={title ?? placeholder}>
        <div className="flex flex-col gap-1 pb-2">
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <motion.button
                key={opt.value}
                type="button"
                whileTap={tapScale}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex h-14 items-center justify-between rounded-2xl px-4 text-start text-base transition-colors',
                  active ? 'bg-teal-50 font-semibold text-teal-600' : 'text-ink active:bg-cream-100',
                )}
              >
                <span className="flex items-center gap-3">
                  {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
                  {opt.label}
                </span>
                {active && <Check className="h-5 w-5 text-teal-500" />}
              </motion.button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}
