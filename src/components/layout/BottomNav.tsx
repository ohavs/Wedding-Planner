import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Users, Wallet, ListChecks, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'בית', icon: Home, end: true },
  { to: '/guests', label: 'מוזמנים', icon: Users, end: false },
  { to: '/budget', label: 'הוצאות', icon: Wallet, end: false },
  { to: '/tasks', label: 'משימות', icon: ListChecks, end: false },
  { to: '/more', label: 'עוד', icon: LayoutGrid, end: false },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[var(--safe-bottom)]">
      <div className="mx-3 mb-3 flex w-full max-w-lg items-stretch justify-around rounded-3xl border border-cream-200/70 bg-surface/85 px-2 py-2 shadow-float backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-1 flex-col items-center gap-1 py-1.5"
            >
              <span className="relative flex h-7 w-12 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-2xl bg-teal-50"
                  />
                )}
                <Icon
                  className={cn(
                    'relative h-[22px] w-[22px] transition-colors',
                    active ? 'text-teal-500' : 'text-ink-faint',
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold transition-colors',
                  active ? 'text-teal-600' : 'text-ink-faint',
                )}
              >
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
