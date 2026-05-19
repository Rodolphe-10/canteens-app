'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { menuItems, menuCategories } from '@/data/menu'
import { useCartStore } from '@/stores/cart.store'
import MenuCard from './MenuCard'
import Cart from './Cart'

export default function MenuSection({ locale }: { locale: string }) {
  const [activeCategory, setActiveCategory] = useState('entrees')
  const [activeType, setActiveType] = useState<'food' | 'drink'>('food')
  const navRef = useRef<HTMLDivElement>(null)
  const toggleCart = useCartStore((s) => s.toggleCart)
  const totalItems = useCartStore((s) => s.totalItems)

  const filteredCategories = menuCategories.filter((c) => c.type === activeType)
  const filteredItems = menuItems.filter((item) => item.category === activeCategory)

  const handleTypeChange = (type: 'food' | 'drink') => {
    setActiveType(type)
    const firstCat = menuCategories.find((c) => c.type === type)
    if (firstCat) setActiveCategory(firstCat.id)
  }

  return (
    <section className="min-h-screen bg-tc-black">
      <div className="sticky top-16 z-30 border-b border-white/10 bg-tc-black/95 backdrop-blur-md md:top-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex gap-1 rounded-full bg-white/5 p-1">
              {(['food', 'drink'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeType === type
                      ? 'bg-tc-gold text-tc-black'
                      : 'text-tc-cream/50 hover:text-tc-cream'
                  }`}
                >
                  {type === 'food'
                    ? locale === 'fr'
                      ? '🍽️ Plats'
                      : '🍽️ Food'
                    : locale === 'fr'
                      ? '🍹 Boissons'
                      : '🍹 Drinks'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleCart}
              className="relative flex items-center gap-2 border border-tc-gold/40 px-4 py-2 text-sm text-tc-gold transition-all hover:bg-tc-gold/10"
            >
              <ShoppingBag size={16} />
              <span className="hidden text-xs font-bold uppercase tracking-wider sm:inline">
                {locale === 'fr' ? 'Panier' : 'Cart'}
              </span>
              {totalItems() > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-tc-gold text-xs font-bold text-tc-black">
                  {totalItems()}
                </span>
              )}
            </button>
          </div>

          <div
            ref={navRef}
            className="scrollbar-hide flex gap-2 overflow-x-auto pb-3"
            style={{ scrollbarWidth: 'none' }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'border-tc-gold/50 bg-tc-gold/20 text-tc-gold'
                    : 'border-white/10 text-tc-cream/50 hover:border-white/30 hover:text-tc-cream'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{locale === 'fr' ? cat.labelFr : cat.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {filteredItems.length > 0 ? (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <MenuCard item={item} locale={locale} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="py-20 text-center text-tc-cream/30">
            <p>
              {locale === 'fr'
                ? 'Aucun plat dans cette catégorie'
                : 'No items in this category'}
            </p>
          </div>
        )}
      </div>

      <Cart locale={locale} />
    </section>
  )
}
