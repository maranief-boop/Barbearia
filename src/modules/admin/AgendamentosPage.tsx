import { useMemo, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { useAppointments } from '@/hooks/useAppointments'
import { useProfessionals } from '@/hooks/useProfessionals'
import { getDateRange, type PeriodKey } from '@/lib/date'
import { KanbanBoard } from './KanbanBoard'
import { PeriodTabs } from './PeriodTabs'

/** Painel de agendamentos em Kanban com filtros de período e barbeiro. */
export function AgendamentosPage() {
  const [period, setPeriod] = useState<PeriodKey>('dia')
  const [professionalId, setProfessionalId] = useState('')
  const { professionals } = useProfessionals()

  const { from, to } = useMemo(() => getDateRange(period), [period])
  const {
    appointments,
    loading,
    error,
    refetch,
    updateStatus,
  } = useAppointments({
    from,
    to,
    professionalId: professionalId || null,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <PeriodTabs value={period} onChange={setPeriod} />

        {/* Barbeiro */}
        <select
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
          className="rounded-xl border border-white/10 bg-brand-secondary/50 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">Todos os barbeiros</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void refetch()}
          aria-label="Atualizar"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-brand-light/60 transition hover:border-brand-primary hover:text-brand-primary"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">Erro: {error}</p> : null}

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 w-72 shrink-0 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : (
        <KanbanBoard
          appointments={appointments}
          showDate={period !== 'dia'}
          onStatusChange={(id, status) => void updateStatus(id, status)}
        />
      )}
    </div>
  )
}
