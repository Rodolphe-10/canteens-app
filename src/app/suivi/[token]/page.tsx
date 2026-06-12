'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

const DeliveryMap = dynamic(() => import('@/components/delivery/DeliveryMap'), {
  ssr: false,
})

const GOOGLE_REVIEW_URL =
  'https://www.google.com/maps/search/?api=1&query=The+Canteen%27s+Yaound%C3%A9'

type LivreurInfo = {
  nom: string
  moto_immatriculation: string
  moto_modele?: string
  photo_url?: string
}

type DeliveryRow = {
  id: string
  statut: 'assignee' | 'en_route' | 'livree' | 'annulee'
  lat?: number
  lng?: number
  started_at?: string
  delivered_at?: string
  eta_minutes?: number
  livreurs?: LivreurInfo
}

const DELIVERY_STEPS = [
  { statut: 'assignee' as const, label: 'Confirmée', icon: '✓' },
  { statut: 'en_route' as const, label: 'En route', icon: '🛵' },
  { statut: 'livree' as const, label: 'Livrée', icon: '✅' },
]

function normalizeDelivery(data: Record<string, unknown> | null): DeliveryRow | null {
  if (!data) return null
  const raw = data.livreurs
  const livreurs = Array.isArray(raw) ? (raw[0] as LivreurInfo) : (raw as LivreurInfo)
  return { ...(data as DeliveryRow), livreurs }
}

function getStepIndex(statut: DeliveryRow['statut']): number {
  if (statut === 'assignee') return 0
  if (statut === 'en_route') return 1
  if (statut === 'livree') return 2
  return -1
}

