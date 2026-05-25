'use client'

import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { useParams } from 'next/navigation'
import { PageBackNav } from '@/components/ui/BackButton'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

export default function ContactRestaurantPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const isEn = locale === 'en'

  return (
    <div className="min-h-screen bg-tc-black pt-32">
      <PageBackNav locale={locale} fallbackHref="/contact" />
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-4 block text-3xl">🍽️</span>
            <span className="mb-3 block text-xs uppercase tracking-[0.4em] text-tc-gold">
              {isEn ? 'Reservations & Information' : 'Réservations & Informations'}
            </span>
            <h1 className="mb-10 font-serif text-4xl text-tc-cream sm:text-5xl">
              Restaurant & Lounge
            </h1>

            <div className="mb-10 flex flex-col gap-4">
              {[
                {
                  icon: <Phone size={18} />,
                  label: isEn ? 'Phone' : 'Téléphone',
                  value: '+237 699 999 886',
                  href: 'tel:+237699999886',
                },
                {
                  icon: <WhatsAppIcon />,
                  label: 'WhatsApp',
                  value: '+237 699 999 886',
                  href: 'https://wa.me/237699999886',
                  external: true,
                },
                {
                  icon: <Mail size={18} />,
                  label: 'Email',
                  value: 'thecanteens.sarl2024@gmail.com',
                  href: 'mailto:thecanteens.sarl2024@gmail.com',
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
                  className="glass group flex items-center gap-4 border border-tc-gold/20 p-5 transition-all hover:border-tc-gold/50"
                >
                  <span className="shrink-0 text-tc-gold transition-transform group-hover:scale-110">
                    {c.icon}
                  </span>
                  <div>
                    <p className="mb-0.5 text-[10px] uppercase tracking-widest text-tc-cream/30">
                      {c.label}
                    </p>
                    <p className="text-tc-cream transition-colors group-hover:text-tc-gold">
                      {c.value}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="glass mb-8 border border-white/10 p-6">
              <div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-widest text-tc-gold">
                <Clock size={14} />
                {isEn ? 'Hours' : 'Horaires'}
              </div>
              <div className="flex flex-col gap-3">
                {[
                  {
                    day: isEn ? 'Every day' : 'Tous les jours',
                    hours: isEn ? 'Until 6AM' : "Jusqu'à 6H du matin",
                  },
                  {
                    day: isEn ? 'Sunday brunch' : 'Brunch du dimanche',
                    hours: isEn ? 'From 12PM' : 'À partir de 12H',
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
              <p className="mb-5 text-xs uppercase tracking-widest text-tc-gold">
                {isEn ? 'Social media' : 'Réseaux sociaux'}
              </p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    icon: <InstagramIcon />,
                    handle: '@thecanteenslounge',
                    href: 'https://www.instagram.com/thecanteenslounge/',
                    color: 'hover:text-pink-400',
                  },
                  {
                    icon: <FacebookIcon />,
                    handle: "The Canteen's Lounge",
                    href: 'https://www.facebook.com/the.canteens.lounge/',
                    color: 'hover:text-blue-400',
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
              <MapPin size={16} className="mt-0.5 shrink-0 text-tc-gold" />
              <span>Dragage, à côté du Club Camtel — Yaoundé, Cameroun</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
