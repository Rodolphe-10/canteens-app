'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGallery } from '@/hooks/useGallery'
import { mediaUrls } from '@/lib/media'

const HERO_LABELS = ['Le Lounge', 'Le Restaurant', 'Game Room', 'La Terrasse']
const HERO_GRADIENTS = [
  'from-tc-navy/80 via-black/60 to-black/90',
  'from-red-950/80 via-black/60 to-black/90',
  'from-purple-950/80 via-black/60 to-black/90',
  'from-stone-900/80 via-black/60 to-black/90',
]
const HERO_FALLBACK = [
  mediaUrls.lounge.lounge1,
  mediaUrls.restaurant.restaurant,
  mediaUrls.gameRoom.gameroom1,
  mediaUrls.terrasse.terrasse1,
]

export default function HeroGallery({ locale }: { locale: string }) {
  const urls = useGallery('home-hero', HERO_FALLBACK)
  const slides = useMemo(
    () =>
      urls.map((src, i) => ({
        src,
        label: HERO_LABELS[i] ?? '',
        gradient: HERO_GRADIENTS[i] ?? 'from-black/80 via-black/60 to-black/90',
      })),
    [urls],
  )

  const [current, setCurrent] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % Math.max(slides.length, 1))
  }, [slides.length])

  useEffect(() => {
    if (current >= slides.length) setCurrent(0)
  }, [slides.length, current])

  const slide = slides[current] ?? slides[0]

  useEffect(() => {
    setIsLoaded(true)
    if (slides.length === 0) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  useEffect(() => {
    setImgError(false)
  }, [current])

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br',
              current === 0 && 'from-tc-navy to-tc-black',
              current === 1 && 'from-red-950 to-tc-black',
              current === 2 && 'from-purple-950 to-tc-black',
              current === 3 && 'from-stone-900 to-tc-black',
            )}
          />
          {!imgError && slide && (
            <Image
              src={slide.src}
              alt={slide.label}
              fill
              sizes="100vw"
              className="object-cover"
              priority={current === 0}
              onError={() => setImgError(true)}
            />
          )}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${slide?.gradient ?? ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-tc-black via-transparent to-black/30" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.div
          key={`badge-${current}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <span className="rounded-full border border-tc-gold/30 px-4 py-1.5 text-xs uppercase tracking-[0.4em] text-tc-gold/70">
            {slide?.label}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-4"
        >
          <h1 className="font-serif text-5xl font-bold tracking-wider text-gradient-gold sm:text-7xl lg:text-8xl">
            THE CANTEEN&apos;S
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-4 text-sm uppercase tracking-[0.3em] text-tc-cream/50 sm:text-base"
        >
          Restaurant · Bar · Lounge · Game Room
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-12 font-serif text-lg italic text-tc-cream/40"
        >
          &quot;Let&apos;s enjoy free time&quot;
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <Link
            href={`/${locale}/restauration`}
            className="group relative overflow-hidden px-10 py-4 text-sm font-bold uppercase tracking-[0.3em] text-tc-black transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] bg-tc-gold"
          >
            <span className="relative z-10">
              {locale === 'fr' ? 'RESTAURATION' : 'DINING'}
            </span>
            <div className="absolute inset-0 translate-x-[-100%] bg-white/20 transition-transform duration-300 group-hover:translate-x-0" />
          </Link>

          <Link
            href={`/${locale}/game-room`}
            className="group relative overflow-hidden border-2 border-tc-game-cyan px-10 py-4 text-sm font-bold uppercase tracking-[0.3em] text-tc-game-cyan transition-all duration-300 hover:bg-tc-game-cyan/10 hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]"
          >
            GAME ROOM
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={slides[i].src}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={cn(
              'rounded-full transition-all duration-300',
              i === current ? 'h-1.5 w-8 bg-tc-gold' : 'h-1.5 w-1.5 bg-white/30 hover:bg-white/60',
            )}
          />
        ))}
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-tc-cream/30"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <ChevronDown size={16} />
      </motion.div>
    </section>
  )
}
