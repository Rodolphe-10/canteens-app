'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { olaMenuItems } from '@/data/menu-ola'
import { useMenuImageOverrides } from '@/hooks/useMenuImageOverrides'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const ADMIN_PIN = '2024'
const ACCESS_KEY = 'tc_staff_auth'

type Tab = 'reservations' | 'orders' | 'images'
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

type OrderRow = {
  id: string
  client_nom: string
  client_telephone: string
  total: number
  mode_paiement: string
  statut: OrderStatus
  quartier: string
  created_at: string
}

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const

const reservationStatusPill: Record<ReservationStatus, string> = {
  nouveau: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
  confirme: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30',
  annule: 'bg-red-500/15 text-red-400 border-red-400/30',
}

const reservationStatusLabel: Record<ReservationStatus, string> = {
  nouveau: 'Nouveau',
  confirme: 'Confirmé',
  annule: 'Annulé',
}

const orderStatusFlow: OrderStatus[] = [
  'en_attente',
  'confirme',
  'en_preparation',
  'en_livraison',
  'livre',
]

const orderStatusLabel: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  confirme: 'Confirmé',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livre: 'Livré',
}

function formatAmount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
}

function formatClock(date: Date) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function PinDots({
  length,
  max = 4,
  error,
}: {
  length: number
  max?: number
  error?: boolean
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-2.5 w-2.5 rounded-full transition-colors duration-200',
            i < length
              ? error
                ? 'bg-red-500'
                : 'bg-tc-gold'
              : error
                ? 'bg-red-500/30'
                : 'bg-white/15',
          )}
        />
      ))}
    </div>
  )
}

