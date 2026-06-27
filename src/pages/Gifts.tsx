import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Trash2, Gift as GiftIcon } from 'lucide-react'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { Gift, GiftType } from '@/lib/types'
import { GIFT_TYPES } from '@/lib/constants'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn, formatCurrency } from '@/lib/utils'
import { staggerContainer, slideItem } from '@/lib/motion'

type Editing = Partial<Gift> | null
const typeKeys = Object.keys(GIFT_TYPES) as GiftType[]

export default function Gifts() {
  const { items, add, update, remove } = useWeddingCollection<Gift>('gifts')
  const [editing, setEditing] = useState<Editing>(null)

  const sums = useMemo(() => {
    const total = items.reduce((s, g) => s + (g.amount || 0), 0)
    const count = items.length
    const avg = count ? Math.round(total / count) : 0
    return { total, count, avg }
  }, [items])

  return (
    <div>
      <PageHeader title="מתנות וכספים" subtitle="מעקב אחרי המתנות שקיבלתם" />

      <div className="px-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-coral-300 to-coral-500 p-6 text-white shadow-glow"
        >
          <div className="absolute -end-6 -top-10 h-32 w-32 rounded-full bg-white/15" />
          <p className="relative text-sm text-white/85">סך הכל התקבל</p>
          <p className="relative mt-1 font-display text-5xl font-bold">{formatCurrency(sums.total)}</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mt-3 grid grid-cols-2 gap-3"
        >
          <StatTile label="מספר מתנות" value={sums.count} tone="teal" />
          <StatTile label="ממוצע למתנה" value={formatCurrency(sums.avg)} tone="sun" />
        </motion.div>

        <div className="mt-5">
          <h2 className="mb-3 px-1 text-lg font-extrabold text-ink">רשימת המתנות</h2>
          {items.length === 0 ? (
            <EmptyState
              emoji="🎁"
              title="עדיין לא נרשמו מתנות"
              description="רשמו כל מתנה שמתקבלת כדי לעקוב בקלות ולהודות בהמשך"
              action={<Button onClick={() => setEditing({})}>הוספת מתנה</Button>}
            />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-2.5"
            >
              <AnimatePresence initial={false}>
                {items.map((g) => {
                  const t = GIFT_TYPES[g.type]
                  return (
                    <motion.button
                      key={g.id}
                      variants={slideItem}
                      exit="exit"
                      layout
                      onClick={() => setEditing(g)}
                      className="flex w-full items-center gap-3 rounded-3xl bg-white p-3.5 text-start shadow-card"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-2xl">
                        {t.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-ink">{g.from || 'אנונימי'}</span>
                        <span className="block text-xs text-ink-soft">{t.label}</span>
                      </span>
                      <span className="shrink-0 font-bold text-teal-600">{formatCurrency(g.amount)}</span>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <Fab onClick={() => setEditing({})} label="מתנה" />

      <GiftSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<Gift, 'id' | 'createdAt'>)
            toast.success('המתנה נרשמה 🎁')
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

function GiftSheet({
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing
  onClose: () => void
  onSave: (data: Partial<Gift>, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const open = editing !== null
  const isEdit = Boolean(editing?.id)
  const [from, setFrom] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<GiftType>('transfer')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) {
      setFrom(editing.from ?? '')
      setAmount(editing.amount ? String(editing.amount) : '')
      setType(editing.type ?? 'transfer')
      setNotes(editing.notes ?? '')
    }
  }, [editing])

  const submit = async () => {
    if (!amount) {
      toast.error('צריך סכום')
      return
    }
    setSaving(true)
    await onSave(
      { from: from.trim(), amount: Number(amount) || 0, type, notes: notes.trim() },
      editing?.id,
    )
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'עריכת מתנה' : 'מתנה חדשה'}>
      <div className="space-y-4">
        <Field label="ממי">
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="שם הנותן" />
        </Field>
        <Field label="סכום (₪)">
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="text-xl font-bold"
          />
        </Field>
        <Field label="סוג">
          <div className="grid grid-cols-4 gap-2">
            {typeKeys.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl py-2.5 text-xs font-semibold transition-colors',
                  type === t ? 'bg-teal-500 text-white' : 'bg-cream-100 text-ink-soft',
                )}
              >
                <span className="text-lg">{GIFT_TYPES[t].emoji}</span>
                {GIFT_TYPES[t].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="הערות">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="אופציונלי" />
        </Field>
        <div className="flex gap-3 pt-1">
          {isEdit && (
            <Button variant="danger" size="lg" onClick={() => onDelete(editing!.id!)} icon={<Trash2 className="h-5 w-5" />}>
              מחיקה
            </Button>
          )}
          <Button size="lg" fullWidth loading={saving} onClick={submit} icon={<GiftIcon className="h-5 w-5" />}>
            {isEdit ? 'שמירה' : 'הוספה'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
