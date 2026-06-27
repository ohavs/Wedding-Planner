import type {
  GiftType,
  GuestSide,
  InspirationCategory,
  RsvpStatus,
  TaskTiming,
  VendorStatus,
} from './types'

/** קטגוריות ספקים נפוצות לחתונה ישראלית */
export const VENDOR_CATEGORIES = [
  { id: 'venue', label: 'אולם / גן אירועים', emoji: '🏛️' },
  { id: 'catering', label: 'קייטרינג', emoji: '🍽️' },
  { id: 'photo', label: 'צילום סטילס', emoji: '📷' },
  { id: 'video', label: 'צילום וידאו', emoji: '🎥' },
  { id: 'music', label: 'די.ג׳יי / מוזיקה', emoji: '🎧' },
  { id: 'band', label: 'להקה / זמר', emoji: '🎤' },
  { id: 'dress', label: 'שמלת כלה', emoji: '👰' },
  { id: 'suit', label: 'חליפת חתן', emoji: '🤵' },
  { id: 'makeup', label: 'איפור ושיער', emoji: '💄' },
  { id: 'design', label: 'עיצוב ופרחים', emoji: '💐' },
  { id: 'rabbi', label: 'רב / עורך טקס', emoji: '📜' },
  { id: 'invitations', label: 'הזמנות', emoji: '✉️' },
  { id: 'transport', label: 'הסעות', emoji: '🚌' },
  { id: 'cake', label: 'עוגה וקינוחים', emoji: '🎂' },
  { id: 'gifts', label: 'מתנות לאורחים', emoji: '🎁' },
  { id: 'other', label: 'אחר', emoji: '✨' },
] as const

export function vendorCategory(id: string) {
  return VENDOR_CATEGORIES.find((c) => c.id === id) ?? VENDOR_CATEGORIES[VENDOR_CATEGORIES.length - 1]
}

export const VENDOR_STATUS: Record<VendorStatus, { label: string; tone: string }> = {
  lead: { label: 'ליד', tone: 'bg-sky-100 text-teal-700' },
  contacted: { label: 'יצרנו קשר', tone: 'bg-sun-100 text-sun-600' },
  booked: { label: 'נסגר', tone: 'bg-blush-100 text-coral-600' },
  paid: { label: 'שולם', tone: 'bg-teal-100 text-teal-700' },
}

export const RSVP_STATUS: Record<RsvpStatus, { label: string; tone: string; emoji: string }> = {
  pending: { label: 'ממתין', tone: 'bg-cream-200 text-ink-soft', emoji: '⏳' },
  yes: { label: 'מגיע', tone: 'bg-teal-100 text-teal-700', emoji: '✅' },
  no: { label: 'לא מגיע', tone: 'bg-coral-100 text-coral-600', emoji: '❌' },
  maybe: { label: 'אולי', tone: 'bg-sun-100 text-sun-600', emoji: '🤔' },
}

export const GUEST_SIDES: Record<GuestSide, string> = {
  partner1: 'צד ראשון',
  partner2: 'צד שני',
  shared: 'משותף',
}

export const GUEST_GROUPS = ['משפחה', 'חברים', 'עבודה', 'צבא', 'לימודים', 'שכנים', 'אחר']

export const TASK_TIMINGS: { id: TaskTiming; label: string; short: string }[] = [
  { id: '12m', label: '12 חודשים לפני', short: '12 ח׳' },
  { id: '6m', label: '6 חודשים לפני', short: '6 ח׳' },
  { id: '3m', label: '3 חודשים לפני', short: '3 ח׳' },
  { id: '1m', label: 'חודש לפני', short: 'חודש' },
  { id: '1w', label: 'שבוע לפני', short: 'שבוע' },
  { id: 'day', label: 'יום האירוע', short: 'היום' },
]

export function taskTiming(id: TaskTiming) {
  return TASK_TIMINGS.find((t) => t.id === id) ?? TASK_TIMINGS[0]
}

export const GIFT_TYPES: Record<GiftType, { label: string; emoji: string }> = {
  cash: { label: 'מזומן', emoji: '💵' },
  transfer: { label: 'העברה', emoji: '🏦' },
  check: { label: 'צ׳ק', emoji: '🧾' },
  gift: { label: 'מתנה', emoji: '🎁' },
}

export const INSPIRATION_CATEGORIES: Record<InspirationCategory, { label: string; emoji: string }> = {
  dress: { label: 'שמלה ולבוש', emoji: '👗' },
  decor: { label: 'עיצוב', emoji: '🪞' },
  flowers: { label: 'פרחים', emoji: '🌸' },
  invitations: { label: 'הזמנות', emoji: '✉️' },
  cake: { label: 'עוגה', emoji: '🎂' },
  venue: { label: 'מקום', emoji: '🏞️' },
  documents: { label: 'מסמכים', emoji: '📄' },
  other: { label: 'אחר', emoji: '✨' },
}

/** משימות ברירת מחדל שנוצרות עם פתיחת חתונה חדשה */
export const DEFAULT_TASKS: { title: string; timing: TaskTiming }[] = [
  { title: 'לסגור תאריך ואולם', timing: '12m' },
  { title: 'להגדיר תקציב כולל', timing: '12m' },
  { title: 'לבחור צלם סטילs ווידאו', timing: '6m' },
  { title: 'להזמין די.ג׳יי / להקה', timing: '6m' },
  { title: 'לבחור שמלת כלה וחליפת חתן', timing: '6m' },
  { title: 'לסגור קייטרינג / תפריט', timing: '3m' },
  { title: 'להזמין הזמנות ולשלוח לאורחים', timing: '3m' },
  { title: 'לסגור איפור ושיער', timing: '3m' },
  { title: 'לבנות רשימת מוזמנים סופית', timing: '1m' },
  { title: 'לאסוף אישורי הגעה', timing: '1w' },
  { title: 'להעביר סופית מספרים לאולם', timing: '1w' },
  { title: 'לארוז ולהתרגש 💍', timing: 'day' },
]
