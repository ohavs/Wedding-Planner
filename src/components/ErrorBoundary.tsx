import { Component, type ReactNode } from 'react'

const RELOAD_KEY = 'wp:chunkReloaded'

function isChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /loading chunk|loading css chunk|dynamically imported module|importing a module script failed|failed to fetch/i.test(
    msg,
  )
}

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/** תופס שגיאות רינדור (כולל כשלי טעינת chunk) ומונע מסך לבן */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // כשל טעינת chunk - בד"כ גרסה חדשה; ריענון חד-פעמי אוטומטי
    if (isChunkError(error)) {
      try {
        if (!window.sessionStorage.getItem(RELOAD_KEY)) {
          window.sessionStorage.setItem(RELOAD_KEY, '1')
          window.location.reload()
        }
      } catch {
        /* ignore */
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col items-center justify-center px-7 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-4xl bg-cream-200 text-4xl">
            🔄
          </div>
          <h1 className="mb-1 text-2xl font-extrabold text-ink">רגע, טוענים מחדש…</h1>
          <p className="mb-6 text-ink-soft">משהו השתבש בטעינה. אפשר לנסות שוב.</p>
          <button
            onClick={() => {
              try {
                window.sessionStorage.removeItem(RELOAD_KEY)
              } catch {
                /* ignore */
              }
              window.location.reload()
            }}
            className="h-12 rounded-2xl bg-teal-500 px-6 font-semibold text-white shadow-float"
          >
            רענון
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
