'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  clearLivreurSession,
  getLivreurSession,
  type LivreurSession,
} from '@/lib/livreur-session'
import { cn } from '@/lib/utils'

type DeliveryStatut = 'assignee' | 'en_route' | 'livree' | 'annulee'

type ActiveDelivery = {
  id: string
  client_nom?: string
  client_telephone?: string
  client_adresse?: string
  statut: DeliveryStatut
  assigned_at?: string
  started_at?: string
  delivered_at?: string
  eta_minutes?: number
}

type HistoryDelivery = ActiveDelivery & {
  assigned_at: string
}

const STATUS_BADGE: Record<
  DeliveryStatut,
  { label: string; className: string }
> = {
  livree: { label: 'Livrée', className: 'bg-emerald-500/20 text-emerald-400' },
  en_route: { label: 'En route', className: 'bg-blue-500/20 text-blue-400' },
  assignee: { label: 'Assignée', className: 'bg-amber-500/20 text-amber-400' },
  annulee: { label: 'Annulée', className: 'bg-red-500/20 text-red-400' },
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? 6 : day - 1
  x.setDate(x.getDate() - diff)
  return x
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function getDayKey(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDayLabel(key: string): string {
  const todayKey = getDayKey(new Date().toISOString())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = getDayKey(yesterday.toISOString())

  if (key === todayKey) return "Aujourd'hui"
  if (key === yesterdayKey) return 'Hier'

  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function extractQuartier(adresse?: string): string {
  if (!adresse?.trim()) return '—'
  return adresse.split(',')[0]?.trim() || adresse.trim()
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

function deliveryDurationMinutes(
  started?: string,
  delivered?: string,
): string | null {
  if (!started || !delivered) return null
  const mins = Math.round(
    (new Date(delivered).getTime() - new Date(started).getTime()) / 60000,
  )
  return `${mins} min`
}

function getEtaRemaining(delivery: ActiveDelivery): number {
  const eta = delivery.eta_minutes ?? 25
  if (delivery.statut === 'assignee') return eta
  if (delivery.started_at) {
    const elapsed =
      (Date.now() - new Date(delivery.started_at).getTime()) / 60000
    return Math.max(0, Math.round(eta - elapsed))
  }
  return eta
}

function playAssignNotification(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.connect(ctx.destination)
    osc.frequency.value = 880
    osc.start()
    setTimeout(() => {
      osc.stop()
      void ctx.close()
    }, 300)
  } catch {
    // silencieux si AudioContext indisponible
  }
}

export default function LivreurHomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [livreur, setLivreur] = useState<LivreurSession | null>(null)
  const [disponible, setDisponible] = useState(true)
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(
    null,
  )
  const [history, setHistory] = useState<HistoryDelivery[]>([])
  const [statsToday, setStatsToday] = useState(0)
  const [statsWeek, setStatsWeek] = useState(0)
  const [statsMonth, setStatsMonth] = useState(0)
  const [avgMinutesToday, setAvgMinutesToday] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [togglingDispo, setTogglingDispo] = useState(false)
  const prevActiveIdRef = useRef<string | undefined>(undefined)
  const isFirstFetchRef = useRef(true)

  const logout = useCallback(() => {
    clearLivreurSession()
    router.replace('/livreur')
  }, [router])

  const fetchAll = useCallback(async (livreurId: string) => {
    const now = new Date()
    const dayStart = startOfDay(now)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)

    const [profileRes, activeRes, statsRes, historyRes] = await Promise.all([
      supabase
        .from('livreurs')
        .select('disponible')
        .eq('id', livreurId)
        .maybeSingle(),
      supabase
        .from('deliveries')
        .select(
          'id, client_nom, client_telephone, client_adresse, statut, assigned_at, started_at, delivered_at, eta_minutes',
        )
        .eq('livreur_id', livreurId)
        .in('statut', ['assignee', 'en_route'])
        .order('assigned_at', { ascending: false })
        .limit(1),
      supabase
        .from('deliveries')
        .select('id, statut, started_at, delivered_at, assigned_at')
        .eq('livreur_id', livreurId)
        .eq('statut', 'livree'),
      supabase
        .from('deliveries')
        .select(
          'id, client_nom, client_adresse, statut, assigned_at, started_at, delivered_at, eta_minutes',
        )
        .eq('livreur_id', livreurId)
        .order('assigned_at', { ascending: false })
        .limit(30),
    ])

    if (!profileRes.error && profileRes.data) {
      setDisponible(
        (profileRes.data as { disponible: boolean }).disponible ?? true,
      )
    }

    const active =
      activeRes.data && activeRes.data.length > 0
        ? (activeRes.data[0] as ActiveDelivery)
        : null

    if (!isFirstFetchRef.current) {
      if (
        active?.statut === 'assignee' &&
        active.id !== prevActiveIdRef.current
      ) {
        playAssignNotification()
      }
    }
    prevActiveIdRef.current = active?.id
    isFirstFetchRef.current = false

    setActiveDelivery(active)

    if (!statsRes.error && statsRes.data) {
      const livrees = statsRes.data as {
        started_at?: string
        delivered_at?: string
      }[]

      let today = 0
      let week = 0
      let month = 0
      const durationsToday: number[] = []

      for (const row of livrees) {
        if (!row.delivered_at) continue
        const delivered = new Date(row.delivered_at)
        if (delivered >= dayStart) {
          today++
          if (row.started_at) {
            durationsToday.push(
              (delivered.getTime() - new Date(row.started_at).getTime()) /
                60000,
            )
          }
        }
        if (delivered >= weekStart) week++
        if (delivered >= monthStart) month++
      }

      setStatsToday(today)
      setStatsWeek(week)
      setStatsMonth(month)
      setAvgMinutesToday(
        durationsToday.length > 0
          ? Math.round(
              durationsToday.reduce((a, b) => a + b, 0) /
                durationsToday.length,
            )
          : null,
      )
    }

    if (!historyRes.error && historyRes.data) {
      setHistory(historyRes.data as HistoryDelivery[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const session = getLivreurSession()
    if (!session) {
      router.replace('/livreur')
      return
    }
    setLivreur(session)
    void fetchAll(session.id)

    const channel = supabase
      .channel(`livreur-home-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `livreur_id=eq.${session.id}`,
        },
        () => {
          void fetchAll(session.id)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchAll, router, supabase])

  const toggleDisponible = async () => {
    if (!livreur || togglingDispo) return
    setTogglingDispo(true)
    const next = !disponible
    const { error } = await supabase
      .from('livreurs')
      .update({ disponible: next })
      .eq('id', livreur.id)
    if (!error) setDisponible(next)
    setTogglingDispo(false)
  }

  const historyGroups = useMemo(() => {
    const map = new Map<string, HistoryDelivery[]>()
    const order: string[] = []
    for (const item of history) {
      const key = getDayKey(item.assigned_at)
      if (!map.has(key)) {
        map.set(key, [])
        order.push(key)
      }
      map.get(key)!.push(item)
    }
    return order.map((key) => ({
      key,
      label: formatDayLabel(key),
      items: map.get(key)!,
    }))
  }, [history])

  if (!livreur) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-tc-game-cyan" />
      </div>
    )
  }

  const initial = livreur.nom.charAt(0).toUpperCase()
  const etaRemaining = activeDelivery ? getEtaRemaining(activeDelivery) : null

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="relative mb-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-tc-game-cyan/70">
              THE CANTEEN&apos;S
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Déconnexion"
            className="absolute right-0 rounded-full border border-white/10 p-2 text-white/40 transition hover:border-tc-game-cyan/40 hover:text-tc-game-cyan"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Profil */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-4">
            {livreur.photo_url ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-tc-game-cyan/40">
                <Image
                  src={livreur.photo_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tc-game-cyan/20 text-lg font-bold text-tc-game-cyan">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-tc-cream">{livreur.nom}</p>
              <p className="font-mono text-xs text-white/40">
                {livreur.moto_immatriculation}
                {livreur.moto_modele ? ` · ${livreur.moto_modele}` : ''}
              </p>
            </div>
            <button
              type="button"
              disabled={togglingDispo}
              onClick={() => void toggleDisponible()}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition',
                disponible
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400',
              )}
            >
              {disponible ? 'Disponible' : 'Occupé'}
            </button>
          </div>
        </section>

        {/* Livraison en cours */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            Livraison en cours
          </h2>
          {loading ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-tc-game-cyan" />
            </div>
          ) : activeDelivery ? (
            <div className="rounded-2xl border border-tc-game-cyan/30 bg-tc-game-cyan/5 p-4">
              <p className="font-medium text-tc-cream">
                {activeDelivery.client_nom ?? 'Client'}
              </p>
              {activeDelivery.client_adresse ? (
                <p className="mt-1 text-sm text-white/50">
                  📍 {activeDelivery.client_adresse}
                </p>
              ) : null}
              {etaRemaining !== null ? (
                <p className="mt-2 text-sm text-tc-game-cyan">
                  ⏱ ETA ~ {etaRemaining} min
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {activeDelivery.client_adresse ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeDelivery.client_adresse)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl border border-tc-game-cyan/30 bg-tc-game-cyan/10 py-2.5 text-center text-sm font-medium text-tc-game-cyan transition hover:bg-tc-game-cyan/20"
                  >
                    📍 Naviguer
                  </a>
                ) : null}
                {activeDelivery.client_telephone ? (
                  <a
                    href={`tel:${activeDelivery.client_telephone}`}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-center text-sm font-medium text-tc-cream transition hover:bg-white/[0.08]"
                  >
                    📞 Appeler
                  </a>
                ) : null}
              </div>
              <a
                href={`/livreur/${activeDelivery.id}`}
                className="mt-3 block w-full rounded-xl bg-tc-game-cyan py-3 text-center text-sm font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-game-cyan/90"
              >
                Ouvrir l&apos;app de livraison
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-white/40">Aucune livraison en cours</p>
              <p className="mt-2 text-xs text-white/25">
                {disponible
                  ? 'Vous êtes disponible pour une nouvelle course'
                  : 'Passez en disponible pour recevoir des courses'}
              </p>
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            Statistiques
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-lg">🛵</p>
              <p className="mt-1 text-2xl font-bold text-tc-cream">
                {statsToday}
              </p>
              <p className="text-[10px] text-white/30">Aujourd&apos;hui</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-lg">📦</p>
              <p className="mt-1 text-2xl font-bold text-tc-cream">
                {statsWeek}
              </p>
              <p className="text-[10px] text-white/30">Cette semaine</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-lg">📅</p>
              <p className="mt-1 text-2xl font-bold text-tc-cream">
                {statsMonth}
              </p>
              <p className="text-[10px] text-white/30">Ce mois</p>
            </div>
          </div>
          {avgMinutesToday !== null ? (
            <p className="mt-3 text-center text-xs text-white/40">
              Temps moyen aujourd&apos;hui :{' '}
              <span className="text-tc-game-cyan">{avgMinutesToday} min</span>
            </p>
          ) : null}
        </section>

        {/* Historique */}
        <section className="pb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            Historique
          </h2>
          {historyGroups.length === 0 ? (
            <p className="text-center text-sm text-white/30">
              Aucune livraison enregistrée
            </p>
          ) : (
            <div className="space-y-6">
              {historyGroups.map((group) => (
                <div key={group.key}>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xs font-semibold capitalize text-white/30">
                      {group.label}
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/25">
                      {group.items.length}
                    </span>
                    <div className="flex-1 border-t border-white/5" />
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const badge = STATUS_BADGE[item.statut]
                      const duration = deliveryDurationMinutes(
                        item.started_at,
                        item.delivered_at,
                      )
                      return (
                        <article
                          key={item.id}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-tc-cream">
                                {item.client_nom ?? '—'}
                              </p>
                              <p className="truncate text-xs text-white/40">
                                {extractQuartier(item.client_adresse)}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[10px] text-white/25">
                                {formatShortDate(item.assigned_at)}
                              </p>
                              <span
                                className={cn(
                                  'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                                  badge.className,
                                )}
                              >
                                {badge.label}
                              </span>
                            </div>
                          </div>
                          {duration ? (
                            <p className="mt-1 text-[10px] text-white/30">
                              Durée : {duration}
                            </p>
                          ) : null}
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
