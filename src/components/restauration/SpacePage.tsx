'use client'

import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import InfiniteGalleryStrip from '@/components/ui/InfiniteGalleryStrip'

export interface SpaceConfig {
  id: string
  nameEn: string
  nameFr: string
  taglineFr: string
  taglineEn: string
  descriptionFr: string
  descriptionEn: string
  ambianceFr: string[]
  ambianceEn: string[]
  featuresFr: string[]
  featuresEn: string[]
  images: string[]
  reservationSlug: 'restaurant' | 'lounge' | 'terrasse'
  fallbackGradient: string
  accentColor: string
  borderColor: string
  badgeColor: string
  nextSpace?: { hrefSuffix: string; labelFr: string; labelEn: string }
  prevSpace?: { hrefSuffix: string; labelFr: string; labelEn: string }
}

function dividerFromBorder(borderColor: string) {
  return borderColor.replace(/^border-/, 'bg-')
}

export default function SpacePage({
  config,
  locale,
}: {
  config: SpaceConfig
  locale: string
}) {
  const galleryRef = useRef(null)
  const infoRef = useRef(null)
  const ambianceRef = useRef(null)
  const ctaRef = useRef(null)
  const isGalleryInView = useInView(galleryRef, { once: true, margin: '-80px' })
  const isInfoInView = useInView(infoRef, { once: true, margin: '-80px' })
  const isAmbianceInView = useInView(ambianceRef, { once: true, margin: '-80px' })
  const isCtaInView = useInView(ctaRef, { once: true, margin: '-80px' })
  const [heroError, setHeroError] = useState(false)

  const name = locale === 'fr' ? config.nameFr : config.nameEn
  const tagline = locale === 'fr' ? config.taglineFr : config.taglineEn
  const description = locale === 'fr' ? config.descriptionFr : config.descriptionEn
  const ambiance = locale === 'fr' ? config.ambianceFr : config.ambianceEn
  const features = locale === 'fr' ? config.featuresFr : config.featuresEn
  const dividerClass = dividerFromBorder(config.borderColor)
  const galleryImages = config.images

  return (
    <>
      <section className="relative flex min-h-[500px] h-[75vh] items-end overflow-hidden pt-16 md:pt-20">
        <div
          className={cn('absolute inset-0 bg-gradient-to-br', config.fallbackGradient)}
        />
        {config.id === 'restaurant' && (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0a0a0a 75%), linear-gradient(-45deg, transparent 75%, #0a0a0a 75%)',
              backgroundSize: '28px 28px',
              backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0',
            }}
            aria-hidden
          />
        )}
        {config.id === 'lounge' && (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(26,107,90,0.25),transparent_50%),radial-gradient(ellipse_at_80%_60%,rgba(212,175,55,0.12),transparent_45%)]"
            aria-hidden
          />
        )}
        {config.id === 'terrasse' && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-950/30 via-transparent to-stone-950/40"
            aria-hidden
          />
        )}
        {config.images[0] && !heroError && (
          <Image
            src={config.images[0]}
            alt={name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            onError={() => setHeroError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-tc-black via-black/50 to-black/20" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14">
          <Link
            href={`/${locale}/restauration`}
            className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-tc-cream/40 transition-colors hover:text-tc-cream"
          >
            <ArrowLeft size={12} />
            {locale === 'fr' ? 'Restauration' : 'Dining'}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span
              className={cn(
                'mb-3 block text-xs uppercase tracking-[0.4em]',
                config.accentColor,
              )}
            >
              {tagline}
            </span>
            <h1 className="font-serif text-5xl font-bold text-white sm:text-7xl">{name}</h1>
          </motion.div>
        </div>
      </section>

      <section ref={infoRef} className="bg-tc-dark px-4 py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInfoInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className={cn('mb-8 h-px w-12', dividerClass)} />
            <p className="mb-10 text-lg leading-relaxed text-tc-cream/70">{description}</p>
            <Link
              href={`/${locale}/restauration`}
              className={cn(
                'inline-flex items-center gap-2 border px-8 py-3.5 text-sm font-bold uppercase tracking-widest transition-all hover:bg-white/5',
                config.borderColor,
                config.accentColor,
              )}
            >
              {locale === 'fr' ? 'Voir le menu' : 'View menu'}
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInfoInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {features.map((feature, i) => (
              <div
                key={i}
                className={cn(
                  'glass flex items-start gap-3 border p-4',
                  config.borderColor,
                )}
              >
                <div
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    config.badgeColor,
                  )}
                />
                <span className="text-sm text-tc-cream/70">{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {galleryImages.length > 0 && (
        <section ref={galleryRef} className="bg-tc-black px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isGalleryInView ? { opacity: 1, y: 0 } : {}}
              className="mb-8"
            >
              <span
                className={cn('text-xs uppercase tracking-[0.4em]', config.accentColor)}
              >
                {locale === 'fr' ? 'Galerie' : 'Gallery'}
              </span>
              <h2 className="mt-3 font-serif text-3xl text-tc-cream sm:text-4xl">
                {locale === 'fr' ? 'Un aperçu de l\'espace' : 'A glimpse of the space'}
              </h2>
            </motion.div>

            <InfiniteGalleryStrip
              images={galleryImages}
              altPrefix={name}
              fallbackGradient={config.fallbackGradient}
              cardClassName={cn(
                'h-56 w-72 sm:h-64 sm:w-80',
                config.borderColor,
              )}
            />
          </div>
        </section>
      )}

      <section ref={ambianceRef} className="bg-tc-dark px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isAmbianceInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className={cn('glass rounded-lg border p-8 sm:p-10', config.borderColor)}
          >
            <span
              className={cn('text-xs uppercase tracking-[0.4em]', config.accentColor)}
            >
              {locale === 'fr' ? 'Ambiance' : 'Atmosphere'}
            </span>
            <h2 className="mt-3 mb-6 font-serif text-3xl text-tc-cream">
              {locale === 'fr' ? 'L\'expérience sur place' : 'The on-site experience'}
            </h2>
            <div className="space-y-4">
              {ambiance.map((paragraph, i) => (
                <p key={i} className="text-base leading-relaxed text-tc-cream/70">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={ctaRef} className="border-t border-white/5 bg-tc-black px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-serif text-3xl text-tc-cream sm:text-4xl">
            {locale === 'fr'
              ? `Réservez ${config.nameFr.toLowerCase()}`
              : `Book ${config.nameEn.toLowerCase()}`}
          </h2>
          <p className="mt-4 text-tc-cream/60">
            {locale === 'fr'
              ? 'Week-end et groupes : réservez à l\'avance pour garantir votre table.'
              : 'Weekends and groups: book ahead to secure your table.'}
          </p>
          <Link
            href={`/${locale}/reservation?espace=${config.reservationSlug}`}
            className="mt-8 inline-flex items-center gap-2 bg-tc-gold px-10 py-4 text-sm font-bold uppercase tracking-widest text-tc-black transition-all hover:bg-tc-gold/90 hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
          >
            {locale === 'fr' ? 'Réserver une table' : 'Book a table'}
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      <section className="border-t border-white/5 bg-tc-dark px-4 py-12">
        <div className="mx-auto flex max-w-7xl items-stretch justify-between gap-4">
          {config.prevSpace ? (
            <Link
              href={`/${locale}/restauration/${config.prevSpace.hrefSuffix}`}
              className={cn(
                'group glass flex flex-1 items-center gap-3 border p-4 transition-all hover:bg-white/5 sm:p-5',
                config.borderColor,
              )}
            >
              <ArrowLeft
                size={16}
                className={cn('shrink-0 transition-transform group-hover:-translate-x-1', config.accentColor)}
              />
              <div>
                <span className="block text-[10px] uppercase tracking-[0.3em] text-tc-cream/30">
                  {locale === 'fr' ? 'Espace précédent' : 'Previous space'}
                </span>
                <span className="mt-1 block font-serif text-lg text-tc-cream transition-colors group-hover:text-white">
                  {locale === 'fr'
                    ? config.prevSpace.labelFr
                    : config.prevSpace.labelEn}
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {config.nextSpace ? (
            <Link
              href={`/${locale}/restauration/${config.nextSpace.hrefSuffix}`}
              className={cn(
                'group glass flex flex-1 items-center justify-end gap-3 border p-4 text-right transition-all hover:bg-white/5 sm:p-5',
                config.borderColor,
              )}
            >
              <div>
                <span className="block text-[10px] uppercase tracking-[0.3em] text-tc-cream/30">
                  {locale === 'fr' ? 'Espace suivant' : 'Next space'}
                </span>
                <span className="mt-1 block font-serif text-lg text-tc-cream transition-colors group-hover:text-white">
                  {locale === 'fr'
                    ? config.nextSpace.labelFr
                    : config.nextSpace.labelEn}
                </span>
              </div>
              <ArrowRight
                size={16}
                className={cn('shrink-0 transition-transform group-hover:translate-x-1', config.accentColor)}
              />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </section>
    </>
  )
}
