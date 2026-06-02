'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, Clock3, LogOut, Package, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const ADMIN_PIN = 'TC2024'
const ACCESS_KEY = 'tc-admin-auth'

type Tab = 'reservations' | 'orders'
type ReservationStatus = 'nouveau' | 'confirme' | 'annule'
type OrderStatus =
  | 'en_attente'
  | 'confirme'
  | 'en_preparation'
  | 'en_livraison'
  | 'livre'

type ReservationRow = {
  id: string
  nom: string
  telephone: string
  date_souhaitee: string
  heure_arrivee: string
  espace: string
  nombre_personnes: number
  statut: ReservationStatus
  created_at: string
}

type OrderItemRow = {
  id: string
  nom: string
  quantite: number
  prix_unitaire: number
  sous_total: number
}

type OrderRow = {
  id: string
  client_nom: string
  client_telephone: string
  total: number
  mode_paiement: string
  statut: OrderStatus
  quartier: string
  created_at: string
  order_items: OrderItemRow[]
}

const reservationStatusClasses: Record<ReservationStatus, string> = {
  nouveau: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
  confirme: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  annule: 'bg-red-500/15 text-red-300 border-red-400/30',
}

const orderStatusFlow: OrderStatus[] = [
  'en_attente',
  'confirme',
  'en_preparation',
  'en_livraison',
  'livre',
]

const orderStatusClasses: Record<OrderStatus, string> = {
  en_attente: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
  confirme: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  en_preparation: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
  en_livraison: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
  livre: 'bg-tc-gold/15 text-tc-gold border-tc-gold/30',
}

function formatAmount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
}

