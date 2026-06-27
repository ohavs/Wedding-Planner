import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { collection, documentId, getDocs, query, where } from 'firebase/firestore'
import {
  Pencil,
  UserPlus,
  X,
  Crown,
  LogOut,
  Trash2,
  Check,
  Mail,
  CalendarHeart,
  ChevronLeft,
  KeyRound,
} from 'lucide-react'
import { db } from '@/firebase/config'
import { useAuth } from '@/context/AuthContext'
import { useWedding } from '@/context/WeddingContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DateField } from '@/components/ui/DateField'
import { Field } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn, formatCurrency, formatDateShort } from '@/lib/utils'
import { staggerContainer, fadeUp } from '@/lib/motion'

interface MemberProfile {
  uid: string
  displayName?: string
  email?: string
  photoURL?: string
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const {
    wedding,
    role,
    weddings,
    setActiveWedding,
    updateWedding,
    inviteMember,
    cancelInvite,
    removeMember,
    leaveWedding,
    deleteWedding,
  } = useWedding()

  const [editOpen, setEditOpen] = useState(false)
  const [profiles, setProfiles] = useState<MemberProfile[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [confirm, setConfirm] = useState<null | 'leave'>(null)
  const [codeOpen, setCodeOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)

  const isOwner = role === 'owner'

  // טעינת פרופילי החברים
  useEffect(() => {
    const ids = wedding?.memberIds ?? []
    if (ids.length === 0 || !db) {
      setProfiles([])
      return
    }
    const run = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'users'), where(documentId(), 'in', ids.slice(0, 30))),
        )
        setProfiles(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as object) })) as MemberProfile[])
      } catch (e) {
        console.warn('failed to load members', e)
      }
    }
    run()
  }, [wedding?.memberIds])

  if (!wedding) return null

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase()
    if (!emailRe.test(email)) {
      toast.error('כתובת אימייל לא תקינה')
      return
    }
    if (wedding.memberEmails?.includes(email)) {
      toast.error('המשתמש כבר חבר')
      return
    }
    setInviting(true)
    try {
      await inviteMember(email)
      setInviteEmail('')
      toast.success('ההזמנה נשלחה 💌')
    } catch {
      toast.error('שליחת ההזמנה נכשלה')
    } finally {
      setInviting(false)
    }
  }

  // שיוך חבר כבן/בת הזוג (מתחתן 1 / מתחתן 2)
  const assignPartner = async (p: MemberProfile, slot: 1 | 2) => {
    if (slot === 1) {
      if (wedding.partner1Uid === p.uid) await updateWedding({ partner1Uid: '' })
      else
        await updateWedding({
          partner1Uid: p.uid,
          partner1: p.displayName ?? wedding.partner1,
          ...(wedding.partner2Uid === p.uid ? { partner2Uid: '' } : {}),
        })
    } else {
      if (wedding.partner2Uid === p.uid) await updateWedding({ partner2Uid: '' })
      else
        await updateWedding({
          partner2Uid: p.uid,
          partner2: p.displayName ?? wedding.partner2,
          ...(wedding.partner1Uid === p.uid ? { partner1Uid: '' } : {}),
        })
    }
    toast.success('עודכן')
  }

  return (
    <div>
      <PageHeader title="ניהול החתונה" subtitle="פרטים, שיתוף והגדרות" />

      <div className="space-y-6 px-5 pb-4">
        {/* פרטי החתונה */}
        <motion.section variants={fadeUp} initial="initial" animate="animate">
          <Card animate={false} className="relative overflow-hidden">
            <div className="absolute -end-6 -top-10 h-28 w-28 rounded-full bg-cream-100" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm text-ink-soft">פרטי האירוע</p>
                <h2 className="mt-0.5 text-xl font-extrabold text-ink">
                  {wedding.partner1} & {wedding.partner2}
                </h2>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-100 text-teal-600"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-3 text-sm">
              <Detail icon={<CalendarHeart className="h-4 w-4" />} label="תאריך" value={formatDateShort(wedding.date)} />
              <Detail icon="📍" label="מקום" value={wedding.venue || wedding.city || '—'} />
              <Detail icon="👥" label="יעד מוזמנים" value={wedding.guestTarget ? String(wedding.guestTarget) : '—'} />
              <Detail icon="💰" label="תקציב" value={wedding.budgetTotal ? formatCurrency(wedding.budgetTotal) : '—'} />
            </div>
          </Card>
        </motion.section>

        {/* החלפת חתונה */}
        {weddings.length > 1 && (
          <section>
            <h3 className="mb-2 px-1 text-sm font-bold text-ink-soft">החתונות שלי</h3>
            <div className="space-y-2">
              {weddings.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setActiveWedding(w.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition-colors',
                    w.id === wedding.id ? 'border-teal-300 bg-teal-50' : 'border-cream-200 bg-white',
                  )}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blush-100 text-xl">💍</span>
                  <span className="flex-1 font-semibold text-ink">
                    {w.partner1} & {w.partner2}
                  </span>
                  {w.id === wedding.id && <Check className="h-5 w-5 text-teal-500" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* שיתוף ועריכה משותפת */}
        <section>
          <h3 className="mb-2 px-1 text-sm font-bold text-ink-soft">שותפים לעריכה</h3>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-2"
          >
            {profiles.map((p) => {
              const memberRole = wedding.members?.[p.uid]
              return (
                <motion.div
                  key={p.uid}
                  variants={fadeUp}
                  className="flex flex-col gap-2.5 rounded-2xl bg-white p-3 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={p.photoURL} name={p.displayName} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        {p.displayName ?? p.email}
                        {p.uid === user?.uid && ' (אני)'}
                      </p>
                      <p className="truncate text-xs text-ink-soft">{p.email}</p>
                    </div>
                    {memberRole === 'owner' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-2.5 py-1 text-xs font-bold text-sun-600">
                        <Crown className="h-3.5 w-3.5" /> בעלים
                      </span>
                    ) : isOwner ? (
                      <button
                        onClick={() => removeMember(p.uid, p.email ?? '').then(() => toast('הוסר'))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-50 text-coral-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-ink-soft">
                        עורך
                      </span>
                    )}
                  </div>

                  {/* שיוך כבן/בת הזוג */}
                  {isOwner ? (
                    <div className="flex gap-2">
                      {([1, 2] as const).map((slot) => {
                        const active =
                          slot === 1
                            ? wedding.partner1Uid === p.uid
                            : wedding.partner2Uid === p.uid
                        return (
                          <button
                            key={slot}
                            onClick={() => assignPartner(p, slot)}
                            className={cn(
                              'flex-1 rounded-xl px-2 py-2 text-xs font-bold transition-colors',
                              active ? 'bg-teal-500 text-white' : 'bg-cream-100 text-ink-soft',
                            )}
                          >
                            💍 {slot === 1 ? 'מתחתן/ת 1' : 'מתחתן/ת 2'}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    (wedding.partner1Uid === p.uid || wedding.partner2Uid === p.uid) && (
                      <span className="self-start rounded-full bg-blush-100 px-2.5 py-1 text-xs font-bold text-coral-600">
                        💍 {wedding.partner1Uid === p.uid ? 'מתחתן/ת 1' : 'מתחתן/ת 2'}
                      </span>
                    )
                  )}
                </motion.div>
              )
            })}

            {/* הזמנות ממתינות */}
            {wedding.pendingInvites?.map((email) => (
              <motion.div
                key={email}
                variants={fadeUp}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-cream-200 bg-cream-50 p-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-200 text-ink-soft">
                  <Mail className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{email}</p>
                  <p className="text-xs text-ink-faint">ממתין לאישור</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => cancelInvite(email).then(() => toast('ההזמנה בוטלה'))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-50 text-coral-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* הזמנה חדשה */}
          {isOwner && (
            <div className="mt-3 flex gap-2">
              <Input
                icon={<Mail className="h-5 w-5" />}
                type="email"
                inputMode="email"
                dir="auto"
                placeholder="הזמנת שותף לפי אימייל"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleInvite} loading={inviting} className="h-14 px-4" icon={<UserPlus className="h-5 w-5" />}>
                הזמנה
              </Button>
            </div>
          )}
          <p className="mt-2 px-1 text-xs text-ink-faint">
            השותף יתחבר עם Google באותה כתובת אימייל ויקבל גישת עריכה מלאה.
          </p>
        </section>

        {/* אזור מסוכן */}
        <section className="space-y-2.5">
          {!isOwner && (
            <button
              onClick={() => setConfirm('leave')}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-white p-3.5 font-bold text-ink-soft shadow-card"
            >
              <LogOut className="h-5 w-5" />
              יציאה מהחתונה המשותפת
            </button>
          )}
          {isOwner && (
            <>
              <button
                onClick={() => setCodeOpen(true)}
                className="flex w-full items-center justify-between gap-2 rounded-3xl bg-white p-3.5 shadow-card"
              >
                <span className="flex items-center gap-2 font-bold text-ink">
                  <KeyRound className="h-5 w-5 text-ink-soft" />
                  קוד מחיקה
                </span>
                <span className="text-xs font-semibold text-ink-faint">
                  {wedding.deleteCode ? 'מוגדר ✓' : 'לא הוגדר'}
                </span>
              </button>
              <button
                onClick={() => setDelOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-3xl bg-coral-50 p-3.5 font-bold text-coral-600"
              >
                <Trash2 className="h-5 w-5" />
                מחיקת החתונה לצמיתות
              </button>
            </>
          )}
          <button
            onClick={() => signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-white p-3.5 font-bold text-ink-soft shadow-card"
          >
            <ChevronLeft className="h-5 w-5" />
            התנתקות מהחשבון
          </button>
        </section>
      </div>

      <EditWeddingSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={wedding}
        onSave={async (data) => {
          await updateWedding(data)
          setEditOpen(false)
          toast.success('הפרטים עודכנו')
        }}
      />

      <ConfirmDialog
        open={confirm === 'leave'}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          leaveWedding().then(() => {
            toast('יצאת מהחתונה')
            navigate('/')
          })
        }
        emoji="👋"
        title="לצאת מהחתונה?"
        description="לא תהיה לך יותר גישה לתכנון המשותף הזה."
        confirmLabel="יציאה"
        danger
      />
      <SetDeleteCodeSheet
        open={codeOpen}
        current={wedding.deleteCode ?? ''}
        onClose={() => setCodeOpen(false)}
        onSave={async (code) => {
          await updateWedding({ deleteCode: code })
          setCodeOpen(false)
          toast.success(code ? 'קוד המחיקה נשמר' : 'קוד המחיקה הוסר')
        }}
      />

      <DeleteWeddingSheet
        open={delOpen}
        code={wedding.deleteCode ?? ''}
        onClose={() => setDelOpen(false)}
        onSetCode={() => {
          setDelOpen(false)
          setCodeOpen(true)
        }}
        onDelete={() =>
          deleteWedding().then(() => {
            toast('החתונה נמחקה')
            navigate('/')
          })
        }
      />
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream-50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-ink-soft">
        <span>{icon}</span>
        {label}
      </p>
      <p className="mt-0.5 truncate font-bold text-ink">{value}</p>
    </div>
  )
}

function EditWeddingSheet({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean
  onClose: () => void
  initial: {
    partner1: string
    partner2: string
    date: string | null
    venue: string
    city: string
    guestTarget: number
    budgetTotal: number
  }
  onSave: (data: {
    partner1: string
    partner2: string
    date: string | null
    venue: string
    city: string
    guestTarget: number
    budgetTotal: number
  }) => Promise<void>
}) {
  const [partner1, setPartner1] = useState('')
  const [partner2, setPartner2] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('')
  const [guestTarget, setGuestTarget] = useState('')
  const [budgetTotal, setBudgetTotal] = useState('')
  const [saving, setSaving] = useState(false)
  const baseline = useRef('')

  useEffect(() => {
    if (open) {
      const init = {
        partner1: initial.partner1,
        partner2: initial.partner2,
        date: initial.date ?? '',
        venue: initial.venue,
        city: initial.city,
        guestTarget: initial.guestTarget ? String(initial.guestTarget) : '',
        budgetTotal: initial.budgetTotal ? String(initial.budgetTotal) : '',
      }
      setPartner1(init.partner1)
      setPartner2(init.partner2)
      setDate(init.date)
      setVenue(init.venue)
      setCity(init.city)
      setGuestTarget(init.guestTarget)
      setBudgetTotal(init.budgetTotal)
      baseline.current = JSON.stringify(init)
    }
  }, [open, initial])

  const dirty =
    JSON.stringify({ partner1, partner2, date, venue, city, guestTarget, budgetTotal }) !==
    baseline.current

  const submit = async () => {
    setSaving(true)
    await onSave({
      partner1: partner1.trim(),
      partner2: partner2.trim(),
      date: date || null,
      venue: venue.trim(),
      city: city.trim(),
      guestTarget: Number(guestTarget) || 0,
      budgetTotal: Number(budgetTotal) || 0,
    })
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title="עריכת פרטי החתונה">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="בן/בת זוג 1">
            <Input value={partner1} onChange={(e) => setPartner1(e.target.value)} />
          </Field>
          <Field label="בן/בת זוג 2">
            <Input value={partner2} onChange={(e) => setPartner2(e.target.value)} />
          </Field>
        </div>
        <Field label="תאריך החתונה">
          <DateField value={date} onChange={setDate} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="אולם / מקום">
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
          </Field>
          <Field label="עיר">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="יעד מוזמנים">
            <Input type="number" inputMode="numeric" value={guestTarget} onChange={(e) => setGuestTarget(e.target.value)} />
          </Field>
          <Field label="תקציב (₪)">
            <Input type="number" inputMode="numeric" value={budgetTotal} onChange={(e) => setBudgetTotal(e.target.value)} />
          </Field>
        </div>
        <Button size="lg" fullWidth loading={saving} onClick={submit}>
          שמירת שינויים
        </Button>
      </div>
    </BottomSheet>
  )
}

function SetDeleteCodeSheet({
  open,
  current,
  onClose,
  onSave,
}: {
  open: boolean
  current: string
  onClose: () => void
  onSave: (code: string) => Promise<void>
}) {
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setCode(current)
  }, [open, current])

  const dirty = code !== current

  const submit = async () => {
    setSaving(true)
    await onSave(code.trim())
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title="קוד מחיקה">
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-cream-100 text-3xl">
            🔐
          </div>
          <p className="text-sm text-ink-soft">
            בחרו קוד שיידרש כדי למחוק את החתונה לצמיתות — כך מונעים מחיקה בטעות.
          </p>
        </div>
        <Field label="קוד מחיקה" hint="השאירו ריק כדי לבטל את הדרישה לקוד">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="לדוגמה: שלנו2026"
            autoComplete="off"
          />
        </Field>
        <Button size="lg" fullWidth loading={saving} onClick={submit} icon={<KeyRound className="h-5 w-5" />}>
          שמירת הקוד
        </Button>
      </div>
    </BottomSheet>
  )
}

function DeleteWeddingSheet({
  open,
  code,
  onClose,
  onSetCode,
  onDelete,
}: {
  open: boolean
  code: string
  onClose: () => void
  onSetCode: () => void
  onDelete: () => Promise<void>
}) {
  const [val, setVal] = useState('')
  const [busy, setBusy] = useState(false)
  const hasCode = code.trim().length > 0

  useEffect(() => {
    if (open) setVal('')
  }, [open])

  const submit = async () => {
    if (val.trim() !== code.trim()) {
      toast.error('הקוד שגוי')
      return
    }
    setBusy(true)
    await onDelete()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="מחיקת החתונה">
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-coral-100 text-3xl">
            🗑️
          </div>
          <p className="text-sm text-ink-soft">
            כל המוזמנים, התקציב, הספקים והנתונים יימחקו לצמיתות. לא ניתן לשחזר.
          </p>
        </div>

        {hasCode ? (
          <>
            <Field label="הזינו את קוד המחיקה לאישור">
              <Input
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="קוד מחיקה"
                autoComplete="off"
              />
            </Field>
            <Button
              size="lg"
              fullWidth
              loading={busy}
              onClick={submit}
              className="bg-coral-500 active:bg-coral-600"
              icon={<Trash2 className="h-5 w-5" />}
            >
              מחיקה לצמיתות
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-sun-50 p-3.5 text-center text-sm font-medium text-ink-soft">
              כדי למחוק את החתונה צריך קודם להגדיר קוד מחיקה.
            </div>
            <Button
              size="lg"
              fullWidth
              variant="secondary"
              onClick={onSetCode}
              icon={<KeyRound className="h-5 w-5" />}
            >
              הגדרת קוד מחיקה
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
