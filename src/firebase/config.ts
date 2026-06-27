import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

/** האם הוגדרו פרטי Firebase (לזיהוי מצב "לא מוגדר") */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && !firebaseConfig.apiKey.includes('your-'),
)

// אתחול בטוח - גם אם אין הגדרות, האפליקציה לא תקרוס, רק תציג מסך הסבר
let app: FirebaseApp | undefined
try {
  app = initializeApp(firebaseConfig)
} catch (e) {
  console.warn('Firebase initialization skipped:', e)
}

export const firebaseApp = app
export const auth = app ? getAuth(app) : (null as never)
export const db = app ? getFirestore(app) : (null as never)
export const storage = app ? getStorage(app) : (null as never)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
