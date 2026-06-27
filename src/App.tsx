import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { WeddingProvider, useWedding } from './context/WeddingContext'
import { AppShell } from './components/layout/AppShell'
import { FullScreenLoader } from './components/ui/Spinner'

import Login from './pages/Login'
import SetupRequired from './pages/SetupRequired'

const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Guests = lazy(() => import('./pages/Guests'))
const Budget = lazy(() => import('./pages/Budget'))
const Vendors = lazy(() => import('./pages/Vendors'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Gifts = lazy(() => import('./pages/Gifts'))
const DaySchedule = lazy(() => import('./pages/DaySchedule'))
const Inspiration = lazy(() => import('./pages/Inspiration'))
const More = lazy(() => import('./pages/More'))
const Settings = lazy(() => import('./pages/Settings'))

function RequireWedding() {
  const { weddings, loading } = useWedding()
  if (loading) return <FullScreenLoader label="טוען את החתונה שלך..." />
  if (weddings.length === 0) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

function Gate() {
  const { user, loading, configured } = useAuth()

  if (!configured) return <SetupRequired />
  if (loading) return <FullScreenLoader label="רגע אחד..." />
  if (!user) return <Login />

  return (
    <WeddingProvider>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<RequireWedding />}>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="guests" element={<Guests />} />
              <Route path="budget" element={<Budget />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="gifts" element={<Gifts />} />
              <Route path="schedule" element={<DaySchedule />} />
              <Route path="inspiration" element={<Inspiration />} />
              <Route path="more" element={<More />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </WeddingProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2600,
            style: {
              background: 'rgb(var(--c-surface))',
              color: 'rgb(var(--c-ink))',
              borderRadius: '1rem',
              boxShadow: '0 10px 30px -12px rgba(0,0,0,0.35)',
              fontWeight: 600,
              fontSize: '14px',
              direction: 'rtl',
              fontFamily: 'Rubik, sans-serif',
            },
            success: { iconTheme: { primary: '#2D8088', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EC6A6A', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