function formatDeliveredAt(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DeliveryPipeline({ statut }: { statut: DeliveryRow['statut'] }) {
  const currentIndex = getStepIndex(statut)
  if (statut === 'annulee') {
    return (
      <p className="text-center text-sm text-red-400">Livraison annulée</p>
    )
  }

  return (
    <div className="flex items-center justify-between gap-1 px-2">
      {DELIVERY_STEPS.map((step, index) => {
        const done = index <= currentIndex
        const active = index === currentIndex
        return (
          <div key={step.statut} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm transition-colors',
                  done
                    ? active
                      ? 'border-tc-gold bg-tc-gold/20 text-tc-gold'
                      : 'border-tc-gold/60 bg-tc-gold/10 text-tc-gold'
                    : 'border-white/10 bg-white/[0.03] text-white/25',
                )}
              >
                {done && !active ? '✓' : step.icon}
              </div>
              <span
                className={cn(
                  'text-center text-[9px] font-medium uppercase tracking-wider',
                  done ? 'text-tc-cream' : 'text-white/25',
                  active && 'text-tc-gold',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < DELIVERY_STEPS.length - 1 ? (
              <div
                className={cn(
                  'mx-1 mb-5 h-0.5 flex-1 rounded',
                  index < currentIndex ? 'bg-tc-gold/50' : 'bg-white/10',
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export default function SuiviDeliveryPage() {
  const params = useParams()
  const token = params?.token as string
  const [delivery, setDelivery] = useState<DeliveryRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [minuteTick, setMinuteTick] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  const fetchDelivery = useCallback(async () => {
    const { data } = await supabase
      .from('deliveries')
      .select(
        'id, statut, lat, lng, started_at, delivered_at, eta_minutes, livreurs(nom, moto_immatriculation, moto_modele, photo_url)',
      )
      .eq('lien_suivi', token)
      .single()
    setDelivery(normalizeDelivery(data as Record<string, unknown> | null))
    setLoading(false)
  }, [supabase, token])

  const handlePositionUpdate = useCallback((lat: number, lng: number) => {
    setDelivery((prev) => (prev ? { ...prev, lat, lng } : prev))
  }, [])

  useEffect(() => {
    void fetchDelivery()

    const channel = supabase
      .channel(`suivi-${token}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `lien_suivi=eq.${token}`,
        },
        () => {
          void fetchDelivery()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchDelivery, supabase, token])

  useEffect(() => {
    if (!delivery?.id) return

    const posChannel = supabase
      .channel(`pos-${delivery.id}`)
      .on('broadcast', { event: 'position' }, ({ payload }) => {
        const { lat, lng } = payload as { lat: number; lng: number }
        setDelivery((prev) => (prev ? { ...prev, lat, lng } : prev))
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(posChannel)
    }
  }, [delivery?.id, supabase])

  const statut = delivery?.statut ?? 'assignee'

  useEffect(() => {
    if (statut !== 'en_route') return
    const interval = setInterval(() => {
      setMinuteTick((t) => t + 1)
    }, 60000)
    return () => clearInterval(interval)
  }, [statut])

  const livreur = delivery?.livreurs

  const { elapsed, remaining } = useMemo(() => {
    const eta = delivery?.eta_minutes ?? 25
    if (!delivery?.started_at) return { elapsed: 0, remaining: eta }
    const mins = Math.floor(
      (Date.now() - new Date(delivery.started_at).getTime()) / 60000,
    )
    return { elapsed: mins, remaining: Math.max(0, eta - mins) }
  }, [delivery?.started_at, delivery?.eta_minutes, minuteTick])

  const showMap =
    statut === 'en_route' &&
    delivery?.lat != null &&
    delivery?.lng != null &&
    livreur

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-tc-cream">
      <header className="border-b border-white/5 py-6 text-center">
        <p className="text-sm tracking-widest text-white/50">
          THE CANTEEN&apos;S · Suivi de commande
        </p>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
        {loading ? (
          <p className="text-center text-white/40">Chargement…</p>
        ) : !delivery ? (
          <p className="text-center text-white/40">Lien de suivi invalide.</p>
        ) : statut === 'livree' ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <p className="animate-bounce text-5xl">✅</p>
            <h1 className="mt-4 text-xl font-semibold text-tc-cream">
              Votre commande a été livrée !
            </h1>
            {delivery.delivered_at ? (
              <p className="mt-2 text-sm text-white/50">
                {formatDeliveredAt(delivery.delivered_at)}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-tc-gold">
              Bon appétit 🍽️ — The Canteen&apos;s
            </p>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full border border-tc-gold/40 px-5 py-2.5 text-sm text-tc-gold transition hover:bg-tc-gold/10"
            >
              Laisser un avis sur Google
            </a>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <DeliveryPipeline statut={statut} />
            </div>

            {livreur ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-4">
                  {livreur.photo_url ? (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={livreur.photo_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg text-white/30">
                      {livreur.nom.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-medium">{livreur.nom}</p>
                    <p className="font-mono text-sm text-tc-gold">
                      {livreur.moto_immatriculation}
                    </p>
                    {livreur.moto_modele ? (
                      <p className="text-xs text-white/40">{livreur.moto_modele}</p>
                    ) : null}
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/50">
                  Votre commande est prise en charge par{' '}
                  <span className="text-tc-cream">{livreur.nom}</span>
                </p>
              </div>
            ) : null}

            {showMap ? (
              <div className="h-64 overflow-hidden rounded-2xl border border-white/10 sm:h-80">
                <DeliveryMap
                  lat={delivery.lat!}
                  lng={delivery.lng!}
                  livreurNom={livreur!.nom}
                  immatriculation={livreur!.moto_immatriculation}
                  deliveryId={delivery.id}
                  onPositionUpdate={handlePositionUpdate}
                />
              </div>
            ) : null}

            {statut === 'en_route' ? (
              <>
                <div className="flex items-center justify-center gap-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-blue-400">
                      ~{remaining}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                      min restantes
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-white/40">
                      {elapsed}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                      min écoulées
                    </p>
                  </div>
                </div>
                {remaining === 0 ? (
                  <p className="animate-pulse text-center text-sm text-amber-400">
                    🛵 Votre livreur devrait arriver d&apos;un moment à l&apos;autre !
                  </p>
                ) : null}
              </>
            ) : null}

            {statut === 'assignee' ? (
              <p className="text-center text-sm leading-relaxed text-white/50">
                Votre commande est confirmée. Le livreur se prépare et partira
                bientôt.
              </p>
            ) : null}

            {statut === 'annulee' ? (
              <p className="text-center text-sm text-red-400">
                Cette livraison a été annulée.
              </p>
            ) : null}

            <p className="text-center text-xs text-white/30">
              Un problème ? Appelez-nous :{' '}
              <a href="tel:+237655867084" className="text-tc-gold">
                +237 655 867 084
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
