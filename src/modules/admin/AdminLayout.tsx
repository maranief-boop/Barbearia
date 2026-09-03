import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CalendarDays, LogOut, Scissors, Users, Wallet } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { to: '/admin/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
] as const

/** Layout do painel administrativo: sidebar (desktop) + topbar (mobile). */
export function AdminLayout() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-brand-secondary/60 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <Scissors className="h-5 w-5 text-brand-primary" />
          <span className="font-bold text-brand-primary">{BRAND.name}</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-primary/15 text-brand-primary'
                    : 'text-brand-light/70 hover:bg-white/5 hover:text-brand-light'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <UserBox email={session?.user.email} onSignOut={handleSignOut} />
      </aside>

      {/* Topbar — mobile */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-dark/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="flex items-center gap-2 font-bold text-brand-primary">
              <Scissors className="h-5 w-5" />
              {BRAND.name}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sair"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-light/60 transition hover:bg-white/5 hover:text-brand-light"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-primary/15 text-brand-primary'
                      : 'text-brand-light/60'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function UserBox({
  email,
  onSignOut,
}: {
  email?: string
  onSignOut: () => void
}) {
  return (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-xs text-brand-light/50">{email}</p>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-light/70 transition hover:bg-white/5 hover:text-brand-light"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </div>
  )
}
