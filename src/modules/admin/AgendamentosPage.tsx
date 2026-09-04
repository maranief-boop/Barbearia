import { useMemo, useState } from 'react'
import { CalendarDays, Columns3, RefreshCcw } from 'lucide-react'
import { useAppointments } from '@/hooks/useAppointments'
import { useProfessionals } from '@/hooks/useProfessionals'
import {
  addMonths,
  getDateRange,
  startOfMonth,
  toISODate,
  type PeriodKey,
} from '@/lib/date'
import { KanbanBoard } from './KanbanBoard'
import { MonthCalendar } from './MonthCalendar'
import { PeriodTabs } from './PeriodTabs'

type ViewKey = 'kanban' | 'calendario'

/** Painel de agendamentos: Kanban (status) ou Calendário mensal. */
export function AgendamentosPage() {
  const [view, setView] = useState<ViewKey>('kanban')
  const [period, setPeriod] = useState<PeriodKey>('dia')
  const [professionalId, setProfessionalId] = useState('')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const { professionals } = useProfessionals()

  const { from, to } = useMemo(() => getDateRange(period), [period])
  const monthRange = useMemo(() => {
    const start = startOfMonth(month)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    return { from: toISODate(start), to: toISODate(end) }
  }, [month])

  const {
    appointments: kanbanAppointments,
    loading: kanbanLoading,
    error,
    refetch,
    updateStatus,
  } = useAppointments({ from, to, professionalId: professionalId || null })

  const {
    appointments: calendarAppointments,
    loading: calendarLoading,
    refetch: refetchCalendar,
  } = useAppointments({
    from: monthRange.from,
    to: monthRange.to,
    professionalId: professionalId || null,
  })

  const loading = view === 'kanban' ? kanbanLoading : calendarLoading

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Alternância de visualização */}
        <div className="flex rounded-xl border border-white/10 bg-brand-secondary/50 p-1">
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === 'kanban'
                ? 'bg-brand-primary text-brand-dark'
                : 'text-brand-light/60 hover:text-brand-light'
            }`}
          >
            <Columns3 className="h-4 w-4" />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView('calendario')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === 'calendario'
                ? 'bg-brand-primary text-brand-dark'
                : 'text-brand-light/60 hover:text-brand-light'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendário
          </button>
        </div>

        {/* Período (apenas no Kanban) */}
        {view === 'kanban' ? <PeriodTabs value={period} onChange={setPeriod} /> : null}

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
          onClick={() => void (view === 'kanban' ? refetch() : refetchCalendar())}
          aria-label="Atualizar"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-brand-light/60 transition hover:border-brand-primary hover:text-brand-primary"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">Erro: {error}</p> : null}

      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
      ) : view === 'kanban' ? (
        <KanbanBoard
          appointments={kanbanAppointments}
          showDate={period !== 'dia'}
          onStatusChange={(id, status) => void updateStatus(id, status)}
        />
      ) : (
        <MonthCalendar
          month={month}
          appointments={calendarAppointments}
          onPrevMonth={() => setMonth((m) => addMonths(m, -1))}
          onNextMonth={() => setMonth((m) => addMonths(m, 1))}
        />
      )}
    </div>
  )
}
