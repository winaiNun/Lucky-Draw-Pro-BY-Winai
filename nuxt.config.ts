import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],

  app: {
    head: {
      title: 'Lucky Draw Pro',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'ระบบสุ่มนักเรียนสำหรับห้องเรียน พัฒนาโดย Winai Nunkratok' },
        { name: 'theme-color', content: '#0f172a' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800;900&display=swap',
        },
      ],
      script: [
        {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
          defer: true,
        },
        {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/canvas-confetti/1.9.2/confetti.browser.min.js',
          defer: true,
        },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'ระบบสุ่มนักเรียน',
      short_name: 'สุ่มนักเรียน',
      description: 'ระบบสุ่มนักเรียนสำหรับห้องเรียน พัฒนาโดย Winai Nunkratok',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config',
    exposeConfig: false,
    viewer: false,
  },

  compatibilityDate: '2024-01-01',
})
