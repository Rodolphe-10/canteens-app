import SpacePage from '@/components/restauration/SpacePage'
import { restaurantConfig } from '@/data/spaces'

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <SpacePage config={restaurantConfig} locale={locale} />
}
