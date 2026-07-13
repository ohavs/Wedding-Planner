import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuth } from './AuthContext'
import { DEFAULT_TASKS } from '@/lib/constants'
import { reportWriteError } from '@/lib/writeError'
import type { MemberRole, Wedding, WeddingFormData } from '@/lib/types'

const ACTIVE_KEY = 'wp:activeWedding'

interface WeddingContextValue {
  weddings: Wedding[]
  wedding: Wedding | null
  weddingId: string | null
  role: MemberRole | null
  loading: boolean
  /** הזמנות ממתינות עבור המשתמש (לפי אימייל) */
  invites: Wedding[]
  setActiveWedding: (id: string) => void
  createWedding: (data: WeddingFormData) => Promise<string>
  updateWedding: (data: Partial<WeddingFormData>) => Promise<void>
  inviteMember: (email: string) => Promise<void>
  cancelInvite: (email: string) => Promise<void>
  acceptInvite: (weddingId: string) => Promise<void>
  declineInvite: (weddingId: string) => Promise<void>
  removeMember: (uid: string, email: string) => Promise<void>
  leaveWedding: () => Promise<void>
  deleteWedding: () => Promise<void>
}

const WeddingContext = createContext<WeddingContextValue | undefined>(undefined)

export function WeddingProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth()
  const [weddings, setWeddings] = useState<Wedding[]>([])
  const [invites, setInvites] = useState<Wedding[]>([])
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY),
  )
  const [loading, setLoading] = useState(true)

  // מנוי לחתונות שהמשתמש חבר בהן
  useEffect(() => {
    if (!user || !configured || !db) {
      setWeddings([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'weddings'),
      where('memberIds', 'array-contains', user.uid),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Wedding[]
        list.sort((a, b) => (a.partner1 > b.partner1 ? 1 : -1))
        setWeddings(list)
        setLoading(false)
      },
      (err) => {
        console.error('weddings snapshot error', err)
        setLoading(false)
      },
    )
    return unsub
  }, [user, configured])

  // מנוי להזמנות ממתינות לפי אימייל
  useEffect(() => {
    if (!user?.email || !configured || !db) {
      setInvites([])
      return
    }
    const q = query(
      collection(db, 'weddings'),
      where('pendingInvites', 'array-contains', user.email.toLowerCase()),
    )
    const unsub = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Wedding[])
    })
    return unsub
  }, [user?.email, configured])

  // בחירת חתונה פעילה ברירת מחדל
  useEffect(() => {
    if (weddings.length === 0) return
    if (!activeId || !weddings.some((w) => w.id === activeId)) {
      setActiveId(weddings[0].id)
    }
  }, [weddings, activeId])

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId)
  }, [activeId])

  const wedding = useMemo(
    () => weddings.find((w) => w.id === activeId) ?? null,
    [weddings, activeId],
  )

  const role: MemberRole | null = useMemo(() => {
    if (!wedding || !user) return null
    return wedding.members?.[user.uid] ?? null
  }, [wedding, user])

  const setActiveWedding = (id: string) => setActiveId(id)

  // כל פעולות הכתיבה לא-חוסמות (optimistic) - לא ממתינות ל-ack מהשרת,
  // כך שהממשק פועל גם אופליין. Firestore מסנכרן אוטומטית כשחוזר החיבור.
  const createWedding = async (data: WeddingFormData): Promise<string> => {
    if (!user) throw new Error('not signed in')
    // מזהה נוצר מקומית ומיד זמין (גם אופליין)
    const ref = doc(collection(db, 'weddings'))
    setDoc(ref, {
      ...data,
      ownerId: user.uid,
      members: { [user.uid]: 'owner' },
      memberIds: [user.uid],
      memberEmails: user.email ? [user.email.toLowerCase()] : [],
      pendingInvites: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(reportWriteError)
    // זריעת משימות ברירת מחדל
    const batch = writeBatch(db)
    DEFAULT_TASKS.forEach((t, i) => {
      const tRef = doc(collection(db, 'weddings', ref.id, 'tasks'))
      batch.set(tRef, {
        title: t.title,
        timing: t.timing,
        done: false,
        dueDate: null,
        notes: '',
        createdAt: serverTimestamp(),
        order: i,
      })
    })
    batch.commit().catch(reportWriteError)
    setActiveId(ref.id)
    return ref.id
  }

  const updateWedding = async (data: Partial<WeddingFormData>) => {
    if (!wedding) return
    updateDoc(doc(db, 'weddings', wedding.id), {
      ...data,
      updatedAt: serverTimestamp(),
    }).catch(reportWriteError)
  }

  const inviteMember = async (email: string) => {
    if (!wedding) return
    const clean = email.trim().toLowerCase()
    if (!clean) return
    updateDoc(doc(db, 'weddings', wedding.id), {
      pendingInvites: arrayUnion(clean),
    }).catch(reportWriteError)
  }

  const cancelInvite = async (email: string) => {
    if (!wedding) return
    updateDoc(doc(db, 'weddings', wedding.id), {
      pendingInvites: arrayRemove(email.toLowerCase()),
    }).catch(reportWriteError)
  }

  const acceptInvite = async (wId: string) => {
    if (!user?.email) return
    const email = user.email.toLowerCase()
    updateDoc(doc(db, 'weddings', wId), {
      pendingInvites: arrayRemove(email),
      memberIds: arrayUnion(user.uid),
      memberEmails: arrayUnion(email),
      [`members.${user.uid}`]: 'editor' as MemberRole,
    }).catch(reportWriteError)
    setActiveId(wId)
  }

  const declineInvite = async (wId: string) => {
    if (!user?.email) return
    updateDoc(doc(db, 'weddings', wId), {
      pendingInvites: arrayRemove(user.email.toLowerCase()),
    }).catch(reportWriteError)
  }

  const removeMember = async (uid: string, email: string) => {
    if (!wedding) return
    const members = { ...wedding.members }
    delete members[uid]
    updateDoc(doc(db, 'weddings', wedding.id), {
      members,
      memberIds: arrayRemove(uid),
      memberEmails: arrayRemove(email.toLowerCase()),
    }).catch(reportWriteError)
  }

  const leaveWedding = async () => {
    if (!wedding || !user) return
    const members = { ...wedding.members }
    delete members[user.uid]
    updateDoc(doc(db, 'weddings', wedding.id), {
      members,
      memberIds: arrayRemove(user.uid),
      memberEmails: arrayRemove(user.email?.toLowerCase() ?? ''),
    }).catch(reportWriteError)
    setActiveId(null)
  }

  const deleteWedding = async () => {
    if (!wedding) return
    deleteDoc(doc(db, 'weddings', wedding.id)).catch(reportWriteError)
    setActiveId(null)
  }

  return (
    <WeddingContext.Provider
      value={{
        weddings,
        wedding,
        weddingId: wedding?.id ?? null,
        role,
        loading,
        invites,
        setActiveWedding,
        createWedding,
        updateWedding,
        inviteMember,
        cancelInvite,
        acceptInvite,
        declineInvite,
        removeMember,
        leaveWedding,
        deleteWedding,
      }}
    >
      {children}
    </WeddingContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWedding() {
  const ctx = useContext(WeddingContext)
  if (!ctx) throw new Error('useWedding must be used within WeddingProvider')
  return ctx
}
