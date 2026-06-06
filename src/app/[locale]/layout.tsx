import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
export const metadata: Metadata = {
  title: "The Canteen's — Restaurant · Bar · Lounge · Game Room",
  description:
    "The Canteen's à Dragage, Yaoundé. Restaurant gastronomique, lounge bar chic et game room — une expérience unique.",
  keywords: ['restaurant', 'yaoundé', 'dragage', 'lounge', 'game room', 'canteens'],
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
  )
}
