import { BRAND } from '@/config/brand'

export function Gallery() {
  return (
    <section id="galeria" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-3xl font-bold">
        Nossa <span className="text-brand-primary">galeria</span>
      </h2>
      <p className="mt-2 text-center text-brand-light/60">
        Um ambiente pensado para você relaxar e sair no seu melhor estilo.
      </p>
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {BRAND.galleryImages.map((src) => (
          <img
            key={src}
            src={src}
            alt={`Foto do ambiente — ${BRAND.name}`}
            loading="lazy"
            className="aspect-square w-full rounded-2xl border border-white/10 object-cover transition hover:opacity-90"
          />
        ))}
      </div>
    </section>
  )
}
