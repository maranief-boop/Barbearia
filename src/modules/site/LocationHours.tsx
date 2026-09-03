import { Clock, MapPin } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { useBusinessHours } from '@/hooks/useBusinessHours'
import { formatShortTime, weekdayName } from '@/lib/date'

export function LocationHours() {
  const { hours, loading, error } = useBusinessHours()
  const today = new Date().getDay()

  return (
    <section id="localizacao" className="bg-brand-secondary/40 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">
            Onde <span className="text-brand-primary">estamos</span>
          </h2>
          <p className="mt-4 inline-flex items-start gap-2 text-brand-light/75">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
            <span>
              {BRAND.address}
              <br />
              {BRAND.city}
            </span>
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            {BRAND.mapsEmbedUrl ? (
              <iframe
                src={BRAND.mapsEmbedUrl}
                title={`Mapa — ${BRAND.name}`}
                loading="lazy"
                className="h-64 w-full"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 bg-brand-dark text-brand-light/40">
                <MapPin className="h-8 w-8 text-brand-primary/60" />
                <p className="text-sm">
                  Configure VITE_BRAND_MAPS_EMBED para exibir o mapa
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Horários de <span className="text-brand-primary">funcionamento</span>
          </h2>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-brand-light/60">
            <Clock className="h-4 w-4 text-brand-primary" />
            Agendamento online disponível 24/7
          </p>

          {error ? (
            <p className="mt-6 text-red-400">Erro ao carregar horários: {error}</p>
          ) : loading ? (
            <div className="mt-6 space-y-2">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
              {hours.map((h) => (
                <li
                  key={h.id}
                  className={`flex items-center justify-between px-5 py-3 text-sm ${
                    h.weekday === today
                      ? 'bg-brand-primary/15 font-semibold text-brand-primary'
                      : 'bg-brand-dark text-brand-light/80'
                  }`}
                >
                  <span>{weekdayName(h.weekday)}</span>
                  <span>
                    {h.is_open
                      ? `${formatShortTime(h.open_time)} às ${formatShortTime(h.close_time)}`
                      : 'Fechado'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
