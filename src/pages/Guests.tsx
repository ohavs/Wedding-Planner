import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Search, Users, Download, FileText, ChevronDown, Plus, X } from 'lucide-react'
import { useWedding } from '@/context/WeddingContext'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { FamilyMember, Guest, GuestAge, GuestKind, GuestSide } from '@/lib/types'
import { GUEST_GROUPS } from '@/lib/constants'
import { exportGuestsWord, exportGuestsPdf } from '@/lib/exportGuests'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
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
import { cn, normalizeMembers } from '@/lib/utils'
import { staggerContainer, slideItem } from '@/lib/motion'

type Editing = Partial<Guest> | null

const KIDS = '__kids__'
const groupOptions = GUEST_GROUPS.map((g) => ({ value: g, label: g }))
const ageOptions: SelectOption[] = [
  { value: 'adult', label: 'מבוגר', emoji: '🧑' },
  { value: 'child', label: 'ילד', emoji: '🧒' },
]

/** מספר הילדים ברשומה - למשפחה לפי סימון בני המשפחה, ליחיד לפי גיל */
function childrenOf(g: Guest): number {
  if (g.kind === 'family') return normalizeMembers(g.members).filter((m) => m.child).length
  return g.ageGroup === 'child' ? g.count || 1 : 0
}

