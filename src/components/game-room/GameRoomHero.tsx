'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import BackButton from '@/components/ui/BackButton'

export default function GameRoomHero({ locale }: { locale: string }) {
  const [bgError, setBgError] = useState(false)

  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden pt-16 md:pt-20">
      <div className="absolute left-4 top-24 z-10 sm:left-8">
        <BackButton locale={locale} fallbackHref="/" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-tc-black to-tc-black" />
      {!bgError && (
        <Image
          src="/images/game-room/gameroom1.jpg"
          alt="Game Room"
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
          onError={() => setBgError(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-tc-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-tc-black/60 via-transparent to-transparent" />

      <div className="pointer-events-none absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-tc-game-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-tc-game-red/10 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <span className="rounded-full border border-tc-game-cyan/30 px-4 py-1.5 text-xs uppercase tracking-[0.4em] text-tc-game-cyan/70">
              PLAY AND CHILL
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 font-display text-6xl leading-none tracking-wide text-white sm:text-8xl"
          >
            {locale === 'fr' ? (
              <>
                L&apos;ESPACE
                <br />
                <span className="text-tc-game-red">GAMING</span>
              </>
            ) : (
              <>
                THE
                <br />
                <span className="text-tc-game-red">GAMING</span> SPACE
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 max-w-lg text-lg leading-relaxed text-tc-cream/60"
          >
            {locale === 'fr'
              ? 'Billard, VR, simulateurs de rallye, arcade… Une salle de jeux complète pour tous les profils, ouverte tous les jours.'
              : 'Billiards, VR, rally simulators, arcade… A complete game room for all profiles, open every day.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <div className="glass flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
              <span className="text-lg">👦</span>
              <div>
                <p className="text-xs uppercase tracking-wider text-tc-cream/40">
                  {locale === 'fr' ? 'Enfants' : 'Kids'}
                </p>
                <p className="text-sm font-medium text-tc-cream">12H – 18H</p>
              </div>
            </div>
            <div className="glass animate-glow-pulse flex items-center gap-2 rounded-full border border-tc-game-cyan/20 px-4 py-2">
              <span className="text-lg">🎮</span>
              <div>
                <p className="text-xs uppercase tracking-wider text-tc-game-cyan/60">
                  {locale === 'fr' ? 'Adultes' : 'Adults'}
                </p>
                <p className="text-sm font-medium text-tc-cream">12H – 00H</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
