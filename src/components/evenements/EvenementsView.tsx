'use client'

import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Calendar, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import FlyerModal from '@/components/ui/FlyerModal'
import { PageBackNav } from '@/components/ui/BackButton'

const events = [
  {
    id: 'friday-afterwork',
    category: 'game-room',
    categoryLabelFr: 'Game Room',
    categoryLabelEn: 'Game Room',
    nameFr: 'Friday After Work Game Night',
    nameEn: 'Friday After Work Game Night',
    taglineFr: 'Finis le boulot et lance la partie',
    taglineEn: 'Finish work and start playing',
    descFr:
      'Tous les vendredis dès 18H, profitez de tarifs réduits sur tous les jeux de la Game Room. Billard, VR, simulateur, baby-foot, fléchettes… La soirée parfaite pour décompresser après le boulot.',
    descEn:
      'Every Friday from 6PM, enjoy reduced prices on all Game Room games. Billiards, VR, simulator, foosball, darts… The perfect evening to unwind after work.',
    schedule: 'Tous les vendredis dès 18H',
    scheduleEn: 'Every Friday from 6PM',
    flyer: '/images/flyers/pack_afterwork.jpg',
    accent: 'text-tc-game-orange',
    border: 'border-tc-game-orange/30',
    badge: 'VENDREDI',
    badgeColor: 'bg-tc-game-orange text-black',
    href: '/game-room',
    fallback: 'from-orange-950 to-tc-black',
  },
  {
    id: 'sunday-game-brunch',
    category: 'game-room',
    categoryLabelFr: 'Game Room',
    categoryLabelEn: 'Game Room',
    nameFr: 'Dimanche Brunch + Game Room',
    nameEn: 'Sunday Brunch + Game Room',
    taglineFr: 'Le dimanche, on brunche et on joue',
    taglineEn: 'On Sundays, we brunch and play',
    descFr:
      "5 000F par personne pour 1 heure d'accès illimité à la Game Room. VR, billard, baby-foot inclus. L'expérience ultime entre amis le dimanche.",
    descEn:
      '5,000F per person for 1 hour unlimited access to the Game Room. VR, billiards, foosball included. The ultimate Sunday experience with friends.',
    schedule: 'Tous les dimanches',
    scheduleEn: 'Every Sunday',
    flyer: '/images/flyers/pack_diamnche.jpg',
    accent: 'text-tc-game-red',
    border: 'border-tc-game-red/30',
    badge: 'DIMANCHE',
    badgeColor: 'bg-tc-game-red text-white',
    href: '/game-room',
    fallback: 'from-red-950 to-tc-black',
  },
  {
    id: 'sunday-brunch-resto',
    category: 'restaurant',
    categoryLabelFr: 'Restaurant & Lounge',
    categoryLabelEn: 'Restaurant & Lounge',
    nameFr: 'Brunch du Dimanche',
    nameEn: 'Sunday Brunch',
    taglineFr: 'Bufet à volonté · Karaoké · Live Music',
    taglineEn: 'All-you-can-eat · Karaoke · Live Music',
    descFr:
      'Bufet à volonté à 10 000 FCFA. Finger food, plats chauds (Ndolè, Gombo aux crabes, Blanquette de veau…), salades, desserts maison. Ambiance karaoké et live music dès 12H.',
    descEn:
      'All-you-can-eat buffet at 10,000 FCFA. Finger food, hot dishes (Ndolè, crab Gombo, Veal blanquette…), salads, homemade desserts. Karaoke and live music from 12PM.',
    schedule: 'Tous les dimanches à partir de 12H',
    scheduleEn: 'Every Sunday from 12PM',
    flyer: '/images/flyers/brunch1.jpg',
    accent: 'text-tc-gold',
    border: 'border-tc-gold/30',
    badge: 'DIMANCHE',
    badgeColor: 'bg-tc-gold text-black',
    href: '/restauration',
    fallback: 'from-amber-950 to-tc-black',
  },
  {
    id: 'brunch-mystere',
    category: 'restaurant',
    categoryLabelFr: 'Restaurant & Lounge',
    categoryLabelEn: 'Restaurant & Lounge',
    nameFr: 'Brunch Mystère',
    nameEn: 'Mystery Brunch',
    taglineFr: 'Laissez-vous surprendre',
    taglineEn: 'Let yourself be surprised',
    descFr:
      "Un menu 100% surprise. Des saveurs inattendues. Une expérience signée The Canteen's. Le dimanche à partir de 12H — réservation conseillée.",
    descEn:
      "A 100% surprise menu. Unexpected flavors. A signature The Canteen's experience. Sundays from 12PM — reservation recommended.",
    schedule: 'Tous les dimanches à partir de 12H',
    scheduleEn: 'Every Sunday from 12PM',
    flyer: '/images/flyers/brunch2.jpg',
    accent: 'text-tc-gold',
    border: 'border-tc-gold/30',
    badge: '?',
    badgeColor: 'bg-stone-700 text-white',
    href: '/restauration',
    fallback: 'from-stone-900 to-tc-black',
  },
  {
    id: 'soiree-dj',
    category: 'lounge',
    categoryLabelFr: 'Lounge',
    categoryLabelEn: 'Lounge',
    nameFr: 'Soirées DJ & Karaoké',
    nameEn: 'DJ Nights & Karaoke',
    taglineFr: 'La nuit commence au Lounge',
    taglineEn: 'The night starts at the Lounge',
    descFr:
      "Soirées DJ, sessions karaoké, afterwork… Le Lounge The Canteen's accueille régulièrement des événements festifs. Ouvert jusqu'à 6H du matin.",
    descEn:
      "DJ nights, karaoke sessions, afterwork… The Canteen's Lounge regularly hosts festive events. Open until 6AM.",
    schedule: 'Événements réguliers',
    scheduleEn: 'Regular events',
    flyer: '/images/lounge/lounge1.jpg',
    accent: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'LOUNGE',
    badgeColor: 'bg-purple-700 text-white',
    href: '/restauration/lounge',
    fallback: 'from-tc-navy to-tc-black',
  },
  {
    id: 'privatisation',
    category: 'event',
    categoryLabelFr: 'Événement privé',
    categoryLabelEn: 'Private event',
    nameFr: 'Privatisation & Événements',
    nameEn: 'Private Hire & Events',
    taglineFr: 'Anniversaires, corporate, cérémonies',
    taglineEn: 'Birthdays, corporate, ceremonies',
    descFr:
      "The Canteen's est disponible pour vos événements privés — anniversaires, réunions d'entreprise, cérémonies. Restaurant, lounge ou game room : choisissez votre espace.",
    descEn:
      "The Canteen's is available for your private events — birthdays, corporate meetings, ceremonies. Restaurant, lounge or game room: choose your space.",
    schedule: 'Sur réservation',
    scheduleEn: 'By reservation',
    flyer: '/images/flyers/brunch3.jpg',
    accent: 'text-tc-emerald',
    border: 'border-emerald-500/30',
    badge: 'PRIVÉ',
    badgeColor: 'bg-emerald-700 text-white',
    href: '/reservation',
    fallback: 'from-emerald-950 to-tc-black',
  },
]

