import { Link, useNavigate } from 'react-router-dom'
import { useCatalog } from '../api/useCatalog'
import PlantPicker from '../components/PlantPicker'

export default function CatalogPage() {
  const { plants, error } = useCatalog()
  const navigate = useNavigate()

  return (
    <section>
      <Link to="/garten" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
        ‹ Garten
      </Link>
      <h1 className="mb-4 text-xl font-semibold text-heading">Pflanzen-Katalog</h1>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!plants && !error && <p className="text-sm">Lädt …</p>}
      {plants && <PlantPicker plants={plants} onSelect={(plant) => navigate(`/garten/katalog/${plant.id}`)} />}
    </section>
  )
}
