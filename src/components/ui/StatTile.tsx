import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'

interface StatTileProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  tone?: 'teal' | 'sun' | 'coral' | 'sky' | 'plain'
  className?: string
}

const tones = {
  teal: 'bg-teal-500 text-white',
  sun: 'bg-gradient-to-br from-sun-300 to-sun-400 text-white',
  coral: 'bg-gradient-to-br from-coral-300 to-coral text-white',
  sky: 'bg-sky-100 text-teal-700',
  plain: 'bg-white text-ink',
}

/** אריח סטטיסטיקה קומפקטי */
export function StatTile({ label, value, icon, tone = 'plain', className }: StatTileProps) {
  const inverted = tone !== 'plain' && tone !== 'sky'
  return (
    <motion.div
      variants={fadeUp}
      className={cn('flex flex-col gap-1 rounded-3xl p-4 shadow-card', tones[tone], className)}
    >
      {icon && (
        <div
          className={cn(
            'mb-1 flex h-9 w-9 items-center justify-center rounded-xl',
            inverted ? 'bg-white/20' : 'bg-cream-200',
          )}
        >
          {icon}
        </div>
      )}
      <span className="text-2xl font-extrabold leading-none tabular-nums">{value}</span>
      <span className={cn('text-xs font-medium', inverted ? 'text-white/80' : 'text-ink-soft')}>
        {label}
      </span>
    </motion.div>
  )
}
