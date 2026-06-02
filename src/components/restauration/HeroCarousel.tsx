'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'

const dishes = [
  'https://cqatekwthaiwvdabtfth.supabase.co/storage/v1/object/public/media/menu/la_fameuse_entrecote.webp',
  'https://cqatekwthaiwvdabtfth.supabase.co/storage/v1/object/public/media/menu/mix_grill_grand.webp',
  'https://cqatekwthaiwvdabtfth.supabase.co/storage/v1/object/public/media/menu/fruits_de_mer.webp',
  'https://cqatekwthaiwvdabtfth.supabase.co/storage/v1/object/public/media/menu/choupette.webp',
  'https://cqatekwthaiwvdabtfth.supabase.co/storage/v1/object/public/media/menu/margarita.webp',
]

const dishLabels = {
  fr: [
    'Entrecôte Fameuse',
    'Mix Grill Grand',
    'Fruits de mer',
    'Choupette',
    'Margarita',
  ],
  en: [
    'Famous Ribeye',
    'Grand Mix Grill',
    'Seafood',
    'Choupette',
    'Margarita',
  ],
}

export default function HeroCarousel({ locale }: { locale: string }) {
  const [current, setCurrent] = useState(0)
  const isFr = locale === 'fr'
  const labels = isFr ? dishLabels.fr : dishLabels.en

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % dishes.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 3500)
    return () => clearInterval(timer)
  }, [next])

  return (
    <section className="relative h-64 overflow-hidden pt-16 sm:h-80 md:pt-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Image
            src={dishes[current]}
            alt={`${labels[current]} — The Canteen's`}
            fill
            className="object-cover object-center"
            priority={current === 0}
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-tc-black" />

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
  )
}
