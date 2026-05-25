'use client'

import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import BackButton from '@/components/ui/BackButton'

const spaces = [
  {
    id: 'restaurant',
    icon: '🕯️',
    nameFr: 'Le Restaurant',
    nameEn: 'The Restaurant',
    taglineFr: 'Gastronomie & Élégance',
    taglineEn: 'Gastronomy & Elegance',
    descFr:
      "Sol damier noir et blanc, nappes immaculées, lanternes chinoises rouges et murs en marbre sombre. Le restaurant The Canteen's incarne une gastronomie haut de gamme dans un écrin dramatique et élégant. Cuisine européenne, orientale et camerounaise.",
    descEn:
      "Black and white checkered floor, immaculate tablecloths, red Chinese lanterns and dark marble walls. The Canteen's restaurant embodies high-end gastronomy in a dramatic and elegant setting. European, Oriental and Cameroonian cuisine.",
    image: '/images/restaurant/restaurant.jpg',
    fallback: 'from-red-950 to-tc-black',
    accent: 'text-red-400',
    divider: 'bg-red-400',
    border: 'border-red-500/20',
    glow: 'rgba(220,38,38,0.1)',
    href: '/restauration/restaurant',
    details: ['80 couverts', "Ouvert jusqu'à 6H", 'Privatisation possible'],
    detailsEn: ['80 seats', 'Open until 6AM', 'Private hire available'],
    imagePosition: 'left' as const,
  },
  {
    id: 'lounge',
    icon: '🍸',
    nameFr: 'Le Lounge',
    nameEn: 'The Lounge',
    taglineFr: 'Cocktails & Ambiance Feutrée',
    taglineEn: 'Cocktails & Intimate Atmosphere',
    descFr:
      "Canapés en velours bleu nuit et émeraude, coussins dorés, plafond en bulles blanches sculpté, comptoir en marbre noir et DJ booth Pioneer. Le Lounge est l'espace de la soirée parfaite — cocktails signature, musique live et ambiance premium.",
    descEn:
      'Navy and emerald velvet sofas, golden cushions, sculpted white bubble ceiling, black marble counter and Pioneer DJ booth. The Lounge is the perfect evening space — signature cocktails, live music and premium atmosphere.',
    image: '/images/lounge/lounge1.jpg',
    fallback: 'from-tc-navy to-tc-black',
    accent: 'text-tc-gold',
    divider: 'bg-tc-gold',
    border: 'border-tc-gold/20',
    glow: 'rgba(212,175,55,0.1)',
    href: '/restauration/lounge',
    details: ['DJ booth Pioneer', 'Cocktails signature', 'Soirées DJ & Karaoké'],
    detailsEn: ['Pioneer DJ booth', 'Signature cocktails', 'DJ nights & Karaoke'],
    imagePosition: 'right' as const,
  },
  {
    id: 'terrasse',
    icon: '🌿',
    nameFr: 'La Terrasse',
    nameEn: 'The Terrace',
    taglineFr: 'En plein air, à Dragage',
    taglineEn: 'Open air, in Dragage',
    descFr:
      "Longue galerie couverte ouverte sur la rue animée de Dragage. Grandes baies vitrées, plafond industriel, vue sur les palmiers et l'effervescence du quartier. L'endroit idéal pour un déjeuner ensoleillé, un brunch entre amis ou un afterwork décontracté.",
    descEn:
      "Long covered gallery open to the lively Dragage street. Large glass bays, industrial ceiling, view of palm trees and the neighborhood's energy. The ideal spot for a sunny lunch, brunch with friends or relaxed afterwork.",
    image: '/images/terrasse/terrasse1.jpg',
    fallback: 'from-stone-800 to-tc-black',
    accent: 'text-amber-400',
    divider: 'bg-amber-400',
    border: 'border-amber-500/20',
    glow: 'rgba(245,158,11,0.1)',
    href: '/restauration/terrasse',
    details: ['Vue sur Dragage', 'Idéal brunch', 'Espace couvert & ventilé'],
    detailsEn: ['View over Dragage', 'Ideal for brunch', 'Covered & ventilated'],
    imagePosition: 'left' as const,
  },
  {
    id: 'game-room',
    icon: '🎮',
    nameFr: 'La Game Room',
    nameEn: 'The Game Room',
    taglineFr: 'Play and Chill',
    taglineEn: 'Play and Chill',
    descFr:
      "Néons RGB, consoles VR immersives, billard, baby-foot, simulateurs de rallye, flipper Star Wars et machines arcade. La Game Room The Canteen's est la salle de jeux la plus complète de Yaoundé — pour tous les âges, tous les profils.",
    descEn:
      "RGB neons, immersive VR consoles, billiards, foosball, rally simulators, Star Wars pinball and arcade machines. The Canteen's Game Room is Yaoundé's most complete game room — for all ages, all profiles.",
    image: '/images/game-room/gameroom1.jpg',
    fallback: 'from-purple-950 to-tc-black',
    accent: 'text-tc-game-cyan',
    divider: 'bg-tc-game-cyan',
    border: 'border-tc-game-cyan/20',
    glow: 'rgba(0,229,255,0.1)',
    href: '/game-room',
    details: ['10 jeux disponibles', 'Enfants 12H-18H', 'Adultes 12H-00H'],
    detailsEn: ['10 games available', 'Kids 12PM-6PM', 'Adults 12PM-Midnight'],
    imagePosition: 'right' as const,
  },
]

