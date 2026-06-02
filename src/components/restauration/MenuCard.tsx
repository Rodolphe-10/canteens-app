'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Star } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { cn, formatPrice } from '@/lib/utils'
import type { MenuItem } from '@/data/menu'

export default function MenuCard({ item, locale }: { item: MenuItem; locale: string }) {
  const addItem = useCartStore((s) => s.addItem)
  const [justAdded, setJustAdded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const name = locale === 'fr' ? item.nameFr : item.nameEn ?? item.nameFr
  const description = locale === 'fr' ? item.descFr : item.descEn ?? item.descFr
  const showImage = Boolean(item.image) && !imgError

  const handleAdd = () => {
    addItem({
      id: item.id,
      nameFr: item.nameFr,
      price: item.price,
    })
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 450)
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group flex flex-col overflow-hidden border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-tc-gold/30"
    >
      <div className="relative h-40 overflow-hidden">
        {showImage ? (
          <Image
            src={item.image!}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-white/[0.03]">
            <span className="text-2xl text-tc-cream/20">—</span>
          </div>
        )}

        {item.isPopular && (
          <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-tc-gold/30 bg-black/60 px-2 py-0.5 text-[10px] text-tc-gold backdrop-blur-sm">
            <Star size={8} fill="currentColor" />
            {locale === 'fr' ? 'Populaire' : 'Popular'}
          </span>
        )}
      </div>

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
  )
}
