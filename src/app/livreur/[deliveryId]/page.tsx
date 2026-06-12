'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type LivreurInfo = {
  nom: string
  telephone: string
  moto_immatriculation: string
  photo_url?: string
}

type DeliveryRow = {
  id: string
  client_nom?: string
  client_telephone?: string
  client_adresse?: string
  statut: 'assignee' | 'en_route' | 'livree' | 'annulee'
  lat?: number
  lng?: number
  lien_suivi?: string
  eta_minutes?: number
  livreurs?: LivreurInfo
}

function normalizeDelivery(data: Record<string, unknown> | null): DeliveryRow | null {
  if (!data) return null
  const raw = data.livreurs
  const livreurRow = Array.isArray(raw) ? raw[0] : raw
  const livreurs =
    livreurRow && typeof livreurRow === 'object'
      ? (livreurRow as LivreurInfo)
      : undefined
  return {
    ...(data as Omit<DeliveryRow, 'livreurs'>),
    livreurs,
  }
}

function notifyClientOnWhatsApp(delivery: DeliveryRow) {
  if (!delivery.client_telephone || !delivery.lien_suivi) return

  const livreurNom = delivery.livreurs?.nom ?? 'votre livreur'
  const etaMinutes = delivery.eta_minutes ?? 25
  const suiviUrl = `${window.location.origin}/suivi/${delivery.lien_suivi}`

  const text =
    `Bonjour ${delivery.client_nom ?? 'client'} 👋\n\n` +
    `Je suis ${livreurNom}, votre livreur The Canteen's 🛵\n\n` +
    `Votre commande est en route ! Suivez ma position en temps réel ici :\n` +
    `${suiviUrl}\n\n` +
    `Nous arrivons dans environ ${etaMinutes} minutes.\n` +
    `Pour toute question : +237 655 867 084`

  const msg = encodeURIComponent(text)
  const phone = delivery.client_telephone.replace(/\D/g, '')
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, '_blank')
}

export default function LivreurDeliveryPage() {
  const params = useParams()
  const deliveryId = params?.deliveryId as string
  const [delivery, setDelivery] = useState<DeliveryRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchDelivery = useCallback(async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*, livreurs(*)')
      .eq('id', deliveryId)
      .single()
    setDelivery(normalizeDelivery(data as Record<string, unknown> | null))
    setLoading(false)
  }, [supabase, deliveryId])

  useEffect(() => {
    void fetchDelivery()

    const channel = supabase
      .channel(`livreur-delivery-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        () => {
          void fetchDelivery()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [deliveryId, fetchDelivery, supabase])

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [watchId])

  const startTracking = async () => {
    if (!delivery) return

    await supabase
      .from('deliveries')
      .update({
        statut: 'en_route',
        started_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        void supabase
          .from('deliveries')
          .update({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
          .eq('id', deliveryId)
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )

    notifyClientOnWhatsApp(delivery)

    setWatchId(id)
    setTracking(true)
    await fetchDelivery()
  }

  const stopTracking = async () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    setWatchId(null)
    await supabase
      .from('deliveries')
      .update({
        statut: 'livree',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
    setTracking(false)
    await fetchDelivery()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4 py-8">
      <p className="mb-8 text-[10px] uppercase tracking-[0.4em] text-tc-gold/50">
        THE CANTEEN&apos;S
      </p>

      {loading ? (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-tc-gold" />
      ) : !delivery ? (
        <p className="text-white/40">Livraison introuvable.</p>
      ) : (
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-lg font-medium text-tc-cream">Ma livraison</h1>

          <div className="mt-4 space-y-2">
            <p className="text-tc-cream">👤 {delivery.client_nom ?? '—'}</p>
            {delivery.client_telephone ? (
              <p>
                📞{' '}
                <a
                  href={`tel:${delivery.client_telephone}`}
                  className="text-tc-gold underline"
                >
                  {delivery.client_telephone}
                </a>
              </p>
            ) : null}
            {delivery.client_adresse ? (
              <p className="text-white/50">📍 {delivery.client_adresse}</p>
            ) : null}
          </div>

          {delivery.statut === 'assignee' ? (
            <button
              type="button"
              onClick={() => void startTracking()}
              className="mt-6 w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white transition hover:bg-blue-500"
            >
              🛵 Démarrer la livraison
            </button>
          ) : null}

          {delivery.statut === 'en_route' || tracking ? (
            <div className="mt-6">
              <p className="animate-pulse text-center text-sm text-blue-400">
                🔴 En direct — GPS actif
              </p>
              <button
                type="button"
                onClick={() => void stopTracking()}
                className="mt-4 w-full rounded-xl bg-emerald-600 py-4 text-base font-bold text-white transition hover:bg-emerald-500"
              >
                ✅ Marquer comme livrée
              </button>
            </div>
          ) : null}

          {delivery.statut === 'livree' ? (
            <div className="mt-8 text-center">
              <p className="text-xl font-bold text-emerald-400">
                ✅ Livraison terminée !
              </p>
              <p className="mt-2 text-white/40">Merci !</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
