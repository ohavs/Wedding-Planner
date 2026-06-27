import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** מיזוג קלאסים של Tailwind */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** עיצוב מטבע בשקלים */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

/** עיצוב מספר עם מפרידי אלפים */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('he-IL').format(value || 0)
}

const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]
const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/** תאריך מלא בעברית: "יום שלישי, 14 ביוני 2026" */
export function formatDateLong(iso: string | null): string {
  if (!iso) return 'טרם נקבע'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'טרם נקבע'
  return `יום ${HE_DAYS[d.getDay()]}, ${d.getDate()} ב${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** תאריך קצר: "14 ביוני 2026" */
export function formatDateShort(iso: string | null): string {
  if (!iso) return 'טרם נקבע'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'טרם נקבע'
  return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** מספר הימים שנותרו עד התאריך (יכול להיות שלילי) */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const target = new Date(iso)
  if (isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** פירוק ספירה לאחור לימים/שבועות */
export function countdownLabel(iso: string | null): string {
  const days = daysUntil(iso)
  if (days === null) return 'קבעו תאריך'
  if (days < 0) return `עברו ${Math.abs(days)} ימים`
  if (days === 0) return 'היום מתחתנים! 🎉'
  if (days === 1) return 'מחר הרגע הגדול!'
  return `עוד ${days} ימים`
}

/** אחוז בטוח (0-100) */
export function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)))
}

/** המרת תאריך ל-input מסוג date (yyyy-mm-dd) */
export function toDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

/** קיצור שם לאות ראשונה */
export function initials(name?: string | null): string {
  if (!name) return '🙂'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0)
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
}

/** ברכת שעה */
export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'לילה טוב'
  if (h < 12) return 'בוקר טוב'
  if (h < 17) return 'צהריים טובים'
  if (h < 21) return 'ערב טוב'
  return 'לילה טוב'
}
