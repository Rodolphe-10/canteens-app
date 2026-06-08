'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useGallery } from '@/hooks/useGallery'
import { mediaUrls } from '@/lib/media'

const GAME_ROOM_FALLBACK = [
  mediaUrls.gameRoom.gameroom1,
  mediaUrls.gameRoom.gameroom2,
  mediaUrls.lounge.lounge1,
  mediaUrls.lounge.photoBar1,
]

export default function GalleryStrip() {
  const images = useGallery('game-room', GAME_ROOM_FALLBACK)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const imagesLenRef = useRef(images.length)

  // Slides = 2 copies for infinite loop (4 copies if only 1 image)
  const slides =
    images.length === 0
      ? []
      : images.length === 1
        ? [...images, ...images, ...images, ...images]
        : [...images, ...images]

  // Keep ref up-to-date without restarting animation
  useEffect(() => {
    imagesLenRef.current = images.length
  })

  // Reset errors when images array changes
  useEffect(() => {
    setErrors({})
  }, [images])

  // RAF-based scroll — starts once, never restarts
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    const step = () => {
      if (imagesLenRef.current === 0) {
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
  }, []) // Pas de dépendances — ne redémarre jamais

  if (slides.length === 0) return null

  return (
    <section className="overflow-hidden bg-tc-black px-4 py-16">
      <div
        ref={scrollRef}
        className="overflow-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex w-max gap-4">
          {slides.map((src, i) => {
            const copyNum = Math.floor(i / Math.max(imagesLenRef.current, 1))
            const stableKey = `${src}-c${copyNum}`
            return (
              <div
                key={stableKey}
                className="relative h-48 w-72 shrink-0 overflow-hidden rounded-lg border border-white/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-950 to-tc-black" />
                {!errors[stableKey] && (
                  <Image
                    src={src}
                    alt={`Game Room ${(i % Math.max(imagesLenRef.current, 1)) + 1}`}
                    fill
                    sizes="288px"
                    className="object-cover opacity-80 transition-opacity hover:opacity-100"
                    onError={() => setErrors((e) => ({ ...e, [stableKey]: true }))}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
