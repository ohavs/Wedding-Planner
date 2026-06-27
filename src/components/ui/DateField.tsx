import { motion } from 'framer-motion'
import { CalendarDays, Clock } from 'lucide-react'
import { cn, formatDateShort } from '@/lib/utils'
import { tapScale } from '@/lib/motion'

const HE_DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function openPicker(el: HTMLInputElement) {
  try {
    // נתמך בדפדפנים מודרניים; במובייל פתיחת הבורר הנייטיבי
    ;(el as HTMLInputElement & { showPicker?: () => void }).showPicker?.()
  } catch {
    /* נפילה חיננית - הלחיצה עצמה תפתח את הבורר */
  }
}

interface DateFieldProps {
  value: string // yyyy-mm-dd
  onChange: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
}

/** שדה תאריך מעוצב — נראה כמו שאר השדות, פותח בורר נייטיבי בלחיצה */
export function DateField({ value, onChange, placeholder = 'בחרו תאריך', min, max }: DateFieldProps) {
  const d = value ? new Date(value) : null
  const dayLabel = d && !isNaN(d.getTime()) ? HE_DAYS_SHORT[d.getDay()] : null

  return (
    <motion.div whileTap={tapScale} className="relative">
      <div className="flex h-14 w-full items-center justify-between rounded-2xl border border-cream-200 bg-cream-50 px-4 transition-colors">
        <span className={cn('flex items-center gap-2', !value && 'text-ink-faint')}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-teal-500 shadow-soft">
            <CalendarDays className="h-[18px] w-[18px]" />
          </span>
          {value ? (
            <span className="font-semibold text-ink">
              {dayLabel && <span className="text-ink-faint">{dayLabel}, </span>}
              {formatDateShort(value)}
            </span>
          ) : (
            placeholder
          )}
        </span>
      </div>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => openPicker(e.currentTarget)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={placeholder}
      />
    </motion.div>
  )
}

interface TimeFieldProps {
  value: string // HH:mm
  onChange: (value: string) => void
  placeholder?: string
}

/** שדה שעה מעוצב — פותח בורר שעה נייטיבי בלחיצה */
export function TimeField({ value, onChange, placeholder = 'בחרו שעה' }: TimeFieldProps) {
  return (
    <motion.div whileTap={tapScale} className="relative">
      <div className="flex h-14 w-full items-center justify-between rounded-2xl border border-cream-200 bg-cream-50 px-4">
        <span className={cn('flex items-center gap-2', !value && 'text-ink-faint')}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-teal-500 shadow-soft">
            <Clock className="h-[18px] w-[18px]" />
          </span>
          {value ? (
            <span className="text-lg font-bold tabular-nums text-ink">{value}</span>
          ) : (
            placeholder
          )}
        </span>
      </div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => openPicker(e.currentTarget)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={placeholder}
      />
    </motion.div>
  )
}
