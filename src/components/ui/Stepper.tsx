import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { tapScale } from '@/lib/motion'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

/** בורר כמות נוח למגע */
export function Stepper({ value, onChange, min = 1, max = 99 }: StepperProps) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="flex h-14 items-center justify-between rounded-2xl border border-cream-200 bg-cream-50 px-2">
      <motion.button
        type="button"
        whileTap={tapScale}
        onClick={() => set(value - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-soft disabled:opacity-40"
        disabled={value <= min}
        aria-label="הפחת"
      >
        <Minus className="h-5 w-5" strokeWidth={2.5} />
      </motion.button>
      <span className="min-w-[3ch] text-center text-xl font-bold tabular-nums text-ink">
        {value}
      </span>
      <motion.button
        type="button"
        whileTap={tapScale}
        onClick={() => set(value + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-soft disabled:opacity-40"
        disabled={value >= max}
        aria-label="הוסף"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </motion.button>
    </div>
  )
}
