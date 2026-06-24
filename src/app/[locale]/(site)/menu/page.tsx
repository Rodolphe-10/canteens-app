import type { Metadata } from 'next'
import MenuPageClient from './MenuPageClient'

export const metadata: Metadata = {
  title: "Menu — The Canteen's",
  description:
    'Découvrez notre menu : restauration, boissons, cocktails & plus.',
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <MenuPageClient locale={locale} />
}
