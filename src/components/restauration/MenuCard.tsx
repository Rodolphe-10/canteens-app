'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Star, X } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
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
  const [aspectRatio, setAspectRatio] = useState(4 / 3)

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

  const handleOpenLightbox = () => {
    if (!showImage) return
    setIsLightboxOpen(true)
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        className="group flex flex-col overflow-hidden border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-tc-gold/30"
      >
        <button
          type="button"
          onClick={handleOpenLightbox}
          className={cn(
            'relative w-full overflow-hidden text-left',
            showImage && 'cursor-zoom-in',
            !showImage && 'cursor-default',
            showImage && 'bg-black/20',
          )}
          style={
            showImage
              ? {
                  aspectRatio: Math.min(1.35, Math.max(0.75, aspectRatio)),
                  maxHeight: '11rem',
                }
              : undefined
          }
          aria-label={showImage ? (locale === 'fr' ? 'Agrandir la photo du plat' : 'Enlarge dish photo') : undefined}
        >
          {showImage ? (
            <Image
              src={item.image!}
              alt={name}
              fill
              className="object-contain object-center p-1 transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onLoad={(e) => {
                const img = e.currentTarget
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  setAspectRatio(img.naturalWidth / img.naturalHeight)
                }
              }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-32 items-center justify-center bg-white/[0.03]">
              <span className="px-4 text-center text-xs uppercase tracking-[0.2em] text-tc-cream/20">
                {item.nameFr}
              </span>
            </div>
          )}

          {item.isPopular && (
            <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-tc-gold/30 bg-black/60 px-2 py-0.5 text-[10px] text-tc-gold backdrop-blur-sm">
              <Star size={8} fill="currentColor" />
              {locale === 'fr' ? 'Populaire' : 'Popular'}
            </span>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex-1">
            <h3 className="text-sm font-medium leading-snug text-tc-cream">{name}</h3>
            {description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-tc-cream/40">
                {description}
              </p>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-2">
            <span className="font-serif text-lg text-tc-gold">{formatPrice(item.price)}</span>
            <motion.button
              type="button"
              onClick={handleAdd}
              animate={justAdded ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={cn(
                'flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200',
                justAdded
                  ? 'border-tc-gold bg-tc-gold text-tc-black shadow-[0_0_12px_rgba(212,175,55,0.45)]'
                  : 'border-tc-gold/30 bg-tc-gold/10 text-tc-gold hover:border-tc-gold hover:bg-tc-gold hover:text-tc-black',
              )}
            >
              <Plus size={12} />
              {locale === 'fr' ? 'Ajouter' : 'Add'}
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
                width={1200}
                height={900}
                className="h-auto max-h-[90vh] w-full rounded object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
