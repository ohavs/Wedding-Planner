import type { Variants, Transition } from 'framer-motion'

/** מעבר רך אחיד לכל האפליקציה */
export const spring: Transition = { type: 'spring', stiffness: 320, damping: 30 }
export const softSpring: Transition = { type: 'spring', stiffness: 220, damping: 26 }

/** כניסת עמוד */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

/** מיכל עם stagger לילדים */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

/** פריט שעולה מלמטה */
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
}

/** פריט שמתקרב (scale) */
export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

/** רשימה: פריט שמחליק מהצד */
export const slideItem: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: 24, height: 0, marginBottom: 0, transition: { duration: 0.2 } },
}

/** רקע מודאל */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

/** מגירה תחתונה (bottom sheet) */
export const sheetVariants: Variants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring', stiffness: 360, damping: 36 } },
  exit: { y: '100%', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
}

/** לחיצה על כפתור */
export const tapScale = { scale: 0.96 }
