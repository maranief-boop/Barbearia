import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Scissors } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { useServices } from '@/hooks/useServices'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useBusinessHours } from '@/hooks/useBusinessHours'
import type { Appointment } from '@/types/database'
import { ANY_PROFESSIONAL, ProfessionalStep } from './ProfessionalStep'
import { ServiceStep } from './ServiceStep'
import { DateStep } from './DateStep'
import { TimeStep } from './TimeStep'
import { DetailsStep } from './DetailsStep'
import { ConfirmationStep } from './ConfirmationStep'

const STEP_LABELS = ['Serviço', 'Barbeiro', 'Data', 'Horário', 'Seus dados'] as const

const STEP_TITLES = [
  'Escolha o serviço',
  'Escolha o barbeiro',
  'Escolha a data',
  'Escolha o horário',
  'Confirme seus dados',
] as const

/**
 * PWA de agendamento 24/7 — wizard mobile-first:
 * Serviço → Barbeiro → Data → Horário → Dados → Confirmação.
 */
export function BookingPage() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [serviceId, setServiceId] = useState<string | null>(
    searchParams.get('service'),
  )
  const [professionalId, setProfessionalId] = useState<string | 'any' | undefined>(
    undefined,
  )
  const [date, setDate] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)

  const { services } = useServices()
  const { professionals } = useProfessionals()
  const { byWeekday } = useBusinessHours()

  const service = services.find((s) => s.id === serviceId) ?? null
  const professional =
    professionalId && professionalId !== ANY_PROFESSIONAL
      ? professionals.find((p) => p.id === professionalId) ?? null
      : null
  const professionalName = professional?.name ?? 'Sem preferência'

  const canContinue =
    (step === 0 && serviceId !== null) ||
    (step === 1 && professionalId !== undefined) ||
    (step === 2 && date !== null) ||
    (step === 3 && startTime !== null) ||
    step === 4

  function reset() {
    setStep(0)
    setServiceId(null)
    setProfessionalId(undefined)
    setDate(null)
    setStartTime(null)
    setAppointment(null)
  }

  if (appointment && service) {
    return (
      <BookingShell step={5}>
        <ConfirmationStep
          appointment={appointment}
          serviceName={service.name}
          professionalName={professionalName}
          onNewBooking={reset}
        />
      </BookingShell>
    )
  }

  return (
    <BookingShell step={step}>
      {step === 0 ? (
        <ServiceStep
          services={services}
          selectedId={serviceId}
          onSelect={setServiceId}
        />
      ) : null}

      {step === 1 ? (
        <ProfessionalStep
          professionals={professionals}
          selected={professionalId}
          onSelect={setProfessionalId}
        />
      ) : null}

      {step === 2 ? (
        <DateStep byWeekday={byWeekday} selectedDate={date} onSelect={setDate} />
      ) : null}

      {step === 3 && service && date ? (
        <TimeStep
          professionalId={
            professionalId === ANY_PROFESSIONAL ? null : professionalId ?? null
          }
          date={date}
          durationMin={service.duration_min}
          selectedTime={startTime}
          onSelect={setStartTime}
        />
      ) : null}

      {step === 4 && service && date && startTime ? (
        <DetailsStep
          service={service}
          professionalId={professionalId ?? ANY_PROFESSIONAL}
          professionalName={professionalName}
          date={date}
          startTime={startTime}
          onBooked={(created) => {
            setAppointment(created)
            setStep(5)
          }}
        />
      ) : null}

      {step < 4 ? (
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition enabled:hover:border-brand-primary enabled:hover:text-brand-primary disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={!canContinue}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-brand-dark transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </BookingShell>
  )
}

function BookingShell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-dark/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-bold text-brand-primary">
            <Scissors className="h-5 w-5" />
            {BRAND.name}
          </a>
          <span className="text-sm text-brand-light/50">
            {step < 5 ? `Etapa ${step + 1} de ${STEP_LABELS.length}` : 'Concluído'}
          </span>
        </div>
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-brand-primary transition-all duration-300"
            style={{ width: `${(Math.min(step, 5) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {step < 5 ? (
          <h1 className="mb-6 text-2xl font-bold">{STEP_TITLES[step]}</h1>
        ) : null}
        {children}
      </main>
    </div>
  )
}
