import { NavLink, Outlet } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'
import { useAuth } from '../auth/useAuth'
import UserAvatar from './UserAvatar'
import { BookIcon, CheckIcon, HomeIcon, SparkIcon, SproutIcon } from './Icons'

const navItems: { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { to: '/', label: 'Übersicht', icon: HomeIcon },
  { to: '/garten', label: 'Garten', icon: SproutIcon },
  { to: '/tagebuch', label: 'Tagebuch', icon: BookIcon },
  { to: '/aufgaben', label: 'Aufgaben', icon: CheckIcon },
  { to: '/ki', label: 'KI', icon: SparkIcon },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <span className="text-lg font-semibold text-heading">Gartengeist</span>
        {user && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`${user.name} abmelden?`)) logout()
            }}
            className="flex min-h-11 items-center gap-2 rounded-full px-2 text-sm"
            aria-label={`Abmelden (${user.name})`}
          >
            <UserAvatar user={user} />
          </button>
        )}
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {navItems.map(({ to, label, icon: IconComponent }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
                    isActive ? 'font-semibold text-accent' : 'text-text'
                  }`
                }
              >
                <IconComponent className="size-6" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
