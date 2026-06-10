'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { X, Minus, Plus, Trash2, ShoppingBag, Phone, CheckCircle, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import Tooltip from '@/components/ui/Tooltip'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { openWhatsApp } from '@/lib/whatsapp'
import DeliveryForm, { DeliveryData, emptyDelivery } from './DeliveryForm'

type Step = 'cart' | 'delivery' | 'confirm'

// Quartiers éloignés → 2000F, les autres → 1000F
const FAR_QUARTIERS = [
  'odza', 'nkol eton', 'nsam', 'mimboman', 'mvog-mbi', 'etoudi', 'nkomo',
  'jouvence', 'mballa 2', 'soa', 'messassi', 'biyem-assi', 'ngoa-ekelle',
  'ahala', 'ekounou', 'nkolfoulou', 'nkoabang', 'mbankomo', 'djoungolo',
  'autre quartier',
]

function getDeliveryFee(quartier: string): number {
  const q = quartier.toLowerCase().trim()
  return FAR_QUARTIERS.some(f => q.includes(f)) ? 2000 : 1000
}

function generateOrderNumber() {
  return `TC-${Date.now().toString().slice(-5)}`
}

const paiementLabel: Record<string, { fr: string; en: string }> = {
  especes: { fr: 'Espèces à la livraison', en: 'Cash on delivery' },
  om: { fr: 'Orange Money', en: 'Orange Money' },
  momo: { fr: 'MTN MoMo', en: 'MTN MoMo' },
}

