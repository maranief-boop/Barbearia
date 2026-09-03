import { CalendarPlus, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useServices } from '@/hooks/useServices'
import { formatBRL } from '@/lib/date'

export function ServicesSection() {
  const { services, loading, error } = useServices()

  return (
    <section id="servicos" className="bg-brand-secondary/40 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold">
          Serviços e <span className="text-brand-primary">preços</span>
        </h2>
        <p className="mt-2 text-center text-brand-light/60">
          Valores transparentes, agendamento em um toque.
        </p>

        {error ? (
          <p className="mt-8 text-center text-red-400">
            Não foi possível carregar os serviços: {error}
          </p>
        ) : loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-brand-dark p-6 transition hover:border-brand-primary/40"
              >
                <h3 className="text-lg font-semibold text-brand-primary">
                  {service.name}
                </h3>
                {service.description ? (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-light/65">
                    {service.description}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {formatBRL(Number(service.price))}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-brand-light/50">
                    <Clock className="h-3.5 w-3.5" />
                    ≈ {service.duration_min} min
                  </span>
                </div>
                <Link
                  to={`/agendar?service=${service.id}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:opacity-90"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Agendar este serviço
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
