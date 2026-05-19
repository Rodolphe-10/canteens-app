'use client'

import { motion } from 'framer-motion'
import { Plus, Star } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { formatPrice } from '@/lib/utils'
import type { MenuItem } from '@/data/menu'

export default function MenuCard({ item, locale }: { item: MenuItem; locale: string }) {
  const addItem = useCartStore((s) => s.addItem)
  const toggleCart = useCartStore((s) => s.toggleCart)

  const handleAdd = () => {
    addItem({
      id: item.id,
      nameFr: item.nameFr,
      price: item.price,
    })
    toggleCart()
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative flex flex-col gap-3 border border-white/5 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-tc-gold/30"
    >
      {item.isPopular && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-tc-gold/30 bg-tc-gold/10 px-2 py-0.5 text-[10px] text-tc-gold">
          <Star size={8} fill="currentColor" />{' '}
          {locale === 'fr' ? 'Populaire' : 'Popular'}
        </span>
      )}
      <div className="flex-1">
        <h3 className="pr-16 text-sm font-medium leading-snug text-tc-cream">
          {locale === 'fr' ? item.nameFr : item.nameEn ?? item.nameFr}
        </h3>
        {(locale === 'fr' ? item.descFr : item.descEn ?? item.descFr) && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-tc-cream/40">
            {locale === 'fr' ? item.descFr : item.descEn ?? item.descFr}
          </p>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-2">
        <span className="font-serif text-lg text-tc-gold">{formatPrice(item.price)}</span>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 border border-tc-gold/30 bg-tc-gold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-tc-gold transition-all duration-200 hover:border-tc-gold hover:bg-tc-gold hover:text-tc-black"
        >
          <Plus size={12} />
          {locale === 'fr' ? 'Ajouter' : 'Add'}
        </button>
      </div>
    </motion.div>
  )
}
