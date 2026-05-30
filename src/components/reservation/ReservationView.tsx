'use client'

import { motion } from 'framer-motion'
import { Phone, Clock, Users, MapPin, Info } from 'lucide-react'
import { PageBackNav } from '@/components/ui/BackButton'
import ReservationForm from '@/components/reservation/ReservationForm'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

type Section = {
  id: string
  label: string
  icon: string
  color: string
  accent: string
  glow: string
  description: string
  infos: string[]
  steps: string[]
  whatsapp: { number: string; label: string }
  phone: { number: string; label: string }
}

function getContent(locale: string): {
  badge: string
  title: string
  subtitle: string
  tip: string
  howTitle: string
  sections: Section[]
  address: string
  mapsLabel: string
} {
  if (locale === 'fr') {
    return {
      badge: 'Réservation',
      title: 'Réservez votre\nexpérience',
      subtitle:
        'Simple et rapide — contactez-nous directement via WhatsApp ou par téléphone.',
      tip: 'Réservation conseillée le weekend et pour les groupes de plus de 6 personnes.',
      howTitle: 'Comment réserver',
      address: 'Dragage, à côté du Club Camtel — Yaoundé, Cameroun',
      mapsLabel: 'Voir sur Google Maps →',
      sections: [
        {
          id: 'restaurant',
          label: 'Restaurant & Lounge',
          icon: '🍽️',
          color: 'border-tc-gold/30',
          accent: 'text-tc-gold',
          glow: 'rgba(212,175,55,0.1)',
          description:
            'Pour dîner au restaurant, privatiser le lounge ou organiser un événement — brunch, anniversaire, réunion professionnelle.',
          infos: [
            '80 couverts en salle',
            "Ouvert tous les jours jusqu'à 6H",
            'Dragage, à côté du Club Camtel',
          ],
          steps: [
            'Envoyez un message WhatsApp avec la date souhaitée',
            "Précisez le nombre de personnes et l'occasion",
            'Nous confirmons votre créneau sous 30 minutes',
          ],
          whatsapp: { number: '237655867084', label: 'WhatsApp Restaurant' },
          phone: { number: '+237 655 867 084', label: 'Appeler le restaurant' },
        },
        {
          id: 'gameroom',
          label: 'Game Room',
          icon: '🎮',
          color: 'border-tc-game-cyan/30',
          accent: 'text-tc-game-cyan',
          glow: 'rgba(0,229,255,0.1)',
          description:
            "Pour réserver un créneau en salle, profiter d'un pack groupe, organiser un anniversaire gaming ou privatiser la salle.",
          infos: [
            'Capacité groupe disponible',
            'Enfants 12H-18H • Adultes 12H-00H',
            'Même adresse — Dragage',
          ],
          steps: [
            'Contactez-nous via WhatsApp avec votre date',
            'Choisissez votre pack ou formule libre',
            'Confirmation et réservation du créneau',
          ],
          whatsapp: { number: '237677138318', label: 'WhatsApp Game Room' },
          phone: { number: '+237 677 138 318', label: 'Appeler la Game Room' },
        },
      ],
    }
  }
  return {
    badge: 'Reservation',
    title: 'Book your\nexperience',
    subtitle: 'Simple and fast — contact us directly via WhatsApp or by phone.',
    tip: 'Reservation recommended on weekends and for groups of more than 6 people.',
    howTitle: 'How to book',
    address: 'Dragage, next to Club Camtel — Yaoundé, Cameroon',
    mapsLabel: 'View on Google Maps →',
    sections: [
      {
        id: 'restaurant',
        label: 'Restaurant & Lounge',
        icon: '🍽️',
        color: 'border-tc-gold/30',
        accent: 'text-tc-gold',
        glow: 'rgba(212,175,55,0.1)',
        description:
          'For dining at the restaurant, privatizing the lounge or organizing an event — brunch, birthday, business meeting.',
        infos: [
          '80 seats',
          'Open every day until 6AM',
          'Dragage, next to Club Camtel',
        ],
        steps: [
          'Send a WhatsApp message with your desired date',
          'Specify the number of guests and occasion',
          'We confirm your slot within 30 minutes',
        ],
        whatsapp: { number: '237655867084', label: 'WhatsApp Restaurant' },
        phone: { number: '+237 655 867 084', label: 'Call the restaurant' },
      },
      {
        id: 'gameroom',
        label: 'Game Room',
        icon: '🎮',
        color: 'border-tc-game-cyan/30',
        accent: 'text-tc-game-cyan',
        glow: 'rgba(0,229,255,0.1)',
        description:
          'To book a time slot, enjoy a group pack, organize a gaming birthday or privatize the room.',
        infos: [
          'Group capacity available',
          'Kids 12PM-6PM • Adults 12PM-Midnight',
          'Same address — Dragage',
        ],
        steps: [
          'Contact us via WhatsApp with your date',
          'Choose your pack or free session',
          'Confirmation and time slot booking',
        ],
        whatsapp: { number: '237677138318', label: 'WhatsApp Game Room' },
        phone: { number: '+237 677 138 318', label: 'Call the Game Room' },
      },
    ],
  }
}

