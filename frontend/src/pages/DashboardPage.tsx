import { useAuth } from '../auth/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <section>
      <h1 className="text-xl font-semibold text-heading">Hallo {user?.name}!</h1>
      <p className="mt-2 text-sm">
        Hier erscheinen bald die heutigen Aufgaben, die nächste Ernte und Wetterwarnungen.
      </p>
    </section>
  )
}
