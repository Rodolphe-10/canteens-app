'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { games } from '@/data/games'
import { formatPrice } from '@/lib/utils'

type GameCategory = 'all' | 'vr' | 'arcade' | 'sport' | 'simulation'

const categoryFilters: {
  id: GameCategory
  labelFr: string
  labelEn: string
  icon: string
}[] = [
  { id: 'all', labelFr: 'Tous', labelEn: 'All', icon: '🎯' },
  { id: 'vr', labelFr: 'Réalité Virtuelle', labelEn: 'Virtual Reality', icon: '🥽' },
  { id: 'arcade', labelFr: 'Arcade', labelEn: 'Arcade', icon: '🕹️' },
  { id: 'sport', labelFr: 'Sport', labelEn: 'Sport', icon: '🎱' },
  { id: 'simulation', labelFr: 'Simulation', labelEn: 'Simulation', icon: '🏎️' },
]

const categoryColors: Record<GameCategory, string> = {
  all: 'border-white/20 text-white/60',
  vr: 'border-tc-game-cyan/50 text-tc-game-cyan',
  arcade: 'border-tc-game-orange/50 text-tc-game-orange',
  sport: 'border-green-500/50 text-green-400',
  simulation: 'border-tc-game-red/50 text-tc-game-red',
}

const glowColors: Record<string, string> = {
  vr: 'hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:border-tc-game-cyan/40',
  arcade:
    'hover:shadow-[0_0_20px_rgba(255,140,0,0.2)] hover:border-tc-game-orange/40',
  sport: 'hover:shadow-[0_0_20px_rgba(74,222,128,0.2)] hover:border-green-500/40',
  simulation:
    'hover:shadow-[0_0_20px_rgba(232,35,42,0.2)] hover:border-tc-game-red/40',
}

export default function GamesGrid({ locale }: { locale: string }) {
  const [activeFilter, setActiveFilter] = useState<GameCategory>('all')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const filtered =
    activeFilter === 'all'
      ? games
      : games.filter((g) => g.category === activeFilter)

  return (
    <section ref={ref} className="bg-tc-black px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="mb-14 text-center"
        >
          <span className="mb-4 block text-xs uppercase tracking-[0.4em] text-tc-game-cyan/60">
            {locale === 'fr' ? 'Nos équipements' : 'Our equipment'}
          </span>
          <h2 className="font-display text-5xl tracking-wide text-white sm:text-6xl">
            {locale === 'fr' ? 'LES JEUX' : 'THE GAMES'}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="mb-12 flex flex-wrap justify-center gap-2"
        >
          {categoryFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeFilter === f.id
                  ? `${categoryColors[f.id]} bg-white/5`
                  : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
              }`}
            >
              <span>{f.icon}</span>
              <span>{locale === 'fr' ? f.labelFr : f.labelEn}</span>
            </button>
          ))}
        </motion.div>

        <motion.div
          key={activeFilter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`glass group relative border border-white/5 p-6 transition-all duration-300 ${glowColors[game.category] || ''}`}
            >
              {game.isHighlight && (
                <div className="absolute right-0 top-0 bg-tc-game-red px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {locale === 'fr' ? 'Vedette' : 'Featured'}
                </div>
              )}

              <div className="mb-4 text-3xl">
                {game.category === 'vr'
                  ? '🥽'
                  : game.category === 'arcade'
                    ? '🕹️'
                    : game.category === 'sport'
                      ? '🎱'
                      : '🏎️'}
              </div>

              <h3 className="mb-2 font-display text-2xl tracking-wide text-white">
                {game.name}
              </h3>

              {game.description && (
                <p className="mb-5 text-xs leading-relaxed text-tc-cream/40">
                  {game.description}
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-2">
                {game.prices.map((p, pi) => (
                  <div
                    key={`${p.label}-${pi}`}
                    className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs ${
                      game.category === 'vr'
                        ? 'border-tc-game-cyan/30 bg-tc-game-cyan/5 text-tc-game-cyan'
                        : game.category === 'simulation'
                          ? 'border-tc-game-red/30 bg-tc-game-red/5 text-tc-game-red'
                          : game.category === 'sport'
                            ? 'border-green-500/30 bg-green-500/5 text-green-400'
                            : 'border-tc-game-orange/30 bg-tc-game-orange/5 text-tc-game-orange'
                    }`}
                  >
                    <span className="font-bold">{formatPrice(p.amount)}</span>
                    <span className="opacity-60">— {p.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
