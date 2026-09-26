import { useAuth } from '../auth/useAuth'
import { useGarden } from '../garden/useGarden'

export default function DashboardPage() {
  const { user } = useAuth()
  const { garden } = useGarden()

  return (
    <section>
      <h1 className="text-xl font-semibold text-heading">Hallo {user?.name}!</h1>
      {garden && <p className="mt-1 text-sm">Garten in {garden.locationName}</p>}
      <p className="mt-4 text-sm">
        Hier erscheinen bald die heutigen Aufgaben, die nächste Ernte und Wetterwarnungen.
      </p>
    </section>
  )
}
