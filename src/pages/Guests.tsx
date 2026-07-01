import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Search, Users, Download, FileText } from 'lucide-react'
import { useWedding } from '@/context/WeddingContext'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { Guest, GuestSide } from '@/lib/types'
import { GUEST_GROUPS } from '@/lib/constants'
import { exportGuestsWord, exportGuestsPdf } from '@/lib/exportGuests'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Stepper } from '@/components/ui/Stepper'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { staggerContainer, slideItem } from '@/lib/motion'

type Editing = Partial<Guest> | null

const groupOptions = GUEST_GROUPS.map((g) => ({ value: g, label: g }))

export default function Guests() {
  const { wedding } = useWedding()
  const { items, add, update, remove } = useWeddingCollection<Guest>('guests')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // אפשרויות הצד - שמות המתחתנים בלבד (ומשותף)
  const sideOptions: SelectOption[] = useMemo(
    () => [
      { value: 'partner1', label: wedding?.partner1 || 'ראשון', emoji: '🤵' },
      { value: 'partner2', label: wedding?.partner2 || 'שני', emoji: '👰' },
      { value: 'shared', label: 'משותף', emoji: '💞' },
    ],
    [wedding?.partner1, wedding?.partner2],
  )
  const sideLabel = (s: GuestSide) => sideOptions.find((o) => o.value === s)?.label ?? ''

  const stats = useMemo(() => {
    const people = (f: (g: Guest) => boolean) =>
      items.filter(f).reduce((s, g) => s + (g.count || 1), 0)
    return {
      total: people(() => true),
      entries: items.length,
      p1: people((g) => g.side === 'partner1'),
      p2: people((g) => g.side === 'partner2'),
      shared: people((g) => g.side === 'shared'),
    }
  }, [items])

  const filtered = useMemo(
    () =>
      items
        .filter((g) => (search ? g.name.includes(search) : true))
        .sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [items, search],
  )

  return (
    <div>
      <PageHeader
        title="מוזמנים"
        subtitle={`${stats.entries} רשומות · ${stats.total} אנשים`}
        action={
          <IconButton variant="soft" onClick={() => setExportOpen(true)} aria-label="ייצוא">
            <Download className="h-5 w-5" />
          </IconButton>
        }
      />

      <div className="px-5">
        {/* סטטיסטיקות */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          <StatTile label="סה״כ אנשים" value={stats.total} tone="teal" />
          <StatTile label="הזמנות" value={stats.entries} tone="sun" />
        </motion.div>

        {/* פילוח לפי צד */}
        {stats.entries > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <SideChip emoji="🤵" name={wedding?.partner1 || 'ראשון'} value={stats.p1} />
            <SideChip emoji="👰" name={wedding?.partner2 || 'שני'} value={stats.p2} />
            {stats.shared > 0 && <SideChip emoji="💞" name="משותף" value={stats.shared} />}
          </div>
        )}

        {/* חיפוש */}
        <div className="mt-4">
          <Input
            icon={<Search className="h-5 w-5" />}
            placeholder="חיפוש לפי שם"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* רשימה */}
      <div className="mt-4 px-5">
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🤵👰"
            title="אין מוזמנים עדיין"
            description="הוסיפו את המוזמנים הראשונים שלכם לרשימה"
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
              {filtered.map((g) => (
                <motion.button
                  key={g.id}
                  variants={slideItem}
                  exit="exit"
                  layout
                  onClick={() => setEditing(g)}
                  className="flex w-full items-center gap-3 rounded-3xl bg-white p-3.5 text-start shadow-card"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-100 font-bold text-teal-600">
                    {g.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink">{g.name}</span>
                    <span className="block truncate text-xs text-ink-soft">
                      {[g.group, sideLabel(g.side)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-cream-100 px-3 py-1.5 text-sm font-bold text-teal-600">
                    {g.count || 1}
                    <Users className="h-4 w-4" />
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Fab onClick={() => setEditing({})} aria-label="מוזמן חדש" />

      <GuestSheet
        editing={editing}
        sideOptions={sideOptions}
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

      <ExportSheet
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={items.length}
        onWord={() => {
          exportGuestsWord(items, wedding)
          setExportOpen(false)
          toast.success('הקובץ הורד 📄')
        }}
        onPdf={async () => {
          const t = toast.loading('מכין PDF...')
          try {
            await exportGuestsPdf(items, wedding)
            toast.success('ה-PDF הורד 📕', { id: t })
          } catch {
            toast.error('הייצוא נכשל, נסו שוב', { id: t })
          }
          setExportOpen(false)
        }}
      />
    </div>
  )
}

function SideChip({ emoji, name, value }: { emoji: string; name: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-soft">
      <span>{emoji}</span>
      <span className="max-w-[7rem] truncate">{name}</span>
      <span className="text-ink-faint">·</span>
      <span className="text-teal-600">{value}</span>
    </span>
  )
}

function ExportSheet({
  open,
  onClose,
  count,
  onWord,
  onPdf,
}: {
  open: boolean
  onClose: () => void
  count: number
  onWord: () => void
  onPdf: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  return (
    <BottomSheet open={open} onClose={onClose} title="ייצוא רשימת מוזמנים">
      <div className="space-y-3">
        <p className="px-1 text-sm text-ink-soft">{count} מוזמנים ברשימה</p>
        <button
          onClick={onWord}
          className="flex w-full items-center gap-3 rounded-2xl bg-sky-100 p-4 text-start"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-soft">
            <FileText className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-ink">קובץ Word</span>
            <span className="block text-xs text-ink-soft">מסמך .doc לעריכה</span>
          </span>
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await onPdf()
            setBusy(false)
          }}
          className="flex w-full items-center gap-3 rounded-2xl bg-coral-50 p-4 text-start disabled:opacity-60"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-coral-500 shadow-soft">
            <FileText className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-ink">קובץ PDF</span>
            <span className="block text-xs text-ink-soft">{busy ? 'מכין...' : 'מסמך להדפסה ושיתוף'}</span>
          </span>
        </button>
      </div>
    </BottomSheet>
  )
}

function GuestSheet({
  editing,
  sideOptions,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing
  sideOptions: SelectOption[]
  onClose: () => void
  onSave: (data: Partial<Guest>, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const open = editing !== null
  const isEdit = Boolean(editing?.id)

  const [name, setName] = useState('')
  const [side, setSide] = useState<GuestSide>('shared')
  const [group, setGroup] = useState('משפחה')
  const [count, setCount] = useState(1)
  const [saving, setSaving] = useState(false)
  const baseline = useRef('')

  useEffect(() => {
    if (editing) {
      const init = {
        name: editing.name ?? '',
        side: editing.side ?? 'shared',
        group: editing.group ?? 'משפחה',
        count: editing.count ?? 1,
      }
      setName(init.name)
      setSide(init.side)
      setGroup(init.group)
      setCount(init.count)
      baseline.current = JSON.stringify(init)
    }
  }, [editing])

  const dirty = JSON.stringify({ name, side, group, count }) !== baseline.current

  const submit = async () => {
    if (!name.trim()) {
      toast.error('צריך שם')
      return
    }
    setSaving(true)
    if (editing?.id) {
      await onSave({ name: name.trim(), side, group, count }, editing.id)
    } else {
      await onSave({
        name: name.trim(),
        side,
        group,
        count,
        phone: '',
        rsvp: 'pending',
        notes: '',
      })
    }
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title={isEdit ? 'עריכת מוזמן' : 'מוזמן חדש'}>
      <div className="space-y-4">
        <Field label="שם המוזמן">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: דוד כהן" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="קירבה">
            <Select value={group} onChange={setGroup} options={groupOptions} title="בחרו קירבה" />
          </Field>
          <Field label="צד">
            <Select
              value={side}
              onChange={(v) => setSide(v as GuestSide)}
              options={sideOptions}
              title="בחרו צד"
            />
          </Field>
        </div>
        <Field label="כמות אנשים">
          <Stepper value={count} onChange={setCount} min={1} max={30} />
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
