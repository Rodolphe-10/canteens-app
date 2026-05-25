import Link from 'next/link'
import { PageBackNav } from '@/components/ui/BackButton'

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isEn = locale === 'en'
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-tc-black px-4 pt-32">
      <PageBackNav locale={locale} fallbackHref="/" />
      <h1 className="text-center font-serif text-4xl text-tc-cream">Contact</h1>
      <p className="text-center text-sm text-tc-cream/40">
        {isEn ? 'Choose your universe' : 'Choisissez votre univers'}
      </p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <Link
          href={`/${locale}/contact/restaurant`}
          className="border border-tc-gold/40 px-8 py-4 text-center text-sm uppercase tracking-widest text-tc-gold transition-all hover:bg-tc-gold/10"
        >
          🍽️ Restaurant & Lounge
        </Link>
        <Link
          href={`/${locale}/contact/game-room`}
          className="border border-tc-game-cyan/40 px-8 py-4 text-center text-sm uppercase tracking-widest text-tc-game-cyan transition-all hover:bg-tc-game-cyan/10"
        >
          🎮 Game Room
        </Link>
      </div>
    </div>
  )
}
