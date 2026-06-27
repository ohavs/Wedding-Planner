import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
}

/** כותרת עמוד אחידה למסכי המודולים */
export function PageHeader({ title, subtitle, back = true, action }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="pt-safe sticky top-0 z-20 bg-cream/80 px-5 pb-3 pt-3 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        {back && (
          <IconButton variant="soft" onClick={() => navigate(-1)} aria-label="חזרה">
            <ChevronRight className="h-5 w-5" />
          </IconButton>
        )}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="min-w-0 flex-1"
        >
          <h1 className="truncate text-2xl font-extrabold leading-tight text-ink">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-soft">{subtitle}</p>}
        </motion.div>
        {action}
      </div>
    </header>
  )
}