export default function Guests() {
  const { wedding } = useWedding()
  const { items, add, update, remove } = useWeddingCollection<Guest>('guests')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Editing>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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
      children: items.reduce((s, g) => s + childrenOf(g), 0),
    }
  }, [items])

  // פילטרים לפי קירבה + פילטר ילדים
  const segments = useMemo(() => {
    const base = [{ value: 'all', label: 'הכל', count: items.length }]
    const kidsCount = items.filter((g) => childrenOf(g) > 0).length
    const kids = kidsCount > 0 ? [{ value: KIDS, label: 'ילדים 🧒', count: kidsCount }] : []
    const groups = GUEST_GROUPS.map((grp) => ({
      value: grp,
      label: grp,
      count: items.filter((g) => g.group === grp).length,
    })).filter((s) => s.count > 0)
    return [...base, ...kids, ...groups]
  }, [items])

  const filtered = useMemo(
    () =>
      items
        .filter((g) => {
          if (filter === 'all') return true
          if (filter === KIDS) return childrenOf(g) > 0
          return g.group === filter
        })
        .filter((g) => (search ? g.name.includes(search) : true))
        .sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [items, filter, search],
  )

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

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
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          <StatTile label="סה״כ אנשים" value={stats.total} tone="teal" />
          <StatTile label="הזמנות" value={stats.entries} tone="sun" />
        </motion.div>

        {stats.entries > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <SideChip emoji="🤵" name={wedding?.partner1 || 'ראשון'} value={stats.p1} />
            <SideChip emoji="👰" name={wedding?.partner2 || 'שני'} value={stats.p2} />
            {stats.shared > 0 && <SideChip emoji="💞" name="משותף" value={stats.shared} />}
            {stats.children > 0 && <SideChip emoji="🧒" name="ילדים" value={stats.children} />}
          </div>
        )}

        <div className="mt-4">
          <Input
            icon={<Search className="h-5 w-5" />}
            placeholder="חיפוש לפי שם"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* פילטר קירבה */}
      {segments.length > 1 && (
        <div className="mt-4 px-5">
          <SegmentedControl value={filter} onChange={setFilter} segments={segments} idKey="guests" />
        </div>
      )}

      {/* רשימה */}
      <div className="mt-4 px-5">
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🤵👰"
            title="אין מוזמנים עדיין"
            description="הוסיפו מוזמן יחיד או משפחה שלמה לרשימה"
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
                const isFamily = g.kind === 'family'
                const isOpen = expanded.has(g.id)
                const kids = childrenOf(g)
                return (
                  <motion.div
                    key={g.id}
                    variants={slideItem}
                    exit="exit"
                    layout
                    className="overflow-hidden rounded-3xl bg-white shadow-card"
                  >
                    <button
                      onClick={() => (isFamily ? toggleExpand(g.id) : setEditing(g))}
                      className="flex w-full items-center gap-3 p-3.5 text-start"
                    >
                      <span
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold',
                          isFamily ? 'bg-blush-100 text-coral-500' : 'bg-cream-100 text-teal-600',
                        )}
                      >
                        {isFamily ? <Users className="h-5 w-5" /> : g.name.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-ink">
                          {g.name}
                          {isFamily && kids > 0 && (
                            <span className="text-sm font-semibold text-coral-500"> ({kids} ילדים)</span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-ink-soft">
                          {[
                            isFamily ? 'משפחה' : g.group,
                            sideLabel(g.side),
                            !isFamily && g.ageGroup === 'child' ? '🧒 ילד' : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-cream-100 px-3 py-1.5 text-sm font-bold text-teal-600">
                        {g.count || 1}
                        <Users className="h-4 w-4" />
                      </span>
                      {isFamily && (
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 shrink-0 text-ink-faint transition-transform',
                            isOpen && 'rotate-180',
                          )}
                        />
                      )}
                    </button>

                    {isFamily && (
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3.5">
                              <div className="space-y-1.5 border-t border-cream-200 pt-3">
                                {normalizeMembers(g.members).map((m, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm text-ink">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cream-100 text-xs font-bold text-ink-faint">
                                      {i + 1}
                                    </span>
                                    <span className="flex-1">{m.name}</span>
                                    {m.child && (
                                      <span className="rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-bold text-sun-600">
                                        🧒 ילד
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => setEditing(g)}
                                className="mt-3 text-sm font-bold text-teal-600"
                              >
                                עריכת המשפחה
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
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
        sideOptions={sideOptions}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<Guest, 'id' | 'createdAt'>)
            toast.success('נוסף לרשימה 🎉')
          }
          setEditing(null)
        }}
        onDelete={async (id) => {
          await remove(id)
          toast('נמחק')
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
        <p className="px-1 text-sm text-ink-soft">{count} רשומות ברשימה</p>
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

function KindButton({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean
  onClick: () => void
  emoji: string
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl py-3 text-sm font-bold transition-colors',
        active ? 'bg-teal-500 text-white' : 'bg-cream-100 text-ink-soft',
      )}
    >
      <span className="text-xl">{emoji}</span>
      {label}
    </button>
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

  const [kind, setKind] = useState<GuestKind>('single')
  const [name, setName] = useState('')
  const [side, setSide] = useState<GuestSide>('shared')
  const [group, setGroup] = useState('משפחה')
  const [count, setCount] = useState(1)
  const [age, setAge] = useState<GuestAge>('adult')
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [saving, setSaving] = useState(false)
  const baseline = useRef('')

  useEffect(() => {
    if (editing) {
      const init = {
        kind: editing.kind ?? 'single',
        name: editing.name ?? '',
        side: editing.side ?? 'shared',
        group: editing.group ?? 'משפחה',
        count: editing.count ?? 1,
        age: editing.ageGroup ?? 'adult',
        members: normalizeMembers(editing.members),
      }
      setKind(init.kind)
      setName(init.name)
      setSide(init.side)
      setGroup(init.group)
      setCount(init.count)
      setAge(init.age)
      setMembers(init.members)
      baseline.current = JSON.stringify(init)
    }
  }, [editing])

  const cleanedMembers = members
    .map((m) => ({ name: m.name.trim(), child: m.child ?? false }))
    .filter((m) => m.name)
  const childCount = cleanedMembers.filter((m) => m.child).length
  const dirty =
    JSON.stringify({ kind, name, side, group, count, age, members }) !== baseline.current

  const selectFamily = () => {
    setKind('family')
    if (members.length === 0) setMembers([{ name: '' }])
  }

  const submit = async () => {
    if (!name.trim()) {
      toast.error(kind === 'family' ? 'צריך שם למשפחה' : 'צריך שם')
      return
    }
    if (kind === 'family' && cleanedMembers.length === 0) {
      toast.error('הוסיפו לפחות שם אחד')
      return
    }
    setSaving(true)
    const base: Partial<Guest> =
      kind === 'family'
        ? {
            kind: 'family',
            name: name.trim(),
            members: cleanedMembers,
            side,
            group,
            count: cleanedMembers.length,
          }
        : { kind: 'single', name: name.trim(), members: [], side, group, count, ageGroup: age }

    if (editing?.id) {
      await onSave(base, editing.id)
    } else {
      await onSave({ ...base, phone: '', rsvp: 'pending', notes: '' })
    }
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title={isEdit ? 'עריכת מוזמן' : 'מוזמן חדש'}>
      <div className="space-y-4">
        {/* בורר סוג */}
        <div className="grid grid-cols-2 gap-2">
          <KindButton active={kind === 'single'} onClick={() => setKind('single')} emoji="🧍" label="מוזמן יחיד" />
          <KindButton active={kind === 'family'} onClick={selectFamily} emoji="👨‍👩‍👧" label="משפחה" />
        </div>

        <Field label={kind === 'family' ? 'שם המשפחה' : 'שם המוזמן'}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'family' ? 'לדוגמה: משפחת כהן' : 'לדוגמה: דוד כהן'}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="קירבה">
            <Select value={group} onChange={setGroup} options={groupOptions} title="בחרו קירבה" />
          </Field>
          <Field label="צד">
            <Select value={side} onChange={(v) => setSide(v as GuestSide)} options={sideOptions} title="בחרו צד" />
          </Field>
        </div>

        {kind === 'single' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="כמות אנשים">
              <Stepper value={count} onChange={setCount} min={1} max={30} />
            </Field>
            <Field label="גיל" hint="לא חובה — למנות ילדים">
              <Select
                value={age}
                onChange={(v) => setAge(v as GuestAge)}
                options={ageOptions}
                title="מבוגר או ילד"
              />
            </Field>
          </div>
        ) : (
          <Field
            label="שמות בני המשפחה"
            hint={`סה״כ ${cleanedMembers.length} אנשים${childCount > 0 ? ` · ${childCount} ילדים` : ''} · הקישו 🧑/🧒 לסימון ילד`}
          >
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={m.name}
                    onChange={(e) =>
                      setMembers((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    placeholder={`שם ${i + 1}`}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMembers((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, child: !x.child } : x)),
                      )
                    }
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl transition-colors',
                      m.child ? 'bg-sun-100' : 'bg-cream-100',
                    )}
                    aria-label={m.child ? 'ילד' : 'מבוגר'}
                    title={m.child ? 'ילד' : 'מבוגר'}
                  >
                    {m.child ? '🧒' : '🧑'}
                  </button>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))}
                      className="flex h-14 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-coral-500"
                      aria-label="הסרה"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMembers((prev) => [...prev, { name: '' }])}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-200 py-3 text-sm font-bold text-teal-600"
              >
                <Plus className="h-5 w-5" /> הוספת שם
              </button>
            </div>
          </Field>
        )}

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
