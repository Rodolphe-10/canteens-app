'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'
import { DARK_BLUR } from '@/lib/blur-placeholder'

export interface InfiniteGalleryStripProps {
  images: string[]
  altPrefix: string
  fallbackGradient?: string
  cardClassName?: string
  showArrows?: boolean
  className?: string
}

const RESUME_AUTO_SCROLL_MS = 2200

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
  const isInteracting = useRef(false)
  const didSwipe = useRef(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slidesLengthRef = useRef(0)

  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [paused, setPaused] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1)

  const slides =
    images.length === 0
      ? []
      : images.length === 1
        ? [...images, ...images, ...images, ...images]
        : [...images, ...images]

  useEffect(() => {
    setErrors({})
  }, [images])

  useEffect(() => {
    slidesLengthRef.current = slides.length
  })

  const clearResumeTimer = useCallback(() => {
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current)
      resumeTimer.current = null
    }
  }, [])

  const scheduleResumeAutoScroll = useCallback(() => {
    if (isHovering.current || lightboxSrc) return
    clearResumeTimer()
    resumeTimer.current = setTimeout(() => {
      if (!isHovering.current && !isInteracting.current) {
        setPaused(false)
      }
    }, RESUME_AUTO_SCROLL_MS)
  }, [clearResumeTimer, lightboxSrc])

  const pauseAutoScroll = useCallback(() => {
    clearResumeTimer()
    setPaused(true)
  }, [clearResumeTimer])

  const wrapInfiniteScroll = useCallback((el: HTMLDivElement) => {
    const half = el.scrollWidth / 2
    if (half > 0 && el.scrollLeft >= half) {
      el.scrollLeft -= half
    }
  }, [])

  // Native scroll + touch-action: pan-x → swipe fluide avec inertie (momentum)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let scrollEndFallback: ReturnType<typeof setTimeout> | null = null

    const onInteractionStart = () => {
      isInteracting.current = true
      didSwipe.current = false
      pauseAutoScroll()
    }

    const onInteractionEnd = () => {
      isInteracting.current = false
      scheduleResumeAutoScroll()
    }

    const onScroll = () => {
      wrapInfiniteScroll(el)
      if (!isInteracting.current) return
      didSwipe.current = true
      if (scrollEndFallback) clearTimeout(scrollEndFallback)
      scrollEndFallback = setTimeout(() => {
        isInteracting.current = false
        scheduleResumeAutoScroll()
      }, 120)
    }

    el.addEventListener('touchstart', onInteractionStart, { passive: true })
    el.addEventListener('touchend', onInteractionEnd, { passive: true })
    el.addEventListener('touchcancel', onInteractionEnd, { passive: true })
    el.addEventListener('pointerdown', onInteractionStart, { passive: true })
    el.addEventListener('pointerup', onInteractionEnd, { passive: true })
    el.addEventListener('pointercancel', onInteractionEnd, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })

    if ('onscrollend' in el) {
      el.addEventListener('scrollend', onInteractionEnd)
    }

    return () => {
      el.removeEventListener('touchstart', onInteractionStart)
      el.removeEventListener('touchend', onInteractionEnd)
      el.removeEventListener('touchcancel', onInteractionEnd)
      el.removeEventListener('pointerdown', onInteractionStart)
      el.removeEventListener('pointerup', onInteractionEnd)
      el.removeEventListener('pointercancel', onInteractionEnd)
      el.removeEventListener('scroll', onScroll)
      if ('onscrollend' in el) {
        el.removeEventListener('scrollend', onInteractionEnd)
      }
      if (scrollEndFallback) clearTimeout(scrollEndFallback)
    }
  }, [pauseAutoScroll, scheduleResumeAutoScroll, wrapInfiniteScroll])

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer])

  const openLightbox = (src: string, realIndex: number) => {
    if (didSwipe.current) return
    setLightboxSrc(src)
    setLightboxIndex(realIndex)
    pauseAutoScroll()
  }

  const closeLightbox = () => {
    setLightboxSrc(null)
    setLightboxIndex(-1)
    if (!isHovering.current) scheduleResumeAutoScroll()
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

  const nudge = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    pauseAutoScroll()
    el.scrollBy({ left: direction * 320, behavior: 'smooth' })
    scheduleResumeAutoScroll()
  }, [pauseAutoScroll, scheduleResumeAutoScroll])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || paused) return

    let raf = 0
    const step = () => {
      if (slidesLengthRef.current === 0) {
        raf = requestAnimationFrame(step)
        return
      }
      if (el.scrollWidth <= el.clientWidth) {
        raf = requestAnimationFrame(step)
        return
      }
      el.scrollLeft += 0.6
      wrapInfiniteScroll(el)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [paused, wrapInfiniteScroll])

  if (slides.length === 0) return null

  return (
    <>
    <div
      className={cn('relative', className)}
      onMouseEnter={() => {
        isHovering.current = true
        pauseAutoScroll()
      }}
      onMouseLeave={() => {
        isHovering.current = false
        scheduleResumeAutoScroll()
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
        className="gallery-strip-scroll overflow-x-auto overflow-y-hidden px-10 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          overscrollBehaviorX: 'contain',
        }}
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
                style={{ touchAction: 'pan-x' }}
                aria-label={`Voir ${altPrefix} ${realIndex + 1}`}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br', fallbackGradient)} />
                {!errors[stableKey] && (
                  <Image
                    src={src}
                    alt={`${altPrefix} ${realIndex + 1}`}
                    fill
                    sizes="288px"
                    placeholder="blur"
                    blurDataURL={DARK_BLUR}
                    className="pointer-events-none object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    onError={() => setErrors((e) => ({ ...e, [stableKey]: true }))}
                    draggable={false}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
                  <ZoomIn size={22} className="text-white drop-shadow-lg" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>

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
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-sm transition hover:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>

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
            {images.length > 1 && (
              <p className="mt-2 text-center text-xs text-white/40">
                {lightboxIndex + 1} / {images.length}
              </p>
            )}
          </motion.div>

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
