import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlaceholderPage from './pages/PlaceholderPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route
                path="garten"
                element={<PlaceholderPage title="Garten" description="Flächen und Bepflanzung – kommt als Nächstes." />}
              />
              <Route
                path="tagebuch"
                element={<PlaceholderPage title="Tagebuch" description="Einträge, Fotos und Ernte-Log – Phase 2." />}
              />
              <Route
                path="aufgaben"
                element={<PlaceholderPage title="Aufgaben" description="Aufgaben und Kalender – Phase 3." />}
              />
              <Route
                path="ki"
                element={<PlaceholderPage title="KI-Assistent" description="Chat mit Gartenkontext – Phase 5." />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
