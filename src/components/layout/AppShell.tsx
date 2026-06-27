import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { pageVariants } from '@/lib/motion'

/** מעטפת האפליקציה: אזור גלילה עם מעברי עמודים + ניווט תחתון */
export function AppShell() {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <div className="relative mx-auto min-h-[100dvh] w-full max-w-lg bg-cream">
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="pb-nav min-h-[100dvh]"
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}