export default function Cart({ locale }: { locale: string }) {
  const items = useCartStore((s) => s.items)
  const isOpen = useCartStore((s) => s.isOpen)
  const toggleCart = useCartStore((s) => s.toggleCart)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalAmount = useCartStore((s) => s.totalAmount)
  const totalItems = useCartStore((s) => s.totalItems)

  const isFr = locale === 'fr'
  const [step, setStep] = useState<Step>('cart')
  const [delivery, setDelivery] = useState<DeliveryData>(emptyDelivery)
  const [orderNumber] = useState(generateOrderNumber)
  const [sent, setSent] = useState(false)
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null)

  const deliveryFee = delivery.customFee ?? getDeliveryFee(delivery.quartier || '')

  const grandTotal = totalAmount() + deliveryFee

  const handleClose = () => {
    toggleCart()
    setTimeout(() => { setStep('cart'); setSent(false) }, 400)
  }

  const buildMessage = () => {
    const lignes = items
      .map((i) => `• ${isFr ? i.nameFr : i.nameFr} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
      .join('\n')

    const horaire = delivery.horaire === 'asap'
      ? (isFr ? 'Dès que possible' : 'ASAP')
      : delivery.heureChoisie

    const msg = isFr
      ? `🛵 *COMMANDE LIVRAISON — THE CANTEEN'S*\n\n` +
        `📋 *N° Commande :* ${orderNumber}\n\n` +
        `🍽️ *Commande :*\n${lignes}\n\n` +
        `💰 Sous-total : ${formatPrice(totalAmount())}\n` +
        `🛵 Frais de livraison : ${formatPrice(deliveryFee)}\n` +
        `*TOTAL : ${formatPrice(grandTotal)}*\n\n` +
        `👤 *Client :* ${delivery.nom}\n` +
        `📱 *Téléphone :* ${delivery.telephone}\n` +
        `📍 *Quartier :* ${delivery.quartier}\n` +
        `🏠 *Adresse :* ${delivery.adresse}\n` +
        `🗺️ *Repère :* ${delivery.repere}\n` +
        `${delivery.etage ? `🏢 *Étage/Appt :* ${delivery.etage}\n` : ''}` +
        `💳 *Paiement :* ${paiementLabel[delivery.paiement]?.fr}\n` +
        `⏰ *Livraison :* ${horaire}\n` +
        `${delivery.instructions ? `💬 *Instructions :* ${delivery.instructions}\n` : ''}`
      : `🛵 *DELIVERY ORDER — THE CANTEEN'S*\n\n` +
        `📋 *Order N° :* ${orderNumber}\n\n` +
        `🍽️ *Order :*\n${lignes}\n\n` +
        `💰 Subtotal: ${formatPrice(totalAmount())}\n` +
        `🛵 Delivery fee: ${formatPrice(deliveryFee)}\n` +
        `*TOTAL: ${formatPrice(grandTotal)}*\n\n` +
        `👤 *Customer :* ${delivery.nom}\n` +
        `📱 *Phone :* ${delivery.telephone}\n` +
        `📍 *Neighborhood :* ${delivery.quartier}\n` +
        `🏠 *Address :* ${delivery.adresse}\n` +
        `🗺️ *Landmark :* ${delivery.repere}\n` +
        `${delivery.etage ? `🏢 *Floor/Apt :* ${delivery.etage}\n` : ''}` +
        `💳 *Payment :* ${paiementLabel[delivery.paiement]?.en}\n` +
        `⏰ *Delivery :* ${horaire}\n` +
        `${delivery.instructions ? `💬 *Instructions :* ${delivery.instructions}\n` : ''}`

    return msg
  }

  const handleConfirm = async () => {
    if (items.length === 0) return // sécurité : panier vide
    const subtotal = totalAmount()
    const orderItems = [...items]
    const supabase = createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        client_nom: delivery.nom,
        client_telephone: delivery.telephone,
        quartier: delivery.quartier,
        adresse: delivery.adresse,
        repere: delivery.repere,
        etage: delivery.etage || null,
        instructions: delivery.instructions || null,
        horaire: delivery.horaire,
        heure_choisie: delivery.heureChoisie || null,
        mode_paiement: delivery.paiement,
        sous_total: subtotal,
        frais_livraison: deliveryFee,
        total: subtotal + deliveryFee,
        statut: 'en_attente',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Supabase order insert error:', orderError)
      return
    }

    if (order) {
      const rows = orderItems.map((item) => ({
        order_id: order.id,
        nom: item.nameFr,
        categorie: null,
        quantite: item.quantity,
        prix_unitaire: item.price,
        sous_total: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(rows)
      if (itemsError) {
        console.error('Supabase order_items insert error:', itemsError)
      }

      void fetch('/api/orders/staff-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      }).catch((err) => console.error('staff-notify error:', err))
    }

    openWhatsApp(buildMessage())
    setSent(true)
    clearCart()
  }

  const stepTitle = {
    cart: isFr ? 'Mon Panier' : 'My Cart',
    delivery: isFr ? 'Livraison' : 'Delivery',
    confirm: isFr ? 'Confirmation' : 'Confirm order',
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-white/10 bg-[#111] sm:w-[440px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-tc-gold" />
                <h2 className="font-serif text-lg text-tc-cream">
                  {sent ? (isFr ? 'Commande envoyée' : 'Order sent') : stepTitle[step]}
                </h2>
                {step === 'cart' && totalItems() > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tc-gold text-xs font-bold text-tc-black">
                    {totalItems()}
                  </span>
                )}
              </div>
              <Tooltip text={isFr ? 'Fermer' : 'Close'} position="bottom">
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 text-tc-cream/50 transition-colors hover:text-tc-cream"
                >
                  <X size={22} />
                </button>
              </Tooltip>
            </div>

            {/* Indicateur d'étapes */}
            {!sent && (
              <div className="flex border-b border-white/5">
                {(['cart', 'delivery', 'confirm'] as Step[]).map((s, i) => (
                  <div
                    key={s}
                    className={`flex flex-1 items-center justify-center gap-1 py-2 text-[10px] uppercase tracking-widest transition-colors ${
                      step === s ? 'text-tc-gold border-b-2 border-tc-gold' : 'text-tc-cream/20'
                    }`}
                  >
                    <span>{i + 1}</span>
                    <span className="hidden sm:inline">
                      {s === 'cart' ? (isFr ? 'Panier' : 'Cart') : s === 'delivery' ? (isFr ? 'Livraison' : 'Delivery') : (isFr ? 'Confirm.' : 'Confirm')}
                    </span>
                    {i < 2 && <ChevronRight size={10} className="opacity-30" />}
                  </div>
                ))}
              </div>
            )}

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto">

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center"
                >
                  <CheckCircle size={52} className="text-tc-gold" />
                  <div>
                    <p className="font-serif text-2xl text-tc-cream">
                      {isFr ? 'Commande envoyée !' : 'Order sent!'}
                    </p>
                    <p className="mt-2 text-sm text-tc-cream/40">
                      {isFr
                        ? 'Notre équipe vous contacte sous 5 minutes pour confirmer et organiser la livraison.'
                        : 'Our team will contact you within 5 minutes to confirm and organize delivery.'}
                    </p>
                    <p className="mt-3 text-xs text-tc-gold/60">N° {orderNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="border border-white/10 px-6 py-2.5 text-xs uppercase tracking-widest text-tc-cream/40 transition-colors hover:border-tc-gold/30 hover:text-tc-gold"
                  >
                    {isFr ? 'Fermer' : 'Close'}
                  </button>
                </motion.div>
              ) : step === 'cart' ? (
                <>
                  {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                      <ShoppingBag size={48} className="text-white/10" />
                      <p className="text-sm text-tc-cream/40">
                        {isFr ? 'Votre panier est vide.\nAjoutez des plats depuis le menu.' : 'Your cart is empty.\nAdd dishes from the menu.'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 px-6 py-4">
                      <div className="mb-1 flex justify-end">
                        <button
                          type="button"
                          onClick={clearCart}
                          className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-widest text-tc-cream/50 transition-colors hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-300"
                        >
                          {isFr ? 'Vider le panier' : 'Clear cart'}
                        </button>
                      </div>
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
                              <p className="truncate text-sm font-medium text-tc-cream">{item.nameFr}</p>
                              <p className="mt-0.5 text-sm text-tc-gold">{formatPrice(item.price)}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Tooltip text={isFr ? 'Diminuer' : 'Decrease'} position="top">
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.id, item.quantity - 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-tc-cream/70 transition-colors hover:border-tc-gold hover:text-tc-gold"
                                >
                                  <Minus size={12} />
                                </button>
                              </Tooltip>
                              <span className="w-5 text-center text-sm text-tc-cream">{item.quantity}</span>
                              <Tooltip text={isFr ? 'Augmenter' : 'Increase'} position="top">
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.id, item.quantity + 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-tc-cream/70 transition-colors hover:border-tc-gold hover:text-tc-gold"
                                >
                                  <Plus size={12} />
                                </button>
                              </Tooltip>
                              <Tooltip text={isFr ? 'Retirer' : 'Remove'} position="top">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="ml-1 text-tc-cream/30 transition-colors hover:text-red-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Tooltip>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              ) : step === 'delivery' ? (
                <DeliveryForm
                  locale={locale}
                  data={delivery}
                  onChange={setDelivery}
                  onNext={() => setStep('confirm')}
                  onBack={() => setStep('cart')}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-5 px-6 py-5"
                >
                  {/* Récap commande */}
                  <div>
                    <p className="mb-3 text-[11px] uppercase tracking-widest text-tc-gold/60">
                      {isFr ? 'Récapitulatif' : 'Summary'}
                    </p>
                    <div className="flex flex-col gap-2 rounded border border-white/10 bg-white/5 p-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-tc-cream/70">{item.nameFr} x{item.quantity}</span>
                          <span className="text-tc-cream">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-sm">
                        <span className="text-tc-cream/50">{isFr ? 'Livraison' : 'Delivery'}</span>
                        <span className="text-tc-cream/70">{formatPrice(deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold">
                        <span className="text-tc-cream">Total</span>
                        <span className="text-tc-gold">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Récap livraison */}
                  <div>
                    <p className="mb-3 text-[11px] uppercase tracking-widest text-tc-gold/60">
                      {isFr ? 'Livraison à' : 'Delivering to'}
                    </p>
                    <div className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/5 p-4 text-sm text-tc-cream/60">
                      <p><span className="text-tc-cream/40">{isFr ? 'Nom :' : 'Name:'}</span> {delivery.nom}</p>
                      <p><span className="text-tc-cream/40">{isFr ? 'Tel :' : 'Phone:'}</span> {delivery.telephone}</p>
                      <p><span className="text-tc-cream/40">{isFr ? 'Quartier :' : 'Area:'}</span> {delivery.quartier}</p>
                      <p><span className="text-tc-cream/40">{isFr ? 'Adresse :' : 'Address:'}</span> {delivery.adresse}</p>
                      <p><span className="text-tc-cream/40">{isFr ? 'Repère :' : 'Landmark:'}</span> {delivery.repere}</p>
                      <p><span className="text-tc-cream/40">{isFr ? 'Paiement :' : 'Payment:'}</span> {paiementLabel[delivery.paiement]?.[isFr ? 'fr' : 'en']}</p>
                    </div>
                  </div>

                  <p className="text-center text-[11px] leading-relaxed text-tc-cream/25">
                    {isFr
                      ? 'En confirmant, vous serez redirigé vers WhatsApp. Notre équipe vous confirme la livraison sous 5 min.'
                      : 'By confirming, you\'ll be redirected to WhatsApp. Our team confirms delivery within 5 min.'}
                  </p>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="flex w-full items-center justify-center gap-2 bg-green-600 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-green-500"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {isFr ? 'Confirmer via WhatsApp' : 'Confirm via WhatsApp'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('delivery')}
                      className="py-2 text-center text-xs text-tc-cream/30 transition-colors hover:text-tc-cream/60"
                    >
                      ← {isFr ? 'Modifier la livraison' : 'Edit delivery'}
                    </button>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="mx-auto rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-widest text-tc-cream/50 transition-colors hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-300"
                    >
                      {isFr ? 'Vider le panier' : 'Clear cart'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer — uniquement visible à l'étape panier */}
            {step === 'cart' && items.length > 0 && !sent && (
              <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm uppercase tracking-wider text-tc-cream/60">
                    {isFr ? 'Articles' : 'Items'}
                  </span>
                  <span className="font-serif text-xl text-gradient-gold">
                    {formatPrice(totalAmount())}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('delivery')}
                  className="flex w-full items-center justify-center gap-2 bg-tc-gold py-3.5 text-sm font-bold uppercase tracking-widest text-tc-black transition-all hover:bg-tc-gold/90"
                >
                  {isFr ? 'Passer à la livraison →' : 'Proceed to delivery →'}
                </button>
                <a
                  href="tel:+237655867084"
                  className="flex items-center justify-center gap-2 border border-white/20 py-2.5 px-6 text-sm tracking-wider text-tc-cream/50 transition-colors hover:border-tc-gold hover:text-tc-gold"
                >
                  <Phone size={13} />
                  {isFr ? 'Commander par téléphone' : 'Order by phone'}
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
