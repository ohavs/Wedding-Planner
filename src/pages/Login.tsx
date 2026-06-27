import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
    />
  </svg>
)

export default function Login() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error(e)
      toast.error('ההתחברות נכשלה, נסו שוב')
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-cream">
      {/* רקע דקורטיבי */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -end-16 -top-16 h-64 w-64 rounded-full bg-sun-200/50 blur-2xl" />
        <div className="absolute -start-20 top-40 h-56 w-56 rounded-full bg-blush-200/50 blur-2xl" />
        <div className="absolute bottom-10 end-0 h-52 w-52 rounded-full bg-sky-200/40 blur-2xl" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-7 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="mb-7 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-sun-300 via-sun-400 to-coral text-6xl shadow-glow"
        >
          <motion.span
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            💍
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-2 text-4xl font-extrabold leading-tight text-ink"
        >
          החתונה שלנו
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-1 text-lg font-semibold text-teal-600"
        >
          כל התכנון במקום אחד 💛
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mb-10 max-w-xs text-ink-soft"
        >
          מוזמנים, תקציב, ספקים, משימות ואישורי הגעה — בצורה פשוטה, יחד עם בן/בת הזוג.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="w-full max-w-sm"
        >
          <Button
            onClick={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
            variant="secondary"
            icon={<GoogleIcon />}
            className="h-16 text-base"
          >
            התחברות עם Google
          </Button>
          <p className="mt-5 text-xs text-ink-faint">
            בהתחברות אתם מאשרים את תנאי השימוש ומדיניות הפרטיות
          </p>
        </motion.div>
      </div>
    </div>
  )
}
