import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'

/** מחוון מצב לא-מקוון - מודיע שהשינויים נשמרים מקומית ויסונכרנו */
export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-teal-700 px-4 pb-1.5 pt-[calc(0.375rem+var(--safe-top))] text-center text-xs font-semibold text-white shadow-float"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          אין חיבור — השינויים נשמרים ויסונכרנו אוטומטית
        </motion.div>
      )}
    </AnimatePresence>
  )
}
