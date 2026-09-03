import { Mail, MapPin, MessageCircle } from 'lucide-react'
import { BRAND, waLink } from '@/config/brand'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-brand-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-brand-primary">{BRAND.name}</p>
          <p className="mt-2 text-sm text-brand-light/60">{BRAND.tagline}</p>
        </div>

        <div className="space-y-2 text-sm text-brand-light/70">
          <p className="font-semibold text-brand-light">Contato</p>
          <a
            href={waLink()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 transition hover:text-brand-primary"
          >
            <MessageCircle className="h-4 w-4 text-brand-primary" />
            WhatsApp
          </a>
          {BRAND.email ? (
            <a
              href={`mailto:${BRAND.email}`}
              className="flex items-center gap-2 transition hover:text-brand-primary"
            >
              <Mail className="h-4 w-4 text-brand-primary" />
              {BRAND.email}
            </a>
          ) : null}
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
            {BRAND.address} — {BRAND.city}
          </p>
        </div>

        <div className="space-y-2 text-sm text-brand-light/70">
          <p className="font-semibold text-brand-light">Navegação</p>
          <a href="#servicos" className="block transition hover:text-brand-primary">
            Serviços
          </a>
          <a href="#galeria" className="block transition hover:text-brand-primary">
            Galeria
          </a>
          <a href="#localizacao" className="block transition hover:text-brand-primary">
            Localização e horários
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-brand-light/40">
        © {year} {BRAND.name}. Todos os direitos reservados.
      </div>
    </footer>
  )
}
