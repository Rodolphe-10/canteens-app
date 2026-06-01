import Image from 'next/image'
import MenuSection from '@/components/restauration/MenuSection'
import SpacesNav from '@/components/restauration/SpacesNav'
const HERO_ENTRECOTE_IMAGE =
  'https://cqatekwthaiwvdabtfth.supabase.co/storage/v1/object/public/media/menu/la_fameuse_entrecote.webp'

export default async function RestaurationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isFr = locale === 'fr'

  return (
    <>
      <section className="relative h-48 overflow-hidden pt-16 sm:h-64 md:pt-20">
        <Image
          src={HERO_ENTRECOTE_IMAGE}
          alt={
            isFr
              ? 'Entrecôte Fameuse — The Canteen\'s'
              : 'Famous Ribeye — The Canteen\'s'
          }
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-tc-black" />
        <div className="relative z-10 flex h-full items-center justify-center px-4">
          <div className="text-center">
            <h1 className="font-serif text-3xl text-tc-cream sm:text-4xl">
              {isFr ? 'Notre Carte' : 'Our Menu'}
            </h1>
            <p className="mt-2 text-xs uppercase tracking-widest text-tc-gold/60">
              {isFr
                ? 'Commande à emporter disponible'
                : 'Takeaway orders available'}
            </p>
          </div>
        </div>
      </section>

      <MenuSection locale={locale} />
      <SpacesNav locale={locale} />
    </>
  )
}
