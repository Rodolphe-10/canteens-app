'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Calendar, Clock, Zap, Image as ImageIcon } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import FlyerModal from '@/components/ui/FlyerModal'
import { mediaUrls } from '@/lib/media'

const gameRoomPacks = [
  {
    id: 'friday-afterwork',
    badge: 'VENDREDI',
    badgeColor: 'bg-tc-game-orange text-black',
    nameFr: 'Friday After Work',
    nameEn: 'Friday After Work',
    subtitleFr: 'GAME NIGHT',
    subtitleEn: 'GAME NIGHT',
    taglineFr: 'Finis le boulot et lance la partie.',
    taglineEn: 'Finish work and start playing.',
    scheduleFr: 'Tous les vendredis dès 18H',
    scheduleEn: 'Every Friday from 6PM',
    price: null as number | null,
    priceLabelFr: 'Tarifs réduits toute la soirée',
    priceLabelEn: 'Reduced prices all evening',
    flyer: mediaUrls.flyers.packAfterwork,
    flyerAlt: 'Friday After Work Game Night',
    items: [
      { nameFr: 'Billard', nameEn: 'Billiards', price: 1000, unitFr: 'la partie', unitEn: 'per game' },
      { nameFr: 'Fléchettes', nameEn: 'Darts', price: 1000, unitFr: 'la partie', unitEn: 'per game' },
      { nameFr: 'Boxer', nameEn: 'Boxer', price: 500, unitFr: '3 coups', unitEn: '3 hits' },
      { nameFr: 'Simulateur', nameEn: 'Simulator', price: 2000, unitFr: 'la session', unitEn: 'per session' },
      { nameFr: 'VR', nameEn: 'VR', price: 2000, unitFr: 'la session', unitEn: 'per session' },
      { nameFr: 'Baby-foot', nameEn: 'Foosball', price: 500, unitFr: 'la partie', unitEn: 'per game' },
      { nameFr: 'Flipper', nameEn: 'Pinball', price: 1000, unitFr: '1 jeton', unitEn: '1 token' },
    ],
    glow: 'rgba(255,140,0,0.15)',
    border: 'border-tc-game-orange/30',
    accent: 'text-tc-game-orange',
    btnBorder: 'border-tc-game-orange/40 text-tc-game-orange hover:bg-tc-game-orange/10',
    icon: '🍺',
  },
  {
    id: 'sunday-brunch-game',
    badge: 'DIMANCHE',
    badgeColor: 'bg-tc-game-red text-white',
    nameFr: 'Dimanche',
    nameEn: 'Sunday',
    subtitleFr: 'BRUNCH + GAME ROOM',
    subtitleEn: 'BRUNCH + GAME ROOM',
    taglineFr: 'Le dimanche, on brunche et on joue !',
    taglineEn: 'On Sundays, we brunch and play!',
    scheduleFr: 'Tous les dimanches',
    scheduleEn: 'Every Sunday',
    price: 5000,
    priceLabelFr: "par personne · 1 heure d'accès",
    priceLabelEn: 'per person · 1 hour access',
    flyer: mediaUrls.flyers.packDimanche,
    flyerAlt: 'Dimanche Brunch Game Room',
    items: [
      { nameFr: 'Réalité Virtuelle', nameEn: 'Virtual Reality', price: null as number | null, unitFr: 'inclus', unitEn: 'included' },
      { nameFr: 'Billard', nameEn: 'Billiards', price: null, unitFr: 'inclus', unitEn: 'included' },
      { nameFr: 'Baby-foot', nameEn: 'Foosball', price: null, unitFr: 'inclus', unitEn: 'included' },
    ],
    glow: 'rgba(232,35,42,0.15)',
    border: 'border-tc-game-red/30',
    accent: 'text-tc-game-red',
    btnBorder: 'border-tc-game-red/40 text-tc-game-red hover:bg-tc-game-red/10',
    icon: '🎮',
  },
]

