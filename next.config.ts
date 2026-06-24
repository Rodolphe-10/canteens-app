import path from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'
import withPWAInit from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'supabase-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 7 },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/menu_items.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'menu-api',
          expiration: { maxEntries: 5, maxAgeSeconds: 86400 },
        },
      },
    ],
  },
})

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

// Évite que Turbopack prenne C:\VENV (package-lock.json parent) comme racine du monorepo
const appRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: appRoot,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cqatekwthaiwvdabtfth.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'd2nagnwby8accc.cloudfront.net',
        port: '',
        pathname: '/companies/products/**',
      },
    ],
  },
}

export default withPWA(withNextIntl(nextConfig))