function OrderStatusProgress({ current }: { current: OrderStatus }) {
  const currentIndex = orderStatusFlow.indexOf(current)

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1">
      {orderStatusFlow.map((status, index) => {
        const done = index <= currentIndex
        const active = index === currentIndex
        return (
          <div key={status} className="flex items-center gap-1">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider transition-colors',
                done
                  ? active
                    ? 'bg-tc-gold/20 text-tc-gold'
                    : 'bg-emerald-500/10 text-emerald-400/80'
                  : 'bg-white/[0.03] text-white/25',
              )}
            >
              {orderStatusLabel[status]}
            </span>
            {index < orderStatusFlow.length - 1 && (
              <span
                className={cn(
                  'text-[10px]',
                  index < currentIndex ? 'text-emerald-400/50' : 'text-white/15',
                )}
              >
                →
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [tab, setTab] = useState<Tab>('reservations')
  const [clock, setClock] = useState('')
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const imageOverrides = useMenuImageOverrides()
  const [search, setSearch] = useState('')
  const [editItem, setEditItem] = useState<(typeof olaMenuItems)[0] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadToast, setUploadToast] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const filteredMenuItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return olaMenuItems
    return olaMenuItems.filter((item) => item.nameFr.toLowerCase().includes(q))
  }, [search])

  useEffect(() => {
    if (sessionStorage.getItem(ACCESS_KEY) === '1') setIsAuthed(true)
  }, [])

  useEffect(() => {
    if (!isAuthed) return
    const tick = () => setClock(formatClock(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isAuthed])

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
      .select('*')
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
        () => void fetchReservations(),
      )
      .subscribe()

    const ordersChannel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => void fetchOrders(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(reservationChannel)
      void supabase.removeChannel(ordersChannel)
    }
  }, [isAuthed, fetchReservations, fetchOrders, supabase])

  const submitPin = useCallback(
    (value: string) => {
      if (value === ADMIN_PIN) {
        sessionStorage.setItem(ACCESS_KEY, '1')
        setIsAuthed(true)
        setPin('')
        setPinError(false)
        return
      }
      setPinError(true)
      window.setTimeout(() => {
        setPin('')
        setPinError(false)
      }, 500)
    },
    [],
  )

  useEffect(() => {
    if (pin.length === 4) submitPin(pin)
  }, [pin, submitPin])

  const appendDigit = (digit: string) => {
    if (pin.length >= 4 || pinError) return
    setPin((prev) => prev + digit)
  }

  const clearPin = () => {
    setPin('')
    setPinError(false)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(ACCESS_KEY)
    setIsAuthed(false)
    setPin('')
    setPinError(false)
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

  const advanceOrderStatus = async (order: OrderRow) => {
    const idx = orderStatusFlow.indexOf(order.statut)
    const next = orderStatusFlow[idx + 1]
    if (!next) return
    setUpdatingOrderId(order.id)
    await supabase.from('orders').update({ statut: next }).eq('id', order.id)
    setUpdatingOrderId(null)
    await fetchOrders()
  }

  const handleImageUpload = async () => {
    if (!editItem || !selectedFile) return

    const client = createClient()
    setUploading(true)

    const file = selectedFile
    await client.storage
      .from('media')
      .upload(`menu/${editItem.id}.webp`, file, { upsert: true, contentType: file.type })

    const { data: urlData } = client.storage
      .from('media')
      .getPublicUrl(`menu/${editItem.id}.webp`)

    await client.from('menu_images').upsert(
      { item_id: editItem.id, image_url: urlData.publicUrl },
      { onConflict: 'item_id' },
    )

    setUploading(false)
    setEditItem(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploadToast(true)
    window.setTimeout(() => setUploadToast(false), 2500)
  }

  const closeEditModal = () => {
    setEditItem(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4">
        <p className="text-xs uppercase tracking-[0.4em] text-white/30">
          THE CANTEEN&apos;S
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.6em] text-tc-gold/50">
          STAFF ACCESS
        </p>

        <PinDots length={pin.length} error={pinError} />

        <Lock className="mt-12 h-12 w-12 text-white/20" strokeWidth={1.25} aria-hidden />

        <div className="mt-10 flex flex-col gap-3">
          {KEYPAD_ROWS.map((row) => (
            <div key={row.join('-')} className="flex justify-center gap-3">
              {row.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => appendDigit(digit)}
                  className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg font-light text-tc-cream transition-colors hover:bg-white/[0.07]"
                >
                  {digit}
                </button>
              ))}
            </div>
          ))}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => appendDigit('0')}
              className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg font-light text-tc-cream transition-colors hover:bg-white/[0.07]"
            >
              0
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={clearPin}
          className="mt-8 text-xs text-white/20 transition-colors hover:text-white/40"
        >
          ← Effacer
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-tc-cream">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#0A0A0A] px-4">
        <p className="text-xs tracking-widest text-white/50">
          THE CANTEEN&apos;S · DASHBOARD
        </p>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs tabular-nums text-white/40">{clock}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-white/30 transition-colors hover:text-red-400"
          >
            ⏻ Déconnexion
          </button>
        </div>
      </header>

      <nav className="sticky top-14 z-20 flex gap-8 border-b border-white/[0.07] bg-[#0A0A0A] px-4">
        {(
          [
            ['reservations', 'Réservations'],
            ['orders', 'Commandes'],
            ['images', 'Images'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'relative py-3 text-sm tracking-wider transition-colors',
              tab === id ? 'text-tc-cream' : 'text-white/35 hover:text-white/55',
            )}
          >
            {label}
            {tab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-tc-gold" />
            )}
          </button>
        ))}
      </nav>

      <div
        className={cn(
          'mx-auto space-y-4 px-4 py-6',
          tab === 'images' ? 'max-w-5xl' : 'max-w-2xl',
        )}
      >
        {tab === 'reservations' ? (
          loadingReservations ? (
            <p className="text-center text-sm text-white/30">Chargement…</p>
          ) : reservations.length === 0 ? (
            <p className="text-center text-sm text-white/30">Aucune réservation.</p>
          ) : (
            reservations.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-tc-cream">{r.nom}</p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider',
                      reservationStatusPill[r.statut],
                    )}
                  >
                    {reservationStatusLabel[r.statut]}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/40">
                  📅 {r.date_souhaitee} · 🕐 {r.heure_arrivee} · 👥 {r.nombre_personnes}{' '}
                  pers. · {r.espace}
                </p>
                <p className="mt-1 text-xs text-tc-gold/60">📞 {r.telephone}</p>
                {r.statut === 'nouveau' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingReservationId === r.id}
                      onClick={() => void updateReservationStatus(r.id, 'confirme')}
                      className="rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      disabled={updatingReservationId === r.id}
                      onClick={() => void updateReservationStatus(r.id, 'annule')}
                      className="rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </article>
            ))
          )
        ) : tab === 'orders' ? (
          loadingOrders ? (
            <p className="text-center text-sm text-white/30">Chargement…</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-sm text-white/30">Aucune commande.</p>
          ) : (
            orders.map((o) => {
            const nextStatus = orderStatusFlow[orderStatusFlow.indexOf(o.statut) + 1]
            return (
              <article
                key={o.id}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
              >
                <p className="font-mono text-xs text-tc-gold">
                  #{o.id.slice(0, 8).toUpperCase()}
                </p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-tc-cream">{o.client_nom}</p>
                    <p className="mt-1 text-xs text-white/40">
                      📞 {o.client_telephone} · 📍 {o.quartier}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      💳 {o.mode_paiement}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-tc-cream">
                    {formatAmount(o.total)}
                  </p>
                </div>

                <OrderStatusProgress current={o.statut} />

                {nextStatus && (
                  <button
                    type="button"
                    disabled={updatingOrderId === o.id}
                    onClick={() => void advanceOrderStatus(o)}
                    className="mt-3 rounded-full border border-tc-gold/30 px-3 py-1 text-xs text-tc-gold transition hover:bg-tc-gold/10 disabled:opacity-50"
                  >
                    → Étape suivante ({orderStatusLabel[nextStatus]})
                  </button>
                )}
              </article>
            )
          })
          )
        ) : (
          <>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un plat…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-tc-cream outline-none transition-colors placeholder:text-white/25 focus:border-tc-gold/40"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredMenuItems.map((item) => {
                const imageSrc = imageOverrides[item.id] ?? item.image
                return (
                  <div key={item.id} className="relative">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageSrc}
                        alt={item.nameFr}
                        className="h-32 w-full rounded-lg bg-white/5 object-cover"
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center rounded-lg bg-white/5 text-[10px] text-white/25">
                        Pas d&apos;image
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditItem(item)
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white"
                    >
                      📷
                    </button>
                    <p className="mt-1 truncate text-xs text-tc-cream">{item.nameFr}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6">
            <p className="mb-3 font-medium text-tc-cream">{editItem.nameFr}</p>
            {(imageOverrides[editItem.id] ?? editItem.image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageOverrides[editItem.id] ?? editItem.image}
                alt={editItem.nameFr}
                className="mb-4 h-40 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mb-4 flex h-40 w-full items-center justify-center rounded-lg bg-white/5 text-sm text-white/30">
                Aucune image
              </div>
            )}
            <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.03] px-4 py-6 text-sm text-white/50 transition hover:border-tc-gold/40 hover:text-tc-cream">
              <span>Choisir une image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {selectedFile && (
              <p className="mb-4 truncate text-xs text-tc-gold/70">{selectedFile.name}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={uploading || !selectedFile}
                onClick={() => void handleImageUpload()}
                className="flex-1 rounded-full bg-tc-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-50"
              >
                {uploading ? 'Envoi…' : 'Uploader'}
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={closeEditModal}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:text-tc-cream disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-tc-gold/40 bg-tc-black px-5 py-2 text-sm text-tc-cream">
          ✓ Image mise à jour
        </div>
      )}
    </div>
  )
}
