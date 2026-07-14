import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Building2,
  Gift,
  Clock,
  Sparkles,
  Users2,
  LogOut,
  Download,
  ChevronLeft,
  Plus,
  Palette,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useWedding } from '@/context/WeddingContext'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { staggerContainer, fadeUp } from '@/lib/motion'

const links = [
  { to: '/venues', label: 'אולמות ומקומות', icon: Building2, tone: 'bg-blush-100 text-coral-500' },
  { to: '/vendors', label: 'ספקים', icon: Briefcase, tone: 'bg-teal-50 text-teal-600' },
  { to: '/gifts', label: 'מתנות וכספים', icon: Gift, tone: 'bg-coral-50 text-coral-500' },
  { to: '/schedule', label: 'לו״ז יום האירוע', icon: Clock, tone: 'bg-sun-50 text-sun-600' },
  { to: '/inspiration', label: 'השראה ומסמכים', icon: Sparkles, tone: 'bg-sky-100 text-teal-600' },
]

export default function More() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { wedding, weddings } = useWedding()
  const { canInstall, promptInstall } = usePWAInstall()

  return (
    <div className="px-5 pt-safe">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
        <h1 className="text-3xl font-extrabold text-ink">עוד</h1>
      </motion.div>

      {/* כרטיס פרופיל */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <Link
          to="/settings"
          className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 p-5 text-white shadow-float"
        >
          <Avatar src={user?.photoURL} name={user?.displayName} size={56} ring={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{user?.displayName}</p>
            <p className="truncate text-sm text-white/80">
              {wedding ? `${wedding.partner1} & ${wedding.partner2}` : user?.email}
            </p>
          </div>
          <ChevronLeft className="h-5 w-5 text-white/80" />
        </Link>
      </motion.div>

      {/* מודולים */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-4 space-y-2.5"
      >
        {links.map((l) => {
          const Icon = l.icon
          return (
            <motion.button
              key={l.to}
              variants={fadeUp}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(l.to)}
              className="flex w-full items-center gap-3 rounded-3xl bg-white p-3.5 text-start shadow-card"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${l.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 font-bold text-ink">{l.label}</span>
              <ChevronLeft className="h-5 w-5 text-ink-faint" />
            </motion.button>
          )
        })}
      </motion.div>

      {/* מצב תצוגה */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-3xl bg-white p-3.5 shadow-card"
      >
        <div className="mb-2.5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 text-ink-soft">
            <Palette className="h-5 w-5" />
          </span>
          <span className="flex-1 font-bold text-ink">מצב תצוגה</span>
        </div>
        <ThemeToggle />
      </motion.div>

      {/* ניהול */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-4 space-y-2.5"
      >
        <motion.button
          variants={fadeUp}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/settings')}
          className="flex w-full items-center gap-3 rounded-3xl bg-white p-3.5 text-start shadow-card"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 text-ink-soft">
            <Users2 className="h-5 w-5" />
          </span>
          <span className="flex-1 font-bold text-ink">ניהול ושיתוף החתונה</span>
          <ChevronLeft className="h-5 w-5 text-ink-faint" />
        </motion.button>

        <motion.button
          variants={fadeUp}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/onboarding')}
          className="flex w-full items-center gap-3 rounded-3xl bg-white p-3.5 text-start shadow-card"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 text-ink-soft">
            <Plus className="h-5 w-5" />
          </span>
          <span className="flex-1 font-bold text-ink">
            חתונה נוספת {weddings.length > 1 && `(${weddings.length})`}
          </span>
          <ChevronLeft className="h-5 w-5 text-ink-faint" />
        </motion.button>

        {canInstall && (
          <motion.button
            variants={fadeUp}
            whileTap={{ scale: 0.98 }}
            onClick={promptInstall}
            className="flex w-full items-center gap-3 rounded-3xl bg-teal-50 p-3.5 text-start shadow-card"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500 text-white">
              <Download className="h-5 w-5" />
            </span>
            <span className="flex-1 font-bold text-teal-700">התקנת האפליקציה למסך הבית</span>
          </motion.button>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => signOut()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-3xl bg-white p-3.5 font-bold text-coral-500 shadow-card"
      >
        <LogOut className="h-5 w-5" />
        התנתקות
      </motion.button>

      <p className="mt-6 text-center text-xs text-ink-faint">החתונה שלנו · גרסה 1.0 💍</p>
    </div>
  )
}
