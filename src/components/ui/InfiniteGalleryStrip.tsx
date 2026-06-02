'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [errors, setErrors] = useState<Record<number, boolean>>({})
  const [paused, setPaused] = useState(false)

  const slides =
    images.length === 0
      ? []
      : images.length === 1
        ? [...images, ...images, ...images, ...images]
        : [...images, ...images]

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
    if (!el || slides.length === 0 || paused) return

    let raf = 0
    const step = () => {
      el.scrollLeft += 0.6
      const half = el.scrollWidth / 2
      if (half > 0 && el.scrollLeft >= half) {
        el.scrollLeft = 0
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [paused, slides.length])

  if (slides.length === 0) return null

  return (
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
          <button
            type="button"
            onClick={() => nudge(-1)}
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-tc-cream/70 backdrop-blur-md transition-colors hover:border-white/25 hover:text-tc-cream"
            aria-label="Image précédente"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-tc-cream/70 backdrop-blur-md transition-colors hover:border-white/25 hover:text-tc-cream"
            aria-label="Image suivante"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="overflow-hidden px-10 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex w-max gap-4">
          {slides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={cn(
                'relative h-48 w-72 shrink-0 overflow-hidden rounded-lg border border-white/5',
                cardClassName,
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  fallbackGradient,
                )}
              />
              {!errors[i] && (
                <Image
                  src={src}
                  alt={`${altPrefix} ${(i % images.length) + 1}`}
                  fill
                  sizes="288px"
                  className="object-cover opacity-80 transition-opacity duration-500 hover:opacity-100"
                  onError={() => setErrors((e) => ({ ...e, [i]: true }))}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
