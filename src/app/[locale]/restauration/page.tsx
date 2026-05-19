import Image from 'next/image'
import MenuSection from '@/components/restauration/MenuSection'
import SpacesNav from '@/components/restauration/SpacesNav'

export default async function RestaurationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <>
      <div className="border-b border-white/5 bg-tc-dark px-4 pb-8 pt-16 text-center md:pt-20">
        <div className="relative mx-auto mb-6 h-14 w-48">
          <Image
            src="/images/logos/logo_restaurant1.jpg"
            alt="The Canteen's"
            fill
            className="object-contain"
            priority
          />
        </div>
        <p className="text-xs uppercase tracking-[0.4em] text-tc-cream/40">
          {locale === 'fr'
            ? 'Notre carte — Commande à emporter disponible'
            : 'Our menu — Takeaway orders available'}
        </p>
      </div>

      <MenuSection locale={locale} />
      <SpacesNav locale={locale} />
    </>
  )
}
