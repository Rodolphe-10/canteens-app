'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mediaUrls } from '@/lib/media'

const spaces = [
  {
    id: 'restaurant',
    labelFr: 'Le Restaurant',
    labelEn: 'The Restaurant',
    descFr: 'Gastronomie & élégance',
    descEn: 'Gastronomy & elegance',
    image: mediaUrls.restaurant.restaurant,
    gradient: 'from-red-950/80 to-black/90',
    fallback: 'from-red-950 to-tc-black',
  },
  {
    id: 'lounge',
    labelFr: 'Le Lounge',
    labelEn: 'The Lounge',
    descFr: 'Cocktails & ambiance',
    descEn: 'Cocktails & atmosphere',
    image: mediaUrls.lounge.lounge1,
    gradient: 'from-tc-navy/80 to-black/90',
    fallback: 'from-tc-navy to-tc-black',
  },
  {
    id: 'terrasse',
    labelFr: 'La Terrasse',
    labelEn: 'The Terrace',
    descFr: 'En plein air, à Dragage',
    descEn: 'Open air, in Dragage',
    image: mediaUrls.terrasse.terrasse1,
    gradient: 'from-stone-900/80 to-black/90',
    fallback: 'from-stone-800 to-tc-black',
  },
]

function SpaceCardLink({
  space,
  locale,
  index,
}: {
  space: (typeof spaces)[number]
  locale: string
  index: number
}) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [space.id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={`/${locale}/restauration/${space.id}`}
        className="group relative block h-72 overflow-hidden rounded-lg"
      >
        <div
          className={cn('absolute inset-0 bg-gradient-to-br', space.fallback)}
        />
        {!imgError && (
          <Image
            src={space.image}
            alt={locale === 'fr' ? space.labelFr : space.labelEn}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t',
            space.gradient,
          )}
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <p className="mb-1 text-xs uppercase tracking-widest text-tc-gold">
            {locale === 'fr' ? space.descFr : space.descEn}
          </p>
          <h3 className="mb-3 font-serif text-2xl font-bold text-white">
            {locale === 'fr' ? space.labelFr : space.labelEn}
          </h3>
          <div className="flex items-center gap-1 text-xs text-tc-cream/60 transition-colors group-hover:text-tc-gold">
            {locale === 'fr' ? "Voir l'espace" : 'View space'}
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function SpacesNav({ locale }: { locale: string }) {
  return (
    <section className="bg-tc-dark px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <span className="mb-4 block text-xs uppercase tracking-[0.4em] text-tc-gold/60">
            {locale === 'fr' ? 'Nos espaces' : 'Our spaces'}
          </span>
          <h2 className="font-serif text-4xl text-tc-cream">
            {locale === 'fr' ? 'Choisissez votre cadre' : 'Choose your setting'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {spaces.map((space, i) => (
            <SpaceCardLink key={space.id} space={space} locale={locale} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
