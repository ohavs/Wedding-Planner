import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

/**
 * הגדרות Firebase של הפרויקט.
 * מפתחות ה-Web של Firebase הם מזהים ציבוריים ובטוחים להטמעה בקוד צד-לקוח —
 * האבטחה נאכפת ע"י Authentication וחוקי Firestore/Storage (ראו firestore.rules).
 * ניתן לדרוס כל ערך באמצעות משתני סביבה (.env) לסביבות שונות.
 */
const fallbackConfig = {
  apiKey: 'AIzaSyAJ8HnO2HbkjcPobSpj1T5eZVckRN_V7oo',
  authDomain: 'wedding-planner-5469d.firebaseapp.com',
  projectId: 'wedding-planner-5469d',
  storageBucket: 'wedding-planner-5469d.firebasestorage.app',
  messagingSenderId: '516344050107',
  appId: '1:516344050107:web:4c361ef22bae0b42a1d49e',
  measurementId: 'G-EEVNCG1PF0',
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId,
}

/** האם הוגדרו פרטי Firebase תקינים */
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

// Analytics - נטען באופן עצל ורק בפרודקשן, מוגן מפני סביבות לא נתמכות
if (app && import.meta.env.PROD) {
  import('firebase/analytics')
    .then(({ getAnalytics, isSupported }) =>
      isSupported().then((ok) => {
        if (ok) getAnalytics(app as FirebaseApp)
      }),
    )
    .catch(() => {
      /* analytics אופציונלי */
    })
}
