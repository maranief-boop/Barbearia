import { useState } from 'react'
import { BanknoteArrowDown, Loader2 } from 'lucide-react'
import type { PaymentMethod } from '@/types/database'
import { PAYMENT_METHOD_LABELS } from '@/types/database'
import {
  formatDateShort,
  formatBRL,
  formatShortTime,
} from '@/lib/date'
import {
  registerPayment,
  type AppointmentWithPayments,
} from '@/hooks/useUnpaidAppointments'

interface Props {
  appointments: AppointmentWithPayments[]
  onRegistered: () => void
}

/** Lista de atendimentos finalizados que ainda não tiveram recebimento. */
export function PendingPayments({ appointments, onRegistered }: Props) {
  if (appointments.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-brand-secondary/30 px-4 py-6 text-center text-sm text-brand-light/50">
        Nenhum recebimento pendente neste período.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {appointments.map((appt) => (
        <PendingPaymentRow key={appt.id} appointment={appt} onRegistered={onRegistered} />
      ))}
    </ul>
  )
}

function PendingPaymentRow({
  appointment: appt,
  onRegistered,
}: {
  appointment: AppointmentWithPayments
  onRegistered: () => void
}) {
  const [amount, setAmount] = useState(String(Number(appt.price)))
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReceive() {
    const value = Number(amount.replace(',', '.'))
    if (!Number.isFinite(value) || value < 0) {
      setError('Valor inválido.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await registerPayment({
        appointmentId: appt.id,
        professionalId: appt.professional_id,
        amount: value,
        method,
      })
      onRegistered()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="rounded-xl border border-white/10 bg-brand-dark p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{appt.customer_name}</span>
        <span className="text-sm text-brand-light/55">
          {appt.service?.name ?? '—'} · {formatDateShort(appt.appointment_date)} ·{' '}
          {formatShortTime(appt.start_time)}
          {appt.professional ? ` · ${appt.professional.name}` : ''}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-brand-secondary px-2.5 py-1.5">
          <BanknoteArrowDown className="h-4 w-4 text-brand-primary" />
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Valor recebido"
            className="w-20 bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          aria-label="Método de pagamento"
          className="rounded-lg border border-white/10 bg-brand-secondary px-2.5 py-2 text-sm outline-none focus:border-brand-primary"
        >
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleReceive}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-3.5 py-2 text-sm font-semibold text-brand-dark transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Receber
        </button>

        <span className="ml-auto text-xs text-brand-light/35">
          Sugerido: {formatBRL(Number(appt.price))}
        </span>
      </div>

      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </li>
  )
}
