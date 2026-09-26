import { Navigate, Outlet } from 'react-router-dom'
import { useGarden } from './useGarden'

export default function RequireGarden() {
  const { garden, error } = useGarden()

  if (error) {
    return <div className="flex min-h-dvh items-center justify-center px-6 text-center text-sm text-danger">{error}</div>
  }

  if (garden === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-sm">Lädt …</div>
  }

  if (garden === null) return <Navigate to="/einrichtung" replace />

  return <Outlet />
}
