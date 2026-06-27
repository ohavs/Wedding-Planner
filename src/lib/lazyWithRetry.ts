import { lazy, type ComponentType } from 'react'

const RELOAD_KEY = 'wp:chunkReloaded'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Factory<T> = () => Promise<{ default: T }>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>

/**
 * עוטף React.lazy עם עמידות לכשלי טעינת chunk:
 * - מנסה שוב פעמיים (לחיבור רשת מקרטע)
 * - אם עדיין נכשל (בד"כ לאחר פריסת גרסה חדשה והאש שונה) - מרענן פעם אחת
 *   כדי למשוך את ה-index והקבצים העדכניים.
 */
export function lazyWithRetry<T extends AnyComponent>(factory: Factory<T>) {
  return lazy(async () => {
    let lastErr: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const mod = await factory()
        try {
          window.sessionStorage.removeItem(RELOAD_KEY)
        } catch {
          /* ignore */
        }
        return mod
      } catch (err) {
        lastErr = err
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      }
    }
    // ריענון חד-פעמי כמוצא אחרון
    try {
      if (!window.sessionStorage.getItem(RELOAD_KEY)) {
        window.sessionStorage.setItem(RELOAD_KEY, '1')
        window.location.reload()
        return await new Promise<{ default: T }>(() => {})
      }
    } catch {
      /* ignore */
    }
    throw lastErr
  })
}
