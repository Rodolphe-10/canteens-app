import MenuSection from '@/components/restauration/MenuSection'
import SpacesNav from '@/components/restauration/SpacesNav'
import HeroCarousel from '@/components/restauration/HeroCarousel'

export default async function RestaurationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <>
      <HeroCarousel locale={locale} />
      <MenuSection locale={locale} />
      <SpacesNav locale={locale} />
    </>
  )
}
