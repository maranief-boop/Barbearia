import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const brandName = env.VITE_BRAND_NAME || 'Barbearia Navalha de Ouro'
  const themeColor = env.VITE_BRAND_DARK || '#0c0a09'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: `${brandName} — Agendamento Online`,
          short_name: brandName,
          description:
            'Agende seu horário na barbearia 24/7: escolha o serviço, o barbeiro e o horário.',
          lang: 'pt-BR',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: themeColor,
          background_color: themeColor,
          icons: [
            {
              src: '/icons/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: 'index.html',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})