const infoIcons = [Users, Clock, MapPin] as const

export default function ReservationView({
  locale,
  defaultEspace,
}: {
  locale: string
  defaultEspace?: string
}) {
  const content = getContent(locale)

  return (
    <div className="min-h-screen bg-tc-black pt-32">
      <PageBackNav locale={locale} fallbackHref="/" />
      <section className="border-b border-white/5 px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-8 inline-block rounded-full border border-tc-gold/20 px-4 py-1.5 text-xs uppercase tracking-[0.4em] text-tc-gold/60">
              {content.badge}
            </span>
            <h1 className="mb-6 whitespace-pre-line font-serif text-5xl leading-tight text-tc-cream sm:text-6xl">
              {content.title}
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-tc-cream/50">
              {content.subtitle}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-tc-gold/20 bg-tc-gold/10 px-4 py-2.5 text-xs text-tc-gold/80">
              <Info size={12} />
              {content.tip}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">

          {/* Formulaire Restaurant / Lounge / Terrasse */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 text-center"
            >
              <span className="mb-4 block text-xs uppercase tracking-[0.3em] text-tc-gold/50">
                {locale === 'fr' ? 'Restaurant · Lounge · Terrasse' : 'Restaurant · Lounge · Terrace'}
              </span>
              <h2 className="font-serif text-3xl text-tc-cream sm:text-4xl">
                {locale === 'fr' ? 'Formulaire de réservation' : 'Reservation form'}
              </h2>
            </motion.div>
            <ReservationForm locale={locale} defaultEspace={defaultEspace} />
          </div>

          {/* Séparateur Game Room */}
          <div className="mb-12 flex items-center gap-6">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs uppercase tracking-[0.3em] text-tc-game-cyan/50">Game Room</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {/* Carte Game Room — conserve l'existant */}
          <div className="mx-auto max-w-lg">
            {/* Ici on garde uniquement la carte Game Room du grid existant */}
            {content.sections.filter(s => s.id === 'gameroom').map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ boxShadow: `0 0 50px ${section.glow}` }}
                className={`glass flex flex-col gap-6 border p-8 ${section.color}`}
              >
                <div>
                  <h2 className="mb-3 font-serif text-3xl text-tc-cream">{section.label}</h2>
                  <p className="text-sm leading-relaxed text-tc-cream/50">{section.description}</p>
                </div>
                <div className={`flex flex-col gap-2 border-y py-4 ${section.color}`}>
                  {section.infos.map((text, j) => {
                    const Icon = infoIcons[j] ?? MapPin
                    return (
                      <div key={j} className={`flex items-center gap-2 text-xs ${section.accent}`}>
                        <Icon size={14} />
                        <span className="text-tc-cream/60">{text}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-3">
                  <p className={`mb-1 text-xs uppercase tracking-widest ${section.accent}`}>{content.howTitle}</p>
                  {section.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${section.color} ${section.accent}`}>
                        {j + 1}
                      </span>
                      <p className="text-sm text-tc-cream/60">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <a
                    href={`https://wa.me/${section.whatsapp.number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-green-500"
                  >
                    <WhatsAppIcon />
                    {section.whatsapp.label}
                  </a>
                  <a
                    href={`tel:${section.phone.number.replace(/\s/g, '')}`}
                    className={`flex items-center justify-center gap-2 border px-6 py-3 text-sm tracking-wider transition-all hover:bg-white/5 ${section.color} ${section.accent}`}
                  >
                    <Phone size={14} />
                    {section.phone.number}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-12 text-center">
        <div className="mx-auto max-w-md">
          <MapPin size={20} className="mx-auto mb-3 text-tc-gold" />
          <p className="text-sm text-tc-cream/50">{content.address}</p>
          <a
            href="https://maps.google.com/?q=Dragage+Yaounde+Cameroun"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs uppercase tracking-widest text-tc-cream/30 transition-colors hover:text-tc-gold"
          >
            {content.mapsLabel}
          </a>
        </div>
      </section>
    </div>
  )
}