const categoryColors: Record<string, string> = {
  'game-room': 'text-tc-game-cyan',
  restaurant: 'text-tc-gold',
  lounge: 'text-purple-400',
  event: 'text-emerald-400',
}

type Event = (typeof events)[number]

function EventCard({
  event,
  index,
  locale,
  isEn,
}: {
  event: Event
  index: number
  locale: string
  isEn: boolean
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [imgError, setImgError] = useState(false)
  const [flyerOpen, setFlyerOpen] = useState(false)

  return (
    <>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: (index % 3) * 0.1 }}
        className={cn(
          'group glass flex flex-col overflow-hidden border transition-all duration-300 hover:shadow-lg',
          event.border,
        )}
      >
        <div className="relative h-52 overflow-hidden">
          <div className={cn('absolute inset-0 bg-gradient-to-br', event.fallback)} />
          {!imgError && (
            <Image
              src={event.flyer}
              alt={isEn ? event.nameEn : event.nameFr}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              onError={() => setImgError(true)}
            />
          )}
          <div className="absolute left-3 top-3">
            <span className={cn('px-3 py-1 text-xs font-black tracking-widest', event.badgeColor)}>
              {event.badge}
            </span>
          </div>
          <div className="absolute right-3 top-3">
            <span
              className={cn(
                'rounded bg-black/60 px-2 py-1 text-[10px] uppercase tracking-widest',
                categoryColors[event.category] || 'text-white',
              )}
            >
              {isEn ? event.categoryLabelEn : event.categoryLabelFr}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFlyerOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100"
          >
            <span className="flex items-center gap-2 rounded border border-white/40 bg-black/60 px-4 py-2 text-xs uppercase tracking-widest text-white backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              {isEn ? 'View flyer' : 'Voir le flyer'}
            </span>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <p className={cn('mb-1 text-xs uppercase tracking-widest', event.accent)}>
              {isEn ? event.taglineEn : event.taglineFr}
            </p>
            <h3 className="font-serif text-xl leading-snug text-tc-cream">
              {isEn ? event.nameEn : event.nameFr}
            </h3>
          </div>

          <p className="flex-1 text-sm leading-relaxed text-tc-cream/50">
            {isEn ? event.descEn : event.descFr}
          </p>

          <div
            className={cn(
              'flex items-center gap-2 border-t pt-3 text-xs',
              event.border,
              event.accent,
            )}
          >
            <Calendar size={12} />
            <span>{isEn ? event.scheduleEn : event.schedule}</span>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={`/${locale}${event.href}`}
              className={cn(
                'group/link inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:underline',
                event.accent,
              )}
            >
              {isEn ? 'Learn more' : 'En savoir plus'}
              <ArrowRight
                size={12}
                className="transition-transform group-hover/link:translate-x-1"
              />
            </Link>
            <button
              type="button"
              onClick={() => setFlyerOpen(true)}
              className={cn(
                'inline-flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-50 transition-opacity hover:opacity-100',
                event.accent,
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              Flyer
            </button>
          </div>
        </div>
      </motion.div>

      <FlyerModal
        src={event.flyer}
        alt={isEn ? event.nameEn : event.nameFr}
        open={flyerOpen}
        onClose={() => setFlyerOpen(false)}
      />
    </>
  )
}

export default function EvenementsView({ locale }: { locale: string }) {
  const isEn = locale === 'en'

  return (
    <div className="min-h-screen bg-tc-black pt-32">
      <PageBackNav locale={locale} fallbackHref="/" />
      <section className="border-b border-white/5 px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
          <span className="mb-8 inline-block rounded-full border border-tc-gold/20 px-4 py-1.5 text-xs uppercase tracking-[0.4em] text-tc-gold/60">
            {isEn ? "What's on" : 'Agenda'}
          </span>
          <h1 className="font-serif mb-6 text-5xl text-tc-cream sm:text-6xl">
            {isEn ? 'Events' : 'Événements'}
          </h1>
          <p className="text-lg leading-relaxed text-tc-cream/50">
            {isEn
              ? "Brunchs, game nights, DJ sets, private events — there's always something happening at The Canteen's."
              : "Brunchs, game nights, soirées DJ, événements privés — il se passe toujours quelque chose chez The Canteen's."}
          </p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} locale={locale} isEn={isEn} />
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <p className="font-serif mb-4 text-3xl text-tc-cream">
            {isEn ? 'Organize your event' : 'Organisez votre événement'}
          </p>
          <p className="mb-8 text-sm leading-relaxed text-tc-cream/40">
            {isEn
              ? "Birthday, corporate event, private party — contact us to organize your event at The Canteen's."
              : "Anniversaire, événement corporate, soirée privée — contactez-nous pour organiser votre événement chez The Canteen's."}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/reservation`}
              className="bg-tc-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-tc-black transition-all hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
            >
              {isEn ? 'Book now' : 'Réserver'}
            </Link>
            <a
              href="https://wa.me/237699999886"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/20 px-8 py-4 text-sm font-bold uppercase tracking-widest text-tc-cream/70 transition-all hover:border-white/50"
            >
              WhatsApp
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
