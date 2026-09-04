import { CalendarCheck2, CalendarPlus, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Appointment, PaymentPreference } from '@/types/database'
import { formatDateBR, formatShortTime } from '@/lib/date'

const PAYMENT_MESSAGES: Record<PaymentPreference, string> = {
  pix: 'Forma de pagamento: Pix — enviaremos as instruções pelo WhatsApp.',
  cartao: 'Forma de pagamento: Cartão — enviaremos o link de pagamento pelo WhatsApp.',
  pagar_no_local: 'Forma de pagamento: você paga no local, após o serviço.',
}

interface Props {
  appointment: Appointment
  serviceName: string
  professionalName: string
  onNewBooking: () => void
}

export function ConfirmationStep({
  appointment,
  serviceName,
  professionalName,
  onNewBooking,
}: Props) {
  const code = appointment.id.slice(0, 8).toUpperCase()

  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
        <CalendarCheck2 className="h-10 w-10 text-green-400" />
      </span>

      <div>
        <h2 className="text-2xl font-bold">
          Agendamento confirmado com sucesso!
        </h2>
        <p className="mt-1 text-brand-light/60">
          Te aguardamos aqui. Obrigado pela preferência!
        </p>
        <p className="mt-1 text-sm text-brand-light/50">
          Código: <strong className="text-brand-primary">{code}</strong>
        </p>
      </div>

      <p className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
        {PAYMENT_MESSAGES[appointment.payment_preference]}
      </p>

      <div className="w-full rounded-2xl border border-white/10 bg-brand-secondary/50 p-5 text-left text-sm">
        <ul className="space-y-2 text-brand-light/80">
          <li>
            Serviço: <strong className="text-brand-primary">{serviceName}</strong>
          </li>
          <li>Barbeiro: {professionalName}</li>
          <li>
            Data: {formatDateBR(appointment.appointment_date)} às{' '}
            {formatShortTime(appointment.start_time)}
          </li>
          <li>Cliente: {appointment.customer_name}</li>
        </ul>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onNewBooking}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-semibold text-brand-dark transition hover:opacity-90"
        >
          <CalendarPlus className="h-5 w-5" />
          Novo agendamento
        </button>
        <Link
          to="/"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 font-semibold transition hover:border-brand-primary hover:text-brand-primary"
        >
          <Home className="h-5 w-5" />
          Voltar ao site
        </Link>
      </div>
    </div>
  )
}
