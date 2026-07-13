import toast from 'react-hot-toast'

/**
 * מטפל בשגיאת כתיבה ל-Firestore.
 * חשוב: כתיבות במצב אופליין אינן "נכשלות" - הן ממתינות בתור ומסונכרנות
 * אוטומטית כשחוזר החיבור, כך שהקולבק הזה נקרא רק על שגיאה אמיתית (למשל הרשאות).
 */
export function reportWriteError(e: unknown) {
  console.error('Firestore write failed', e)
  toast.error('השמירה נכשלה, נסו שוב')
}
