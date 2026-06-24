import path from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

let withPWA: (config: NextConfig) => NextConfig
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWAInit = require('@ducanh2912/next-pwa') as (
    opts: Record<string, unknown>,
  ) => (config: NextConfig) => NextConfig
  withPWA = withPWAInit({
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
} catch {
  withPWA = (config: NextConfig) => config
}

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

// Évite que Turbopack prenne C:\VENV (package-lock.json parent) comme racine du monorepo
const appRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
