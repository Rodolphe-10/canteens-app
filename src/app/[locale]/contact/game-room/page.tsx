'use client'

import { motion } from 'framer-motion'
import { Phone, MapPin, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

export default function ContactGameRoomPage() {
  const params = useParams()
  const locale = typeof params.locale === 'string' ? params.locale : 'fr'
  const isEn = locale === 'en'

  return (
    <div className="min-h-screen bg-tc-black pt-20">
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/${locale}/contact`}
            className="mb-10 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-tc-cream/40 transition-colors hover:text-tc-cream"
          >
            <ArrowLeft size={12} />
            {isEn ? 'All contacts' : 'Tous les contacts'}
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-4 block text-3xl">🎮</span>
            <span className="mb-3 block text-xs uppercase tracking-[0.4em] text-tc-game-cyan">
              {isEn ? 'Bookings, packs & groups' : 'Réservations, packs & groupes'}
            </span>
            <h1 className="mb-10 font-serif text-4xl text-tc-cream sm:text-5xl">Game Room</h1>

            <div className="mb-10 flex flex-col gap-4">
              {[
                {
                  icon: <Phone size={18} />,
                  label: isEn ? 'Phone 1' : 'Téléphone 1',
                  value: '+237 677 138 318',
                  href: 'tel:+237677138318',
                },
                {
                  icon: <Phone size={18} />,
                  label: isEn ? 'Phone 2' : 'Téléphone 2',
                  value: '+237 692 677 519',
                  href: 'tel:+237692677519',
                },
                {
                  icon: <WhatsAppIcon />,
                  label: 'WhatsApp',
                  value: '+237 677 138 318',
                  href: 'https://wa.me/237677138318',
                  external: true,
                },
              ].map((c, i) => (
                <motion.a
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  href={c.href}
                  target={c.external ? '_blank' : undefined}
                  rel={c.external ? 'noopener noreferrer' : undefined}
                  className="glass group flex items-center gap-4 border border-tc-game-cyan/20 p-5 transition-all hover:border-tc-game-cyan/50"
                >
                  <span className="shrink-0 text-tc-game-cyan transition-transform group-hover:scale-110">
                    {c.icon}
                  </span>
                  <div>
                    <p className="mb-0.5 text-[10px] uppercase tracking-widest text-tc-cream/30">
                      {c.label}
                    </p>
                    <p className="text-tc-cream transition-colors group-hover:text-tc-game-cyan">
                      {c.value}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="glass mb-8 border border-white/10 p-6">
              <div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-widest text-tc-game-cyan">
                <Clock size={14} />
                {isEn ? 'Hours' : 'Horaires'}
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { day: isEn ? 'Kids' : 'Enfants', hours: isEn ? '12PM – 6PM' : '12H – 18H' },
                  {
                    day: isEn ? 'Adults' : 'Adultes',
                    hours: isEn ? '12PM – Midnight' : '12H – 00H',
                  },
                  {
                    day: isEn ? 'Every day' : 'Tous les jours',
                    hours: isEn ? '7 days/week' : '7j/7',
                  },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-tc-cream/50">{s.day}</span>
                    <span className="text-tc-cream">{s.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass mb-8 border border-white/10 p-6">
              <p className="mb-5 text-xs uppercase tracking-widest text-tc-game-cyan">
                {isEn ? 'Social media' : 'Réseaux sociaux'}
              </p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    icon: <FacebookIcon />,
                    handle: '@thecanteensgameroom',
                    href: 'https://www.facebook.com/thecanteensgameroom',
                    color: 'hover:text-blue-400',
                  },
                  {
                    icon: <TikTokIcon />,
                    handle: '@thecanteensgameroom',
                    href: 'https://www.tiktok.com/@thecanteensgameroom',
                    color: 'hover:text-white',
                  },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 text-tc-cream/50 transition-colors ${s.color}`}
                  >
                    {s.icon}
                    <span className="text-sm">{s.handle}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-tc-cream/40">
              <MapPin size={16} className="mt-0.5 shrink-0 text-tc-game-cyan" />
              <span>Dragage, à côté du Club Camtel — Yaoundé, Cameroun</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
