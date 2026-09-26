import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import Layout from './components/Layout'
import GardenProvider from './garden/GardenProvider'
import RequireGarden from './garden/RequireGarden'
import AreaEditPage from './pages/AreaEditPage'
import DashboardPage from './pages/DashboardPage'
import GardenPage from './pages/GardenPage'
import GardenSettingsPage from './pages/GardenSettingsPage'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'
import SetupWizardPage from './pages/SetupWizardPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<GardenProvider />}>
              <Route path="einrichtung" element={<SetupWizardPage />} />
              <Route element={<RequireGarden />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="garten" element={<GardenPage />} />
                  <Route path="garten/einstellungen" element={<GardenSettingsPage />} />
                  <Route path="garten/flaechen/neu" element={<AreaEditPage />} />
                  <Route path="garten/flaechen/:id" element={<AreaEditPage />} />
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
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