export default function PacksSection({ locale }: { locale: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [flyerOpen, setFlyerOpen] = useState<{ src: string; alt: string } | null>(null)

  return (
    <section ref={ref} className="bg-tc-dark px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="mb-14 text-center"
        >
          <span className="mb-4 block text-xs uppercase tracking-[0.4em] text-tc-game-cyan/60">
            {locale === 'fr' ? 'Offres spéciales' : 'Special offers'}
          </span>
          <h2 className="font-display text-5xl tracking-wide text-white sm:text-6xl">
            {locale === 'fr' ? 'NOS PACKS' : 'OUR PACKS'}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {gameRoomPacks.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              style={{ boxShadow: isInView ? `0 0 60px ${pack.glow}` : 'none' }}
              className={`glass relative overflow-hidden border p-8 ${pack.border}`}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-5"
                style={{
                  background: `radial-gradient(circle at top right, ${pack.glow.replace('0.15', '0.5')}, transparent 70%)`,
                }}
              />

              <div className="mb-6 flex items-center justify-between">
                <span className={`inline-block px-3 py-1 text-xs font-black tracking-[0.3em] ${pack.badgeColor}`}>
                  {pack.badge}
                </span>
                <button
                  type="button"
                  onClick={() => setFlyerOpen({ src: pack.flyer, alt: pack.flyerAlt })}
                  className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs uppercase tracking-wider transition-all ${pack.btnBorder}`}
                >
                  <ImageIcon size={11} />
                  {locale === 'fr' ? 'Voir le flyer' : 'View flyer'}
                </button>
              </div>

              <div className="mb-2">
                <p className={`mb-1 text-xs uppercase tracking-[0.3em] ${pack.accent}`}>
                  {pack.icon} {locale === 'fr' ? pack.subtitleFr : pack.subtitleEn}
                </p>
                <h3 className="font-display text-4xl leading-none tracking-wide text-white sm:text-5xl">
                  {locale === 'fr' ? pack.nameFr : pack.nameEn}
                </h3>
              </div>

              <p className="mb-6 text-sm italic text-tc-cream/50">
                {locale === 'fr' ? pack.taglineFr : pack.taglineEn}
              </p>

              <div className={`mb-6 flex items-baseline gap-2 border-b pb-6 ${pack.border}`}>
                {pack.price ? (
                  <>
                    <span className={`font-display text-5xl ${pack.accent}`}>{formatPrice(pack.price)}</span>
                    <span className="text-xs text-tc-cream/40">
                      {locale === 'fr' ? pack.priceLabelFr : pack.priceLabelEn}
                    </span>
                  </>
                ) : (
                  <span className="text-sm italic text-tc-cream/60">
                    {locale === 'fr' ? pack.priceLabelFr : pack.priceLabelEn}
                  </span>
                )}
              </div>

              <div className="mb-8 grid grid-cols-2 gap-2">
                {pack.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Zap size={10} className={`shrink-0 ${pack.accent}`} />
                    <span className="text-xs text-tc-cream/70">
                      {locale === 'fr' ? item.nameFr : item.nameEn}
                      {item.price != null && (
                        <span className={`ml-1 font-bold ${pack.accent}`}>{formatPrice(item.price)}</span>
                      )}
                      {item.price == null && (
                        <span className={`ml-1 text-[10px] uppercase ${pack.accent}`}>
                          {' '}
                          ({locale === 'fr' ? item.unitFr : item.unitEn})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-tc-cream/40">
                <Calendar size={12} />
                <span>{locale === 'fr' ? pack.scheduleFr : pack.scheduleEn}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-14 text-center"
        >
          <p className="mb-6 text-sm text-tc-cream/40">
            {locale === 'fr'
              ? 'Réservations et infos : contactez-nous directement'
              : 'Reservations and info: contact us directly'}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="https://wa.me/237677138318"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-green-500"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Game Room
            </a>
            <a
              href="tel:+237677138318"
              className="inline-flex items-center justify-center gap-2 border-2 border-tc-game-cyan px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-tc-game-cyan transition-all hover:bg-tc-game-cyan/10"
            >
              <Clock size={14} />
              +237 677 138 318
            </a>
          </div>
        </motion.div>
      </div>

      <FlyerModal
        src={flyerOpen?.src ?? ''}
        alt={flyerOpen?.alt ?? ''}
        open={flyerOpen !== null}
        onClose={() => setFlyerOpen(null)}
      />
    </section>
  )
}
