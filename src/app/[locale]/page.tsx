import HeroGallery from '@/components/home/HeroGallery'
import AboutSection from '@/components/home/AboutSection'
import StatsSection from '@/components/home/StatsSection'
import SpaceCTA from '@/components/home/SpaceCTA'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <>
      <HeroGallery locale={locale} />
      <AboutSection locale={locale} />
      <StatsSection locale={locale} />
      <SpaceCTA locale={locale} />
    </>
  )
}
