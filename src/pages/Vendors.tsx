import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Phone, Briefcase } from 'lucide-react'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { Vendor, VendorStatus } from '@/lib/types'
import { VENDOR_CATEGORIES, VENDOR_STATUS, vendorCategory } from '@/lib/constants'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn, formatCurrency } from '@/lib/utils'
import { staggerContainer, slideItem, tapScale } from '@/lib/motion'

type Editing = Partial<Vendor> | null
const catOptions = VENDOR_CATEGORIES.map((c) => ({ value: c.id, label: c.label, emoji: c.emoji }))
const statusKeys = Object.keys(VENDOR_STATUS) as VendorStatus[]

export default function Vendors() {
  const { items, add, update, remove } = useWeddingCollection<Vendor>('vendors')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Editing>(null)

  const sums = useMemo(() => {
    const total = items.reduce((s, v) => s + (v.price || 0), 0)
    const paid = items.reduce((s, v) => s + (v.paid || 0), 0)
    const booked = items.filter((v) => v.status === 'booked' || v.status === 'paid').length
    return { total, paid, booked }
  }, [items])

  const segments = useMemo(
    () => [
      { value: 'all', label: 'הכל', count: items.length },
      ...statusKeys.map((s) => ({
        value: s,
        label: VENDOR_STATUS[s].label,
        count: items.filter((v) => v.status === s).length,
      })),
    ],
    [items],
  )

  const filtered = useMemo(
    () => items.filter((v) => (filter === 'all' ? true : v.status === filter)),
    [items, filter],
  )

  return (
    <div>
      <PageHeader title="ספקים" subtitle={`${sums.booked} נסגרו · ${items.length} בסך הכל`} />

      <div className="px-5">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-3 gap-3"
        >
          <StatTile label="ספקים" value={items.length} tone="teal" />
          <StatTile label="עלות כוללת" value={formatCurrency(sums.total)} tone="coral" />
          <StatTile label="שולם" value={formatCurrency(sums.paid)} tone="sun" />
        </motion.div>
      </div>

      <div className="mt-4 px-5">
        <SegmentedControl value={filter} onChange={setFilter} segments={segments} idKey="vendors" />
      </div>

      <div className="mt-3 px-5">
        {filtered.length === 0 ? (
          <EmptyState
            emoji="📸"
            title="אין ספקים עדיין"
            description="הוסיפו ספקים ועקבו אחרי סטטוס וסכומים — צלם, אולם, די.ג׳יי ועוד"
            action={<Button onClick={() => setEditing({})}>הוספת ספק</Button>}
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-2.5"
          >
            <AnimatePresence initial={false}>
              {filtered.map((v) => {
                const cat = vendorCategory(v.category)
                const status = VENDOR_STATUS[v.status]
                return (
                  <motion.div
                    key={v.id}
                    variants={slideItem}
                    exit="exit"
                    layout
                    className="flex items-center gap-3 rounded-3xl bg-white p-3.5 shadow-card"
                  >
                    <button onClick={() => setEditing(v)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-2xl">
                        {cat.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-ink">{v.name || cat.label}</span>
                        <span className="flex items-center gap-2">
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', status.tone)}>
                            {status.label}
                          </span>
                          {v.price > 0 && (
                            <span className="text-xs text-ink-soft">{formatCurrency(v.price)}</span>
                          )}
                        </span>
                      </span>
                    </button>
                    {v.phone && (
                      <motion.a
                        whileTap={tapScale}
                        href={`tel:${v.phone}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"
                        aria-label="חיוג"
                      >
                        <Phone className="h-5 w-5" />
                      </motion.a>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Fab onClick={() => setEditing({})} aria-label="ספק חדש" />

      <VendorSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<Vendor, 'id' | 'createdAt'>)
            toast.success('הספק נוסף')
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

function VendorSheet({
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing
  onClose: () => void
  onSave: (data: Partial<Vendor>, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const open = editing !== null
  const isEdit = Boolean(editing?.id)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('venue')
  const [phone, setPhone] = useState('')
  const [price, setPrice] = useState('')
  const [paid, setPaid] = useState('')
  const [status, setStatus] = useState<VendorStatus>('lead')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const baseline = useRef('')

  useEffect(() => {
    if (editing) {
      const init = {
        name: editing.name ?? '',
        category: editing.category ?? 'venue',
        phone: editing.phone ?? '',
        price: editing.price ? String(editing.price) : '',
        paid: editing.paid ? String(editing.paid) : '',
        status: editing.status ?? 'lead',
        notes: editing.notes ?? '',
      }
      setName(init.name)
      setCategory(init.category)
      setPhone(init.phone)
      setPrice(init.price)
      setPaid(init.paid)
      setStatus(init.status)
      setNotes(init.notes)
      baseline.current = JSON.stringify(init)
    }
  }, [editing])

  const dirty =
    JSON.stringify({ name, category, phone, price, paid, status, notes }) !== baseline.current

  const submit = async () => {
    if (!name.trim()) {
      toast.error('צריך שם ספק')
      return
    }
    setSaving(true)
    await onSave(
      {
        name: name.trim(),
        category,
        phone: phone.trim(),
        price: Number(price) || 0,
        paid: Number(paid) || 0,
        status,
        notes: notes.trim(),
      },
      editing?.id,
    )
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title={isEdit ? 'עריכת ספק' : 'ספק חדש'}>
      <div className="space-y-4">
        <Field label="קטגוריה">
          <Select value={category} onChange={setCategory} options={catOptions} title="בחרו קטגוריה" />
        </Field>
        <Field label="שם הספק">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: סטודיו אור" />
        </Field>
        <Field label="טלפון">
          <Input
            icon={<Phone className="h-5 w-5" />}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-0000000"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="מחיר (₪)">
            <Input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </Field>
          <Field label="שולם (₪)">
            <Input type="number" inputMode="numeric" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="סטטוס">
          <div className="grid grid-cols-4 gap-2">
            {statusKeys.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'rounded-2xl py-2.5 text-xs font-semibold transition-colors',
                  status === s ? 'bg-teal-500 text-white' : 'bg-cream-100 text-ink-soft',
                )}
              >
                {VENDOR_STATUS[s].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="הערות">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="מה סגרתם, מה כולל..." />
        </Field>
        <div className="flex gap-3 pt-1">
          {isEdit && <DeleteButton onConfirm={() => onDelete(editing!.id!)} itemName={name} />}
          <Button size="lg" fullWidth loading={saving} onClick={submit} icon={<Briefcase className="h-5 w-5" />}>
            {isEdit ? 'שמירה' : 'הוספה'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
