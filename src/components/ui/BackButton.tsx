'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
interface BackButtonProps {
  locale: string
  fallbackHref?: string
  labelFr?: string
  labelEn?: string
  className?: string
}

export default function BackButton({
  locale,
  fallbackHref = '/',
  labelFr = 'Retour',
  labelEn = 'Back',
  className = '',
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(`/${locale}${fallbackHref}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-tc-cream/40 transition-colors hover:text-tc-cream/80 ${className}`}
    >
      <ArrowLeft
        size={14}
        className="transition-transform group-hover:-translate-x-1"
      />
      {locale === 'fr' ? labelFr : labelEn}
    </button>
  )
}

export function PageBackNav({
  locale,
  fallbackHref = '/',
  labelFr,
  labelEn,
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(`/${locale}${fallbackHref === '/' ? '' : fallbackHref}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="group fixed left-4 top-24 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[11px] uppercase tracking-widest text-tc-cream/50 backdrop-blur-md transition-all duration-200 hover:border-white/25 hover:bg-black/60 hover:text-tc-cream/90 sm:left-6"
    >
      <ArrowLeft
        size={12}
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      />
      {locale === 'fr' ? (labelFr ?? 'Retour') : (labelEn ?? 'Back')}
    </button>
  )
}
