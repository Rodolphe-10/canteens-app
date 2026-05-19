import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
  },
}

export default withNextIntl(nextConfig)
