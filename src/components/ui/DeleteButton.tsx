import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from './Button'
import { AlertDialog } from './AlertDialog'

interface DeleteButtonProps {
  onConfirm: () => void
  title?: string
  description?: string
  itemName?: string
}

/** כפתור מחיקה עם דיאלוג אישור מעוצב */
export function DeleteButton({
  onConfirm,
  title = 'למחוק?',
  description,
  itemName,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="lg"
        onClick={() => setOpen(true)}
        icon={<Trash2 className="h-5 w-5" />}
        aria-label="מחיקה"
      />
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        emoji="🗑️"
        title={title}
        description={
          description ??
          `${itemName ? `"${itemName}" יימחק לצמיתות. ` : 'הפריט יימחק לצמיתות. '}לא ניתן לשחזר.`
        }
        confirmLabel="מחיקה"
        cancelLabel="ביטול"
        danger
      />
    </>
  )
}
