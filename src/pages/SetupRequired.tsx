import { motion } from 'framer-motion'

/** מוצג כאשר משתני הסביבה של Firebase לא הוגדרו עדיין */
export default function SetupRequired() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col items-center justify-center px-7 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-4xl bg-gradient-to-br from-sun-300 to-coral text-5xl shadow-glow"
      >
        🔧
      </motion.div>
      <h1 className="mb-2 text-2xl font-extrabold text-ink">כמעט מוכן!</h1>
      <p className="mb-6 text-ink-soft">
        כדי להפעיל את האפליקציה צריך לחבר אותה לפרויקט Firebase. זה לוקח כ-5 דקות.
      </p>
      <div className="surface w-full p-5 text-start text-sm leading-relaxed text-ink-soft">
        <ol className="list-inside list-decimal space-y-2">
          <li>
            צרו פרויקט ב-
            <span className="font-semibold text-teal-600"> console.firebase.google.com</span>
          </li>
          <li>הפעילו Authentication → Google, ו-Firestore + Storage</li>
          <li>
            העתיקו את קובץ <code className="rounded bg-cream-200 px-1">.env.example</code> ל-
            <code className="rounded bg-cream-200 px-1">.env</code> ומלאו את המפתחות
          </li>
          <li>הריצו מחדש את האפליקציה</li>
        </ol>
        <p className="mt-4 text-xs text-ink-faint">
          המדריך המלא נמצא בקובץ <span className="font-semibold">README.md</span>
        </p>
      </div>
    </div>
  )
}
