'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Event {
  id: string
  titre: string
  description?: string
  type: string
  date_event: string
  date_end?: string
  deadline_reservation?: string
  places_total?: number
  places_reserved: number
  flyers: string[]
  is_featured: boolean
  is_visible: boolean
}

const TYPE_STYLES: Record<
  string,
  { pill: string; placeholder: string; labelFr: string; labelEn: string; initial: string }
> = {
  showcase: {
    pill: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    placeholder: 'bg-purple-950/60',
    labelFr: 'Showcase',
    labelEn: 'Showcase',
    initial: 'S',
  },
  anniversaire: {
    pill: 'bg-tc-gold/20 text-tc-gold border-tc-gold/30',
    placeholder: 'bg-amber-950/60',
    labelFr: 'Anniversaire',
    labelEn: 'Birthday',
    initial: 'A',
  },
  brunch: {
    pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    placeholder: 'bg-amber-900/50',
    labelFr: 'Brunch',
    labelEn: 'Brunch',
    initial: 'B',
  },
  sport: {
    pill: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    placeholder: 'bg-blue-950/60',
    labelFr: 'Sport',
    labelEn: 'Sport',
    initial: 'S',
  },
  special: {
    pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    placeholder: 'bg-emerald-950/60',
    labelFr: 'Spécial',
    labelEn: 'Special',
    initial: '★',
  },
}

const DEFAULT_TYPE_STYLE = {
  pill: 'bg-white/10 text-tc-cream/70 border-white/15',
  placeholder: 'bg-neutral-900',
  labelFr: 'Événement',
  labelEn: 'Event',
  initial: 'E',
}

function getTypeStyle(type: string) {
  return TYPE_STYLES[type] ?? DEFAULT_TYPE_STYLE
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatFeaturedDate(dateIso: string, locale: string) {
  const d = new Date(dateIso)
  const loc = locale === 'fr' ? 'fr-FR' : 'en-US'
  const weekday = capitalize(d.toLocaleDateString(loc, { weekday: 'long' }))
  const day = d.getDate()
  const month = capitalize(d.toLocaleDateString(loc, { month: 'long' }))
  const year = d.getFullYear()
  const hours = d.getHours()

  if (locale === 'fr') {
    return `${weekday} ${day} ${month} ${year} · À partir de ${hours}H`
  }
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${weekday} ${month} ${day}, ${year} · From ${time}`
}

function formatCardDate(dateIso: string, locale: string) {
  const d = new Date(dateIso)
  const loc = locale === 'fr' ? 'fr-FR' : 'en-US'
  const datePart = d.toLocaleDateString(loc, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const time =
    locale === 'fr'
      ? `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`
      : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${capitalize(datePart)} · ${time}`
}

function formatDeadline(dateIso: string, locale: string) {
  const d = new Date(dateIso)
  const loc = locale === 'fr' ? 'fr-FR' : 'en-US'
  return d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupEventsByMonth(events: Event[], locale: string) {
  const loc = locale === 'fr' ? 'fr-FR' : 'en-US'
  const grouped = events.reduce<Record<string, Event[]>>((acc, ev) => {
    const key = capitalize(
      new Date(ev.date_event).toLocaleDateString(loc, { month: 'long', year: 'numeric' }),
    )
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})

  return Object.entries(grouped).sort(([, a], [, b]) => {
    const ta = new Date(a[0]?.date_event ?? 0).getTime()
    const tb = new Date(b[0]?.date_event ?? 0).getTime()
    return tb - ta
  })
}

function useCountdown(targetIso: string | null) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!targetIso) return
    const tick = () => {
      const diff = Math.max(0, new Date(targetIso).getTime() - Date.now())
      setParts({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      })
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetIso])

  return parts
}