export default function AdminDashboardPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [tab, setTab] = useState<Tab>('reservations')
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const saved = sessionStorage.getItem(ACCESS_KEY)
    if (saved === '1') setIsAuthed(true)
  }, [])

  const fetchReservations = useCallback(async () => {
    setLoadingReservations(true)
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    setReservations((data as ReservationRow[]) ?? [])
    setLoadingReservations(false)
  }, [supabase])

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    setOrders((data as OrderRow[]) ?? [])
    setLoadingOrders(false)
  }, [supabase])

  useEffect(() => {
    if (!isAuthed) return

    void fetchReservations()
    void fetchOrders()

    const reservationChannel = supabase
      .channel('reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          void fetchReservations()
        },
      )
      .subscribe()

    const ordersChannel = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchOrders()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          void fetchOrders()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(reservationChannel)
      void supabase.removeChannel(ordersChannel)
    }
  }, [isAuthed, fetchReservations, fetchOrders, supabase])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(ACCESS_KEY, '1')
      setIsAuthed(true)
      setPinError('')
      return
    }
    setPinError('Code PIN incorrect.')
  }

  const handleLogout = () => {
    sessionStorage.removeItem(ACCESS_KEY)
    setIsAuthed(false)
    setPin('')
  }

  const updateReservationStatus = async (
    id: string,
    newStatus: ReservationStatus,
  ) => {
    setUpdatingReservationId(id)
    await supabase.from('reservations').update({ statut: newStatus }).eq('id', id)
    setUpdatingReservationId(null)
    await fetchReservations()
  }

  const updateOrderStatus = async (id: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(id)
    await supabase.from('orders').update({ statut: newStatus }).eq('id', id)
    setUpdatingOrderId(null)
    await fetchOrders()
  }

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-tc-black px-4 text-tc-cream">
        <form
          onSubmit={handlePinSubmit}
          className="glass w-full max-w-sm rounded-lg border border-white/10 p-6"
        >
          <h1 className="font-serif text-3xl text-tc-cream">Accès staff</h1>
          <p className="mt-2 text-sm text-tc-cream/50">
            Entrez le PIN interne pour accéder au dashboard.
          </p>

          <input
            type="password"
            inputMode="text"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.trim())
              setPinError('')
            }}
            className="mt-5 w-full border border-white/10 bg-white/5 px-4 py-3 text-sm tracking-[0.25em] text-tc-cream outline-none transition-colors focus:border-tc-gold/50"
            placeholder="••••••"
          />
          {pinError && <p className="mt-2 text-xs text-red-400">{pinError}</p>}

          <button
            type="submit"
            className="mt-5 w-full bg-tc-gold px-4 py-3 text-xs font-bold uppercase tracking-widest text-tc-black transition hover:bg-tc-gold/90"
          >
            Déverrouiller
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-tc-black text-tc-cream">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-tc-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-32">
              <Image
                src="/images/logos/logo_restaurant1-removebg-preview.png"
                alt="The Canteen's"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-tc-gold/70">
                The Canteen&apos;s
              </p>
              <h1 className="font-serif text-xl">Dashboard</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-xs uppercase tracking-widest text-tc-cream/70 transition hover:border-tc-gold/40 hover:text-tc-gold"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setTab('reservations')}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition',
              tab === 'reservations'
                ? 'bg-tc-gold text-tc-black'
                : 'text-tc-cream/60 hover:text-tc-cream',
            )}
          >
            Réservations
          </button>
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition',
              tab === 'orders'
                ? 'bg-tc-gold text-tc-black'
                : 'text-tc-cream/60 hover:text-tc-cream',
            )}
          >
            Commandes
          </button>
        </div>

        {tab === 'reservations' ? (
          <div className="grid gap-4">
            {loadingReservations ? (
              <p className="text-sm text-tc-cream/50">Chargement des réservations...</p>
            ) : reservations.length === 0 ? (
              <p className="text-sm text-tc-cream/50">Aucune réservation.</p>
            ) : (
              reservations.map((r) => (
                <article
                  key={r.id}
                  className="glass rounded-lg border border-white/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl">{r.nom}</h3>
                      <p className="mt-1 text-sm text-tc-cream/60">
                        {r.telephone} · {r.espace}
                      </p>
                      <p className="mt-1 text-xs text-tc-cream/40">
                        {r.date_souhaitee} à {r.heure_arrivee} · {r.nombre_personnes} pers.
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest',
                        reservationStatusClasses[r.statut],
                      )}
                    >
                      {r.statut}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingReservationId === r.id}
                      onClick={() => void updateReservationStatus(r.id, 'confirme')}
                      className="inline-flex items-center gap-1 border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      <Check size={12} />
                      Confirmer
                    </button>
                    <button
                      type="button"
                      disabled={updatingReservationId === r.id}
                      onClick={() => void updateReservationStatus(r.id, 'annule')}
                      className="inline-flex items-center gap-1 border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs uppercase tracking-wider text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <X size={12} />
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={updatingReservationId === r.id}
                      onClick={() => void updateReservationStatus(r.id, 'nouveau')}
                      className="inline-flex items-center gap-1 border border-yellow-400/30 bg-yellow-500/10 px-3 py-2 text-xs uppercase tracking-wider text-yellow-300 transition hover:bg-yellow-500/20 disabled:opacity-50"
                    >
                      <Clock3 size={12} />
                      Remettre Nouveau
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {loadingOrders ? (
              <p className="text-sm text-tc-cream/50">Chargement des commandes...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-tc-cream/50">Aucune commande.</p>
            ) : (
              orders.map((o) => {
                const nextStatus =
                  orderStatusFlow[orderStatusFlow.indexOf(o.statut) + 1] ?? null
                return (
                  <article
                    key={o.id}
                    className="glass rounded-lg border border-white/10 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-xl">
                          Commande #{o.id.slice(0, 8)}
                        </h3>
                        <p className="mt-1 text-sm text-tc-cream/60">
                          {o.client_nom} · {o.client_telephone}
                        </p>
                        <p className="mt-1 text-xs text-tc-cream/40">
                          {o.quartier} · {o.mode_paiement} · {formatAmount(o.total)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest',
                          orderStatusClasses[o.statut],
                        )}
                      >
                        {o.statut}
                      </span>
                    </div>

                    <div className="mt-4 rounded-md border border-white/10 bg-black/25 p-3">
                      <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-tc-cream/40">
                        Articles
                      </p>
                      <div className="space-y-1">
                        {o.order_items?.map((item) => (
                          <p key={item.id} className="text-sm text-tc-cream/70">
                            {item.nom} x{item.quantite} - {formatAmount(item.sous_total)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {nextStatus && (
                        <button
                          type="button"
                          disabled={updatingOrderId === o.id}
                          onClick={() => void updateOrderStatus(o.id, nextStatus)}
                          className="inline-flex items-center gap-1 border border-tc-gold/40 bg-tc-gold/10 px-3 py-2 text-xs uppercase tracking-wider text-tc-gold transition hover:bg-tc-gold/20 disabled:opacity-50"
                        >
                          <Package size={12} />
                          Passer en {nextStatus}
                        </button>
                      )}
                      {orderStatusFlow.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={updatingOrderId === o.id}
                          onClick={() => void updateOrderStatus(o.id, status)}
                          className={cn(
                            'border px-2.5 py-2 text-[11px] uppercase tracking-wider transition disabled:opacity-50',
                            o.statut === status
                              ? 'border-tc-gold/40 bg-tc-gold/10 text-tc-gold'
                              : 'border-white/10 text-tc-cream/50 hover:border-white/30 hover:text-tc-cream',
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </article>
                )
              })
            )}
          </div>
        )}
      </section>
    </main>
  )
}
