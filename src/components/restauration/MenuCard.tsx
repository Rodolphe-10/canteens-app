'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Star, X } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import {
  MENU_CARD_IMAGE_HEIGHT,
  MENU_CARD_IMAGE_WIDTH,
  menuCardImageFrameClass,
  menuCardImageInnerClass,
  menuCardImageSquareClass,
} from '@/lib/menu-image'
import { cn, formatPrice } from '@/lib/utils'
import type { MenuItem } from '@/data/menu'

export default function MenuCard({
  item,
  locale,
  onAdded,
}: {
  item: MenuItem
  locale: string
  onAdded?: (label: string) => void
}) {
  const addItem = useCartStore((s) => s.addItem)
  const [justAdded, setJustAdded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const name = locale === 'fr' ? item.nameFr : item.nameEn ?? item.nameFr
  const description = locale === 'fr' ? item.descFr : item.descEn ?? item.descFr
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
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    onError={() => setImgError(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute inset-0 z-[1] cursor-zoom-in"
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
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label={locale === 'fr' ? 'Fermer' : 'Close'}
            >
              <X size={20} />
            </button>
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
