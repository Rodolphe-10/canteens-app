import SpacePage from '@/components/restauration/SpacePage'
import { terrasseConfig } from '@/data/spaces'

export default async function TerrassePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <SpacePage config={terrasseConfig} locale={locale} />
}
