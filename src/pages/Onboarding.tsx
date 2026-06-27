import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useWedding } from '@/context/WeddingContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { staggerContainer, fadeUp } from '@/lib/motion'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { createWedding, invites, acceptInvite, declineInvite } = useWedding()

  const firstName = user?.displayName?.split(' ')[0] ?? ''
  const [partner1, setPartner1] = useState(firstName)
  const [partner2, setPartner2] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('')
  const [guestTarget, setGuestTarget] = useState('')
  const [budgetTotal, setBudgetTotal] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partner1.trim() || !partner2.trim()) {
      toast.error('נשמח לדעת את שמות בני הזוג 💛')
      return
    }
    setSaving(true)
    try {
      await createWedding({
        partner1: partner1.trim(),
        partner2: partner2.trim(),
        date: date || null,
        venue: venue.trim(),
        city: city.trim(),
        guestTarget: Number(guestTarget) || 0,
        budgetTotal: Number(budgetTotal) || 0,
      })
      toast.success('מזל טוב! החתונה נוצרה 🎉')
      navigate('/')
    } catch (err) {
      console.error(err)
      toast.error('משהו השתבש, נסו שוב')
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-lg px-5 pb-10 pt-safe">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
        <p className="text-ink-soft">היי {firstName} 👋</p>
        <h1 className="text-3xl font-extrabold text-ink">בואו נתחיל לתכנן</h1>
      </motion.div>

      {/* הזמנות ממתינות */}
      {invites.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mt-6 space-y-3"
        >
          <p className="px-1 text-sm font-semibold text-ink-soft">הוזמנת לתכנן יחד 💌</p>
          {invites.map((inv) => (
            <Card key={inv.id} className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blush-100 text-2xl">
                💍
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">
                  {inv.partner1} & {inv.partner2}
                </p>
                <p className="text-xs text-ink-soft">הזמנה לעריכה משותפת</p>
              </div>
              <button
                onClick={() => declineInvite(inv.id).then(() => toast('ההזמנה נדחתה'))}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-100 text-coral-600"
                aria-label="דחייה"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  acceptInvite(inv.id).then(() => {
                    toast.success('הצטרפת! 🎉')
                    navigate('/')
                  })
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white"
                aria-label="אישור"
              >
                <Check className="h-5 w-5" />
              </button>
            </Card>
          ))}
          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-cream-200" />
            <span className="text-xs text-ink-faint">או צרו חתונה חדשה</span>
            <div className="h-px flex-1 bg-cream-200" />
          </div>
        </motion.div>
      )}

      <motion.form
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <Field label="בן/בת זוג 1">
            <Input value={partner1} onChange={(e) => setPartner1(e.target.value)} placeholder="ישראל" />
          </Field>
          <Field label="בן/בת זוג 2">
            <Input value={partner2} onChange={(e) => setPartner2(e.target.value)} placeholder="ישראלה" />
          </Field>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Field label="תאריך החתונה" hint="אפשר לעדכן בהמשך">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <Field label="אולם / מקום">
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="גן האירועים" />
          </Field>
          <Field label="עיר">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="תל אביב" />
          </Field>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <Field label="יעד מוזמנים">
            <Input
              type="number"
              inputMode="numeric"
              value={guestTarget}
              onChange={(e) => setGuestTarget(e.target.value)}
              placeholder="300"
            />
          </Field>
          <Field label="תקציב (₪)">
            <Input
              type="number"
              inputMode="numeric"
              value={budgetTotal}
              onChange={(e) => setBudgetTotal(e.target.value)}
              placeholder="120000"
            />
          </Field>
        </motion.div>

        <motion.div variants={fadeUp} className="pt-2">
          <Button type="submit" size="lg" fullWidth loading={saving}>
            יוצרים את החתונה 🎊
          </Button>
        </motion.div>
      </motion.form>

      <button
        onClick={() => signOut()}
        className="mt-6 w-full py-2 text-center text-sm text-ink-faint"
      >
        התנתקות
      </button>
    </div>
  )
}
