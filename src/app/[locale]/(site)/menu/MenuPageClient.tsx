'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { menuCategories, type MenuCategory, type MenuItem } from '@/data/menu'
import { createClient } from '@/lib/supabase/client'
import { sortAlphaBy } from '@/lib/sort'
import { cn } from '@/lib/utils'
import MenuCard from '@/components/restauration/MenuCard'

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

function mapDbRow(row: DbMenuItem): MenuItem {
  return {
    id: row.id,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    descFr: row.desc_fr,
    descEn: row.desc_en,
    price: Number(row.price),
    category: row.category as MenuCategory,
    image: row.image,
    isPopular: row.is_popular,
  }
}

export default function MenuPageClient({ locale }: { locale: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<'food' | 'drink'>('food')
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null)

  const categoryPillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const fetchMenu = useCallback(async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_visible', true)
      .order('name_fr')
    if (!data) {
      setLoading(false)
      return
    }
    setMenuItems(data.map(mapDbRow))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void fetchMenu()
  }, [fetchMenu])

  const availableCategories = useMemo(
    () =>
      sortAlphaBy(
        menuCategories.filter(
          (cat) =>
            cat.type === activeType &&
            menuItems.some((item) => item.category === cat.id),
        ),
        (cat) => cat.labelFr,
      ),
    [menuItems, activeType],
  )

  // Set default category when type changes or data loads
  useEffect(() => {
    if (availableCategories.length === 0) return
    const current = availableCategories.find((c) => c.id === activeCategory)
    if (!current) {
      setActiveCategory(availableCategories[0].id)
    }
  }, [availableCategories, activeCategory])

  // Auto-scroll pill into view when activeCategory changes
  useEffect(() => {
    if (!activeCategory) return
    const btn = categoryPillRefs.current.get(activeCategory)
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeCategory])

  const filteredItems = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          item.category === activeCategory &&
          menuCategories.find((c) => c.id === item.category)?.type === activeType,
      ),
    [menuItems, activeCategory, activeType],
  )

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-6 text-center">
        <p className="mb-2 text-xs uppercase tracking-widest text-tc-gold/60">
          Notre menu
        </p>
        <h1 className="font-serif text-3xl text-tc-cream">The Canteen&apos;s</h1>
        <p className="mt-3 text-sm text-tc-cream/40">
          Choisissez un plat et montrez-le à votre serveur 🍽️
        </p>
      </section>

      {/* Sticky type tabs */}
      <div className="sticky top-20 z-40 border-b border-white/5 bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-2 px-4 py-3">
          {(
            [
              { id: 'food', label: '🍽️ Restauration' },
              { id: 'drink', label: '🍹 Boissons' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveType(tab.id)}
              className={cn(
                'flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                activeType === tab.id
                  ? 'border-tc-gold/40 bg-tc-gold/15 text-tc-gold'
                  : 'border-white/10 text-tc-cream/40 hover:text-tc-cream/60',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky category pills */}
      <div className="sticky top-[133px] z-30 border-b border-white/5 bg-[#0A0A0A]/95 backdrop-blur-md">
        <div
          className="flex gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => {
                if (el) categoryPillRefs.current.set(cat.id, el)
                else categoryPillRefs.current.delete(cat.id)
              }}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                activeCategory === cat.id
                  ? 'border-tc-gold/40 bg-tc-gold/15 text-tc-gold'
                  : 'border-white/10 text-tc-cream/40 hover:text-tc-cream/60',
              )}
            >
              {cat.labelFr}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-tc-gold" />
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="py-16 text-center text-sm text-tc-cream/30">
            Aucun plat dans cette catégorie.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                locale={locale}
                readOnly
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 border-t border-white/5 bg-[#0A0A0A]/95 py-3 px-4 backdrop-blur-md"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-center">
          <Link
            href={`/${locale}/reservation`}
            className="rounded-full border border-tc-gold/40 bg-tc-gold/5 px-6 py-2.5 text-sm text-tc-gold transition hover:bg-tc-gold/15"
          >
            🪑 Réserver une table
          </Link>
        </div>
      </div>
    </>
  )
}
