import { useMemo } from 'react'
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd'
import { MessageCircle } from 'lucide-react'
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
  type AppointmentWithRelations,
} from '@/types/database'
import { formatDateShort, formatBRL, formatShortTime } from '@/lib/date'
import { customerWaLink } from '@/config/brand'

const COLUMNS: { status: AppointmentStatus; dotClass: string }[] = [
  { status: 'agendado', dotClass: 'bg-brand-primary' },
  { status: 'em_atendimento', dotClass: 'bg-sky-400' },
  { status: 'finalizado', dotClass: 'bg-green-400' },
  { status: 'cancelado', dotClass: 'bg-red-400/70' },
]

interface Props {
  appointments: AppointmentWithRelations[]
  /** Exibe a data no card (quando o período cobre mais de um dia). */
  showDate: boolean
  onStatusChange: (id: string, status: AppointmentStatus) => void
}

/** Kanban de agendamentos com drag-and-drop entre as colunas de status. */
export function KanbanBoard({ appointments, showDate, onStatusChange }: Props) {
  function handleDragEnd(result: DropResult) {
    const { destination, draggableId } = result
    if (!destination) return
    const destStatus = destination.droppableId as AppointmentStatus
    const appointment = appointments.find((a) => a.id === draggableId)
    if (!appointment || appointment.status === destStatus) return
    onStatusChange(draggableId, destStatus)
  }

  const byStatus = useMemo(() => {
    const map = new Map<AppointmentStatus, AppointmentWithRelations[]>(
      COLUMNS.map((c) => [c.status, []]),
    )
    for (const appt of appointments) {
      map.get(appt.status)?.push(appt)
    }
    return map
  }, [appointments])

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(({ status, dotClass }) => {
          const items = byStatus.get(status) ?? []
          return (
            <section key={status} className="flex w-72 shrink-0 flex-col">
              <header className="mb-2 flex items-center gap-2 px-1">
                <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                <h2 className="text-sm font-semibold">
                  {APPOINTMENT_STATUS_LABELS[status]}
                </h2>
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-brand-light/60">
                  {items.length}
                </span>
              </header>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-40 flex-1 flex-col gap-2 rounded-2xl border p-2 transition ${
                      snapshot.isDraggingOver
                        ? 'border-brand-primary/50 bg-brand-primary/5'
                        : 'border-white/10 bg-brand-secondary/30'
                    }`}
                  >
                    {items.map((appt, index) => (
                      <KanbanCard
                        key={appt.id}
                        appointment={appt}
                        index={index}
                        showDate={showDate}
                        onStatusChange={onStatusChange}
                      />
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && !snapshot.isDraggingOver ? (
                      <p className="py-6 text-center text-xs text-brand-light/30">
                        Arraste um card para cá
                      </p>
                    ) : null}
                  </div>
                )}
              </Droppable>
            </section>
          )
        })}
      </div>
    </DragDropContext>
  )
}

function KanbanCard({
  appointment: appt,
  index,
  showDate,
  onStatusChange,
}: {
  appointment: AppointmentWithRelations
  index: number
  showDate: boolean
  onStatusChange: (id: string, status: AppointmentStatus) => void
}) {
  return (
    <Draggable draggableId={appt.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`cursor-grab rounded-xl border border-white/10 bg-brand-dark p-3 transition active:cursor-grabbing ${
            snapshot.isDragging ? 'ring-2 ring-brand-primary' : 'hover:border-brand-primary/40'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-tight">{appt.customer_name}</p>
            <span className="shrink-0 text-sm font-bold text-brand-primary">
              {formatBRL(Number(appt.price))}
            </span>
          </div>

          <p className="mt-1 text-sm text-brand-light/60">
            {appt.service?.name ?? 'Serviço removido'}
          </p>

          <p className="mt-1 text-xs text-brand-light/50">
            {showDate ? `${formatDateShort(appt.appointment_date)} · ` : ''}
            {formatShortTime(appt.start_time)}–{formatShortTime(appt.end_time)}
            {appt.professional ? ` · ${appt.professional.name}` : ''}
          </p>

          <div className="mt-2 flex items-center gap-2 border-t border-white/5 pt-2">
            <select
              value={appt.status}
              onChange={(e) =>
                onStatusChange(appt.id, e.target.value as AppointmentStatus)
              }
              aria-label="Mudar status"
              className="rounded-lg border border-white/10 bg-brand-secondary px-2 py-1 text-xs outline-none focus:border-brand-primary"
            >
              {(Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {APPOINTMENT_STATUS_LABELS[s]}
                  </option>
                ),
              )}
            </select>

            <a
              href={customerWaLink(`Olá ${appt.customer_name}! Sobre seu agendamento...`, appt.customer_phone)}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp de ${appt.customer_name}`}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-brand-light/50 transition hover:bg-white/5 hover:text-[#25d366]"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </Draggable>
  )
}
