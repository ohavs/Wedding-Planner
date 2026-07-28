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
const MAYBE = '__maybe__'
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

/** מספר האנשים ברשומה שהגעתם בספק */
function tentativeOf(g: Guest): number {
  if (g.kind === 'family') return normalizeMembers(g.members).filter((m) => m.tentative).length
  return g.tentative ? g.count || 1 : 0
}

const sideEmoji = (s: GuestSide) => (s === 'partner1' ? '🤵' : s === 'partner2' ? '👰' : '💞')

function Pill({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode
  tone?: 'muted' | 'side' | 'sun' | 'coral'
}) {
  const tones = {
    muted: 'bg-cream-100 text-ink-soft',
    side: 'bg-teal-50 text-teal-700',
    sun: 'bg-sun-100 text-sun-600',
    coral: 'bg-coral-100 text-coral-600',
  }
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
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
      tentative: items.reduce((s, g) => s + tentativeOf(g), 0),
    }
  }, [items])

  // צ'יפים לחיצים: צד / ילדים / בספק (מתפקדים כפילטרים)
  const filterChips = useMemo(() => {
    const chips: { value: string; emoji: string; label: string; count: number }[] = [
      { value: 'side:partner1', emoji: '🤵', label: wedding?.partner1 || 'ראשון', count: stats.p1 },
      { value: 'side:partner2', emoji: '👰', label: wedding?.partner2 || 'שני', count: stats.p2 },
    ]
    if (stats.shared > 0) chips.push({ value: 'side:shared', emoji: '💞', label: 'משותף', count: stats.shared })
    if (stats.children > 0) chips.push({ value: KIDS, emoji: '🧒', label: 'ילדים', count: stats.children })
    if (stats.tentative > 0) chips.push({ value: MAYBE, emoji: '❓', label: 'בספק', count: stats.tentative })
    return chips
  }, [wedding?.partner1, wedding?.partner2, stats])

  // פילטר קירבה
  const segments = useMemo(() => {
    const base = [{ value: 'all', label: 'הכל', count: items.length }]
    const groups = GUEST_GROUPS.map((grp) => ({
      value: grp,
      label: grp,
      count: items.filter((g) => g.group === grp).length,
    })).filter((s) => s.count > 0)
    return [...base, ...groups]
  }, [items])

  const filtered = useMemo(
    () =>
      items
        .filter((g) => {
          if (filter === 'all') return true
          if (filter === KIDS) return childrenOf(g) > 0
          if (filter === MAYBE) return tentativeOf(g) > 0
          if (filter.startsWith('side:')) return g.side === filter.slice(5)
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
          <div className="hide-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
            {filterChips.map((c) => {
              const active = filter === c.value
              return (
                <button
                  key={c.value}
                  onClick={() => setFilter(active ? 'all' : c.value)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    active ? 'bg-teal-500 text-white shadow-card' : 'bg-white text-ink shadow-soft',
                  )}
                >
                  <span>{c.emoji}</span>
                  <bdi className="max-w-[7rem] truncate">{c.label}</bdi>
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[11px] font-bold',
                      active ? 'bg-white/25 text-white' : 'bg-cream-100 text-teal-600',
                    )}
                  >
                    {c.count}
                  </span>
                </button>
              )
            })}
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
                const maybe = tentativeOf(g)
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
                          !isFamily && g.tentative
                            ? 'bg-coral-100 text-coral-600'
                            : isFamily
                              ? 'bg-blush-100 text-coral-500'
                              : 'bg-cream-100 text-teal-600',
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
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Pill>{isFamily ? 'משפחה' : g.group}</Pill>
                          <Pill tone="side">
                            <span>{sideEmoji(g.side)}</span>
                            <bdi className="max-w-[7rem] truncate">{sideLabel(g.side)}</bdi>
                          </Pill>
                          {!isFamily && g.ageGroup === 'child' && <Pill tone="sun">🧒 ילד</Pill>}
                          {!isFamily && g.tentative && <Pill tone="coral">❓ בספק</Pill>}
                          {isFamily && maybe > 0 && <Pill tone="coral">❓ {maybe} בספק</Pill>}
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
                                  <div
                                    key={i}
                                    className={cn(
                                      'flex items-center gap-2 text-sm',
                                      m.tentative ? 'font-semibold text-coral-500' : 'text-ink',
                                    )}
                                  >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cream-100 text-xs font-bold text-ink-faint">
                                      {i + 1}
                                    </span>
                                    <span className="flex-1 truncate">{m.name}</span>
                                    {m.tentative && (
                                      <span className="rounded-full bg-coral-100 px-2 py-0.5 text-[11px] font-bold text-coral-600">
                                        ❓ בספק
                                      </span>
                                    )}
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
  const [tentative, setTentative] = useState(false)
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
        tentative: editing.tentative ?? false,
        members: normalizeMembers(editing.members),
      }
      setKind(init.kind)
      setName(init.name)
      setSide(init.side)
      setGroup(init.group)
      setCount(init.count)
      setAge(init.age)
      setTentative(init.tentative)
      setMembers(init.members)
      baseline.current = JSON.stringify(init)
    }
  }, [editing])

  const cleanedMembers = members
    .map((m) => ({ name: m.name.trim(), child: m.child ?? false, tentative: m.tentative ?? false }))
    .filter((m) => m.name)
  const childCount = cleanedMembers.filter((m) => m.child).length
  const maybeCount = cleanedMembers.filter((m) => m.tentative).length
  const dirty =
    JSON.stringify({ kind, name, side, group, count, age, tentative, members }) !== baseline.current

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
            tentative: false,
          }
        : { kind: 'single', name: name.trim(), members: [], side, group, count, ageGroup: age, tentative }

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
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="כמות אנשים">
                <Stepper value={count} onChange={setCount} min={1} max={30} />
              </Field>
              <Field label="גיל" hint="לא חובה">
                <Select
                  value={age}
                  onChange={(v) => setAge(v as GuestAge)}
                  options={ageOptions}
                  title="מבוגר או ילד"
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={() => setTentative((t) => !t)}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-colors',
                tentative ? 'bg-coral-100 text-coral-600' : 'bg-cream-100 text-ink-soft',
              )}
            >
              <span className="text-base font-black">?</span>
              {tentative ? 'מסומן: הגעה בספק' : 'סימון הגעה בספק (אולי)'}
            </button>
          </>
        ) : (
          <Field
            label="שמות בני המשפחה"
            hint={`${cleanedMembers.length} אנשים${childCount > 0 ? ` · ${childCount} ילדים` : ''}${maybeCount > 0 ? ` · ${maybeCount} בספק` : ''} · 🧑/🧒 ילד · ? הגעה בספק`}
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
                    className={cn('flex-1', m.tentative && 'border-coral-300 bg-coral-50')}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMembers((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, child: !x.child } : x)),
                      )
                    }
                    className={cn(
                      'flex h-14 w-11 shrink-0 items-center justify-center rounded-2xl text-lg transition-colors',
                      m.child ? 'bg-sun-100' : 'bg-cream-100',
                    )}
                    aria-label={m.child ? 'ילד' : 'מבוגר'}
                    title={m.child ? 'ילד' : 'מבוגר'}
                  >
                    {m.child ? '🧒' : '🧑'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMembers((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, tentative: !x.tentative } : x)),
                      )
                    }
                    className={cn(
                      'flex h-14 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black transition-colors',
                      m.tentative ? 'bg-coral-100 text-coral-600' : 'bg-cream-100 text-ink-faint',
                    )}
                    aria-label="הגעה בספק"
                    title="הגעה בספק"
                  >
                    ?
                  </button>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))}
                      className="flex h-14 w-10 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-coral-500"
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
