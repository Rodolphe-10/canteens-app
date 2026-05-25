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
