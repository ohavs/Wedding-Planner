import type { Timestamp } from 'firebase/firestore'

export type MemberRole = 'owner' | 'editor'

export interface AppUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

/** מסמך החתונה הראשי */
export interface Wedding {
  id: string
  ownerId: string
  /** שמות בני הזוג */
  partner1: string
  partner2: string
  /** קישור בני הזוג לחשבונות משתמש (אופציונלי) */
  partner1Uid?: string
  partner2Uid?: string
  /** תאריך האירוע (ISO string לשמירה פשוטה) */
  date: string | null
  venue: string
  city: string
  /** מספר אורחים מתוכנן (יעד) */
  guestTarget: number
  /** תקציב כולל מתוכנן */
  budgetTotal: number
  /** הרשאות חברים: uid -> תפקיד */
  members: Record<string, MemberRole>
  /** מזהי חברים (לשאילתת array-contains) */
  memberIds: string[]
  /** אימיילים של חברים לצורך תצוגה */
  memberEmails: string[]
  /** הזמנות ממתינות לפי אימייל */
  pendingInvites: string[]
  /** קוד אישור שיש להזין כדי למחוק את החתונה (הגנה מפני מחיקה בטעות) */
  deleteCode?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type WeddingFormData = Omit<
  Wedding,
  | 'id'
  | 'ownerId'
  | 'members'
  | 'memberIds'
  | 'memberEmails'
  | 'pendingInvites'
  | 'createdAt'
  | 'updatedAt'
>

export type RsvpStatus = 'pending' | 'yes' | 'no' | 'maybe'
export type GuestSide = 'partner1' | 'partner2' | 'shared'
export type GuestKind = 'single' | 'family'

export interface Guest {
  id: string
  name: string
  /** סוג: מוזמן יחיד או משפחה */
  kind?: GuestKind
  /** שמות בני המשפחה (כאשר kind === 'family') */
  members?: string[]
  /** צד: של מי האורח */
  side: GuestSide
  /** קבוצה: משפחה, חברים, עבודה... */
  group: string
  /** כמות אנשים בהזמנה */
  count: number
  phone: string
  rsvp: RsvpStatus
  /** האם שובץ/הוזמן */
  notes: string
  createdAt?: Timestamp
}

export type VendorStatus = 'lead' | 'contacted' | 'booked' | 'paid'

export interface Vendor {
  id: string
  name: string
  /** קטגוריה (אולם, צלם, די.ג'יי...) */
  category: string
  phone: string
  price: number
  /** סכום ששולם בפועל */
  paid: number
  status: VendorStatus
  notes: string
  createdAt?: Timestamp
}

export interface BudgetItem {
  id: string
  title: string
  category: string
  /** עלות מתוכננת */
  estimated: number
  /** עלות בפועל */
  actual: number
  /** שולם */
  paid: number
  /** תאריך ההוצאה / תשלום */
  date?: string
  notes?: string
  createdAt?: Timestamp
}

export type TaskTiming = '12m' | '6m' | '3m' | '1m' | '1w' | 'day'

export interface ChecklistTask {
  id: string
  title: string
  /** שלב בזמן לפני החתונה */
  timing: TaskTiming
  done: boolean
  dueDate: string | null
  notes: string
  createdAt?: Timestamp
}

export type GiftType = 'cash' | 'transfer' | 'check' | 'gift'

export interface Gift {
  id: string
  /** שם הנותן */
  from: string
  amount: number
  type: GiftType
  /** שויך לאורח (אופציונלי) */
  notes: string
  createdAt?: Timestamp
}

export interface ScheduleEvent {
  id: string
  title: string
  /** שעה בפורמט HH:mm */
  time: string
  /** אחראי */
  responsible: string
  location: string
  notes: string
  createdAt?: Timestamp
}

/** בלוק מותאם אישית באולם - קישור או טקסט */
export interface VenueField {
  type: 'link' | 'text'
  label: string
  value: string
}

export interface VenueImage {
  url: string
  path: string
}

export interface Venue {
  id: string
  name: string
  /** קיבולת - כמות אנשים מקסימלית */
  capacity: number
  /** בלוקים דינמיים: קישורים / שדות מותאמים */
  fields: VenueField[]
  images: VenueImage[]
  notes: string
  createdAt?: Timestamp
}

export type InspirationCategory =
  | 'dress'
  | 'decor'
  | 'flowers'
  | 'invitations'
  | 'cake'
  | 'venue'
  | 'documents'
  | 'other'

export interface InspirationItem {
  id: string
  title: string
  category: InspirationCategory
  imageUrl: string
  /** נתיב הקובץ ב-Storage לצורך מחיקה */
  storagePath: string
  notes: string
  /** האם זה מסמך ולא תמונה */
  isDocument: boolean
  createdAt?: Timestamp
}
