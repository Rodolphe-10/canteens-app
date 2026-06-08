'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

export interface InfiniteGalleryStripProps {
  images: string[]
  altPrefix: string
  fallbackGradient?: string
  cardClassName?: string
  showArrows?: boolean
  className?: string
}

export default function InfiniteGalleryStrip({
  images,
  altPrefix,
  fallbackGradient = 'from-purple-950 to-tc-black',
  cardClassName,
  showArrows = true,
  className,
}: InfiniteGalleryStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isHovering = useRef(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartLeft = useRef(0)
  const slidesLengthRef = useRef(0)

  // Reset errors quand images change pour éviter les flashs noirs
  useEffect(() => {
    setErrors({})
  }, [images])

  // Garde la longueur des slides dans un ref pour que l'animation ne redémarre pas
  useEffect(() => {
    slidesLengthRef.current = slides.length
  })
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1)

  const openLightbox = (src: string, realIndex: number) => {
    setLightboxSrc(src)
    setLightboxIndex(realIndex)
    setPaused(true)
  }

  const closeLightbox = () => {
    setLightboxSrc(null)
    setLightboxIndex(-1)
    if (!isHovering.current) setPaused(false)
  }

  const lightboxNav = (dir: -1 | 1) => {
    const next = (lightboxIndex + dir + images.length) % images.length
    setLightboxIndex(next)
    setLightboxSrc(images[next])
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightboxSrc) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') lightboxNav(1)
      if (e.key === 'ArrowLeft') lightboxNav(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxSrc, lightboxIndex, images])

  const slides =
    images.length === 0
      ? []
      : images.length === 1
        ? [...images, ...images, ...images, ...images]
        : [...images, ...images]

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchStartLeft.current = scrollRef.current?.scrollLeft ?? 0
    setPaused(true)
  }, [])

  // NOTE: onTouchMove is intentionally NOT handled via React synthetic events
  // because those are passive by default — e.preventDefault() doesn't work.
  // Instead we use a native non-passive listener (see useEffect below).

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null
    touchStartY.current = null
    if (!isHovering.current) {
      window.setTimeout(() => setPaused(false), 3000)
    }
  }, [])

  // Native non-passive touchmove — allows preventDefault() to block page scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null) return
      const dx = Math.abs(touchStartX.current - e.touches[0].clientX)
      const dy = Math.abs((touchStartY.current ?? 0) - e.touches[0].clientY)
      // Only hijack horizontal swipes
      if (dx > dy) {
        e.preventDefault()
        el.scrollLeft = touchStartLeft.current + (touchStartX.current - e.touches[0].clientX)
      }
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [])

  const nudge = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    setPaused(true)
    el.scrollBy({ left: direction * 320, behavior: 'smooth' })
    if (!isHovering.current) {
      window.setTimeout(() => setPaused(false), 4000)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || paused) return

    let raf = 0
    const step = () => {
      if (slidesLengthRef.current === 0) {
        raf = requestAnimationFrame(step)
        return
      }
      el.scrollLeft += 0.6
      const half = el.scrollWidth / 2
      if (half > 0 && el.scrollLeft >= half) {
        el.scrollLeft = 0
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [paused])

  if (slides.length === 0) return null

  return (
    <>
    <div
      className={cn('relative', className)}
      onMouseEnter={() => {
        isHovering.current = true
        setPaused(true)
      }}
      onMouseLeave={() => {
        isHovering.current = false
        setPaused(false)
      }}
    >
      {showArrows && (
        <>
          <Tooltip text="Image précédente" position="right">
            <button
              type="button"
              onClick={() => nudge(-1)}
              className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-tc-cream/70 backdrop-blur-md transition-colors hover:border-white/25 hover:text-tc-cream"
              aria-label="Image précédente"
            >
              <ChevronLeft size={18} />
            </button>
          </Tooltip>
          <Tooltip text="Image suivante" position="left">
            <button
              type="button"
              onClick={() => nudge(1)}
              className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-tc-cream/70 backdrop-blur-md transition-colors hover:border-white/25 hover:text-tc-cream"
              aria-label="Image suivante"
            >
              <ChevronRight size={18} />
            </button>
          </Tooltip>
        </>
      )}

      <div
        ref={scrollRef}
        className="overflow-hidden px-10 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex w-max gap-4">
          {slides.map((src, i) => {
            const realIndex = i % images.length
            const copyNum = Math.floor(i / Math.max(images.length, 1))
            const stableKey = `${src}-c${copyNum}`
            return (
              <button
                key={stableKey}
                type="button"
                onClick={() => openLightbox(src, realIndex)}
                className={cn(
                  'group relative h-48 w-72 shrink-0 overflow-hidden rounded-lg border border-white/5 transition-all duration-300 hover:border-white/20',
                  cardClassName,
                )}
                aria-label={`Voir ${altPrefix} ${realIndex + 1}`}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br', fallbackGradient)} />
                {!errors[stableKey] && (
                  <Image
                    src={src}
                    alt={`${altPrefix} ${realIndex + 1}`}
                    fill
                    sizes="288px"
                    className="object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    onError={() => setErrors((e) => ({ ...e, [stableKey]: true }))}
                  />
                )}
                {/* Overlay zoom au hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
                  <ZoomIn size={22} className="text-white drop-shadow-lg" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>

    {/* Lightbox */}
    <AnimatePresence>
      {lightboxSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          {/* Bouton fermer */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-sm transition hover:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>

          {/* Navigation gauche */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); lightboxNav(-1) }}
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-sm transition hover:text-white"
              aria-label="Image précédente"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={lightboxSrc}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxSrc}
              alt={`${altPrefix} ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            {/* Compteur */}
            {images.length > 1 && (
              <p className="mt-2 text-center text-xs text-white/40">
                {lightboxIndex + 1} / {images.length}
              </p>
            )}
          </motion.div>

          {/* Navigation droite */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); lightboxNav(1) }}
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-sm transition hover:text-white"
              aria-label="Image suivante"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
