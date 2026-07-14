import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Pencil, Wallet, PieChart } from 'lucide-react'
import { useWedding } from '@/context/WeddingContext'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { BudgetItem, Vendor } from '@/lib/types'
import { vendorCategory } from '@/lib/constants'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { DateField } from '@/components/ui/DateField'
import { IconButton } from '@/components/ui/IconButton'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn, formatCurrency, formatDateShort, pct } from '@/lib/utils'
import { staggerContainer, slideItem } from '@/lib/motion'

const noOrder: [] = []
type Editing = Partial<BudgetItem> | null

const barColors = [
  'bg-teal-500',
  'bg-coral-400',
  'bg-sun-400',
  'bg-sky-300',
  'bg-blush-300',
  'bg-teal-300',
]

function payStatus(b: BudgetItem) {
  const cost = b.actual || 0
  const paid = b.paid || 0
  if (cost > 0 && paid >= cost) return { label: 'שולם', tone: 'bg-teal-100 text-teal-700' }
  if (paid > 0) return { label: 'שולם חלקית', tone: 'bg-sun-100 text-sun-600' }
  return { label: 'לא שולם', tone: 'bg-cream-200 text-ink-soft' }
}

export default function Budget() {
  const { wedding, updateWedding } = useWedding()
  const { items, add, update, remove } = useWeddingCollection<BudgetItem>('budget')
  const { items: vendors } = useWeddingCollection<Vendor>('vendors', noOrder)
  const [editing, setEditing] = useState<Editing>(null)
  const [editTotal, setEditTotal] = useState(false)

  const sums = useMemo(() => {
    const itemsCost = items.reduce((s, b) => s + (b.actual || 0), 0)
    const itemsPaid = items.reduce((s, b) => s + (b.paid || 0), 0)
    const vendorsCost = vendors.reduce((s, v) => s + (v.price || 0), 0)
    const vendorsPaid = vendors.reduce((s, v) => s + (v.paid || 0), 0)
    const total = wedding?.budgetTotal || 0
    const cost = itemsCost + vendorsCost
    const paid = itemsPaid + vendorsPaid
    return { total, cost, paid, remainingToPay: cost - paid }
  }, [items, vendors, wedding])

  // פילוח לפי קטגוריה (הוצאות ידניות + ספקים)
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((b) => {
      const c = (b.category || '').trim() || 'אחר'
      map.set(c, (map.get(c) || 0) + (b.actual || 0))
    })
    vendors.forEach((v) => {
      const c = vendorCategory(v.category).label
      map.set(c, (map.get(c) || 0) + (v.price || 0))
    })
    const arr = [...map.entries()]
      .map(([cat, sum]) => ({ cat, sum }))
      .filter((x) => x.sum > 0)
      .sort((a, b) => b.sum - a.sum)
    const max = arr.reduce((m, x) => Math.max(m, x.sum), 0)
    return { arr, max }
  }, [items, vendors])

  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [items],
  )

  return (
    <div>
      <PageHeader title="הוצאות" subtitle="מעקב תקציב מפורט" />

      <div className="px-5">
        {/* כרטיס סקירה */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-teal-400 to-teal-600 p-6 text-white shadow-float"
        >
          <div className="absolute -end-6 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">תקציב מתוכנן</p>
              <p className="mt-1 font-display text-4xl font-bold">{formatCurrency(sums.total)}</p>
            </div>
            <IconButton variant="glass" className="bg-white/20 text-white" onClick={() => setEditTotal(true)}>
              <Pencil className="h-5 w-5" />
            </IconButton>
          </div>
          <div className="relative mt-5">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-white/85">שולם {formatCurrency(sums.paid)}</span>
              <span className="font-semibold">{pct(sums.paid, sums.total)}%</span>
            </div>
            <ProgressBar value={pct(sums.paid, sums.total)} barClassName="bg-white" className="bg-white/25" />
          </div>
        </motion.div>

        {/* סטטיסטיקות */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mt-3 grid grid-cols-3 gap-3"
        >
          <StatTile label="סה״כ הוצאות" value={formatCurrency(sums.cost)} tone="coral" />
          <StatTile label="שולם" value={formatCurrency(sums.paid)} tone="sun" />
          <StatTile
            label="נותר לתשלום"
            value={formatCurrency(sums.remainingToPay)}
            tone={sums.remainingToPay > 0 ? 'plain' : 'sky'}
          />
        </motion.div>
        <p className="mt-2 px-1 text-xs text-ink-faint">* כולל את עלויות הספקים מהמודול "ספקים"</p>

        {/* פילוח לפי קטגוריה */}
        {byCategory.arr.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-3xl bg-white p-4 shadow-card"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cream-100 text-teal-600">
                <PieChart className="h-4 w-4" />
              </span>
              <h2 className="font-extrabold text-ink">לאן הולך הכסף</h2>
            </div>
            <div className="space-y-3">
              {byCategory.arr.slice(0, 8).map((c, i) => (
                <div key={c.cat}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{c.cat}</span>
                    <span className="font-bold text-ink">{formatCurrency(c.sum)}</span>
                  </div>
                  <ProgressBar
                    value={pct(c.sum, byCategory.max)}
                    barClassName={barColors[i % barColors.length]}
                    height="h-2"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* רשימת הוצאות */}
        <div className="mt-5">
          <h2 className="mb-3 px-1 text-lg font-extrabold text-ink">ההוצאות שלי</h2>
          {items.length === 0 ? (
            <EmptyState
              emoji="🧾"
              title="אין הוצאות עדיין"
              description="הוסיפו הוצאות כמו טבעות, ירח דבש, שמלה ועוד — ועקבו אחרי התשלומים"
              action={<Button onClick={() => setEditing({})}>הוספת הוצאה</Button>}
            />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-2.5"
            >
              <AnimatePresence initial={false}>
                {sorted.map((b) => {
                  const st = payStatus(b)
                  return (
                    <motion.button
                      key={b.id}
                      variants={slideItem}
                      exit="exit"
                      layout
                      onClick={() => setEditing(b)}
                      className="block w-full rounded-3xl bg-white p-4 text-start shadow-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink">{b.title}</p>
                          <p className="truncate text-xs text-ink-soft">
                            {[b.category, b.date && formatDateShort(b.date)].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <div className="shrink-0 text-end">
                          <p className="font-bold text-ink">{formatCurrency(b.actual)}</p>
                          <span className={cn('mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold', st.tone)}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                      {b.actual > 0 && b.paid > 0 && b.paid < b.actual && (
                        <ProgressBar value={pct(b.paid, b.actual)} height="h-1.5" className="mt-2.5" />
                      )}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <Fab onClick={() => setEditing({})} aria-label="הוצאה חדשה" />

      <EditTotalSheet
        open={editTotal}
        current={sums.total}
        onClose={() => setEditTotal(false)}
        onSave={async (v) => {
          await updateWedding({ budgetTotal: v })
          setEditTotal(false)
          toast.success('התקציב עודכן')
        }}
      />

      <ExpenseSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<BudgetItem, 'id' | 'createdAt'>)
            toast.success('ההוצאה נוספה')
          }
          setEditing(null)
        }}
        onDelete={async (id) => {
          await remove(id)
          toast('נמחק')
          setEditing(null)
        }}
      />
    </div>
  )
}

function EditTotalSheet({
  open,
  current,
  onClose,
  onSave,
}: {
  open: boolean
  current: number
  onClose: () => void
  onSave: (v: number) => Promise<void>
}) {
  const [val, setVal] = useState(String(current || ''))
  useEffect(() => {
    if (open) setVal(String(current || ''))
  }, [open, current])
  const dirty = val !== String(current || '')
  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title="עדכון תקציב מתוכנן">
      <div className="space-y-4">
        <Field label="סכום (₪)">
          <Input type="number" inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value)} placeholder="120000" />
        </Field>
        <Button size="lg" fullWidth onClick={() => onSave(Number(val) || 0)}>
          שמירה
        </Button>
      </div>
    </BottomSheet>
  )
}

function ExpenseSheet({
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing
  onClose: () => void
  onSave: (data: Partial<BudgetItem>, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const open = editing !== null
  const isEdit = Boolean(editing?.id)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [paid, setPaid] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const baseline = useRef('')

  useEffect(() => {
    if (editing) {
      const init = {
        title: editing.title ?? '',
        category: editing.category ?? '',
        amount: editing.actual ? String(editing.actual) : '',
        paid: editing.paid ? String(editing.paid) : '',
        date: editing.date ?? '',
        notes: editing.notes ?? '',
      }
      setTitle(init.title)
      setCategory(init.category)
      setAmount(init.amount)
      setPaid(init.paid)
      setDate(init.date)
      setNotes(init.notes)
      baseline.current = JSON.stringify(init)
    }
  }, [editing])

  const dirty = JSON.stringify({ title, category, amount, paid, date, notes }) !== baseline.current

  const submit = async () => {
    if (!title.trim()) {
      toast.error('צריך שם להוצאה')
      return
    }
    setSaving(true)
    const amountN = Number(amount) || 0
    await onSave(
      {
        title: title.trim(),
        category: category.trim(),
        estimated: amountN,
        actual: amountN,
        paid: Number(paid) || 0,
        date: date || '',
        notes: notes.trim(),
      },
      editing?.id,
    )
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title={isEdit ? 'עריכת הוצאה' : 'הוצאה חדשה'}>
      <div className="space-y-4">
        <Field label="שם ההוצאה">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: טבעות" />
        </Field>
        <Field label="קטגוריה">
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="לדוגמה: תכשיטים" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="סכום (₪)">
            <Input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </Field>
          <Field label="שולם (₪)">
            <Input type="number" inputMode="numeric" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="תאריך (אופציונלי)">
          <DateField value={date} onChange={setDate} placeholder="ללא תאריך" />
        </Field>
        <Field label="הערות">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="פרטים נוספים" />
        </Field>
        <div className="flex gap-3 pt-1">
          {isEdit && <DeleteButton onConfirm={() => onDelete(editing!.id!)} itemName={title} />}
          <Button size="lg" fullWidth loading={saving} onClick={submit} icon={<Wallet className="h-5 w-5" />}>
            {isEdit ? 'שמירה' : 'הוספה'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
