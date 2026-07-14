import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { Plus, X, Link as LinkIcon, Type, ImagePlus, Users, ExternalLink } from 'lucide-react'
import { storage } from '@/firebase/config'
import { useWedding } from '@/context/WeddingContext'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import { compressImage } from '@/lib/imageCompress'
import type { Venue, VenueField, VenueImage } from '@/lib/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { staggerContainer, slideItem, overlayVariants } from '@/lib/motion'

type Editing = Partial<Venue> | null

function genId() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

export default function Venues() {
  const { items, add, update, remove } = useWeddingCollection<Venue>('venues')
  const [editing, setEditing] = useState<Editing>(null)
  const [viewing, setViewing] = useState<Venue | null>(null)

  return (
    <div>
      <PageHeader title="אולמות ומקומות" subtitle={`${items.length} מקומות ברשימה`} />

      <div className="px-5">
        {items.length === 0 ? (
          <EmptyState
            emoji="🏛️"
            title="אין מקומות עדיין"
            description="הוסיפו אולמות וגני אירועים להשוואה — עם קיבולת, קישורים ותמונות"
            action={<Button onClick={() => setEditing({})}>הוספת מקום</Button>}
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence initial={false}>
              {items.map((v) => (
                <VenueCard
                  key={v.id}
                  venue={v}
                  onOpen={() => setEditing(v)}
                  onViewImages={() => setViewing(v)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Fab onClick={() => setEditing({})} aria-label="מקום חדש" />

      <VenueSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (data, id) => {
          if (id) {
            await update(id, data)
            toast.success('עודכן')
          } else {
            await add(data as Omit<Venue, 'id' | 'createdAt'>)
            toast.success('המקום נוסף 🏛️')
          }
          setEditing(null)
        }}
        onDelete={async (id) => {
          await remove(id)
          toast('נמחק')
          setEditing(null)
        }}
      />

      <ImageLightbox venue={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

function VenueCard({
  venue,
  onOpen,
  onViewImages,
}: {
  venue: Venue
  onOpen: () => void
  onViewImages: () => void
}) {
  const cover = venue.images?.[0]
  const fields = venue.fields ?? []
  const links = fields.filter((f) => f.type === 'link' && f.value)
  const texts = fields.filter((f) => f.type === 'text' && (f.label || f.value))

  return (
    <motion.div
      variants={slideItem}
      exit="exit"
      layout
      className="overflow-hidden rounded-3xl bg-white shadow-card"
    >
      {/* תמונה - לחיצה פותחת צפייה בכל התמונות */}
      {cover ? (
        <button onClick={onViewImages} className="relative block aspect-[16/9] w-full bg-cream-200">
          <img src={cover.url} alt={venue.name} loading="lazy" className="h-full w-full object-cover" />
          {venue.images.length > 1 && (
            <span className="absolute bottom-2 end-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">
              📷 {venue.images.length}
            </span>
          )}
        </button>
      ) : (
        <button onClick={onOpen} className="flex aspect-[16/9] w-full items-center justify-center bg-blush-100 text-5xl">
          🏛️
        </button>
      )}

      {/* פרטים - לחיצה פותחת עריכה */}
      <div onClick={onOpen} className="cursor-pointer p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-lg font-bold text-ink">{venue.name}</h3>
          {venue.capacity > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 text-xs font-bold text-teal-600">
              <Users className="h-3.5 w-3.5" />
              {venue.capacity}
            </span>
          )}
        </div>

        {/* בלוקי טקסט מותאמים */}
        {texts.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {texts.map((f, i) => (
              <div key={i} className="flex justify-between gap-3 text-sm">
                <span className="shrink-0 text-ink-soft">{f.label || 'פרט'}</span>
                <span className="truncate text-end font-medium text-ink">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* קישורים */}
        {links.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {links.map((l, i) => (
              <a
                key={i}
                href={l.value}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {l.label || 'קישור'}
              </a>
            ))}
          </div>
        )}

        {/* הערות */}
        {venue.notes && (
          <p className="mt-2.5 border-t border-cream-200 pt-2.5 text-sm leading-relaxed text-ink-soft">
            {venue.notes}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function ImageLightbox({ venue, onClose }: { venue: Venue | null; onClose: () => void }) {
  return createPortal(
    <AnimatePresence>
      {venue && venue.images.length > 0 && (
        <motion.div
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between p-4 pt-safe">
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="truncate px-3 font-semibold text-white">{venue.name}</span>
            <span className="w-11" />
          </div>
          <div
            className="hide-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {venue.images.map((img) => (
              <div key={img.path} className="flex min-w-full snap-center items-center justify-center p-4">
                <img src={img.url} alt="" className="max-h-full max-w-full rounded-3xl object-contain" />
              </div>
            ))}
          </div>
          {venue.images.length > 1 && (
            <p className="pb-[calc(1rem+var(--safe-bottom))] text-center text-sm text-white/70">
              החליקו לתמונות נוספות ({venue.images.length})
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function VenueSheet({
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing
  onClose: () => void
  onSave: (data: Partial<Venue>, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const { weddingId } = useWedding()
  const open = editing !== null
  const isEdit = Boolean(editing?.id)

  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [fields, setFields] = useState<VenueField[]>([])
  const [images, setImages] = useState<VenueImage[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const baseline = useRef('')
  const folder = useRef(genId())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      const init = {
        name: editing.name ?? '',
        capacity: editing.capacity ? String(editing.capacity) : '',
        fields: editing.fields ?? [],
        images: editing.images ?? [],
        notes: editing.notes ?? '',
      }
      setName(init.name)
      setCapacity(init.capacity)
      setFields(init.fields)
      setImages(init.images)
      setNotes(init.notes)
      baseline.current = JSON.stringify(init)
      folder.current = genId()
    }
  }, [editing])

  const dirty =
    JSON.stringify({ name, capacity, fields, images, notes }) !== baseline.current

  const onFiles = async (files: FileList | null) => {
    if (!files) return
    if (!weddingId) {
      toast.error('אין חתונה פעילה')
      return
    }
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const blob = await compressImage(file, 1400, 0.8)
        const compressed = blob !== file
        const contentType = compressed ? 'image/jpeg' : file.type || 'image/jpeg'
        const ext = compressed ? 'jpg' : (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `weddings/${weddingId}/venues/${folder.current}/${Date.now()}_${genId().slice(0, 6)}.${ext}`
        const sref = storageRef(storage, path)
        await uploadBytes(sref, blob, { contentType })
        const url = await getDownloadURL(sref)
        setImages((prev) => [...prev, { url, path }])
      }
    } catch (e) {
      const code = (e as { code?: string })?.code || (e as Error)?.message || 'שגיאה'
      console.error('venue image upload failed:', code, e)
      toast.error('העלאה נכשלה: ' + code)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeImage = async (img: VenueImage) => {
    setImages((prev) => prev.filter((x) => x.path !== img.path))
    try {
      await deleteObject(storageRef(storage, img.path))
    } catch {
      /* אולי כבר נמחק */
    }
  }

  const addField = (type: VenueField['type']) =>
    setFields((prev) => [...prev, { type, label: '', value: '' }])
  const updateField = (i: number, patch: Partial<VenueField>) =>
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  const removeField = (i: number) => setFields((prev) => prev.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (!name.trim()) {
      toast.error('צריך שם למקום')
      return
    }
    setSaving(true)
    const cleanFields = fields
      .map((f) => ({ ...f, label: f.label.trim(), value: f.value.trim() }))
      .filter((f) => f.label || f.value)
    await onSave(
      {
        name: name.trim(),
        capacity: Number(capacity) || 0,
        fields: cleanFields,
        images,
        notes: notes.trim(),
      },
      editing?.id,
    )
    setSaving(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={dirty} title={isEdit ? 'עריכת מקום' : 'מקום חדש'}>
      <div className="space-y-4">
        <Field label="שם המקום">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: גן האירועים" />
        </Field>
        <Field label="כמות אנשים (קיבולת)">
          <Input
            type="number"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="300"
          />
        </Field>

        {/* תמונות */}
        <Field label="תמונות" hint="נדחסות אוטומטית לטעינה מהירה">
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.path} className="relative aspect-square overflow-hidden rounded-2xl bg-cream-200">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute end-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"
                  aria-label="הסרת תמונה"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-cream-200 text-ink-faint disabled:opacity-60"
            >
              {uploading ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-semibold">הוספה</span>
                </>
              )}
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </Field>

        {/* בלוקים דינמיים */}
        <Field label="קישורים ובלוקים">
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-cream-200 bg-cream-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-soft">
                    {f.type === 'link' ? <LinkIcon className="h-4 w-4" /> : <Type className="h-4 w-4" />}
                  </span>
                  <Input
                    value={f.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                    placeholder={f.type === 'link' ? 'שם הקישור (אתר, וייז...)' : 'כותרת (מנהל, מחיר...)'}
                    className="h-12 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    className="flex h-12 w-11 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500"
                    aria-label="הסרה"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <Input
                  value={f.value}
                  onChange={(e) => updateField(i, { value: e.target.value })}
                  dir={f.type === 'link' ? 'ltr' : 'auto'}
                  inputMode={f.type === 'link' ? 'url' : 'text'}
                  placeholder={f.type === 'link' ? 'https://...' : 'תוכן'}
                  className="h-12"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addField('link')}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-200 py-3 text-sm font-bold text-teal-600"
              >
                <LinkIcon className="h-4 w-4" /> קישור
              </button>
              <button
                type="button"
                onClick={() => addField('text')}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-200 py-3 text-sm font-bold text-teal-600"
              >
                <Type className="h-4 w-4" /> בלוק טקסט
              </button>
            </div>
          </div>
        </Field>

        <Field label="הערות">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="התרשמות, מחיר, זמינות..." />
        </Field>

        <div className="flex gap-3 pt-1">
          {isEdit && <DeleteButton onConfirm={() => onDelete(editing!.id!)} itemName={name} />}
          <Button size="lg" fullWidth loading={saving} onClick={submit} icon={<Plus className="h-5 w-5" />}>
            {isEdit ? 'שמירה' : 'הוספה'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
