import { CalendarCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BRAND } from '@/config/brand'

const NAV_LINKS = [
  { href: '#diferenciais', label: 'Diferenciais' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#galeria', label: 'Galeria' },
  { href: '#localizacao', label: 'Localização' },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-dark/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2 font-bold">
          {BRAND.logoUrl ? (
            <img
              src={BRAND.logoUrl}
              alt={BRAND.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : null}
          <span className="text-lg text-brand-primary">{BRAND.name}</span>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-brand-light/80 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-brand-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          to="/agendar"
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-dark transition hover:opacity-90"
        >
          <CalendarCheck className="h-4 w-4" />
          Agendar
        </Link>
      </div>
    </header>
  )
}
