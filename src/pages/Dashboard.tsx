import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bell,
  Users,
  Wallet,
  ListChecks,
  Briefcase,
  Gift,
  Clock,
  Sparkles,
  ChevronLeft,
} from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { useWedding } from '@/context/WeddingContext'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { Guest, Vendor, ChecklistTask, BudgetItem, Gift as GiftT } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Card } from '@/components/ui/Card'
import {
  countdownLabel,
  daysUntil,
  formatCurrency,
  formatDateShort,
  greeting,
  pct,
} from '@/lib/utils'
import { staggerContainer, fadeUp, popIn } from '@/lib/motion'

const noOrder: [] = []

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { wedding } = useWedding()

  const { items: guests } = useWeddingCollection<Guest>('guests', noOrder)
  const { items: vendors } = useWeddingCollection<Vendor>('vendors', noOrder)
  const { items: tasks } = useWeddingCollection<ChecklistTask>('tasks', [orderBy('order', 'asc')])
  const { items: budgetItems } = useWeddingCollection<BudgetItem>('budget', noOrder)
  const { items: gifts } = useWeddingCollection<GiftT>('gifts', noOrder)

  const stats = useMemo(() => {
    const invited = guests.reduce((s, g) => s + (g.count || 1), 0)
    const confirmed = guests
      .filter((g) => g.rsvp === 'yes')
      .reduce((s, g) => s + (g.count || 1), 0)
    const responded = guests.filter((g) => g.rsvp !== 'pending').length
    const rsvpPct = pct(responded, guests.length)

    const spent =
      vendors.reduce((s, v) => s + (v.paid || 0), 0) +
      budgetItems.reduce((s, b) => s + (b.paid || 0), 0)
    const budgetTotal = wedding?.budgetTotal || 0
    const budgetPct = pct(spent, budgetTotal)

    const doneTasks = tasks.filter((t) => t.done).length
    const tasksPct = pct(doneTasks, tasks.length)

    const bookedVendors = vendors.filter((v) => v.status === 'booked' || v.status === 'paid').length
    const vendorsPct = pct(bookedVendors, vendors.length)

    const giftsTotal = gifts.reduce((s, g) => s + (g.amount || 0), 0)

    return {
      invited,
      confirmed,
      rsvpPct,
      spent,
      budgetTotal,
      budgetPct,
      doneTasks,
      tasksTotal: tasks.length,
      tasksPct,
      bookedVendors,
      vendorsTotal: vendors.length,
      vendorsPct,
      giftsTotal,
    }
  }, [guests, vendors, tasks, budgetItems, gifts, wedding])

  const days = daysUntil(wedding?.date ?? null)

  const modules = [
    {
      to: '/guests',
      title: 'מוזמנים',
      ring: stats.rsvpPct,
      sub: `${stats.confirmed} אישרו · ${stats.invited} הוזמנו`,
      icon: Users,
      tone: 'from-teal-400 to-teal-600',
    },
    {
      to: '/budget',
      title: 'תקציב',
      ring: stats.budgetPct,
      sub: `${formatCurrency(stats.spent)} מתוך ${formatCurrency(stats.budgetTotal)}`,
      icon: Wallet,
      tone: 'from-coral-300 to-coral-500',
    },
    {
      to: '/tasks',
      title: 'משימות',
      ring: stats.tasksPct,
      sub: `${stats.doneTasks} מתוך ${stats.tasksTotal} הושלמו`,
      icon: ListChecks,
      tone: 'from-sun-300 to-sun-500',
    },
    {
      to: '/vendors',
      title: 'ספקים',
      ring: stats.vendorsPct,
      sub: `${stats.bookedVendors} ספקים נסגרו`,
      icon: Briefcase,
      tone: 'from-sky-300 to-teal-400',
    },
  ]

  const quickLinks = [
    { to: '/gifts', label: 'מתנות', icon: Gift, value: formatCurrency(stats.giftsTotal) },
    { to: '/schedule', label: 'לו״ז האירוע', icon: Clock },
    { to: '/inspiration', label: 'השראה', icon: Sparkles },
  ]

  return (
    <div className="px-5 pt-safe">
      {/* פס עליון */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-4"
      >
        <Link to="/settings" className="flex items-center gap-3">
          <Avatar src={user?.photoURL} name={user?.displayName} size={48} />
          <div>
            <p className="text-sm text-ink-soft">{greeting()},</p>
            <p className="-mt-0.5 text-lg font-bold text-ink">
              {user?.displayName?.split(' ')[0] ?? 'מתחתנים'} 👋
            </p>
          </div>
        </Link>
        <Link
          to="/more"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft"
        >
          <Bell className="h-5 w-5 text-ink-soft" />
        </Link>
      </motion.header>

      {/* כרטיס ספירה לאחור */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative mt-5 overflow-hidden rounded-4xl bg-gradient-to-br from-sun-300 via-sun-400 to-coral p-6 text-white shadow-glow"
      >
        <div className="absolute -end-8 -top-10 h-40 w-40 rounded-full bg-white/15" />
        <div className="absolute -bottom-12 -start-6 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-medium text-white/85">
            {wedding?.partner1} & {wedding?.partner2}
          </p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              {days !== null && days >= 0 ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <motion.span
                      key={days}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-display text-6xl font-bold leading-none"
                    >
                      {days}
                    </motion.span>
                    <span className="pb-1 text-xl font-semibold">ימים</span>
                  </div>
                  <p className="mt-1 text-sm text-white/85">{countdownLabel(wedding?.date ?? null)}</p>
                </>
              ) : (
                <p className="font-display text-3xl font-bold">
                  {countdownLabel(wedding?.date ?? null)}
                </p>
              )}
            </div>
            <ProgressRing value={stats.tasksPct} size={76} stroke={8}>
              <span className="text-lg font-extrabold">{stats.tasksPct}%</span>
            </ProgressRing>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm text-white/90">
            <span className="rounded-full bg-white/20 px-3 py-1 font-medium">
              {formatDateShort(wedding?.date ?? null)}
            </span>
            {wedding?.venue && (
              <span className="truncate rounded-full bg-white/20 px-3 py-1 font-medium">
                {wedding.venue}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* מודולים עם טבעות התקדמות */}
      <div className="mt-6 flex items-center justify-between px-1">
        <h2 className="text-xl font-extrabold text-ink">ההתקדמות שלכם</h2>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-3 grid grid-cols-2 gap-3"
      >
        {modules.map((m) => {
          const Icon = m.icon
          return (
            <Card
              key={m.to}
              interactive
              onClick={() => navigate(m.to)}
              className={`relative overflow-hidden bg-gradient-to-br ${m.tone} text-white`}
            >
              <div className="absolute -end-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                  <Icon className="h-5 w-5" />
                </div>
                <ProgressRing value={m.ring} size={52} stroke={6}>
                  <span className="text-xs font-bold">{m.ring}%</span>
                </ProgressRing>
              </div>
              <p className="relative mt-3 text-base font-bold">{m.title}</p>
              <p className="relative mt-0.5 text-xs text-white/85">{m.sub}</p>
            </Card>
          )
        })}
      </motion.div>

      {/* קישורים מהירים */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-4 grid grid-cols-3 gap-3"
      >
        {quickLinks.map((q) => {
          const Icon = q.icon
          return (
            <motion.button
              key={q.to}
              variants={popIn}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(q.to)}
              className="flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 text-teal-500">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-ink">{q.label}</span>
              {q.value && <span className="-mt-1 text-[11px] text-ink-faint">{q.value}</span>}
            </motion.button>
          )
        })}
      </motion.div>

      {/* משימות קרובות */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="mt-6">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xl font-extrabold text-ink">המשימות הבאות</h2>
          <Link to="/tasks" className="flex items-center text-sm font-semibold text-teal-600">
            הכל
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-2.5">
          {tasks.filter((t) => !t.done).slice(0, 3).map((t) => (
            <Card key={t.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun-100 text-sun-600">
                <ListChecks className="h-5 w-5" />
              </span>
              <p className="flex-1 font-semibold text-ink">{t.title}</p>
            </Card>
          ))}
          {tasks.filter((t) => !t.done).length === 0 && (
            <Card className="text-center text-sm text-ink-soft">סיימתם את כל המשימות! 🎉</Card>
          )}
        </div>
      </motion.div>
    </div>
  )
}
