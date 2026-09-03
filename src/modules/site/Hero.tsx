import { CalendarCheck, Clock, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND, waLink } from '@/config/brand'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 60% at 70% 20%, color-mix(in srgb, var(--brand-primary) 18%, transparent), transparent 70%)',
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/10 px-4 py-1.5 text-sm text-brand-primary">
          <Star className="h-4 w-4" />
          Agendamento online 24 horas
        </span>

        <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-6xl">
          Sua melhor versão começa com um{' '}
          <span className="text-brand-primary">bom corte</span>
        </h1>

        <p className="max-w-xl text-lg text-brand-light/70">
          {BRAND.tagline} Escolha o serviço, o barbeiro e o horário em menos de
          um minuto — sem ligação e sem espera.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/agendar"
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-4 text-lg font-semibold text-brand-dark shadow-lg shadow-brand-primary/25 transition hover:opacity-90"
          >
            <CalendarCheck className="h-5 w-5" />
            Agende Seu Horário
          </Link>
          <a
            href={waLink()}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-brand-light/25 px-8 py-4 text-lg font-semibold transition hover:border-brand-primary hover:text-brand-primary"
          >
            Chamar no WhatsApp
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-light/60">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-brand-primary" />
            {BRAND.address} — {BRAND.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-primary" />
            Seg a Sáb, das 9h às 19h
          </span>
        </div>
      </div>
    </section>
  )
}
