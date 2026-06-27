import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Search, Phone, Users } from 'lucide-react'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { Guest, GuestSide, RsvpStatus } from '@/lib/types'
import { GUEST_GROUPS, GUEST_SIDES, RSVP_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { Stepper } from '@/components/ui/Stepper'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { staggerContainer, slideItem, tapScale } from '@/lib/motion'

type Editing = Partial<Guest> | null

const sideOptions = (Object.keys(GUEST_SIDES) as GuestSide[]).map((k) => ({
  value: k,
  label: GUEST_SIDES[k],
}))
const groupOptions = GUEST_GROUPS.map((g) => ({ value: g, label: g }))
const rsvpCycle: RsvpStatus[] = ['pending', 'yes', 'maybe', 'no']

export default function Guests() {
  const { items, add, update, remove } = useWeddingCollection<Guest>('guests')
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing>(null)

  const stats = useMemo(() => {
    const invited = items.reduce((s, g) => s + (g.count || 1), 0)
    const confirmed = items.filter((g) => g.rsvp === 'yes').reduce((s, g) => s + (g.count || 1), 0)
    const declined = items.filter((g) => g.rsvp === 'no').length
    const pending = items.filter((g) => g.rsvp === 'pending').length
    return { invited, confirmed, declined, pending }
  }, [items])

  const segments = useMemo(
    () => [
      { value: 'all', label: 'הכל', count: items.length },
      { value: 'yes', label: 'מגיעים', count: items.filter((g) => g.rsvp === 'yes').length },
      { value: 'pending', label: 'ממתינים', count: items.filter((g) => g.rsvp === 'pending').length },
      { value: 'maybe', label: 'אולי', count: items.filter((g) => g.rsvp === 'maybe').length },
      { value: 'no', label: 'לא מגיעים', count: items.filter((g) => g.rsvp === 'no').length },
    ],
    [items],
  )

  const filtered = useMemo(() => {
    return items
      .filter((g) => (filter === 'all' ? true : g.rsvp === filter))
      .filter((g) => (search ? g.name.includes(search) || g.phone.includes(search) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }, [items, filter, search])

  const cycleRsvp = (g: Guest) => {
    const next = rsvpCycle[(rsvpCycle.indexOf(g.rsvp) + 1) % rsvpCycle.length]
    update(g.id, { rsvp: next })
  }

  return (
    <div>
      <PageHeader title="מוזמנים" subtitle={`${stats.confirmed} אישרו מתוך ${stats.invited} שהוזמנו`} />

      <div className="px-5">
        {/* סטטיסטיקות */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-3 gap-3"
        >
          <StatTile label="הוזמנו" value={stats.invited} tone="teal" />
          <StatTile label="אישרו" value={stats.confirmed} tone="sun" />
          <StatTile label="ממתינים" value={stats.pending} tone="plain" />
        </motion.div>

        {/* חיפוש */}
        <div className="mt-4">
          <Input
            icon={<Search className="h-5 w-5" />}
            placeholder="חיפוש לפי שם או טלפון"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* פילטר סטטוס */}
      <div className="mt-4 px-5">
        <SegmentedControl value={filter} onChange={setFilter} segments={segments} idKey="guests" />
      </div>

      {/* רשימה */}
      <div className="mt-3 px-5">
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🤵👰"
            title="אין מוזמנים עדיין"
            description="הוסיפו את המוזמנים הראשונים שלכם ועקבו אחרי אישורי ההגעה"
            action={<Button onClick={() => setEditing({})}>הוספת מוזמן</Button>}
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-2.5"
          >
            <AnimatePresence initial={false}>
              {filtered.map((g) => {
                const status = RSVP_STATUS[g.rsvp]
                return (
                  <motion.div
                    key={g.id}
                    variants={slideItem}
                    exit="exit"
                    layout
                    className="flex items-center gap-3 rounded-3xl bg-white p-3.5 shadow-card"
                  >
                    <button onClick={() => setEditing(g)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-100 font-bold text-teal-600">
                        {g.name.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-ink">{g.name}</span>
                        <span className="block truncate text-xs text-ink-soft">
                          {g.group || GUEST_SIDES[g.side]} · {g.count} מוזמנים
                        </span>
                      </span>
                    </button>
                    <motion.button
                      whileTap={tapScale}
                      onClick={() => cycleRsvp(g)}
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
                        status.tone,
                      )}
                    >
                      {status.emoji} {status.label}
                    </motion.button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Fab onClick={() => setEditing({})} aria-label="מוזמן חדש" />

      <GuestSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<Guest, 'id' | 'createdAt'>)
            toast.success('המוזמן נוסף 🎉')
          }
          setEditing(null)
        }}
        onDelete={async (id) => {
          await remove(id)
          toast('המוזמן נמחק')
          setEditing(null)
        }}
      />
    </div>
  )
}

function GuestSheet({
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing
  onClose: () => void
  onSave: (data: Partial<Guest>, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const open = editing !== null
  const isEdit = Boolean(editing?.id)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [side, setSide] = useState<GuestSide>('shared')
  const [group, setGroup] = useState('משפחה')
  const [count, setCount] = useState(1)
  const [rsvp, setRsvp] = useState<RsvpStatus>('pending')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const baseline = useRef('')

  // איפוס בעת פתיחה
  useEffect(() => {
    if (editing) {
      const init = {
        name: editing.name ?? '',
        phone: editing.phone ?? '',
        side: editing.side ?? 'shared',
        group: editing.group ?? 'משפחה',
        count: editing.count ?? 1,
        rsvp: editing.rsvp ?? 'pending',
        notes: editing.notes ?? '',
      }
      setName(init.name)
      setPhone(init.phone)
      setSide(init.side)
      setGroup(init.group)
      setCount(init.count)
      setRsvp(init.rsvp)
      setNotes(init.notes)
      baseline.current = JSON.stringify(init)
    }
  }, [editing])

  const dirty =
    JSON.stringify({ name, phone, side, group, count, rsvp, notes }) !== baseline.current

  const submit = async () => {
    if (!name.trim()) {
      toast.error('צריך שם')
      return
    }
    setSaving(true)
    await onSave(
      { name: name.trim(), phone: phone.trim(), side, group, count, rsvp, notes: notes.trim() },
      editing?.id,
    )
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title={isEdit ? 'עריכת מוזמן' : 'מוזמן חדש'}>
      <div className="space-y-4">
        <Field label="שם מלא">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: דוד כהן" />
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
          <Field label="צד">
            <Select value={side} onChange={(v) => setSide(v as GuestSide)} options={sideOptions} title="בחרו צד" />
          </Field>
          <Field label="קבוצה">
            <Select value={group} onChange={setGroup} options={groupOptions} title="בחרו קבוצה" />
          </Field>
        </div>
        <Field label="כמות מוזמנים בהזמנה">
          <Stepper value={count} onChange={setCount} min={1} max={20} />
        </Field>
        <Field label="סטטוס הגעה">
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(RSVP_STATUS) as RsvpStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRsvp(s)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl py-2.5 text-xs font-semibold transition-colors',
                  rsvp === s ? 'bg-teal-500 text-white' : 'bg-cream-100 text-ink-soft',
                )}
              >
                <span className="text-lg">{RSVP_STATUS[s].emoji}</span>
                {RSVP_STATUS[s].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="הערות">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="אלרגיות, הסעה..." />
        </Field>

        <div className="flex gap-3 pt-1">
          {isEdit && <DeleteButton onConfirm={() => onDelete(editing!.id!)} itemName={name} />}
          <Button size="lg" fullWidth loading={saving} onClick={submit} icon={<Users className="h-5 w-5" />}>
            {isEdit ? 'שמירה' : 'הוספה'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
