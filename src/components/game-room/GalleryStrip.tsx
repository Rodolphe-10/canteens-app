'use client'

import Image from 'next/image'
import { useState } from 'react'
import { mediaUrls } from '@/lib/media'

const images = [
  mediaUrls.gameRoom.gameroom1,
  mediaUrls.gameRoom.gameroom2,
  mediaUrls.lounge.lounge1,
  mediaUrls.lounge.photoBar1,
]

export default function GalleryStrip() {
  const [errors, setErrors] = useState<Record<number, boolean>>({})

  return (
    <section className="overflow-hidden bg-tc-black px-4 py-16">
      <div className="flex w-max animate-scroll gap-4">
        {[...images, ...images].map((src, i) => (
          <div
            key={i}
            className="relative h-48 w-72 shrink-0 overflow-hidden rounded-lg border border-white/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950 to-tc-black" />
            {!errors[i] && (
              <Image
                src={src}
                alt={`Game Room ${(i % images.length) + 1}`}
                fill
                sizes="288px"
                className="object-cover opacity-80 transition-opacity hover:opacity-100"
                onError={() => setErrors((e) => ({ ...e, [i]: true }))}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
