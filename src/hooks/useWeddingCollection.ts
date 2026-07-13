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
import { reportWriteError } from '@/lib/writeError'

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

  // כתיבות לא-חוסמות (optimistic): לא ממתינים ל-ack מהשרת, כדי שהממשק
  // לא ייתקע אופליין. Firestore מעדכן את המטמון המקומי מיד (onSnapshot),
  // ומסנכרן לשרת אוטומטית כשחוזר החיבור.
  const api = useMemo(
    () => ({
      add(data: Omit<T, 'id' | 'createdAt'>): Promise<void> {
        if (!weddingId) return Promise.resolve()
        addDoc(collection(db, 'weddings', weddingId, name), {
          ...data,
          createdAt: serverTimestamp(),
        }).catch(reportWriteError)
        return Promise.resolve()
      },
      update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
        if (!weddingId) return Promise.resolve()
        updateDoc(doc(db, 'weddings', weddingId, name, id), data as object).catch(reportWriteError)
        return Promise.resolve()
      },
      remove(id: string): Promise<void> {
        if (!weddingId) return Promise.resolve()
        deleteDoc(doc(db, 'weddings', weddingId, name, id)).catch(reportWriteError)
        return Promise.resolve()
      },
    }),
    [weddingId, name],
  )

  return { items, loading, ...api }
}
