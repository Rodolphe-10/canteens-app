'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

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

/** Barre fixe sous la navbar — visible sur toutes les pages avec retour */
export function PageBackNav({
  locale,
  fallbackHref = '/',
  labelFr,
  labelEn,
  className,
}: BackButtonProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 top-20 z-40 px-4 py-3 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div className="mx-auto max-w-7xl">
        <BackButton
          locale={locale}
          fallbackHref={fallbackHref}
          labelFr={labelFr}
          labelEn={labelEn}
          className="gap-2 rounded border border-white/10 bg-tc-black/70 px-4 py-2 text-tc-cream/70 backdrop-blur-md hover:border-white/30 hover:bg-tc-black/90 hover:text-tc-cream"
        />
      </div>
    </div>
  )
}
