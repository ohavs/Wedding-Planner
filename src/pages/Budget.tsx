import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Pencil, Wallet } from 'lucide-react'
import { useWedding } from '@/context/WeddingContext'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { BudgetItem, Vendor } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { IconButton } from '@/components/ui/IconButton'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, pct } from '@/lib/utils'
import { staggerContainer, slideItem } from '@/lib/motion'

const noOrder: [] = []
type Editing = Partial<BudgetItem> | null

export default function Budget() {
  const { wedding, updateWedding } = useWedding()
  const { items, add, update, remove } = useWeddingCollection<BudgetItem>('budget')
  const { items: vendors } = useWeddingCollection<Vendor>('vendors', noOrder)
  const [editing, setEditing] = useState<Editing>(null)
  const [editTotal, setEditTotal] = useState(false)

  const sums = useMemo(() => {
    const itemsPaid = items.reduce((s, b) => s + (b.paid || 0), 0)
    const itemsEst = items.reduce((s, b) => s + (b.estimated || 0), 0)
    const vendorsPaid = vendors.reduce((s, v) => s + (v.paid || 0), 0)
    const vendorsPrice = vendors.reduce((s, v) => s + (v.price || 0), 0)
    const total = wedding?.budgetTotal || 0
    const paid = itemsPaid + vendorsPaid
    const committed = itemsEst + vendorsPrice
    return { total, paid, committed, remaining: total - paid }
  }, [items, vendors, wedding])

  return (
    <div>
      <PageHeader title="תקציב" subtitle="המעקב הכספי שלכם" />

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
              <p className="text-sm text-white/80">תקציב כולל</p>
              <p className="mt-1 font-display text-4xl font-bold">{formatCurrency(sums.total)}</p>
            </div>
            <IconButton
              variant="glass"
              className="bg-white/20 text-white"
              onClick={() => setEditTotal(true)}
            >
              <Pencil className="h-5 w-5" />
            </IconButton>
          </div>
          <div className="relative mt-5">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-white/85">שולם {formatCurrency(sums.paid)}</span>
              <span className="font-semibold">{pct(sums.paid, sums.total)}%</span>
            </div>
            <ProgressBar
              value={pct(sums.paid, sums.total)}
              barClassName="bg-white"
              className="bg-white/25"
            />
          </div>
        </motion.div>

        {/* סטטיסטיקות */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mt-3 grid grid-cols-3 gap-3"
        >
          <StatTile label="שולם" value={formatCurrency(sums.paid)} tone="sun" />
          <StatTile
            label="נותר לתשלום"
            value={formatCurrency(sums.remaining)}
            tone={sums.remaining < 0 ? 'coral' : 'plain'}
          />
          <StatTile label="התחייבויות" value={formatCurrency(sums.committed)} tone="sky" />
        </motion.div>

        <p className="mt-3 px-1 text-xs text-ink-faint">* כולל את עלויות הספקים מהמודול "ספקים"</p>

        {/* רשימת סעיפים */}
        <div className="mt-4">
          <h2 className="mb-3 px-1 text-lg font-extrabold text-ink">סעיפי תקציב</h2>
          {items.length === 0 ? (
            <EmptyState
              emoji="💰"
              title="אין סעיפים עדיין"
              description="הוסיפו סעיפי הוצאה כמו טבעות, ירח דבש, שמלה ועוד"
              action={<Button onClick={() => setEditing({})}>הוספת סעיף</Button>}
            />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-2.5"
            >
              <AnimatePresence initial={false}>
                {items.map((b) => (
                  <motion.button
                    key={b.id}
                    variants={slideItem}
                    exit="exit"
                    layout
                    onClick={() => setEditing(b)}
                    className="block w-full rounded-3xl bg-white p-4 text-start shadow-card"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{b.title}</span>
                      <span className="font-bold text-teal-600">{formatCurrency(b.estimated)}</span>
                    </div>
                    {b.category && <p className="text-xs text-ink-soft">{b.category}</p>}
                    <div className="mt-2.5">
                      <ProgressBar value={pct(b.paid, b.estimated)} height="h-1.5" />
                      <p className="mt-1 text-xs text-ink-faint">
                        שולם {formatCurrency(b.paid)} מתוך {formatCurrency(b.estimated)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <Fab onClick={() => setEditing({})} aria-label="סעיף חדש" />

      {/* עריכת סכום כולל */}
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

      {/* עריכת סעיף */}
      <BudgetItemSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<BudgetItem, 'id' | 'createdAt'>)
            toast.success('הסעיף נוסף')
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
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title="עדכון תקציב כולל">
      <div className="space-y-4">
        <Field label="סכום (₪)">
          <Input
            type="number"
            inputMode="numeric"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="120000"
          />
        </Field>
        <Button size="lg" fullWidth onClick={() => onSave(Number(val) || 0)}>
          שמירה
        </Button>
      </div>
    </BottomSheet>
  )
}

function BudgetItemSheet({
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
  const [estimated, setEstimated] = useState('')
  const [paid, setPaid] = useState('')
  const [saving, setSaving] = useState(false)
  const baseline = useRef('')

  useEffect(() => {
    if (editing) {
      const init = {
        title: editing.title ?? '',
        category: editing.category ?? '',
        estimated: editing.estimated ? String(editing.estimated) : '',
        paid: editing.paid ? String(editing.paid) : '',
      }
      setTitle(init.title)
      setCategory(init.category)
      setEstimated(init.estimated)
      setPaid(init.paid)
      baseline.current = JSON.stringify(init)
    }
  }, [editing])

  const dirty = JSON.stringify({ title, category, estimated, paid }) !== baseline.current

  const submit = async () => {
    if (!title.trim()) {
      toast.error('צריך שם לסעיף')
      return
    }
    setSaving(true)
    await onSave(
      {
        title: title.trim(),
        category: category.trim(),
        estimated: Number(estimated) || 0,
        actual: Number(estimated) || 0,
        paid: Number(paid) || 0,
      },
      editing?.id,
    )
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title={isEdit ? 'עריכת סעיף' : 'סעיף חדש'}>
      <div className="space-y-4">
        <Field label="שם הסעיף">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="טבעות / ירח דבש" />
        </Field>
        <Field label="קטגוריה">
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="אופציונלי" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="עלות מתוכננת (₪)">
            <Input
              type="number"
              inputMode="numeric"
              value={estimated}
              onChange={(e) => setEstimated(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="כבר שולם (₪)">
            <Input
              type="number"
              inputMode="numeric"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
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
