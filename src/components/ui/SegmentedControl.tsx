import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface Segment {
  value: string
  label: string
  count?: number
}

interface SegmentedControlProps {
  value: string
  onChange: (value: string) => void
  segments: Segment[]
  /** layoutId ייחודי לאנימציית המחוון */
  idKey?: string
}

/** שורת פילטרים נגללת בסגנון גלולות עם מחוון נע */
export function SegmentedControl({
  value,
  onChange,
  segments,
  idKey = 'seg',
}: SegmentedControlProps) {
  return (
    <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
      {segments.map((seg) => {
        const active = seg.value === value
        return (
          <button
            key={seg.value}
            onClick={() => onChange(seg.value)}
            className={cn(
              'relative shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors',
              active ? 'text-white' : 'bg-white text-ink-soft shadow-soft',
            )}
          >
            {active && (
              <motion.span
                layoutId={`${idKey}-active`}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-2xl bg-teal-500 shadow-float"
              />
            )}
            <span className="relative flex items-center gap-1.5 whitespace-nowrap">
              {seg.label}
              {seg.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs',
                    active ? 'bg-white/25' : 'bg-cream-200 text-ink-faint',
                  )}
                >
                  {seg.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
