import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/aufgaben', label: 'Aufgaben', end: true },
  { to: '/aufgaben/kalender', label: 'Kalender', end: false },
  { to: '/aufgaben/einkauf', label: 'Einkauf', end: false },
  { to: '/aufgaben/vorrat', label: 'Vorrat', end: false },
]

export default function TasksTabs() {
  return (
    <nav className="-mx-4 mb-5 grid grid-cols-4 border-b border-border px-4">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex min-h-11 items-center justify-center border-b-2 text-sm ${
              isActive ? 'border-accent font-semibold text-heading' : 'border-transparent'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
