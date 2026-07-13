import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from '@/firebase/config'
import type { AppUser } from '@/lib/types'

interface AuthContextValue {
  user: AppUser | null
  firebaseUser: User | null
  loading: boolean
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toAppUser(u: User): AppUser {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setFirebaseUser(u)
        setUser(toAppUser(u))
        // שמירת/עדכון פרופיל המשתמש - ללא await כדי לא לחסום את הטעינה
        // (אופליין, הכתיבה נשמרת בתור ותסונכרן מאוחר יותר)
        setDoc(
          doc(db, 'users', u.uid),
          {
            uid: u.uid,
            displayName: u.displayName,
            email: u.email?.toLowerCase() ?? null,
            photoURL: u.photoURL,
            lastSeen: serverTimestamp(),
          },
          { merge: true },
        ).catch((e) => console.warn('failed to save user profile', e))
      } else {
        setFirebaseUser(null)
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) return
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e: unknown) {
      // חלק מהדפדפנים במובייל חוסמים popup - נופלים ל-redirect
      const code = (e as { code?: string })?.code
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, googleProvider)
      } else {
        throw e
      }
    }
  }

  const signOut = async () => {
    if (auth) await fbSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        configured: isFirebaseConfigured,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
