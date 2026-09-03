import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RefreshCcw, Wallet } from 'lucide-react'
import { useRevenueStats } from '@/hooks/useRevenueStats'
import { useUnpaidAppointments } from '@/hooks/useUnpaidAppointments'
import type { PaymentMethod } from '@/types/database'
import { PAYMENT_METHOD_LABELS } from '@/types/database'
import { formatDateShort, formatBRL, getDateRange, type PeriodKey } from '@/lib/date'
import { PeriodTabs } from './PeriodTabs'
import { PendingPayments } from './PendingPayments'

const METHOD_CARDS: { method: PaymentMethod; dotClass: string }[] = [
  { method: 'dinheiro', dotClass: 'bg-green-400' },
  { method: 'pix', dotClass: 'bg-sky-400' },
  { method: 'cartao', dotClass: 'bg-violet-400' },
] as const

/** Gestão financeira: recebimentos, fechamento por método e comissões. */
export function FinanceiroPage() {
  const [period, setPeriod] = useState<PeriodKey>('dia')
  const { from, to } = useMemo(() => getDateRange(period), [period])

  const { summary, loading, error, refetch } = useRevenueStats(from, to)
  const {
    appointments: unpaid,
    refetch: refetchUnpaid,
  } = useUnpaidAppointments(from, to)

  function refreshAll() {
    void refetch()
    void refetchUnpaid()
  }

  const chartData = useMemo(
    () =>
      summary.byDay.map((d) => ({
        day: formatDateShort(d.day),
        total: Number(d.total.toFixed(2)),
      })),
    [summary.byDay],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <PeriodTabs value={period} onChange={setPeriod} />
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

      {/* Resumo do período */}
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
              {formatBRL(summary.byMethod[method])}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico + comissões */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-brand-secondary/40 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-brand-light/70">
            Faturamento por dia
          </h2>
          {chartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-brand-light/40">
              Sem recebimentos no período.
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(v: number) => `R$${v}`}
                    width={64}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(value) => [formatBRL(Number(value)), 'Total']}
                    contentStyle={{
                      backgroundColor: 'var(--brand-secondary)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: 'var(--brand-light)',
                    }}
                  />
                  <Bar dataKey="total" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
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
                  className="rounded-xl border border-white/10 bg-brand-dark p-3"
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
