import path from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

// Évite que Turbopack prenne C:\VENV (package-lock.json parent) comme racine du monorepo
const appRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
}

export default withNextIntl(nextConfig)
