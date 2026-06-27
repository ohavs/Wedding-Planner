import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { orderBy } from 'firebase/firestore'
import { Trash2, Clock, MapPin, User } from 'lucide-react'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import type { ScheduleEvent } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { staggerContainer, slideItem } from '@/lib/motion'

type Editing = Partial<ScheduleEvent> | null

export default function DaySchedule() {
  const { items, add, update, remove } = useWeddingCollection<ScheduleEvent>('schedule', [
    orderBy('time', 'asc'),
  ])
  const [editing, setEditing] = useState<Editing>(null)

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [items],
  )

  return (
    <div>
      <PageHeader title="לו״ז יום האירוע" subtitle="סדר היום של היום הגדול" />

      <div className="px-5">
        {sorted.length === 0 ? (
          <EmptyState
            emoji="⏰"
            title="עוד אין לוח זמנים"
            description="בנו את סדר היום: איפור, צילומים, קבלת פנים, חופה, ריקודים ועוד"
            action={<Button onClick={() => setEditing({})}>הוספת אירוע</Button>}
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="relative space-y-3 ps-3"
          >
            {/* קו הזמן */}
            <div className="absolute bottom-3 end-[1.4rem] top-3 w-0.5 bg-cream-200" />
            <AnimatePresence initial={false}>
              {sorted.map((ev) => (
                <motion.button
                  key={ev.id}
                  variants={slideItem}
                  exit="exit"
                  layout
                  onClick={() => setEditing(ev)}
                  className="relative flex w-full items-stretch gap-3 text-start"
                >
                  {/* שעה + נקודה */}
                  <div className="relative flex w-12 shrink-0 flex-col items-center pt-3">
                    <span className="z-10 mb-1 rounded-lg bg-teal-500 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white shadow-soft">
                      {ev.time || '--:--'}
                    </span>
                    <span className="z-10 h-3 w-3 rounded-full border-2 border-white bg-sun-400 shadow-soft" />
                  </div>
                  <div className="flex-1 rounded-3xl bg-white p-4 shadow-card">
                    <p className="font-bold text-ink">{ev.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                      {ev.responsible && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {ev.responsible}
                        </span>
                      )}
                      {ev.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {ev.location}
                        </span>
                      )}
                    </div>
                    {ev.notes && <p className="mt-1.5 text-xs text-ink-faint">{ev.notes}</p>}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Fab onClick={() => setEditing({})} label="אירוע" />

      <ScheduleSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<ScheduleEvent, 'id' | 'createdAt'>)
            toast.success('האירוע נוסף')
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

function ScheduleSheet({
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing
  onClose: () => void
  onSave: (data: Partial<ScheduleEvent>, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const open = editing !== null
  const isEdit = Boolean(editing?.id)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [responsible, setResponsible] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) {
      setTitle(editing.title ?? '')
      setTime(editing.time ?? '')
      setResponsible(editing.responsible ?? '')
      setLocation(editing.location ?? '')
      setNotes(editing.notes ?? '')
    }
  }, [editing])

  const submit = async () => {
    if (!title.trim()) {
      toast.error('צריך שם לאירוע')
      return
    }
    setSaving(true)
    await onSave(
      {
        title: title.trim(),
        time,
        responsible: responsible.trim(),
        location: location.trim(),
        notes: notes.trim(),
      },
      editing?.id,
    )
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'עריכת אירוע' : 'אירוע חדש'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="שעה">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="אירוע">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="חופה" />
          </Field>
        </div>
        <Field label="אחראי">
          <Input
            icon={<User className="h-5 w-5" />}
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            placeholder="מי אחראי"
          />
        </Field>
        <Field label="מיקום">
          <Input
            icon={<MapPin className="h-5 w-5" />}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="גן / לובי / רחבה"
          />
        </Field>
        <Field label="הערות">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="פרטים נוספים" />
        </Field>
        <div className="flex gap-3 pt-1">
          {isEdit && (
            <Button variant="danger" size="lg" onClick={() => onDelete(editing!.id!)} icon={<Trash2 className="h-5 w-5" />}>
              מחיקה
            </Button>
          )}
          <Button size="lg" fullWidth loading={saving} onClick={submit} icon={<Clock className="h-5 w-5" />}>
            {isEdit ? 'שמירה' : 'הוספה'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
