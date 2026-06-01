'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mediaUrls } from '@/lib/media'

const spaces = [
  {
    id: 'restauration',
    titleFr: 'Restauration',
    titleEn: 'Dining',
    subtitleFr: 'Restaurant · Lounge · Terrasse',
    subtitleEn: 'Restaurant · Lounge · Terrace',
    descFr:
      'Savourez une cuisine raffinée dans une ambiance unique. Menu gastronomique, bar impressionnant et terrasse ouverte.',
    descEn:
      'Savor refined cuisine in a unique atmosphere. Gourmet menu, impressive bar and open terrace.',
    href: '/restauration',
    image: mediaUrls.restaurant.restaurant,
    gradient: 'from-red-950/90 to-black/80',
    accentColor: 'text-tc-gold',
    buttonClass:
      'bg-tc-gold text-tc-black hover:shadow-[0_0_25px_rgba(212,175,55,0.5)]',
    bgFallback: 'from-red-950 to-tc-black',
  },
  {
    id: 'game-room',
    titleFr: 'Game Room',
    titleEn: 'Game Room',
    subtitleFr: 'Play and Chill',
    subtitleEn: 'Play and Chill',
    descFr:
      'Billard, VR, simulateurs, arcade… Une salle de jeux complète pour tous les profils, ouverte tous les jours.',
    descEn:
      'Billiards, VR, simulators, arcade… A complete game room for all profiles, open every day.',
    href: '/game-room',
    image: mediaUrls.gameRoom.gameroom1,
    gradient: 'from-purple-950/90 to-black/80',
    accentColor: 'text-tc-game-cyan',
    buttonClass:
      'border-2 border-tc-game-cyan text-tc-game-cyan hover:bg-tc-game-cyan/10 hover:shadow-[0_0_25px_rgba(0,229,255,0.4)]',
    bgFallback: 'from-purple-950 to-tc-black',
  },
]

function SpaceCard({
  space,
  locale,
  index,
  isInView,
}: {
  space: (typeof spaces)[number]
  locale: string
  index: number
  isInView: boolean
}) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [space.id])

  return (
    <motion.div
      initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15 }}
    >
      <Link
        href={`/${locale}${space.href}`}
        className="group relative block h-[500px] overflow-hidden rounded-lg"
      >
        <div
          className={cn('absolute inset-0 bg-gradient-to-br', space.bgFallback)}
        />
        {!imgError && (
          <Image
            src={space.image}
            alt={locale === 'fr' ? space.titleFr : space.titleEn}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t transition-opacity duration-300',
            space.gradient,
          )}
        />

        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <p
            className={cn(
              'mb-2 text-xs uppercase tracking-[0.3em]',
              space.accentColor,
            )}
          >
            {locale === 'fr' ? space.subtitleFr : space.subtitleEn}
          </p>
          <h3 className="mb-4 font-serif text-4xl font-bold text-white sm:text-5xl">
            {locale === 'fr' ? space.titleFr : space.titleEn}
          </h3>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-tc-cream/70">
            {locale === 'fr' ? space.descFr : space.descEn}
          </p>
          <div
            className={cn(
              'inline-flex w-fit items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300',
              space.buttonClass,
            )}
          >
            {locale === 'fr' ? 'Découvrir' : 'Explore'}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function SpaceCTA({ locale }: { locale: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-tc-dark px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 block text-xs uppercase tracking-[0.4em] text-tc-gold/60">
            {locale === 'fr' ? 'Choisissez votre expérience' : 'Choose your experience'}
          </span>
          <h2 className="font-serif text-4xl text-tc-cream sm:text-5xl">
            {locale === 'fr' ? 'Deux univers, une adresse' : 'Two worlds, one address'}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {spaces.map((space, i) => (
            <SpaceCard
              key={space.id}
              space={space}
              locale={locale}
              index={i}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
