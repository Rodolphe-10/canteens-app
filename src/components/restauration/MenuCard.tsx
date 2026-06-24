'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Star, X } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { DARK_BLUR } from '@/lib/blur-placeholder'
import {
  MENU_CARD_IMAGE_WIDTH,
  MENU_CARD_IMAGE_HEIGHT,
  menuCardImageFrameClass,
  menuCardImageInnerClass,
  menuCardImageSquareClass,
} from '@/lib/menu-image'
import Tooltip from '@/components/ui/Tooltip'
import { cn, formatPrice } from '@/lib/utils'
import type { MenuItem } from '@/data/menu'

export default function MenuCard({
  item,
  locale,
  onAdded,
  readOnly = false,
}: {
  item: MenuItem
  locale: string
  onAdded?: (label: string) => void
  readOnly?: boolean
}) {
  const addItem = useCartStore((s) => s.addItem)
  const [justAdded, setJustAdded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  const name = locale === 'fr' ? item.nameFr : (item.nameEn ?? item.nameFr)
  const description = locale === 'fr' ? item.descFr : (item.descEn ?? item.descFr)
  const showImage = Boolean(item.image) && !imgError

  useEffect(() => {
    setImgError(false)
  }, [item.id, item.image])

  useEffect(() => {
    if (!isLightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isLightboxOpen])

  useEffect(() => {
    if (!isSheetOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSheetOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isSheetOpen])

  const handleAdd = () => {
    addItem({
      id: item.id,
      nameFr: item.nameFr,
      price: item.price,
    })
    onAdded?.(item.nameFr)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 450)
  }

  if (readOnly) {
    return (
      <>
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => setIsSheetOpen(true)}
          className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-tc-gold/30"
        >
          <div className={menuCardImageFrameClass}>
            <div className={menuCardImageSquareClass}>
              <div className={menuCardImageInnerClass}>
                {showImage ? (
                  <Image
                    src={item.image!}
                    alt={name}
                    fill
                    placeholder="blur"
                    blurDataURL={DARK_BLUR}
                    className="object-cover object-center transition-opacity duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
                    <span className="px-4 text-center text-xs uppercase tracking-[0.2em] text-tc-cream/20">
                      {item.nameFr}
                    </span>
                  </div>
                )}
                {item.isPopular && (
                  <span className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-full border border-tc-gold/30 bg-black/60 px-1.5 py-0.5 text-[9px] text-tc-gold backdrop-blur-sm">
                    <Star size={8} fill="currentColor" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-xs font-medium leading-snug text-tc-cream sm:text-sm">
                {name}
              </h3>
              {description && (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-tc-cream/40">
                  {description}
                </p>
              )}
            </div>
            <div className="mt-auto border-t border-white/5 pt-2">
              <span className="font-serif text-sm leading-none text-tc-gold sm:text-base">
                {formatPrice(item.price)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Bottom sheet */}
        <AnimatePresence>
          {isSheetOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[200] bg-black/70"
                onClick={() => setIsSheetOpen(false)}
              />
              <motion.div
                key="sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                className="fixed inset-x-0 bottom-0 z-[201] mx-auto max-w-lg overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#111]"
                style={{
                  maxHeight: '90dvh',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                }}
              >
                {/* Drag handle */}
                <div ref={dragHandleRef} className="flex justify-center pb-2 pt-3">
                  <div className="h-1 w-10 rounded-full bg-white/20" />
                </div>

                {/* Image */}
                {showImage ? (
                  <div className="relative h-56 w-full overflow-hidden sm:h-64">
                    <Image
                      src={item.image!}
                      alt={name}
                      fill
                      placeholder="blur"
                      blurDataURL={DARK_BLUR}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 512px"
                      onError={() => setImgError(true)}
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-white/[0.03]">
                    <span className="text-center text-xs uppercase tracking-[0.2em] text-tc-cream/20">
                      {item.nameFr}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {item.isPopular && (
                        <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-tc-gold/30 bg-tc-gold/10 px-2 py-0.5 text-[10px] text-tc-gold">
                          <Star size={8} fill="currentColor" />
                          {locale === 'fr' ? 'Populaire' : 'Popular'}
                        </span>
                      )}
                      <h2 className="text-xl font-medium text-tc-cream">{name}</h2>
                    </div>
                    <span className="shrink-0 font-serif text-2xl text-tc-gold">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  {description && (
                    <p className="text-sm leading-relaxed text-tc-cream/60">
                      {description}
                    </p>
                  )}

                  {item.options && item.options.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                        {locale === 'fr' ? 'Options' : 'Options'}
                      </p>
                      <ul className="space-y-1.5">
                        {item.options.map((opt) => (
                          <li
                            key={opt.label}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
                          >
                            <span className="text-sm text-tc-cream/70">
                              {opt.label}
                            </span>
                            <span className="font-serif text-sm text-tc-gold">
                              {formatPrice(opt.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsSheetOpen(false)}
                    className="mt-2 w-full rounded-xl border border-white/20 py-3 text-sm text-tc-cream/60 transition hover:border-white/40 hover:text-tc-cream"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── readOnly=false: comportement original inchangé ──
  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        className="group flex h-full min-w-0 flex-col overflow-hidden border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-tc-gold/30"
      >
        <div className={menuCardImageFrameClass}>
          <div className={menuCardImageSquareClass}>
            <div className={menuCardImageInnerClass}>
              {showImage ? (
                <>
                  <Image
                    src={item.image!}
                    alt={name}
                    fill
                    placeholder="blur"
                    blurDataURL={DARK_BLUR}
                    className="object-cover object-center transition-opacity duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    onError={() => setImgError(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    title={locale === 'fr' ? 'Voir l\'image' : 'View image'}
                    className="absolute inset-0 z-[1] h-full w-full cursor-zoom-in"
                    aria-label={
                      locale === 'fr' ? 'Agrandir la photo du plat' : 'Enlarge dish photo'
                    }
                  >
                    <span className="sr-only">{name}</span>
                  </button>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
                  <span className="px-4 text-center text-xs uppercase tracking-[0.2em] text-tc-cream/20">
                    {item.nameFr}
                  </span>
                </div>
              )}

              {item.isPopular && (
                <span className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-full border border-tc-gold/30 bg-black/60 px-1.5 py-0.5 text-[9px] text-tc-gold backdrop-blur-sm sm:right-3 sm:top-3 sm:gap-1 sm:px-2 sm:text-[10px]">
                  <Star size={8} fill="currentColor" />
                  <span className="hidden sm:inline">
                    {locale === 'fr' ? 'Populaire' : 'Popular'}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-xs font-medium leading-snug text-tc-cream sm:text-sm">
              {name}
            </h3>
            {description && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-tc-cream/40 sm:mt-1.5 sm:text-xs">
                {description}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-white/5 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="min-w-0 shrink-0 font-serif text-sm leading-none text-tc-gold sm:text-lg">
              {formatPrice(item.price)}
            </span>
            <motion.button
              type="button"
              onClick={handleAdd}
              animate={justAdded ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={cn(
                'flex w-full shrink-0 items-center justify-center gap-1 border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors duration-200 sm:w-auto sm:gap-1.5 sm:px-3 sm:text-xs sm:tracking-wider',
                justAdded
                  ? 'border-tc-gold bg-tc-gold text-tc-black shadow-[0_0_12px_rgba(212,175,55,0.45)]'
                  : 'border-tc-gold/30 bg-tc-gold/10 text-tc-gold hover:border-tc-gold hover:bg-tc-gold hover:text-tc-black',
              )}
            >
              <Plus size={12} className="shrink-0" />
              <span className="whitespace-nowrap">
                {locale === 'fr' ? 'Ajouter' : 'Add'}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isLightboxOpen && showImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <Tooltip
              text={locale === 'fr' ? 'Fermer' : 'Close'}
              position="bottom"
            >
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                aria-label={locale === 'fr' ? 'Fermer' : 'Close'}
              >
                <X size={20} />
              </button>
            </Tooltip>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[90vh] w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={item.image!}
                alt={name}
                width={MENU_CARD_IMAGE_WIDTH}
                height={MENU_CARD_IMAGE_HEIGHT}
                className="h-auto max-h-[90vh] w-full rounded object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
