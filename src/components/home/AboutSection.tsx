'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function AboutSection({ locale }: { locale: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const content = {
    fr: {
      badge: 'Notre univers',
      title: "Bienvenue chez\nThe Canteen's",
      description:
        "Situé à Dragage, au cœur de Yaoundé, The Canteen's est bien plus qu'un restaurant. C'est un univers complet où la gastronomie rencontre le divertissement — des saveurs entre terroir camerounais, cuisine européenne et touches orientales, dans une ambiance alliant élégance et convivialité.",
      sub: 'Un espace pour chaque moment : dîner en amoureux au restaurant, soirée entre amis au lounge, brunch du dimanche, ou sessions gaming dans notre game room.',
    },
    en: {
      badge: 'Our universe',
      title: "Welcome to\nThe Canteen's",
      description:
        "Located in Dragage, at the heart of Yaoundé, The Canteen's is more than a restaurant. It's a complete universe where gastronomy meets entertainment — flavors blending Cameroonian heritage, European cuisine and Oriental touches, in an atmosphere combining elegance and conviviality.",
      sub: 'A space for every moment: romantic dinner at the restaurant, evening with friends at the lounge, Sunday brunch, or gaming sessions in our game room.',
    },
  }

  const t = locale === 'fr' ? content.fr : content.en

  return (
    <section ref={ref} className="bg-tc-dark px-4 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span className="mb-8 inline-block rounded-full border border-tc-gold/30 px-4 py-1.5 text-xs uppercase tracking-[0.4em] text-tc-gold">
            {t.badge}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mb-8 whitespace-pre-line font-serif text-4xl leading-tight text-tc-cream sm:text-5xl lg:text-6xl"
        >
          {t.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mb-8 h-px w-16 bg-tc-gold"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mb-6 text-lg leading-relaxed text-tc-cream/70"
        >
          {t.description}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="font-serif text-lg italic leading-relaxed text-tc-cream/50"
        >
          {t.sub}
        </motion.p>
      </div>
    </section>
  )
}
