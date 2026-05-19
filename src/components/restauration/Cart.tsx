'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag, Phone } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { formatPrice } from '@/lib/utils'

export default function Cart({ locale }: { locale: string }) {
  const items = useCartStore((s) => s.items)
  const isOpen = useCartStore((s) => s.isOpen)
  const toggleCart = useCartStore((s) => s.toggleCart)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalAmount = useCartStore((s) => s.totalAmount)
  const totalItems = useCartStore((s) => s.totalItems)

  const whatsappMessage = encodeURIComponent(
    `Bonjour The Canteen's 👋\n\nJe souhaite passer une commande à emporter :\n\n${items
      .map((i) => `• ${i.nameFr} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
      .join('\n')}\n\n*Total : ${formatPrice(totalAmount())}*\n\nMerci !`,
  )

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-white/10 bg-[#111] sm:w-[420px]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-tc-gold" />
                <h2 className="font-serif text-xl text-tc-cream">
                  {locale === 'fr' ? 'Mon Panier' : 'My Cart'}
                </h2>
                {totalItems() > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tc-gold text-xs font-bold text-tc-black">
                    {totalItems()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={toggleCart}
                className="p-1 text-tc-cream/50 transition-colors hover:text-tc-cream"
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <ShoppingBag size={48} className="text-white/10" />
                  <p className="whitespace-pre-line text-sm text-tc-cream/40">
                    {locale === 'fr'
                      ? 'Votre panier est vide.\nAjoutez des plats depuis le menu.'
                      : 'Your cart is empty.\nAdd dishes from the menu.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-3 border-b border-white/5 pb-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-tc-cream">
                            {item.nameFr}
                          </p>
                          <p className="mt-0.5 text-sm text-tc-gold">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-tc-cream/70 transition-colors hover:border-tc-gold hover:text-tc-gold"
                            aria-label="Moins"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-sm text-tc-cream">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-tc-cream/70 transition-colors hover:border-tc-gold hover:text-tc-gold"
                            aria-label="Plus"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="ml-1 text-tc-cream/30 transition-colors hover:text-red-400"
                            aria-label="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm uppercase tracking-wider text-tc-cream/60">Total</span>
                  <span className="font-serif text-2xl text-gradient-gold">
                    {formatPrice(totalAmount())}
                  </span>
                </div>

                <a
                  href={`https://wa.me/237699999886?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-green-500"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {locale === 'fr' ? 'Commander via WhatsApp' : 'Order via WhatsApp'}
                </a>

                <a
                  href="tel:+237699999886"
                  className="flex items-center justify-center gap-2 border border-white/20 py-3 px-6 text-sm tracking-wider text-tc-cream/70 transition-colors hover:border-tc-gold hover:text-tc-gold"
                >
                  <Phone size={14} />
                  {locale === 'fr' ? 'Ou appeler : 699 999 886' : 'Or call: 699 999 886'}
                </a>

                <button
                  type="button"
                  onClick={clearCart}
                  className="py-1 text-center text-xs text-tc-cream/30 transition-colors hover:text-red-400"
                >
                  {locale === 'fr' ? 'Vider le panier' : 'Clear cart'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
