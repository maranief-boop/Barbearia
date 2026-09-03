import { useMemo, useState } from 'react'
import { CalendarClock, MessageCircle, Phone, Search, UserRound } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { formatDateBR, formatBRL } from '@/lib/date'
import { customerWaLink } from '@/config/brand'
import { CampaignPanel } from './CampaignPanel'

type InactivityFilter = 'todos' | '30' | '60' | '90' | 'sem_contato'

const INACTIVITY_OPTIONS: { key: InactivityFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: '30', label: 'Inativos 30+ dias' },
  { key: '60', label: 'Inativos 60+ dias' },
  { key: '90', label: 'Inativos 90+ dias' },
  { key: 'sem_contato', label: 'Nunca contactados' },
] as const

/** CRM: base de clientes com histórico e campanhas de reativação via WhatsApp. */
export function ClientesPage() {
  const { customers, loading, error, markContacted } = useCustomers()
  const [inactivity, setInactivity] = useState<InactivityFilter>('todos')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const now = Date.now()
    const cutoffs: Record<Exclude<InactivityFilter, 'todos' | 'sem_contato'>, number> = {
      '30': 30 * 86400000,
      '60': 60 * 86400000,
      '90': 90 * 86400000,
    }
    return customers.filter((c) => {
      if (inactivity === 'sem_contato') {
        if (c.last_contacted_at) return false
      } else if (inactivity !== 'todos') {
        if (!c.stats.lastVisit) return false
        if (now - new Date(c.stats.lastVisit).getTime() < cutoffs[inactivity]) return false
      }
      const q = search.trim().toLowerCase()
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.phone.includes(q.replace(/\D/g, ''))
      ) {
        return false
      }
      return true
    })
  }, [customers, inactivity, search])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap rounded-xl border border-white/10 bg-brand-secondary/50 p-1">
          {INACTIVITY_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setInactivity(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                inactivity === key
                  ? 'bg-brand-primary text-brand-dark'
                  : 'text-brand-light/60 hover:text-brand-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-brand-secondary/50 px-3 py-2 sm:max-w-xs">
          <Search className="h-4 w-4 shrink-0 text-brand-light/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome ou telefone"
            className="w-full bg-transparent text-sm outline-none placeholder:text-brand-light/30"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">Erro: {error}</p> : null}

      {/* Campanha */}
      <CampaignPanel
        customers={customers}
        selectedIds={selected}
        onSent={(id) => void markContacted(id)}
      />

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 py-16 text-center text-sm text-brand-light/40">
          Nenhum cliente encontrado com esses filtros.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => {
            const daysSince =
              c.stats.lastVisit !== null
                ? Math.floor((Date.now() - new Date(c.stats.lastVisit).getTime()) / 86400000)
                : null
            return (
              <li
                key={c.id}
                className={`rounded-2xl border bg-brand-dark p-4 transition ${
                  selected.has(c.id)
                    ? 'border-brand-primary/60'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Selecionar ${c.name}`}
                    className="mt-1 h-4 w-4 accent-[var(--brand-primary)]"
                  />

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 font-bold text-brand-primary">
                    {c.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-brand-light/60">
                      <Phone className="h-3.5 w-3.5" />
                      {formatPhoneBR(c.phone)}
                    </p>

                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-brand-light/45">
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="h-3 w-3" />
                        {c.stats.visits} {c.stats.visits === 1 ? 'visita' : 'visitas'}
                      </span>
                      <span>{formatBRL(c.stats.totalSpent)} no total</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {c.stats.lastVisit
                          ? `Última: ${formatDateBR(c.stats.lastVisit)}${c.stats.lastService ? ` (${c.stats.lastService})` : ''}${daysSince !== null ? ` · ${daysSince}d` : ''}`
                          : 'Sem visitas'}
                      </span>
                    </p>
                  </div>

                  <a
                    href={customerWaLink(
                      `Olá ${c.name.split(' ')[0]}! Tudo bem?`,
                      c.phone,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp de ${c.name}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-brand-light/50 transition hover:bg-white/5 hover:text-[#25d366]"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Formata para exibição: aceita "11999999999" e "5511999999999". */
function formatPhoneBR(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) {
    d = d.slice(2)
  }
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}
