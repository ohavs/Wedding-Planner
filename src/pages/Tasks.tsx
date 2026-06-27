import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { orderBy } from 'firebase/firestore'
import { Check, ListChecks, CalendarDays } from 'lucide-react'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { ChecklistTask, TaskTiming } from '@/lib/types'
import { TASK_TIMINGS } from '@/lib/constants'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DateField } from '@/components/ui/DateField'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn, formatDateShort, pct } from '@/lib/utils'
import { staggerContainer, slideItem, tapScale } from '@/lib/motion'

type Editing = Partial<ChecklistTask> | null
const timingOptions = TASK_TIMINGS.map((t) => ({ value: t.id, label: t.label }))

export default function Tasks() {
  const { items, add, update, remove } = useWeddingCollection<ChecklistTask>('tasks', [
    orderBy('order', 'asc'),
  ])
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Editing>(null)

  const done = items.filter((t) => t.done).length
  const progress = pct(done, items.length)

  const segments = useMemo(
    () => [
      { value: 'all', label: 'הכל' },
      ...TASK_TIMINGS.map((t) => ({
        value: t.id,
        label: t.short,
        count: items.filter((i) => i.timing === t.id).length,
      })),
    ],
    [items],
  )

  const groups = useMemo(() => {
    const visible = filter === 'all' ? TASK_TIMINGS : TASK_TIMINGS.filter((t) => t.id === filter)
    return visible
      .map((t) => ({
        timing: t,
        tasks: items
          .filter((i) => i.timing === t.id)
          .sort((a, b) => Number(a.done) - Number(b.done)),
      }))
      .filter((g) => g.tasks.length > 0)
  }, [items, filter])

  return (
    <div>
      <PageHeader title="משימות" subtitle={`${done} מתוך ${items.length} הושלמו`} />

      <div className="px-5">
        {/* כרטיס התקדמות */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-sun-300 to-coral p-6 text-white shadow-glow"
        >
          <div className="absolute -end-6 -top-10 h-32 w-32 rounded-full bg-white/15" />
          <p className="relative text-sm text-white/85">השלמתם עד עכשיו</p>
          <p className="relative mt-1 font-display text-5xl font-bold">{progress}%</p>
          <div className="relative mt-4">
            <ProgressBar value={progress} barClassName="bg-white" className="bg-white/25" />
          </div>
        </motion.div>
      </div>

      <div className="mt-4 px-5">
        <SegmentedControl value={filter} onChange={setFilter} segments={segments} idKey="tasks" />
      </div>

      <div className="mt-3 px-5">
        {groups.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="אין משימות"
            description="הוסיפו משימות וצרו לעצמכם רשימה מסודרת לקראת היום הגדול"
            action={<Button onClick={() => setEditing({})}>הוספת משימה</Button>}
          />
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.timing.id}>
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
                  <h2 className="text-sm font-bold text-ink-soft">{g.timing.label}</h2>
                </div>
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-2.5"
                >
                  <AnimatePresence initial={false}>
                    {g.tasks.map((t) => (
                      <motion.div
                        key={t.id}
                        variants={slideItem}
                        exit="exit"
                        layout
                        className="flex items-center gap-3 rounded-3xl bg-white p-3.5 shadow-card"
                      >
                        <motion.button
                          whileTap={tapScale}
                          onClick={() => update(t.id, { done: !t.done })}
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            t.done ? 'border-teal-500 bg-teal-500 text-white' : 'border-cream-200',
                          )}
                          aria-label="סימון"
                        >
                          {t.done && <Check className="h-4 w-4" strokeWidth={3} />}
                        </motion.button>
                        <button onClick={() => setEditing(t)} className="min-w-0 flex-1 text-start">
                          <span
                            className={cn(
                              'block font-semibold transition-colors',
                              t.done ? 'text-ink-faint line-through' : 'text-ink',
                            )}
                          >
                            {t.title}
                          </span>
                          {t.dueDate && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-faint">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDateShort(t.dueDate)}
                            </span>
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Fab onClick={() => setEditing({})} aria-label="משימה חדשה" />

      <TaskSheet
        editing={editing}
        count={items.length}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<ChecklistTask, 'id' | 'createdAt'>)
            toast.success('המשימה נוספה')
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

function TaskSheet({
  editing,
  count,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing
  count: number
  onClose: () => void
  onSave: (data: Partial<ChecklistTask> & { order?: number }, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const open = editing !== null
  const isEdit = Boolean(editing?.id)
  const [title, setTitle] = useState('')
  const [timing, setTiming] = useState<TaskTiming>('3m')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const baseline = useRef('')

  useEffect(() => {
    if (editing) {
      const init = {
        title: editing.title ?? '',
        timing: editing.timing ?? '3m',
        dueDate: editing.dueDate ?? '',
        notes: editing.notes ?? '',
      }
      setTitle(init.title)
      setTiming(init.timing)
      setDueDate(init.dueDate)
      setNotes(init.notes)
      baseline.current = JSON.stringify(init)
    }
  }, [editing])

  const dirty = JSON.stringify({ title, timing, dueDate, notes }) !== baseline.current

  const submit = async () => {
    if (!title.trim()) {
      toast.error('צריך שם למשימה')
      return
    }
    setSaving(true)
    await onSave(
      {
        title: title.trim(),
        timing,
        dueDate: dueDate || null,
        notes: notes.trim(),
        done: editing?.done ?? false,
        ...(isEdit ? {} : { order: count }),
      },
      editing?.id,
    )
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title={isEdit ? 'עריכת משימה' : 'משימה חדשה'}>
      <div className="space-y-4">
        <Field label="המשימה">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: לסגור צלם" />
        </Field>
        <Field label="שלב">
          <Select
            value={timing}
            onChange={(v) => setTiming(v as TaskTiming)}
            options={timingOptions}
            title="מתי לבצע"
          />
        </Field>
        <Field label="תאריך יעד (אופציונלי)">
          <DateField value={dueDate} onChange={setDueDate} placeholder="ללא תאריך" />
        </Field>
        <Field label="הערות">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="פרטים נוספים" />
        </Field>
        <div className="flex gap-3 pt-1">
          {isEdit && <DeleteButton onConfirm={() => onDelete(editing!.id!)} itemName={title} />}
          <Button size="lg" fullWidth loading={saving} onClick={submit} icon={<ListChecks className="h-5 w-5" />}>
            {isEdit ? 'שמירה' : 'הוספה'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
