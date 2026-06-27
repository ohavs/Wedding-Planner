import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useWedding } from '@/context/WeddingContext'

interface WithId {
  id: string
}

/**
 * Hook גנרי לעבודה עם תת-אוסף של החתונה הפעילה בזמן אמת.
 * מספק את הפריטים + פעולות הוספה/עדכון/מחיקה.
 */
export function useWeddingCollection<T extends WithId>(
  name: string,
  constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')],
) {
  const { weddingId } = useWedding()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  // מייצב את התלות במגבלות
  const constraintKey = JSON.stringify(constraints.map((c) => (c as { type?: string }).type))

  useEffect(() => {
    if (!weddingId || !db) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const ref = collection(db, 'weddings', weddingId, name)
    const q = query(ref, ...constraints)
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[])
        setLoading(false)
      },
      (err) => {
        console.error(`snapshot error on ${name}`, err)
        setLoading(false)
      },
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId, name, constraintKey])

  const api = useMemo(
    () => ({
      async add(data: Omit<T, 'id' | 'createdAt'>) {
        if (!weddingId) return
        const ref = collection(db, 'weddings', weddingId, name)
        await addDoc(ref, { ...data, createdAt: serverTimestamp() })
      },
      async update(id: string, data: Partial<Omit<T, 'id'>>) {
        if (!weddingId) return
        await updateDoc(doc(db, 'weddings', weddingId, name, id), data as object)
      },
      async remove(id: string) {
        if (!weddingId) return
        await deleteDoc(doc(db, 'weddings', weddingId, name, id))
      },
    }),
    [weddingId, name],
  )

  return { items, loading, ...api }
}
