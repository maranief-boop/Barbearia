import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, X } from 'lucide-react'
import type { AppointmentWithRelations } from '@/types/database'
import {
  formatDateBR,
  formatBRL,
  formatShortTime,
  toISODate,
} from '@/lib/date'
import { customerWaLink } from '@/config/brand'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

interface Props {
  month: Date
  appointments: AppointmentWithRelations[]
  onPrevMonth: () => void
  onNextMonth: () => void
}

/**
 * Calendário mensal de agendamentos: cada dia exibe a quantidade de
 * atendimentos; clicar abre o painel do dia com detalhes e atalho de
 * WhatsApp.
 */
export function MonthCalendar({
  month,
  appointments,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const monthLabel = month.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const countByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const appt of appointments) {
      map.set(appt.appointment_date, (map.get(appt.appointment_date) ?? 0) + 1)
    }
    return map
  }, [appointments])

  const cells = useMemo(() => {
    const firstWeekday = month.getDay()
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate()
    const result: { iso: string; day: number; inMonth: boolean }[] = []

    // Dias finais do mês anterior (preenchem a primeira semana)
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const date = new Date(month.getFullYear(), month.getMonth(), -i)
      result.push({ iso: toISODate(date), day: date.getDate(), inMonth: false })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(month.getFullYear(), month.getMonth(), d)
      result.push({ iso: toISODate(date), day: d, inMonth: true })
    }
    // Completa a última semana com o mês seguinte
    while (result.length % 7 !== 0) {
      const last = result[result.length - 1]
      const date = new Date(last.iso + 'T12:00:00')
      date.setDate(date.getDate() + 1)
      result.push({ iso: toISODate(date), day: date.getDate(), inMonth: false })
    }
    return result
  }, [month])

  const todayIso = toISODate(new Date())
  const dayAppointments = selectedDay
    ? appointments
        .filter((a) => a.appointment_date === selectedDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
    : []

  return (
    <div>
      {/* Navegação do mês */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Mês anterior"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-brand-light/60 transition hover:border-brand-primary hover:text-brand-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Próximo mês"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-brand-light/60 transition hover:border-brand-primary hover:text-brand-primary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Grade */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="pb-1 text-center text-xs font-medium text-brand-light/40"
          >
            {wd}
          </div>
        ))}

        {cells.map(({ iso, day, inMonth }) => {
          const count = countByDay.get(iso) ?? 0
          const isToday = iso === todayIso
          const isSelected = iso === selectedDay
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelectedDay(iso)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border p-1 text-center transition ${
                !inMonth
                  ? 'border-transparent text-brand-light/20'
                  : isSelected
                    ? 'border-brand-primary bg-brand-primary/15'
                    : count > 0
                      ? 'border-brand-primary/30 bg-brand-primary/5 hover:border-brand-primary/60'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/20'
              } ${isToday && !isSelected ? 'ring-1 ring-brand-primary/50' : ''}`}
            >
              <span
                className={`text-sm font-semibold ${isToday ? 'text-brand-primary' : ''}`}
              >
                {day}
              </span>
              {count > 0 ? (
                <span className="rounded-full bg-brand-primary px-1.5 text-[10px] font-bold leading-4 text-brand-dark">
                  {count}
                </span>
              ) : (
                <span className="h-4" />
              )}
            </button>
          )
        })}
      </div>

      {/* Painel do dia */}
      {selectedDay ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/10 bg-brand-secondary p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold">{formatDateBR(selectedDay)}</h3>
                <p className="text-xs text-brand-light/50">
                  {dayAppointments.length === 0
                    ? 'Nenhum agendamento'
                    : `${dayAppointments.length} ${dayAppointments.length === 1 ? 'agendamento' : 'agendamentos'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-light/50 transition hover:bg-white/5 hover:text-brand-light"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {dayAppointments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 py-10 text-center text-sm text-brand-light/40">
                Dia livre. 😴
              </p>
            ) : (
              <ul className="space-y-2">
                {dayAppointments.map((appt) => (
                  <li
                    key={appt.id}
                    className="rounded-xl border border-white/10 bg-brand-dark p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {formatShortTime(appt.start_time)}–
                          {formatShortTime(appt.end_time)} · {appt.customer_name}
                        </p>
                        <p className="mt-0.5 text-sm text-brand-light/60">
                          {appt.service?.name ?? 'Serviço removido'} ·{' '}
                          {formatPhoneBR(appt.customer_phone)}
                          {appt.professional ? ` · ${appt.professional.name}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-brand-primary">
                        {formatBRL(Number(appt.price))}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                      <span className="text-xs capitalize text-brand-light/45">
                        {appt.status.replaceAll('_', ' ')}
                      </span>
                      <a
                        href={customerWaLink(
                          `Olá ${appt.customer_name}! Sobre seu agendamento em ${formatDateBR(appt.appointment_date)}...`,
                          appt.customer_phone,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Formata para exibição (duplicado propositalmente leve aqui). */
function formatPhoneBR(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}
