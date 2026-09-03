import { Clock } from 'lucide-react'
import type { Service } from '@/types/database'
import { formatBRL } from '@/lib/date'

interface Props {
  services: Service[]
  selectedId: string | null
  onSelect: (serviceId: string) => void
}

export function ServiceStep({ services, selectedId, onSelect }: Props) {
  if (services.length === 0) {
    return (
      <p className="text-center text-brand-light/60">
        Nenhum serviço disponível no momento.
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((service) => {
        const selected = service.id === selectedId
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selected
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-white/10 bg-brand-secondary/50 hover:border-brand-primary/40'
            }`}
          >
            <p className="font-semibold text-brand-primary">{service.name}</p>
            {service.description ? (
              <p className="mt-1 text-sm text-brand-light/60">
                {service.description}
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-lg font-bold">
                {formatBRL(Number(service.price))}
              </span>
              <span className="inline-flex items-center gap-1 text-brand-light/50">
                <Clock className="h-3.5 w-3.5" />
                {service.duration_min} min
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
