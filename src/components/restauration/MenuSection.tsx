'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { menuCategories, type MenuCategory, type MenuItem } from '@/data/menu'
import { createClient } from '@/lib/supabase/client'
import MenuCard from './MenuCard'

type DbMenuItem = {
  id: string
  name_fr: string
  name_en?: string
  desc_fr?: string
  desc_en?: string
  price: number
  category: string
  image?: string
  is_popular: boolean
}

function getDefaultFoodCategory(items: MenuItem[]) {
  const withPhoto = menuCategories.find(
    (cat) =>
      cat.type === 'food' &&
      items.some((item) => item.category === cat.id && item.image),
  )
  return withPhoto?.id ?? 'entrees'
}

export default function MenuSection({ locale }: { locale: string }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('entrees')
  const [activeType, setActiveType] = useState<'food' | 'drink'>('food')
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const fetchMenu = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_visible', true)
    if (!data) {
      setLoadingMenu(false)
      return
    }
    setMenuItems(
      data.map((row: DbMenuItem) => ({
        id: row.id,
        nameFr: row.name_fr,
        nameEn: row.name_en,
        descFr: row.desc_fr,
        descEn: row.desc_en,
        price: row.price,
        category: row.category as MenuCategory,
        image: row.image,
        isPopular: row.is_popular,
      })),
    )
    setLoadingMenu(false)
  }, [])

  useEffect(() => {
    void fetchMenu()
  }, [fetchMenu])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('menu_items_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => void fetchMenu(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchMenu])

  useEffect(() => {
    if (loadingMenu) return
    setActiveCategory((prev) =>
      menuItems.some((i) => i.category === prev)
        ? prev
        : getDefaultFoodCategory(menuItems),
    )
  }, [loadingMenu, menuItems])

  const filteredCategories = menuCategories.filter(
    (c) => c.type === activeType && menuItems.some((item) => item.category === c.id),
  )
  const filteredItems = menuItems.filter((item) => item.category === activeCategory)

  const handleTypeChange = (type: 'food' | 'drink') => {
    setActiveType(type)
    const firstCat = menuCategories.find(
      (c) => c.type === type && menuItems.some((item) => item.category === c.id),
    )
    if (firstCat) setActiveCategory(firstCat.id)
  }

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  if (loadingMenu) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="animate-pulse text-xs uppercase tracking-widest text-white/20">
          Chargement du menu…
        </p>
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-tc-black">
      <div className="sticky top-16 z-30 border-b border-white/10 bg-tc-black/95 backdrop-blur-md md:top-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center py-4">
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
                      ? 'Plats'
                      : 'Food'
                    : locale === 'fr'
                      ? 'Boissons'
                      : 'Drinks'}
                </button>
              ))}
            </div>
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
            className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                className="min-w-0"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <MenuCard
                  item={item}
                  locale={locale}
                  onAdded={(label) =>
                    setToast({
                      id: Date.now(),
                      text:
                        locale === 'fr'
                          ? `${label} ajouté au panier ✓`
                          : `${label} added to cart ✓`,
                    })
                  }
                />
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

      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-tc-gold/40 bg-tc-black px-4 py-2 text-sm text-tc-cream"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
