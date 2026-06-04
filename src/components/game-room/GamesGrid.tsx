'use client'

import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { games as staticGames } from '@/data/games'
import type { Game } from '@/data/games'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

type GameCategory = 'all' | 'vr' | 'arcade' | 'sport' | 'simulation'

const categoryFilters: {
  id: GameCategory
  labelFr: string
  labelEn: string
}[] = [
  { id: 'all', labelFr: 'Tous', labelEn: 'All' },
  { id: 'vr', labelFr: 'Réalité Virtuelle', labelEn: 'Virtual Reality' },
  { id: 'arcade', labelFr: 'Arcade', labelEn: 'Arcade' },
  { id: 'sport', labelFr: 'Sport', labelEn: 'Sport' },
  { id: 'simulation', labelFr: 'Simulation', labelEn: 'Simulation' },
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

type DbGame = {
  id: string
  name: string
  description?: string
  prices: { label: string; amount: number }[]
  image?: string
  category: Game['category']
  is_highlight: boolean
}

export default function GamesGrid({ locale }: { locale: string }) {
  const [activeFilter, setActiveFilter] = useState<GameCategory>('all')
  const [games, setGames] = useState<Game[]>(staticGames)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const fetchGames = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('is_visible', true)
      .order('category')
    if (!data || data.length === 0) return // garde les données statiques en fallback
    setGames(data.map((row: DbGame) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      prices: row.prices,
      image: row.image,
      category: row.category,
      isHighlight: row.is_highlight,
    })))
  }, [])

  useEffect(() => { void fetchGames() }, [fetchGames])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('games_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => void fetchGames())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [fetchGames])

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
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeFilter === f.id
                  ? `${categoryColors[f.id]} bg-white/5`
                  : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
              }`}
            >
              {locale === 'fr' ? f.labelFr : f.labelEn}
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
              className={`glass group relative overflow-hidden border border-white/5 transition-all duration-300 ${glowColors[game.category] || ''}`}
            >
              {/* Badge Vedette */}
              {game.isHighlight && (
                <div className="absolute right-0 top-0 z-10 bg-tc-game-red px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {locale === 'fr' ? 'Vedette' : 'Featured'}
                </div>
              )}

              {/* Image */}
              {game.image ? (
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={game.image}
                    alt={game.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
              ) : (
                <div className="flex h-52 items-center justify-center bg-white/[0.03] text-4xl">
                  {game.category === 'vr' ? '🥽' : game.category === 'arcade' ? '🕹️' : game.category === 'sport' ? '🎱' : '🏎️'}
                </div>
              )}

              {/* Infos */}
              <div className="p-5">
                <h3 className="mb-2 font-display text-2xl tracking-wide text-white">
                  {game.name}
                </h3>

                {game.description && (
                  <p className="mb-4 text-xs leading-relaxed text-tc-cream/40">
                    {game.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
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
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