type Space = (typeof spaces)[number]

function SpaceSection({
  space,
  index,
  locale,
  isEn,
}: {
  space: Space
  index: number
  locale: string
  isEn: boolean
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [imgError, setImgError] = useState(false)
  const isLeft = space.imagePosition === 'left'
  const details = isEn ? space.detailsEn : space.details

  return (
    <section
      ref={ref}
      className="border-b border-white/5 px-4 py-20"
      style={{
        background: `radial-gradient(ellipse at ${isLeft ? 'left' : 'right'}, ${space.glow} 0%, transparent 60%)`,
      }}
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2"
          initial={false}
        >
          <motion.div
            initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className={cn(
              'group relative h-80 overflow-hidden sm:h-96 lg:h-[500px]',
              !isLeft && 'lg:order-2',
            )}
          >
            <div className={cn('absolute inset-0 bg-gradient-to-br', space.fallback)} />
            {!imgError && (
              <Image
                src={space.image}
                alt={isEn ? space.nameEn : space.nameFr}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={() => setImgError(true)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute left-6 top-6">
              <span
                className={cn('font-display text-6xl font-black opacity-20', space.accent)}
              >
                0{index + 1}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isLeft ? 40 : -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={cn('flex flex-col gap-6', !isLeft && 'lg:order-1')}
          >
            <div>
              <span className="mb-4 block text-3xl">{space.icon}</span>
              <p className={cn('mb-2 text-xs uppercase tracking-[0.3em]', space.accent)}>
                {isEn ? space.taglineEn : space.taglineFr}
              </p>
              <h2 className="font-serif mb-6 text-4xl text-tc-cream sm:text-5xl">
                {isEn ? space.nameEn : space.nameFr}
              </h2>
              <div className={cn('mb-6 h-px w-12', space.divider)} />
              <p className="text-lg leading-relaxed text-tc-cream/60">
                {isEn ? space.descEn : space.descFr}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {details.map((d, j) => (
                <span
                  key={j}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs',
                    space.border,
                    space.accent,
                  )}
                >
                  {d}
                </span>
              ))}
            </div>

            <Link
              href={`/${locale}${space.href}`}
              className={cn(
                'group inline-flex w-fit items-center gap-2 border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5',
                space.border,
                space.accent,
              )}
            >
              {isEn ? 'Discover' : 'Découvrir'}
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default function NosEspacesView({ locale }: { locale: string }) {
  const isEn = locale === 'en'

  return (
    <div className="min-h-screen bg-tc-black pt-20">
      <section className="border-b border-white/5 px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-left">
            <BackButton locale={locale} fallbackHref="/" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
          <span className="mb-8 inline-block rounded-full border border-tc-gold/20 px-4 py-1.5 text-xs uppercase tracking-[0.4em] text-tc-gold/60">
            {isEn ? 'The venue' : 'Le lieu'}
          </span>
          <h1 className="font-serif mb-6 text-5xl text-tc-cream sm:text-6xl">
            {isEn ? 'Our Spaces' : 'Nos Espaces'}
          </h1>
          <p className="text-lg leading-relaxed text-tc-cream/50">
            {isEn
              ? 'Four distinct universes under one roof — each with its own identity, atmosphere and experience.'
              : 'Quatre univers distincts sous un même toit — chacun avec sa propre identité, son ambiance et son expérience.'}
          </p>
          </motion.div>
        </div>
      </section>

      {spaces.map((space, i) => (
        <SpaceSection
          key={space.id}
          space={space}
          index={i}
          locale={locale}
          isEn={isEn}
        />
      ))}

      <section className="px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-md"
        >
          <p className="font-serif mb-3 text-2xl text-tc-cream">
            {isEn ? 'One address' : 'Une seule adresse'}
          </p>
          <p className="mb-6 text-sm text-tc-cream/40">
            Dragage, à côté du Club Camtel — Yaoundé, Cameroun
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/${locale}/restauration`}
              className="bg-tc-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-tc-black transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              {isEn ? 'Dining' : 'Restauration'}
            </Link>
            <Link
              href={`/${locale}/game-room`}
              className="border-2 border-tc-game-cyan px-6 py-3 text-xs font-bold uppercase tracking-widest text-tc-game-cyan transition-all hover:bg-tc-game-cyan/10"
            >
              Game Room
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
