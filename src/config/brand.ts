type BrandColors = {
  primary: string
  secondary: string
  dark: string
  light: string
}

function env(key: string, fallback: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key]
  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

/**
 * Configuração central da marca (White-Label).
 * Todos os valores podem ser sobrescritos via variáveis de ambiente (arquivo .env).
 * Basta trocar o .env para transformar o sistema em outra barbearia.
 */
export const BRAND = {
  name: env('VITE_BRAND_NAME', 'Barbearia Navalha de Ouro'),
  tagline: env('VITE_BRAND_TAGLINE', 'Estilo clássico, acabamento moderno.'),
  logoUrl: env('VITE_BRAND_LOGO_URL', ''),
  colors: {
    primary: env('VITE_BRAND_PRIMARY', '#f59e0b'),
    secondary: env('VITE_BRAND_SECONDARY', '#1c1917'),
    dark: env('VITE_BRAND_DARK', '#0c0a09'),
    light: env('VITE_BRAND_LIGHT', '#fafaf9'),
  } satisfies BrandColors,
  whatsappNumber: env('VITE_BRAND_WHATSAPP', '5511999999999').replace(/\D/g, ''),
  whatsappMessage: env(
    'VITE_BRAND_WHATSAPP_MESSAGE',
    'Olá! Quero agendar um horário.',
  ),
  address: env('VITE_BRAND_ADDRESS', 'Rua das Tesouras, 123 - Centro'),
  city: env('VITE_BRAND_CITY', 'São Paulo - SP'),
  mapsEmbedUrl: env('VITE_BRAND_MAPS_EMBED', ''),
  instagram: env('VITE_BRAND_INSTAGRAM', ''),
  facebook: env('VITE_BRAND_FACEBOOK', ''),
  email: env('VITE_BRAND_EMAIL', ''),
  /** URLs das fotos da galeria (separadas por vírgula). */
  galleryImages: env(
    'VITE_BRAND_GALLERY',
    '/gallery/g1.svg,/gallery/g2.svg,/gallery/g3.svg,/gallery/g4.svg',
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** Intervalo mínimo (em minutos) entre os horários oferecidos no agendamento. */
  slotIntervalMin: 15,
} as const

/** Monta o link wa.me com mensagem preenchida para o WhatsApp da marca. */
export function waLink(
  message: string = BRAND.whatsappMessage,
  phone: string = BRAND.whatsappNumber,
): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

/**
 * Normaliza o telefone de um cliente para o formato internacional exigido
 * pelo wa.me: números brasileiros de 10-11 dígitos (DDD + número) recebem o
 * prefixo 55; números que já incluem o código do país passam inalterados.
 */
export function normalizeCustomerPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

/** Link wa.me para o WhatsApp de um cliente, com mensagem preenchida. */
export function customerWaLink(message: string, phone: string): string {
  return waLink(message, normalizeCustomerPhone(phone))
}

/** Aplica as cores da marca e o título no documento (chamado no boot). */
export function applyBrandTheme(): void {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', BRAND.colors.primary)
  root.style.setProperty('--brand-secondary', BRAND.colors.secondary)
  root.style.setProperty('--brand-dark', BRAND.colors.dark)
  root.style.setProperty('--brand-light', BRAND.colors.light)
  root.style.setProperty('color-scheme', 'dark')
  document.title = `${BRAND.name} — Agendamento Online`
}
