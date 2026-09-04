import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RefreshCcw, TrendingUp, Wallet } from 'lucide-react'
import { useRevenueStats } from '@/hooks/useRevenueStats'
import { useUnpaidAppointments } from '@/hooks/useUnpaidAppointments'
import { useAppointments } from '@/hooks/useAppointments'
import { useProfessionals } from '@/hooks/useProfessionals'
import type { PaymentMethod } from '@/types/database'
import { PAYMENT_METHOD_LABELS } from '@/types/database'
import {
  formatDateShort,
  formatBRL,
  getDateRange,
  toISODate,
  type PeriodKey,
} from '@/lib/date'
import { PeriodTabs } from './PeriodTabs'
import { PendingPayments } from './PendingPayments'

const METHOD_CARDS: { method: PaymentMethod; dotClass: string }[] = [
  { method: 'dinheiro', dotClass: 'bg-green-400' },
  { method: 'pix', dotClass: 'bg-sky-400' },
  { method: 'cartao', dotClass: 'bg-violet-400' },
] as const

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--brand-secondary)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: 'var(--brand-light)',
  fontSize: 13,
} as const

/** Gestão financeira: linha temporal, fechamento de caixa e comissões. */
export function FinanceiroPage() {
  const [period, setPeriod] = useState<PeriodKey>('dia')
  const [professionalId, setProfessionalId] = useState('')
  const { professionals } = useProfessionals()

  const { from, to } = useMemo(() => getDateRange(period), [period])

  const { summary, loading, error, refetch } = useRevenueStats(
    from,
    to,
    professionalId || null,
  )
  const {
    appointments,
    refetch: refetchAppointments,
  } = useAppointments({ from, to })
  const {
    appointments: unpaid,
    refetch: refetchUnpaid,
  } = useUnpaidAppointments(from, to)

  function refreshAll() {
    void refetch()
    void refetchAppointments()
    void refetchUnpaid()
  }

  const focusedProfessional = professionalId
    ? summary.byProfessional.find((p) => p.id === professionalId) ?? null
    : null
  const focusedInfo = professionalId
    ? professionals.find((p) => p.id === professionalId) ?? null
    : null

  /** Linha temporal: por hora (hoje) ou por dia (semana/mês/ano). */
  const chartData = useMemo(() => {
    if (period === 'dia') {
      const countByHour = new Map<number, number>()
      for (const appt of appointments) {
        const hour = Number(appt.start_time.slice(0, 2))
        countByHour.set(hour, (countByHour.get(hour) ?? 0) + 1)
      }
      // Volume de agendamentos por hora (7h às 20h); a receita do dia
      // já fica visível nos cards de fechamento de caixa acima.
      return Array.from({ length: 14 }, (_, i) => {
        const hour = i + 7
        return {
          label: `${hour}h`,
          agendamentos: countByHour.get(hour) ?? 0,
          faturamento: null as number | null,
        }
      })
    }

    const revenueByDay = new Map(summary.byDay.map((d) => [d.day, d.total]))
    const countByDay = new Map<string, number>()
    for (const appt of appointments) {
      countByDay.set(
        appt.appointment_date,
        (countByDay.get(appt.appointment_date) ?? 0) + 1,
      )
    }

    // Preenche todos os dias do intervalo para continuidade da linha
    const points: {
      label: string
      agendamentos: number
      faturamento: number
    }[] = []
    const cursor = new Date(from + 'T12:00:00')
    const end = new Date(to + 'T12:00:00')
    while (cursor <= end) {
      const iso = toISODate(cursor)
      points.push({
        label: formatDateShort(iso),
        agendamentos: countByDay.get(iso) ?? 0,
        faturamento: Number((revenueByDay.get(iso) ?? 0).toFixed(2)),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    // Limita o "Ano" a pontos mensais para legibilidade
    if (period === 'ano') {
      const monthly = new Map<string, { faturamento: number; agendamentos: number }>()
      let currentKey = ''
      for (const p of points) {
        const [y, m] = p.label.split('/')
        currentKey = `${m}/${y}`
        const acc = monthly.get(currentKey) ?? { faturamento: 0, agendamentos: 0 }
        acc.faturamento += p.faturamento
        acc.agendamentos += p.agendamentos
        monthly.set(currentKey, acc)
      }
      return [...monthly.entries()].map(([label, acc]) => ({
        label,
        agendamentos: acc.agendamentos,
        faturamento: Number(acc.faturamento.toFixed(2)),
      }))
    }
    return points
  }, [period, appointments, summary.byDay, from, to])

  const hasRevenueLine = period !== 'dia'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <PeriodTabs value={period} onChange={setPeriod} />
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
          onClick={refreshAll}
          aria-label="Atualizar"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-brand-light/60 transition hover:border-brand-primary hover:text-brand-primary"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">Erro: {error}</p> : null}

      {/* Comissão focada no barbeiro selecionado */}
      {focusedProfessional ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-primary/40 bg-brand-primary/10 p-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-primary">
              <TrendingUp className="h-4 w-4" />
              {focusedInfo?.name ?? 'Barbeiro'}
            </p>
            <p className="mt-1 text-xs text-brand-light/60">
              {focusedProfessional.count}{' '}
              {focusedProfessional.count === 1 ? 'recebimento' : 'recebimentos'} no
              período · comissão{' '}
              {focusedInfo ? Number(focusedInfo.commission_pct) : 0}%
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-xs text-brand-light/60">Faturamento focado</p>
              <p className="text-2xl font-bold">
                {formatBRL(focusedProfessional.gross)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-light/60">Comissão</p>
              <p className="text-2xl font-bold text-brand-primary">
                {formatBRL(focusedProfessional.commission)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Resumo / fechamento de caixa do período */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-5">
          <p className="flex items-center gap-2 text-sm text-brand-primary">
            <Wallet className="h-4 w-4" />
            Receita total
          </p>
          <p className="mt-2 text-3xl font-bold">{formatBRL(summary.total)}</p>
          <p className="mt-1 text-xs text-brand-light/50">
            {summary.count} {summary.count === 1 ? 'recebimento' : 'recebimentos'}
          </p>
        </div>

        {METHOD_CARDS.map(({ method, dotClass }) => (
          <div
            key={method}
            className="rounded-2xl border border-white/10 bg-brand-secondary/40 p-5"
          >
            <p className="flex items-center gap-2 text-sm text-brand-light/60">
              <span className={`h-2 w-2 rounded-full ${dotClass}`} />
              {PAYMENT_METHOD_LABELS[method]}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {formatBRL(summary.byMethod[method].total)}
            </p>
            <p className="mt-1 text-xs text-brand-light/40">
              {summary.byMethod[method].count}{' '}
              {summary.byMethod[method].count === 1 ? 'recebimento' : 'recebimentos'}
            </p>
          </div>
        ))}
      </div>

      {/* Linha temporal + comissões */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-brand-secondary/40 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-brand-light/70">
            {period === 'dia'
              ? 'Agendamentos por hora (hoje)'
              : 'Evolução no período'}
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="agendamentos"
                  allowDecimals={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  width={32}
                />
                {hasRevenueLine ? (
                  <YAxis
                    yAxisId="faturamento"
                    orientation="right"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    tickFormatter={(v: number) => `R$${v}`}
                    width={64}
                  />
                ) : null}
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) =>
                    name === 'faturamento'
                      ? [formatBRL(Number(value)), 'Faturamento']
                      : [String(value), 'Agendamentos']
                  }
                />
                {hasRevenueLine ? (
                  <Line
                    yAxisId="faturamento"
                    type="monotone"
                    dataKey="faturamento"
                    stroke="var(--brand-primary)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ) : null}
                <Line
                  yAxisId="agendamentos"
                  type="monotone"
                  dataKey="agendamentos"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {hasRevenueLine ? (
            <div className="mt-2 flex gap-5 text-xs text-brand-light/50">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-brand-primary" />
                Faturamento
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-sky-400" />
                Agendamentos
              </span>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-brand-secondary/40 p-5">
          <h2 className="text-sm font-semibold text-brand-light/70">
            Por barbeiro (comissões)
          </h2>
          {summary.byProfessional.length === 0 ? (
            <p className="py-16 text-center text-sm text-brand-light/40">
              Sem recebimentos no período.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {summary.byProfessional.map((prof) => (
                <li
                  key={prof.id}
                  className={`rounded-xl border p-3 ${
                    prof.id === professionalId
                      ? 'border-brand-primary/50 bg-brand-primary/10'
                      : 'border-white/10 bg-brand-dark'
                  }`}
                >
                  <p className="font-medium">{prof.name}</p>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-brand-light/60">
                      Recebido: {formatBRL(prof.gross)}
                    </span>
                    <span className="font-semibold text-brand-primary">
                      Comissão: {formatBRL(prof.commission)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* A receber */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-brand-light/70">
          A receber ({unpaid.length})
        </h2>
        <PendingPayments appointments={unpaid} onRegistered={refreshAll} />
      </section>
    </div>
  )
}
