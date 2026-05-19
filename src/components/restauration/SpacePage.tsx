'use client'

import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SpaceConfig {
  id: string
  nameEn: string
  nameFr: string
  taglineFr: string
  taglineEn: string
  descriptionFr: string
  descriptionEn: string
  featuresFr: string[]
  featuresEn: string[]
  images: string[]
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
  const isGalleryInView = useInView(galleryRef, { once: true, margin: '-80px' })
  const isInfoInView = useInView(infoRef, { once: true, margin: '-80px' })
  const [heroError, setHeroError] = useState(false)
  const [galleryErrors, setGalleryErrors] = useState<Record<number, boolean>>({})

  const name = locale === 'fr' ? config.nameFr : config.nameEn
  const tagline = locale === 'fr' ? config.taglineFr : config.taglineEn
  const description = locale === 'fr' ? config.descriptionFr : config.descriptionEn
  const features = locale === 'fr' ? config.featuresFr : config.featuresEn
  const dividerClass = dividerFromBorder(config.borderColor)

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

      {config.images.length > 1 && (
        <section ref={galleryRef} className="bg-tc-black px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isGalleryInView ? { opacity: 1, y: 0 } : {}}
              className="mb-10 text-center"
            >
              <span
                className={cn('text-xs uppercase tracking-[0.4em]', config.accentColor)}
              >
                {locale === 'fr' ? 'Galerie' : 'Gallery'}
              </span>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {config.images.slice(1).map((src, i) => (
                <motion.div
                  key={`${src}-${i}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={isGalleryInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    'group relative overflow-hidden',
                    i === 0 ? 'col-span-2 row-span-2 h-80 md:col-span-2' : 'h-40',
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-60',
                      config.fallbackGradient,
                    )}
                  />
                  {!galleryErrors[i] && (
                    <Image
                      src={src}
                      alt={`${name} ${i + 2}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes={i === 0 ? '(max-width:768px) 100vw, 66vw' : '(max-width:768px) 50vw, 33vw'}
                      onError={() =>
                        setGalleryErrors((prev) => ({ ...prev, [i]: true }))
                      }
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/5 bg-tc-dark px-4 py-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {config.prevSpace ? (
            <Link
              href={`/${locale}/restauration/${config.prevSpace.hrefSuffix}`}
              className="group flex items-center gap-2 text-sm text-tc-cream/40 transition-colors hover:text-tc-cream"
            >
              <ArrowLeft
                size={14}
                className="transition-transform group-hover:-translate-x-1"
              />
              <span>
                {locale === 'fr'
                  ? config.prevSpace.labelFr
                  : config.prevSpace.labelEn}
              </span>
            </Link>
          ) : (
            <div />
          )}

          <Link
            href={`/${locale}/restauration`}
            className="text-xs uppercase tracking-[0.3em] text-tc-cream/30 transition-colors hover:text-tc-gold"
          >
            {locale === 'fr' ? 'Retour au menu' : 'Back to menu'}
          </Link>

          {config.nextSpace ? (
            <Link
              href={`/${locale}/restauration/${config.nextSpace.hrefSuffix}`}
              className="group flex items-center gap-2 text-sm text-tc-cream/40 transition-colors hover:text-tc-cream"
            >
              <span>
                {locale === 'fr'
                  ? config.nextSpace.labelFr
                  : config.nextSpace.labelEn}
              </span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>
    </>
  )
}
