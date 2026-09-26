import { inWindow, monthShort, type Plant } from '../api/plants'

const rows: { key: 'preCultivation' | 'directSowing' | 'plantingOut' | 'harvest'; label: string; color: string }[] = [
  { key: 'preCultivation', label: 'Vorziehen', color: 'bg-sky-500' },
  { key: 'directSowing', label: 'Säen', color: 'bg-amber-600' },
  { key: 'plantingOut', label: 'Pflanzen', color: 'bg-lime-600' },
  { key: 'harvest', label: 'Ernte', color: 'bg-red-500' },
]

export default function MonthCalendar({ plant }: { plant: Plant }) {
  const currentMonth = new Date().getMonth() + 1
  const visibleRows = rows.filter((row) => plant[row.key] !== null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 text-xs">
        <thead>
          <tr>
            <th className="w-20" />
            {monthShort.map((m, i) => (
              <th
                key={m}
                className={`px-0 py-1 text-center font-normal ${i + 1 === currentMonth ? 'font-semibold text-heading' : ''}`}
              >
                {m.charAt(0)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.key}>
              <th className="pr-2 text-left font-normal">{plant.category === 'blumen' && row.key === 'harvest' ? 'Blüte' : row.label}</th>
              {monthShort.map((m, i) => (
                <td
                  key={m}
                  className={`h-5 rounded-sm ${inWindow(i + 1, plant[row.key]) ? row.color : 'bg-surface'} ${
                    i + 1 === currentMonth ? 'ring-1 ring-heading/40' : ''
                  }`}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
