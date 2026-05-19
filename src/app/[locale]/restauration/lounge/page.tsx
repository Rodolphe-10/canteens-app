import SpacePage from '@/components/restauration/SpacePage'
import { loungeConfig } from '@/data/spaces'

export default async function LoungePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <SpacePage config={loungeConfig} locale={locale} />
}