export default function EvenementsPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'fr'
  const isFr = locale === 'fr'

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [flyerIndex, setFlyerIndex] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_visible', true)
      .order('date_event', { ascending: false })

    setEvents((data as Event[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchEvents()

    const supabase = createClient()
    const channel = supabase
      .channel('events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => void fetchEvents(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchEvents])

  const now = Date.now()

  const futureEvents = useMemo(
    () =>
      events
        .filter((e) => new Date(e.date_event).getTime() > now)
        .sort(
          (a, b) =>
            new Date(a.date_event).getTime() - new Date(b.date_event).getTime(),
        ),
    [events, now],
  )

  const featuredEvent = useMemo(() => {
    if (futureEvents.length === 0) return null
    return futureEvents.find((e) => e.is_featured) ?? futureEvents[0]
  }, [futureEvents])

  const featuredIsFuture = featuredEvent
    ? new Date(featuredEvent.date_event).getTime() > now
    : false

  const countdown = useCountdown(featuredIsFuture ? featuredEvent!.date_event : null)

  const featuredFlyers = useMemo(
    () => featuredEvent?.flyers?.filter(Boolean) ?? [],
    [featuredEvent],
  )

  useEffect(() => {
    setFlyerIndex(0)
  }, [featuredEvent?.id])

  useEffect(() => {
    if (featuredFlyers.length <= 1) return
    const id = window.setInterval(() => {
      setFlyerIndex((i) => (i + 1) % featuredFlyers.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [featuredFlyers.length, featuredEvent?.id])

  const eventsByMonth = useMemo(() => groupEventsByMonth(events, locale), [events, locale])

  const countdownBlocks = [
    { label: isFr ? 'Jours' : 'Days', short: isFr ? 'J' : 'D', value: countdown.days },
    { label: isFr ? 'Heures' : 'Hours', short: 'H', value: countdown.hours },
    { label: isFr ? 'Min' : 'Min', short: 'M', value: countdown.minutes },
    { label: isFr ? 'Sec' : 'Sec', short: 'S', value: countdown.seconds },
  ]

  if (!loading && events.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-tc-black px-6 text-center">
        <Calendar className="h-12 w-12 text-white/10" strokeWidth={1} aria-hidden />
        <p className="mt-6 text-tc-cream/30">
          {isFr ? 'Aucun événement programmé' : 'No events scheduled'}
        </p>
        <p className="mt-2 text-xs text-white/20">
          {isFr
            ? "Revenez bientôt — il se passe toujours quelque chose chez The Canteen's"
            : "Come back soon — there's always something happening at The Canteen's"}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-tc-black text-tc-cream">
      {/* Section 1 — À la une */}
      {featuredEvent ? (
        <section className="relative min-h-[75vh] overflow-hidden">
          <div className="absolute inset-0">
            {featuredFlyers.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredFlyers[flyerIndex]}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={featuredFlyers[flyerIndex]}
                    alt={featuredEvent.titre}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-tc-burgundy/80 via-tc-black to-tc-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
          </div>

          {featuredFlyers.length > 1 ? (
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
              {featuredFlyers.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Flyer ${i + 1}`}
                  onClick={() => setFlyerIndex(i)}
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    i === flyerIndex ? 'bg-tc-gold' : 'bg-white/30',
                  )}
                />
              ))}
            </div>
          ) : null}

          <div className="relative z-10 flex min-h-[75vh] items-center justify-center px-4">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-20 text-center">
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest',
                  getTypeStyle(featuredEvent.type).pill,
                )}
              >
                {isFr
                  ? getTypeStyle(featuredEvent.type).labelFr
                  : getTypeStyle(featuredEvent.type).labelEn}
              </span>

              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
                THE CANTEEN&apos;S PRESENTS
              </p>

              <h1 className="font-serif text-5xl leading-none text-tc-cream sm:text-7xl">
                {featuredEvent.titre}
              </h1>

              {featuredEvent.description ? (
                <p className="max-w-md text-sm text-tc-cream/50">{featuredEvent.description}</p>
              ) : null}

              <p className="text-sm tracking-wider text-tc-gold">
                {formatFeaturedDate(featuredEvent.date_event, locale)}
              </p>

              {featuredIsFuture ? (
                <div className="mt-2 flex justify-center gap-4 sm:gap-6">
                  {countdownBlocks.map((block) => (
                    <div key={block.short} className="flex flex-col items-center">
                      <span className="font-mono text-4xl font-bold text-tc-gold">
                        {String(block.value).padStart(2, '0')}
                      </span>
                      <span className="mt-1 text-[9px] uppercase tracking-[0.3em] text-white/30">
                        {block.short}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {featuredEvent.deadline_reservation ? (
                <p className="text-xs text-white/30">
                  {isFr ? 'Réservations jusqu' : 'Reservations until'}{' '}
                  {isFr ? 'au ' : ''}
                  {formatDeadline(featuredEvent.deadline_reservation, locale)}
                </p>
              ) : null}

              <Link
                href={`/${locale}/reservation`}
                className="mt-2 border border-tc-gold px-8 py-3 text-sm tracking-wider text-tc-gold transition hover:bg-tc-gold hover:text-tc-black"
              >
                {isFr ? 'Réserver ma place →' : 'Reserve my spot →'}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Section 2 — Agenda */}
      <section className="px-4 pb-24 pt-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <p className="py-16 text-center text-sm text-tc-cream/40">
              {isFr ? 'Chargement…' : 'Loading…'}
            </p>
          ) : (() => {
            const upcomingNonFeatured = events.filter(
              (e) => new Date(e.date_event).getTime() > now && e.id !== featuredEvent?.id
            )
            const pastEvents = events.filter(
              (e) => new Date(e.date_event).getTime() <= now
            )
            const pastByMonth = pastEvents.reduce<Record<string, Event[]>>((acc, ev) => {
              const key = capitalize(
                new Date(ev.date_event).toLocaleDateString(
                  locale === 'fr' ? 'fr-FR' : 'en-US',
                  { month: 'long', year: 'numeric' }
                )
              )
              if (!acc[key]) acc[key] = []
              acc[key].push(ev)
              return acc
            }, {})
            const pastMonths = Object.entries(pastByMonth).sort(
              ([, a], [, b]) =>
                new Date(b[0]?.date_event ?? 0).getTime() -
                new Date(a[0]?.date_event ?? 0).getTime()
            )

            return (
              <div>
                {/* Prochains événements (hors à la une) */}
                {upcomingNonFeatured.length > 0 && (
                  <div className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-px flex-1 bg-tc-gold/20" />
                      <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                        {isFr ? 'Prochains événements' : 'Upcoming events'}
                      </span>
                      <div className="h-px flex-1 bg-tc-gold/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {upcomingNonFeatured.map((event, i) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          index={i}
                          locale={locale}
                          isFr={isFr}
                          isPast={false}
                          onFlyerClick={setLightbox}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Événements passés */}
                {pastMonths.length > 0 && (
                  <div>
                    {/* Titre de section */}
                    <div className="flex items-center gap-4 mb-10">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-xs uppercase tracking-[0.4em] text-white/30">
                        {isFr ? 'Événements passés' : 'Past events'}
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    {pastMonths.map(([monthLabel, monthEvents]) => (
                      <div key={monthLabel} className="mb-12">
                        {/* Header mois */}
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-[10px] uppercase tracking-[0.35em] text-white/20">
                            {monthLabel}
                          </span>
                          <div className="h-px flex-1 bg-white/5" />
                          <span className="text-[10px] text-white/20">
                            {monthEvents.length} {monthEvents.length > 1 ? (isFr ? 'événements' : 'events') : (isFr ? 'événement' : 'event')}
                          </span>
                        </div>

                        {/* Grille de cartes */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          {monthEvents.map((event, i) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              index={i}
                              locale={locale}
                              isFr={isFr}
                              isPast={true}
                              onFlyerClick={setLightbox}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </section>

      {/* Lightbox flyer */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/92 p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label={isFr ? 'Fermer' : 'Close'}
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[92vh] w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightbox}
                alt="Flyer"
                width={800}
                height={1000}
                className="h-auto max-h-[92vh] w-full rounded-2xl object-contain shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Composant carte événement ────────────────────────────────────────────────
function EventCard({
  event,
  index,
  locale,
  isFr,
  isPast,
  onFlyerClick,
}: {
  event: Event
  index: number
  locale: string
  isFr: boolean
  isPast: boolean
  onFlyerClick: (src: string) => void
}) {
  const typeStyle = getTypeStyle(event.type)
  const flyer = event.flyers?.[0]

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: isPast ? 0.75 : 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition hover:border-white/10"
    >
      {/* Image flyer */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {flyer ? (
          <button
            type="button"
            onClick={() => onFlyerClick(flyer)}
            className="absolute inset-0 z-10 cursor-zoom-in"
            aria-label={isFr ? 'Agrandir le flyer' : 'Enlarge flyer'}
          >
            <span className="sr-only">{event.titre}</span>
          </button>
        ) : null}
        {flyer ? (
          <Image
            src={flyer}
            alt={event.titre}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center font-serif text-4xl text-white/20',
              typeStyle.placeholder,
            )}
          >
            {typeStyle.initial}
          </div>
        )}
        {/* Badge type */}
        <span
          className={cn(
            'absolute left-2 top-2 z-20 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider backdrop-blur-sm',
            isPast
              ? 'border-white/10 bg-black/50 text-white/40'
              : typeStyle.pill,
          )}
        >
          {isPast ? (isFr ? 'Terminé' : 'Ended') : (isFr ? typeStyle.labelFr : typeStyle.labelEn)}
        </span>
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-xs font-medium leading-snug text-tc-cream sm:text-sm">
          {event.titre}
        </h3>
        {event.description && (
          <p className="line-clamp-2 text-[10px] leading-relaxed text-white/35">
            {event.description}
          </p>
        )}
        <p className="mt-auto pt-2 text-[10px] text-white/25">
          {capitalize(
            new Date(event.date_event).toLocaleDateString(
              locale === 'fr' ? 'fr-FR' : 'en-US',
              { day: 'numeric', month: 'short', year: 'numeric' }
            )
          )}
        </p>
        {event.flyers && event.flyers.length > 1 && (
          <p className="text-[9px] text-white/20">
            + {event.flyers.length - 1} flyer{event.flyers.length > 2 ? 's' : ''}
          </p>
        )}
      </div>
    </motion.article>
  )
}
