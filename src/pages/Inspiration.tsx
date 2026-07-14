import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { Trash2, Upload, FileText, X, ImagePlus, ExternalLink } from 'lucide-react'
import { storage } from '@/firebase/config'
import { useWedding } from '@/context/WeddingContext'
import { useWeddingCollection } from '@/hooks/useWeddingCollection'
import { compressImage } from '@/lib/imageCompress'
import type { InspirationCategory, InspirationItem } from '@/lib/types'
import { INSPIRATION_CATEGORIES } from '@/lib/constants'
import { PageHeader } from '@/components/layout/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Fab } from '@/components/ui/Fab'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { AlertDialog } from '@/components/ui/AlertDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { overlayVariants, popIn, staggerContainer } from '@/lib/motion'

const catKeys = Object.keys(INSPIRATION_CATEGORIES) as InspirationCategory[]
const catOptions = catKeys.map((k) => ({
  value: k,
  label: INSPIRATION_CATEGORIES[k].label,
  emoji: INSPIRATION_CATEGORIES[k].emoji,
}))

export default function Inspiration() {
  const { weddingId } = useWedding()
  const { items, add, remove } = useWeddingCollection<InspirationItem>('inspiration')
  const [filter, setFilter] = useState('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewing, setViewing] = useState<InspirationItem | null>(null)
  const [confirmDel, setConfirmDel] = useState<InspirationItem | null>(null)

  const segments = useMemo(
    () => [
      { value: 'all', label: 'הכל', count: items.length },
      ...catKeys
        .map((k) => ({
          value: k,
          label: INSPIRATION_CATEGORIES[k].label,
          count: items.filter((i) => i.category === k).length,
        }))
        .filter((s) => s.count > 0),
    ],
    [items],
  )

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  )

  const handleDelete = async (item: InspirationItem) => {
    try {
      if (item.storagePath) await deleteObject(storageRef(storage, item.storagePath))
    } catch (e) {
      console.warn('storage delete failed', e)
    }
    await remove(item.id)
    setViewing(null)
    toast('נמחק')
  }

  return (
    <div>
      <PageHeader title="השראה ומסמכים" subtitle="תמונות, רעיונות וקבצים חשובים" />

      {items.length > 0 && (
        <div className="px-5">
          <SegmentedControl value={filter} onChange={setFilter} segments={segments} idKey="insp" />
        </div>
      )}

      <div className="mt-3 px-5">
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🖼️"
            title="לוח ההשראה ריק"
            description="העלו תמונות השראה, הזמנות, חוזים ומסמכים — הכל נשמר בענן"
            action={<Button onClick={() => setUploadOpen(true)} icon={<ImagePlus className="h-5 w-5" />}>העלאת קובץ</Button>}
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 gap-3"
          >
            {filtered.map((item) =>
              item.isDocument ? (
                <motion.a
                  key={item.id}
                  variants={popIn}
                  href={item.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl bg-white p-4 text-center shadow-card"
                >
                  <FileText className="h-10 w-10 text-teal-400" />
                  <span className="line-clamp-2 text-sm font-semibold text-ink">{item.title}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                    פתיחה <ExternalLink className="h-3 w-3" />
                  </span>
                </motion.a>
              ) : (
                <motion.button
                  key={item.id}
                  variants={popIn}
                  onClick={() => setViewing(item)}
                  className="group relative aspect-square overflow-hidden rounded-3xl bg-cream-200 shadow-card"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                    <p className="truncate text-start text-sm font-semibold text-white">{item.title}</p>
                  </div>
                </motion.button>
              ),
            )}
          </motion.div>
        )}
      </div>

      <Fab onClick={() => setUploadOpen(true)} icon={<ImagePlus className="h-6 w-6" />} aria-label="העלאת קובץ" />

      <UploadSheet
        open={uploadOpen}
        weddingId={weddingId}
        onClose={() => setUploadOpen(false)}
        onUploaded={async (data) => {
          await add(data)
          setUploadOpen(false)
          toast.success('הקובץ הועלה ✨')
        }}
      />

      {/* תצוגת תמונה מלאה */}
      {createPortal(
        <AnimatePresence>
          {viewing && (
            <motion.div
              variants={overlayVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm"
              onClick={() => setViewing(null)}
            >
              <div className="flex items-center justify-between p-4 pt-safe">
                <button
                  onClick={() => setViewing(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDel(viewing)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-500/90 text-white"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={viewing.imageUrl}
                  alt={viewing.title}
                  className="max-h-full max-w-full rounded-3xl object-contain"
                />
              </div>
              <p className="p-4 pb-[calc(1rem+var(--safe-bottom))] text-center font-semibold text-white">
                {viewing.title}
              </p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <AlertDialog
        open={confirmDel !== null}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => confirmDel && handleDelete(confirmDel)}
        emoji="🗑️"
        title="למחוק את הקובץ?"
        description={`"${confirmDel?.title ?? ''}" יימחק לצמיתות מהענן. לא ניתן לשחזר.`}
        confirmLabel="מחיקה"
        danger
      />
    </div>
  )
}

function UploadSheet({
  open,
  weddingId,
  onClose,
  onUploaded,
}: {
  open: boolean
  weddingId: string | null
  onClose: () => void
  onUploaded: (data: Omit<InspirationItem, 'id' | 'createdAt'>) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<InspirationCategory>('decor')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setPreview(null)
      setTitle('')
      setCategory('decor')
    }
  }, [open])

  const onPick = (f: File | null) => {
    if (!f) return
    setFile(f)
    setTitle((prev) => prev || f.name.replace(/\.[^.]+$/, ''))
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  const submit = async () => {
    if (!file || !weddingId) {
      toast.error('בחרו קובץ קודם')
      return
    }
    setUploading(true)
    try {
      const isImage = file.type.startsWith('image/')
      let blob: Blob = file
      let contentType = file.type || 'application/octet-stream'
      let ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      if (isImage) {
        blob = await compressImage(file, 1600, 0.82)
        const compressed = blob !== file
        contentType = compressed ? 'image/jpeg' : file.type || 'image/jpeg'
        ext = compressed ? 'jpg' : ext
      }
      const base = (file.name.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_') || 'file').slice(0, 40)
      const path = `weddings/${weddingId}/inspiration/${Date.now()}_${base}.${ext}`
      const sRef = storageRef(storage, path)
      await uploadBytes(sRef, blob, { contentType })
      const url = await getDownloadURL(sRef)
      await onUploaded({
        title: title.trim() || file.name,
        category,
        imageUrl: url,
        storagePath: path,
        notes: '',
        isDocument: !isImage,
      })
    } catch (e) {
      const code = (e as { code?: string })?.code || (e as Error)?.message || 'שגיאה'
      console.error('inspiration upload failed:', code, e)
      toast.error('העלאה נכשלה: ' + code)
    } finally {
      setUploading(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} dirty={Boolean(file)} title="העלאת השראה">
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border-2 border-dashed border-cream-200 bg-cream-50 text-ink-faint"
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : file ? (
            <>
              <FileText className="h-10 w-10 text-teal-400" />
              <span className="px-4 text-sm font-semibold text-ink">{file.name}</span>
            </>
          ) : (
            <>
              <Upload className="h-9 w-9" />
              <span className="text-sm font-semibold">בחרו תמונה או קובץ PDF</span>
              <span className="text-xs">עד 10MB</span>
            </>
          )}
        </button>

        <Field label="כותרת">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="שם לקובץ" />
        </Field>
        <Field label="קטגוריה">
          <Select
            value={category}
            onChange={(v) => setCategory(v as InspirationCategory)}
            options={catOptions}
            title="בחרו קטגוריה"
          />
        </Field>

        <Button size="lg" fullWidth loading={uploading} onClick={submit} icon={<Upload className="h-5 w-5" />}>
          העלאה
        </Button>
      </div>
    </BottomSheet>
  )
}
