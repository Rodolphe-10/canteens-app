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
  eta_minutes?: number
  livreurs?: LivreurInfo
}

function normalizeDelivery(data: Record<string, unknown> | null): DeliveryRow | null {
  if (!data) return null
  const raw = data.livreurs
  const livreurs = Array.isArray(raw) ? (raw[0] as LivreurInfo) : (raw as LivreurInfo)
  return { ...(data as DeliveryRow), livreurs }
}

const STATUS_HEADER: Record<
  DeliveryRow['statut'],
  { className: string; label: string; message: string }
> = {
  assignee: {
    className: 'bg-amber-500/20 text-amber-400',
    label: '⏳ Votre commande est confirmée',
    message:
      'Votre commande est confirmée. Le livreur se prépare et partira bientôt.',
  },
  en_route: {
    className: 'bg-blue-500/20 text-blue-400',
    label: '🛵 Votre livreur est en route',
    message: 'Suivez votre livreur en temps réel sur la carte ci-dessus.',
  },
  livree: {
    className: 'bg-emerald-500/20 text-emerald-400',
    label: '✅ Livraison effectuée',
    message: 'Votre commande a été livrée. Bon appétit ! 🍽️',
  },
  annulee: {
    className: 'bg-red-500/20 text-red-400',
    label: '✗ Livraison annulée',
    message: 'Cette livraison a été annulée.',
  },
}

export default function SuiviDeliveryPage() {
  const params = useParams()
  const token = params?.token as string
  const [delivery, setDelivery] = useState<DeliveryRow | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchDelivery = useCallback(async () => {
    const { data } = await supabase
      .from('deliveries')
      .select(
        'id, statut, lat, lng, started_at, eta_minutes, livreurs(nom, moto_immatriculation, moto_modele, photo_url)',
      )
      .eq('lien_suivi', token)
      .single()
    setDelivery(normalizeDelivery(data as Record<string, unknown> | null))
    setLoading(false)
  }, [supabase, token])

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

  const statut = delivery?.statut ?? 'assignee'
  const header = STATUS_HEADER[statut]
  const livreur = delivery?.livreurs
  const elapsed = delivery?.started_at
    ? Math.floor((Date.now() - new Date(delivery.started_at).getTime()) / 60000)
    : 0
  const remaining = Math.max(0, (delivery?.eta_minutes ?? 25) - elapsed)
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
        ) : (
          <>
            <div className="flex justify-center">
              <span
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium',
                  header.className,
                )}
              >
                {header.label}
              </span>
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
                />
              </div>
            ) : null}

            {statut === 'en_route' ? (
              <>
                <div className="flex items-center justify-center gap-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-blue-400">~{remaining}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                      min restantes
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-3xl font-bold text-white/40">{elapsed}</p>
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

            <p className="text-center text-sm leading-relaxed text-white/50">
              {header.message}
            </p>

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
