'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
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

  const slides = useMemo(
    () =>
      images.length === 0
        ? []
        : images.length === 1
          ? [...images, ...images, ...images, ...images]
          : [...images, ...images],
    [images],
  )

  const marqueeDuration = Math.max(images.length, 1) * 10

  useEffect(() => {
    setErrors({})
  }, [images])

  if (slides.length === 0) return null

  return (
    <section className="overflow-hidden bg-tc-black px-4 py-16">
      <div className="overflow-hidden">
        <div
          className="gallery-marquee flex w-max gap-4"
          style={{ animationDuration: `${marqueeDuration}s` }}
        >
          {slides.map((src, i) => {
            const imageCount = Math.max(images.length, 1)
            const copyNum = Math.floor(i / imageCount)
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
                    alt={`Game Room ${(i % imageCount) + 1}`}
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
