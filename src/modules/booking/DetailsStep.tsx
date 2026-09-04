import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Appointment, Service } from '@/types/database'
import { bookAppointment } from '@/lib/booking'
import { formatDateBR, formatBRL } from '@/lib/date'
import { ANY_PROFESSIONAL } from './ProfessionalStep'

interface Props {
  service: Service
  professionalId: string | 'any'
  professionalName: string
  date: string
  startTime: string
  /** Chamado com o agendamento criado (retorno da RPC). */
  onBooked: (appointment: Appointment) => void
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function DetailsStep({
  service,
  professionalId,
  professionalName,
  date,
  startTime,
  onBooked,
}: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameValid = name.trim().length >= 3
  const phoneValid = phone.replace(/\D/g, '').length >= 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValid || !phoneValid) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await bookAppointment({
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        serviceId: service.id,
        professionalId: professionalId === ANY_PROFESSIONAL ? null : professionalId,
        date,
        startTime,
      })
      onBooked(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/5 p-4 text-sm">
        <p className="font-semibold text-brand-primary">Resumo do agendamento</p>
        <ul className="mt-2 space-y-1 text-brand-light/80">
          <li>
            Serviço: <strong>{service.name}</strong> ({formatBRL(Number(service.price))})
          </li>
          <li>Barbeiro: {professionalName}</li>
          <li>Data: {formatDateBR(date)}</li>
          <li>Horário: {startTime}</li>
        </ul>
      </div>

      <div>
        <label htmlFor="booking-name" className="mb-1 block text-sm text-brand-light/70">
          Seu nome
        </label>
        <input
          id="booking-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome e sobrenome"
          autoComplete="name"
          className="w-full rounded-xl border border-white/10 bg-brand-secondary/50 px-4 py-3 outline-none transition focus:border-brand-primary"
        />
      </div>

      <div>
        <label htmlFor="booking-phone" className="mb-1 block text-sm text-brand-light/70">
          WhatsApp
        </label>
        <input
          id="booking-phone"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(11) 99999-9999"
          autoComplete="tel"
          className="w-full rounded-xl border border-white/10 bg-brand-secondary/50 px-4 py-3 outline-none transition focus:border-brand-primary"
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={!nameValid || !phoneValid || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-4 text-lg font-semibold text-brand-dark transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {submitting ? 'Confirmando...' : 'Confirmar agendamento'}
      </button>
    </form>
  )
}
