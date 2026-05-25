'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  labelFr: string
  labelEn: string
  children?: { href: string; labelFr: string; labelEn: string; icon?: string }[]
}

const navLinks: NavLink[] = [
  { href: '/', labelFr: 'Accueil', labelEn: 'Home' },
  {
    href: '/restauration',
    labelFr: 'Restauration',
    labelEn: 'Dining',
    children: [
      { href: '/restauration', labelFr: 'La Carte', labelEn: 'Menu', icon: '🍽️' },
      {
        href: '/restauration/restaurant',
        labelFr: 'Le Restaurant',
        labelEn: 'Restaurant',
        icon: '🕯️',
      },
      { href: '/restauration/lounge', labelFr: 'Le Lounge', labelEn: 'Lounge', icon: '🍸' },
      {
        href: '/restauration/terrasse',
        labelFr: 'La Terrasse',
        labelEn: 'Terrace',
        icon: '🌿',
      },
    ],
  },
  { href: '/game-room', labelFr: 'Game Room', labelEn: 'Game Room' },
  { href: '/reservation', labelFr: 'Réservation', labelEn: 'Reservation' },
  { href: '/nos-espaces', labelFr: 'Nos Espaces', labelEn: 'Our Spaces' },
  { href: '/evenements', labelFr: 'Événements', labelEn: 'Events' },
  {
    href: '/contact',
    labelFr: 'Contact',
    labelEn: 'Contact',
    children: [
      {
        href: '/contact/restaurant',
        labelFr: 'Restaurant & Lounge',
        labelEn: 'Restaurant & Lounge',
        icon: '🍽️',
      },
      {
        href: '/contact/game-room',
        labelFr: 'Game Room',
        labelEn: 'Game Room',
        icon: '🎮',
      },
    ],
  },
]

export default function Navbar({ locale }: { locale: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setOpenDropdown(null)
  }, [pathname])

  const otherLocale = locale === 'fr' ? 'en' : 'fr'
  const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`)

  const isActive = (href: string) => {
    if (href === '/')
      return pathname === `/${locale}` || pathname === `/${locale}/`
    return pathname.includes(href)
  }

  const isGameRoom = pathname.includes('/game-room')
  const logoSrc = isGameRoom
    ? '/images/logos/logo_gameroom1-removebg-preview.png'
    : '/images/logos/logo_restaurant1-removebg-preview.png'
  const logoAlt = isGameRoom ? "The Canteen's Game Room" : "The Canteen's"

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass-dark border-b border-white/10' : 'bg-transparent',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          <Link href={`/${locale}`} className="flex shrink-0 items-center">
            <div className="relative h-16 w-56">
              <Image
                src={logoSrc}
                alt={logoAlt}
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          <div
            ref={navRef}
            className="hidden items-center gap-1 lg:flex"
          >
            {navLinks.map((link) => {
              if (link.children) {
                return (
                  <div key={link.href} className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdown(openDropdown === link.href ? null : link.href)
                      }
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 text-xs uppercase tracking-wider transition-all duration-200 hover:text-tc-gold',
                        isActive(link.href) ? 'text-tc-gold' : 'text-tc-cream/70',
                      )}
                    >
                      {locale === 'fr' ? link.labelFr : link.labelEn}
                      <ChevronDown
                        size={12}
                        className={cn(
                          'transition-transform duration-200',
                          openDropdown === link.href ? 'rotate-180' : '',
                        )}
                      />
                    </button>

                    {openDropdown === link.href ? (
                      <div className="glass-dark absolute left-0 top-full mt-1 w-52 border border-white/10 py-2 shadow-xl">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={`/${locale}${child.href}`}
                            onClick={() => setOpenDropdown(null)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-wider text-tc-cream/60 transition-all hover:bg-white/5 hover:text-tc-gold',
                            )}
                          >
                            {child.icon ? (
                              <span className="text-base">{child.icon}</span>
                            ) : null}
                            {locale === 'fr' ? child.labelFr : child.labelEn}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              }

              return (
                <Link
                  key={link.href}
                  href={`/${locale}${link.href === '/' ? '' : link.href}`}
                  className={cn(
                    'px-3 py-2 text-xs uppercase tracking-wider transition-all duration-200 hover:text-tc-gold',
                    link.href === '/game-room'
                      ? isActive(link.href)
                        ? 'text-tc-game-cyan'
                        : 'text-tc-cream/70 hover:text-tc-game-cyan'
                      : link.href === '/reservation'
                        ? 'border border-tc-gold/40 px-4 text-tc-gold hover:bg-tc-gold/10'
                        : isActive(link.href)
                          ? 'text-tc-gold'
                          : 'text-tc-cream/70',
                  )}
                >
                  {locale === 'fr' ? link.labelFr : link.labelEn}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={newPath}
              className="hidden rounded border border-white/10 px-3 py-1.5 text-xs uppercase tracking-widest text-tc-cream/50 transition-colors hover:text-tc-gold lg:flex"
            >
              {otherLocale.toUpperCase()}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-tc-cream lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="glass-dark max-h-[80vh] overflow-y-auto border-t border-white/10 lg:hidden">
          <div className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={`/${locale}${link.href === '/' ? '' : link.href}`}
                  onClick={() => !link.children && setMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between border-b border-white/5 px-2 py-3 text-sm uppercase tracking-wider transition-colors',
                    isActive(link.href) ? 'text-tc-gold' : 'text-tc-cream/70',
                  )}
                >
                  {locale === 'fr' ? link.labelFr : link.labelEn}
                </Link>

                {link.children ? (
                  <div className="flex flex-col gap-0.5 pb-2 pl-4">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={`/${locale}${child.href}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-2 py-2 text-xs text-tc-cream/50 transition-colors hover:text-tc-gold"
                      >
                        {child.icon}
                        {locale === 'fr' ? child.labelFr : child.labelEn}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            <Link
              href={newPath}
              onClick={() => setMenuOpen(false)}
              className="px-2 py-3 text-xs uppercase tracking-widest text-tc-cream/40 transition-colors hover:text-tc-gold"
            >
              Langue : {otherLocale.toUpperCase()}
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  )
}
