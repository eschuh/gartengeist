import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import Layout from './components/Layout'
import GardenProvider from './garden/GardenProvider'
import RequireGarden from './garden/RequireGarden'
import AreaDetailPage from './pages/AreaDetailPage'
import AreaEditPage from './pages/AreaEditPage'
import CalendarPage from './pages/CalendarPage'
import InventoryFormPage from './pages/InventoryFormPage'
import InventoryPage from './pages/InventoryPage'
import ShoppingPage from './pages/ShoppingPage'
import TaskFormPage from './pages/TaskFormPage'
import TasksPage from './pages/TasksPage'
import CatalogPage from './pages/CatalogPage'
import DashboardPage from './pages/DashboardPage'
import GardenPage from './pages/GardenPage'
import GardenSettingsPage from './pages/GardenSettingsPage'
import HarvestPage from './pages/HarvestPage'
import JournalEntryFormPage from './pages/JournalEntryFormPage'
import JournalPage from './pages/JournalPage'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'
import PlantDetailPage from './pages/PlantDetailPage'
import PlantingFormPage from './pages/PlantingFormPage'
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
                  <Route path="garten/flaechen/:id" element={<AreaDetailPage />} />
                  <Route path="garten/flaechen/:id/bearbeiten" element={<AreaEditPage />} />
                  <Route path="garten/flaechen/:areaId/bepflanzen" element={<PlantingFormPage />} />
                  <Route path="garten/bepflanzungen/:id" element={<PlantingFormPage />} />
                  <Route path="garten/katalog" element={<CatalogPage />} />
                  <Route path="garten/katalog/:id" element={<PlantDetailPage />} />
                  <Route path="tagebuch" element={<JournalPage />} />
                  <Route path="tagebuch/neu" element={<JournalEntryFormPage />} />
                  <Route path="tagebuch/ernte" element={<HarvestPage />} />
                  <Route path="tagebuch/:id" element={<JournalEntryFormPage />} />
                  <Route path="aufgaben" element={<TasksPage />} />
                  <Route path="aufgaben/neu" element={<TaskFormPage />} />
                  <Route path="aufgaben/kalender" element={<CalendarPage />} />
                  <Route path="aufgaben/einkauf" element={<ShoppingPage />} />
                  <Route path="aufgaben/vorrat" element={<InventoryPage />} />
                  <Route path="aufgaben/vorrat/neu" element={<InventoryFormPage />} />
                  <Route path="aufgaben/vorrat/:id" element={<InventoryFormPage />} />
                  <Route path="aufgaben/:id" element={<TaskFormPage />} />
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
