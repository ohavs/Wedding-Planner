import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { FullScreenLoader } from '@/components/ui/Spinner'

/**
 * מעטפת האפליקציה: אזור גלילה + ניווט תחתון.
 * כל ניווט מרנדר מחדש את התוכן עם אנימציית כניסה פשוטה (ללא AnimatePresence)
 * כדי למנוע היתקעות של מעברים (מסך ריק).
 */
export function AppShell() {
  const location = useLocation()

  return (
    <div className="relative mx-auto min-h-[100dvh] w-full max-w-lg bg-cream">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="pb-nav min-h-[100dvh]"
      >
        <Suspense fallback={<FullScreenLoader />}>
          <Outlet />
        </Suspense>
      </motion.main>
      <BottomNav />
    </div>
  )
}
