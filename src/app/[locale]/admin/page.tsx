'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ArrowRight, Lock } from 'lucide-react'
import {
  buildStaffAssignUrl,
  consumePendingAssignToken,
  peekPendingAssignToken,
  storePendingAssignToken,
} from '@/lib/admin-links'
import { mediaUrls } from '@/lib/media'
import { menuCategories } from '@/data/menu'
import Tooltip from '@/components/ui/Tooltip'
import { sortAlpha, sortAlphaBy } from '@/lib/sort'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const ROLE_STYLES: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrateur', color: 'text-tc-gold' },
  chef: { label: 'Chef de Salle', color: 'text-blue-400' },
  cm: { label: 'Community Manager', color: 'text-purple-400' },
  livreur: { label: 'Chef Livreur', color: 'text-orange-400' },
}

type Role = 'admin' | 'chef' | 'cm' | 'livreur'
const ACCESS_KEY = 'tc_staff_auth_role'

type Tab =
  | 'reservations'
  | 'orders'
  | 'events'
  | 'menu'
  | 'games'
  | 'galleries'
  | 'livreurs'
  | 'livraisons'

const TAB_LABELS: Record<Tab, string> = {
  reservations: 'Réservations',
  orders: 'Commandes',
  events: 'Événements',
  menu: 'Menu',
  games: 'Jeux',
  galleries: 'Galeries',
  livreurs: 'Livreurs',
  livraisons: 'Livraisons',
}

const AVAILABLE_TABS: Record<Role, Tab[]> = {
  admin: [
    'reservations',
    'orders',
    'events',
    'menu',
    'games',
    'galleries',
    'livreurs',
    'livraisons',
  ],
  chef: ['reservations', 'orders', 'menu', 'livraisons'],
  cm: ['events', 'galleries'],
  livreur: ['livreurs'],
}

const GALLERY_DEFINITIONS = [
  {
    id: 'home-hero',
    labelFr: 'Accueil — Hero',
    description: "Diaporama de la page d'accueil",
  },
  {
    id: 'game-room',
    labelFr: 'Game Room — Galerie',
    description: 'Bande défilante page Game Room',
  },
  {
    id: 'lounge',
    labelFr: 'Lounge — Galerie',
    description: 'Photos de la page Lounge',
  },
  {
    id: 'restaurant',
    labelFr: 'Restaurant — Galerie',
    description: 'Photos de la page Restaurant',
  },
  {
    id: 'terrasse',
    labelFr: 'Terrasse — Galerie',
    description: 'Photos de la page Terrasse',
  },
  {
    id: 'nos-espaces',
    labelFr: 'Nos Espaces — Galerie',
    description: 'Bande défilante page Nos Espaces',
  },
] as const

type GalleryPhotoRow = { id: string; image_url: string; position: number }

function getInitialTab(r: Role): Tab {
  if (r === 'cm') return 'events'
  if (r === 'livreur') return 'livreurs'
  return 'reservations'
}

function isRole(value: string | null): value is Role {
  return (
    value === 'admin' ||
    value === 'chef' ||
    value === 'cm' ||
    value === 'livreur'
  )
}
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
  order_number?: string
  client_nom: string
  client_telephone: string
  quartier: string
  adresse?: string
  repere?: string
  etage?: string
  instructions?: string
  horaire?: string
  heure_choisie?: string
  mode_paiement: string
  sous_total?: number
  frais_livraison?: number
  total: number
  statut: OrderStatus
  created_at: string
  assign_token?: string
  order_items?: OrderItem[]
}

type OrderItem = {
  id: string
  order_id: string
  nom: string
  quantite: number
  prix_unitaire: number
  sous_total: number
}

type MenuItem = {
  id: string
  name_fr: string
  name_en?: string
  desc_fr?: string
  price: number
  category: string
  image?: string
  is_popular: boolean
  is_visible: boolean
}

type DbGame = {
  id: string
  name: string
  description?: string
  prices: { label: string; amount: number }[]
  image?: string
  category: 'vr' | 'arcade' | 'sport' | 'simulation'
  is_highlight: boolean
  is_visible: boolean
}

type GameFormState = Partial<DbGame> & { pricesRaw?: string }

type MenuCategoryRow = {
  id: string
  label_fr: string
  label_en: string
  icon: string
  type: 'food' | 'drink'
  position: number
}

type LivreurRow = {
  id: string
  nom: string
  telephone: string
  photo_url?: string
  moto_immatriculation: string
  moto_modele?: string
  disponible: boolean
  actif: boolean
}

type DeliveryRow = {
  id: string
  order_id?: string
  livreur_id?: string
  client_nom?: string
  client_telephone?: string
  client_adresse?: string
  statut: 'assignee' | 'en_route' | 'livree' | 'annulee'
  lat?: number
  lng?: number
  lien_suivi: string
  assigned_at: string
  started_at?: string
  delivered_at?: string
  eta_minutes?: number
  livreurs?: {
    nom: string
    telephone: string
    moto_immatriculation: string
    photo_url?: string
  }
}

const DELIVERY_STATUS_STYLE: Record<
  DeliveryRow['statut'],
  { card: string; badge: string; label: string }
> = {
  assignee: {
    card: 'border-amber-500/30 bg-amber-500/5',
    badge: 'bg-amber-500/20 text-amber-400',
    label: '⏳ Assignée',
  },
  en_route: {
    card: 'border-blue-500/30 bg-blue-500/5',
    badge: 'bg-blue-500/20 text-blue-400',
    label: '🛵 En route',
  },
  livree: {
    card: 'border-emerald-500/30 bg-emerald-500/5',
    badge: 'bg-emerald-500/20 text-emerald-400',
    label: '✅ Livrée',
  },
  annulee: {
    card: 'border-white/5 bg-white/[0.02] opacity-40',
    badge: 'bg-red-500/20 text-red-400',
    label: '✗ Annulée',
  },
}

const GAME_CATEGORY_STYLES: Record<
  DbGame['category'],
  { pill: string; label: string }
> = {
  vr: { pill: 'bg-cyan-500/20 text-cyan-400', label: 'Réalité Virtuelle' },
  arcade: { pill: 'bg-orange-500/20 text-orange-400', label: 'Arcade' },
  sport: { pill: 'bg-green-500/20 text-green-400', label: 'Sport' },
  simulation: { pill: 'bg-red-500/20 text-red-400', label: 'Simulation' },
}

function formatGamePrices(prices: { label: string; amount: number }[]) {
  return prices.map((p) => `${p.label}: ${formatAmount(p.amount)}`).join(' · ')
}

type EventType =
  | 'showcase'
  | 'anniversaire'
  | 'brunch'
  | 'sport'
  | 'special'
  | 'live'
  | 'autres'

type EventRow = {
  id: string
  titre: string
  description?: string
  type: string
  date_event: string
  date_end?: string
  deadline_reservation?: string
  places_total?: number
  places_reserved: number
  flyers: string[]
  is_featured: boolean
  is_visible: boolean
}

type EventForm = Omit<EventRow, 'id' | 'places_reserved' | 'flyers' | 'type'> & {
  flyers: File[]
  type?: EventType
  custom_type?: string
}

const EVENT_TYPE_STYLES: Record<EventType, { pill: string; label: string }> = {
  showcase: {
    pill: 'border-purple-500/30 bg-purple-500/20 text-purple-300',
    label: 'Showcase',
  },
  anniversaire: {
    pill: 'border-tc-gold/30 bg-tc-gold/20 text-tc-gold',
    label: 'Anniversaire',
  },
  brunch: {
    pill: 'border-amber-500/30 bg-amber-500/20 text-amber-300',
    label: 'Brunch',
  },
  sport: {
    pill: 'border-blue-500/30 bg-blue-500/20 text-blue-300',
    label: 'Sport',
  },
  special: {
    pill: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300',
    label: 'Spécial',
  },
  live: {
    pill: 'border-pink-500/30 bg-pink-500/20 text-pink-300',
    label: 'Live',
  },
  autres: {
    pill: 'border-white/20 bg-white/10 text-white/60',
    label: 'Autres',
  },
}

const EVENT_TYPE_OPTIONS: EventType[] = (
  [
    'showcase',
    'anniversaire',
    'brunch',
    'sport',
    'special',
    'live',
    'autres',
  ] as EventType[]
).sort((a, b) => sortAlpha(EVENT_TYPE_STYLES[a].label, EVENT_TYPE_STYLES[b].label))

const PREDEFINED_EVENT_TYPES = new Set<EventType>(
  EVENT_TYPE_OPTIONS.filter((t) => t !== 'autres'),
)

function eventTypeToForm(type: string): { type: EventType; custom_type?: string } {
  if (PREDEFINED_EVENT_TYPES.has(type as EventType)) {
    return { type: type as EventType }
  }
  return { type: 'autres', custom_type: type }
}

function resolveEventTypeForSave(form: Partial<EventForm>): string {
  if (form.type === 'autres') return form.custom_type?.trim() ?? ''
  return form.type ?? 'special'
}

function getEventTypeStyle(type: string) {
  if (type in EVENT_TYPE_STYLES) {
    return EVENT_TYPE_STYLES[type as EventType]
  }
  return EVENT_TYPE_STYLES.autres
}

function getEventTypeLabel(type: string) {
  if (type in EVENT_TYPE_STYLES) {
    return EVENT_TYPE_STYLES[type as EventType].label
  }
  return type
}

const FORM_INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-tc-cream outline-none focus:border-tc-gold/40'

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

const PAYMENT_LABELS: Record<string, string> = {
  especes: 'Espèces à la livraison',
  om: 'Orange Money',
  momo: 'MTN MoMo',
}

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

function toDatetimeLocal(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatEventAdminDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-4 w-8 rounded-full transition-colors',
          checked ? 'bg-tc-gold' : 'bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
      <span className="text-xs text-white/50">{label}</span>
    </label>
  )
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
    <div
      className={cn(
        'mt-6 flex items-center justify-center gap-3',
        error && 'animate-shake',
      )}
    >
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
  const params = useParams<{ locale: string }>()
  const locale = params.locale ?? 'fr'
  const [role, setRole] = useState<Role | null>(null)
  const [staffNom, setStaffNom] = useState('')
  const [staffList, setStaffList] = useState<{ id: string; nom: string }[]>([])
  const [loadingStaffList, setLoadingStaffList] = useState(true)
  const [selectedNom, setSelectedNom] = useState<string | null>(null)
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
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null)
  const [events, setEvents] = useState<EventRow[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventModal, setEventModal] = useState<'create' | 'edit' | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null)
  const [eventForm, setEventForm] = useState<Partial<EventForm>>({})
  const [pendingExistingFlyers, setPendingExistingFlyers] = useState<string[]>([])
  const [savingEvent, setSavingEvent] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [flyerFiles, setFlyerFiles] = useState<File[]>([])
  const flyerInputRef = useRef<HTMLInputElement>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [menuSearch, setMenuSearch] = useState('')
  const [menuTypeFilter, setMenuTypeFilter] = useState<'food' | 'drink'>('food')
  const [menuCatFilter, setMenuCatFilter] = useState('all')
  const [menuModal, setMenuModal] = useState<'create' | 'edit' | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({})
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null)
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null)
  const [savingItem, setSavingItem] = useState(false)
  const menuImgRef = useRef<HTMLInputElement>(null)
  const [menuSubTab, setMenuSubTab] = useState<'items' | 'categories'>('items')
  const [menuCats, setMenuCats] = useState<MenuCategoryRow[]>([])
  const [loadingMenuCats, setLoadingMenuCats] = useState(false)
  const [menuCatModal, setMenuCatModal] = useState<'create' | 'edit' | null>(null)
  const [editingMenuCat, setEditingMenuCat] = useState<MenuCategoryRow | null>(null)
  const [menuCatForm, setMenuCatForm] = useState<Partial<MenuCategoryRow>>({})
  const [savingMenuCat, setSavingMenuCat] = useState(false)
  const [gameItems, setGameItems] = useState<DbGame[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [gameModal, setGameModal] = useState<'create' | 'edit' | null>(null)
  const [editingGame, setEditingGame] = useState<DbGame | null>(null)
  const [gameForm, setGameForm] = useState<GameFormState>({})
  const [gameImageFile, setGameImageFile] = useState<File | null>(null)
  const [gameImagePreview, setGameImagePreview] = useState<string | null>(null)
  const [savingGame, setSavingGame] = useState(false)
  const gameImgRef = useRef<HTMLInputElement>(null)
  const [activeGallery, setActiveGallery] = useState<string | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhotoRow[]>([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const galleryFileRef = useRef<HTMLInputElement>(null)
  const [livreurs, setLivreurs] = useState<LivreurRow[]>([])
  const [loadingLivreurs, setLoadingLivreurs] = useState(true)
  const [livreurModal, setLivreurModal] = useState<'create' | 'edit' | null>(null)
  const [editingLivreur, setEditingLivreur] = useState<LivreurRow | null>(null)
  const [livreurForm, setLivreurForm] = useState<Partial<LivreurRow>>({})
  const [livreurPhotoFile, setLivreurPhotoFile] = useState<File | null>(null)
  const [livreurPhotoPreview, setLivreurPhotoPreview] = useState<string | null>(null)
  const [savingLivreur, setSavingLivreur] = useState(false)
  const livreurPhotoRef = useRef<HTMLInputElement>(null)
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(true)
  const [assignModal, setAssignModal] = useState<OrderRow | null>(null)
  const [assignLivreurId, setAssignLivreurId] = useState('')
  const [assignEta, setAssignEta] = useState(25)
  const [assigningDelivery, setAssigningDelivery] = useState(false)
  const [availableLivreurs, setAvailableLivreurs] = useState<LivreurRow[]>([])
  const supabase = useMemo(() => createClient(), [])

  const uploadToStorage = async (file: File, path: string): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    form.append('path', path)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur upload' }))
      throw new Error(err.error ?? 'Erreur upload')
    }
    const { url } = (await res.json()) as { url: string }
    return url
  }

  const newFlyerPreviews = useMemo(
    () => flyerFiles.map((f) => URL.createObjectURL(f)),
    [flyerFiles],
  )

  useEffect(() => {
    return () => {
      newFlyerPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [newFlyerPreviews])

  // Source dynamique des catégories (Supabase) avec fallback statique
  const activeCats = menuCats.length > 0
    ? menuCats
    : menuCategories.map((c, i) => ({
        id: c.id,
        label_fr: c.labelFr,
        label_en: c.labelEn,
        icon: c.icon,
        type: c.type,
        position: i,
      }))

  const sortedActiveCats = useMemo(
    () => sortAlphaBy(activeCats, (c) => c.label_fr),
    [activeCats],
  )

  const menuUniqueCategories = useMemo(() => {
    const typeCats = new Set<string>(
      activeCats.filter((c) => c.type === menuTypeFilter).map((c) => c.id),
    )
    return [...new Set(menuItems.map((i) => i.category))]
      .filter((cat) => typeCats.has(cat))
      .sort((a, b) => {
        const la = activeCats.find((c) => c.id === a)?.label_fr ?? a
        const lb = activeCats.find((c) => c.id === b)?.label_fr ?? b
        return sortAlpha(la, lb)
      })
  }, [menuItems, menuTypeFilter, activeCats])

  const adminMenuFiltered = useMemo(() => {
    const q = menuSearch.trim().toLowerCase()
    const typeCats = new Set<string>(
      activeCats.filter((c) => c.type === menuTypeFilter).map((c) => c.id),
    )
    return sortAlphaBy(
      menuItems
        .filter((i) => typeCats.has(i.category))
        .filter((i) => menuCatFilter === 'all' || i.category === menuCatFilter)
        .filter((i) => i.name_fr.toLowerCase().includes(q)),
      (i) => i.name_fr,
    )
  }, [menuItems, menuTypeFilter, menuCatFilter, menuSearch, activeCats])

  const availableTabs = useMemo(
    () => AVAILABLE_TABS[role ?? 'cm'],
    [role],
  )

  const fetchStaffList = useCallback(async () => {
    const { data } = await supabase
      .from('staff_profiles')
      .select('id, nom')
      .eq('actif', true)
      .order('nom')
    setStaffList(data ?? [])
    setLoadingStaffList(false)
  }, [supabase])

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('assign')
    if (token) {
      storePendingAssignToken(token)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem(ACCESS_KEY)
    const storedNom = sessionStorage.getItem('tc_staff_nom')
    if (storedNom) setStaffNom(storedNom)
    if (isRole(stored)) {
      setRole(stored)
      setIsAuthed(true)
      setTab(peekPendingAssignToken() ? 'orders' : getInitialTab(stored))
    }
  }, [])

  useEffect(() => {
    void fetchStaffList()

    const channel = supabase
      .channel('staff_profiles_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_profiles' },
        () => {
          void fetchStaffList()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, fetchStaffList])

  useEffect(() => {
    if (!availableTabs.includes(tab)) {
      setTab(availableTabs[0] ?? 'events')
    }
  }, [availableTabs, tab])

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

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(
        (data as OrderRow[]).map((o) => ({
          ...o,
          order_items: sortAlphaBy(o.order_items ?? [], (i) => i.nom),
        })),
      )
      setLoadingOrders(false)
      return
    }

    console.error('fetchOrders join error:', error)
    const { data: ordersOnly } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    const rows = (ordersOnly as OrderRow[]) ?? []
    if (rows.length === 0) {
      setOrders([])
      setLoadingOrders(false)
      return
    }

    const { data: allItems } = await supabase
      .from('order_items')
      .select('*')
      .in(
        'order_id',
        rows.map((o) => o.id),
      )

    const itemsByOrder: Record<string, OrderItem[]> = {}
    for (const item of (allItems as OrderItem[]) ?? []) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
      itemsByOrder[item.order_id].push(item)
    }

    setOrders(
      rows.map((o) => ({
        ...o,
        order_items: sortAlphaBy(itemsByOrder[o.id] ?? [], (i) => i.nom),
      })),
    )
    setLoadingOrders(false)
  }, [supabase])

  useEffect(() => {
    if (!isAuthed || !role) return
    if (role !== 'admin' && role !== 'chef') return

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => void fetchOrders(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(reservationChannel)
      void supabase.removeChannel(ordersChannel)
    }
  }, [isAuthed, role, fetchReservations, fetchOrders, supabase])

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date_event', { ascending: false })
    setEvents((data as EventRow[]) ?? [])
    setLoadingEvents(false)
  }, [supabase])

  useEffect(() => {
    if (tab === 'events' && isAuthed) void fetchEvents()
  }, [tab, fetchEvents, isAuthed])

  const fetchMenuItems = useCallback(async () => {
    setLoadingMenu(true)
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('name_fr')
    setMenuItems((data as MenuItem[]) ?? [])
    setLoadingMenu(false)
  }, [supabase])

  const fetchMenuCategories = useCallback(async () => {
    setLoadingMenuCats(true)
    const { data } = await supabase
      .from('menu_categories')
      .select('*')
      .order('type')
      .order('position')
    if (data && data.length > 0) {
      setMenuCats(data as MenuCategoryRow[])
    }
    setLoadingMenuCats(false)
  }, [supabase])

  useEffect(() => {
    if (tab === 'menu' && isAuthed) {
      void fetchMenuItems()
      void fetchMenuCategories()
    }
  }, [tab, fetchMenuItems, fetchMenuCategories, isAuthed])

  const fetchGames = useCallback(async () => {
    setLoadingGames(true)
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('category')
      .order('name')
    setGameItems((data as DbGame[]) ?? [])
    setLoadingGames(false)
  }, [supabase])

  useEffect(() => {
    if (tab === 'games' && isAuthed) void fetchGames()
  }, [tab, fetchGames, isAuthed])

  const fetchLivreurs = useCallback(async () => {
    setLoadingLivreurs(true)
    const { data } = await supabase.from('livreurs').select('*').order('nom')
    setLivreurs((data as LivreurRow[]) ?? [])
    setLoadingLivreurs(false)
  }, [supabase])

  useEffect(() => {
    if (tab === 'livreurs' && isAuthed) void fetchLivreurs()
  }, [tab, fetchLivreurs, isAuthed])

  const fetchDeliveries = useCallback(async () => {
    setLoadingDeliveries(true)
    const { data } = await supabase
      .from('deliveries')
      .select('*, livreurs(nom, telephone, moto_immatriculation, photo_url)')
      .order('assigned_at', { ascending: false })
    setDeliveries((data as DeliveryRow[]) ?? [])
    setLoadingDeliveries(false)
  }, [supabase])

  useEffect(() => {
    if (tab === 'livraisons' && isAuthed) {
      void fetchDeliveries()
      const channel = supabase
        .channel('deliveries_live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'deliveries' },
          () => void fetchDeliveries(),
        )
        .subscribe()
      return () => {
        void supabase.removeChannel(channel)
      }
    }
  }, [tab, isAuthed, fetchDeliveries, supabase])

  const fetchGalleryPhotos = useCallback(
    async (galleryId: string) => {
      setLoadingGallery(true)
      const { data } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('position')
      setGalleryPhotos((data ?? []) as GalleryPhotoRow[])
      setLoadingGallery(false)
    },
    [supabase],
  )

  useEffect(() => {
    if (activeGallery) void fetchGalleryPhotos(activeGallery)
  }, [activeGallery, fetchGalleryPhotos])

  const uploadGalleryPhotos = async (files: File[]) => {
    if (!activeGallery || files.length === 0) return
    setUploadingGallery(true)
    setGalleryUploadProgress({ done: 0, total: files.length })

    let basePos = galleryPhotos.length
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `galleries/${activeGallery}/${Date.now()}-${i}.${ext}`
      let imageUrl: string
      try {
        imageUrl = await uploadToStorage(file, path)
      } catch (err) {
        errors.push(file.name)
        setGalleryUploadProgress((p) => p ? { ...p, done: p.done + 1 } : null)
        continue
      }
      const { error } = await supabase.from('gallery_photos').insert({
        gallery_id: activeGallery,
        image_url: imageUrl,
        position: basePos++,
      })
      if (error) errors.push(file.name)
      setGalleryUploadProgress((p) => p ? { ...p, done: p.done + 1 } : null)
    }

    await fetchGalleryPhotos(activeGallery)
    if (galleryFileRef.current) galleryFileRef.current.value = ''
    setUploadingGallery(false)
    setGalleryUploadProgress(null)
    if (errors.length > 0) {
      alert(`Erreur sur ${errors.length} fichier(s) : ${errors.join(', ')}`)
    }
  }

  const deleteGalleryPhoto = async (id: string) => {
    if (!window.confirm('Supprimer cette photo ?')) return
    const { error } = await supabase.from('gallery_photos').delete().eq('id', id)
    if (error) {
      alert(`Erreur : ${error.message}`)
      return
    }
    setGalleryPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  const closeGameModal = () => {
    setGameModal(null)
    setEditingGame(null)
    setGameForm({})
    setGameImageFile(null)
    if (gameImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(gameImagePreview)
    }
    setGameImagePreview(null)
    if (gameImgRef.current) gameImgRef.current.value = ''
  }

  const openCreateGame = () => {
    setEditingGame(null)
    setGameForm({
      is_visible: true,
      is_highlight: false,
      category: 'arcade',
      pricesRaw: '',
    })
    setGameImageFile(null)
    setGameImagePreview(null)
    setGameModal('create')
  }

  const openEditGame = (game: DbGame) => {
    setEditingGame(game)
    setGameForm({
      ...game,
      pricesRaw: game.prices.map((p) => `${p.label}:${p.amount}`).join(', '),
    })
    setGameImageFile(null)
    setGameImagePreview(null)
    setGameModal('edit')
  }

  const saveGame = async () => {
    if (!gameForm.name?.trim()) return

    setSavingGame(true)
    try {
      let imageUrl = gameForm.image ?? ''
      if (gameImageFile) {
        const ext = gameImageFile.name.split('.').pop() ?? 'jpg'
        const path = `games/${editingGame?.id ?? 'new'}-${Date.now()}.${ext}`
        try {
          imageUrl = await uploadToStorage(gameImageFile, path)
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Erreur upload')
          return
        }
      }

      const prices = (gameForm.pricesRaw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const [label, amount] = s.split(':')
          return { label: label?.trim() ?? '', amount: Number(amount ?? 0) }
        })

      const payload = {
        name: gameForm.name.trim(),
        description: gameForm.description ?? '',
        prices: prices.length > 0 ? prices : (editingGame?.prices ?? []),
        image: imageUrl || null,
        category: gameForm.category ?? 'arcade',
        is_highlight: gameForm.is_highlight ?? false,
        is_visible: gameForm.is_visible ?? true,
      }

      if (gameModal === 'edit' && editingGame) {
        const { error } = await supabase
          .from('games')
          .update(payload)
          .eq('id', editingGame.id)
        if (error) {
          alert(`Erreur : ${error.message}`)
          return
        }
      } else {
        const id =
          (gameForm.name ?? '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '') +
          '-' +
          Date.now()
        const { error } = await supabase.from('games').insert({ id, ...payload })
        if (error) {
          alert(`Erreur : ${error.message}`)
          return
        }
      }

      await fetchGames()
      closeGameModal()
    } finally {
      setSavingGame(false)
    }
  }

  const deleteGame = async (id: string) => {
    if (!window.confirm('Supprimer ce jeu ?')) return
    const { error } = await supabase.from('games').delete().eq('id', id)
    if (error) {
      alert(`Erreur : ${error.message}`)
      return
    }
    setGameItems((prev) => prev.filter((g) => g.id !== id))
  }

  const toggleGame = async (
    id: string,
    field: 'is_visible' | 'is_highlight',
    val: boolean,
  ) => {
    const { error } = await supabase.from('games').update({ [field]: val }).eq('id', id)
    if (error) {
      alert(`Erreur : ${error.message}`)
      return
    }
    setGameItems((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: val } : g)),
    )
  }

  const closeLivreurModal = () => {
    setLivreurModal(null)
    setEditingLivreur(null)
    setLivreurForm({})
    setLivreurPhotoFile(null)
    if (livreurPhotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(livreurPhotoPreview)
    }
    setLivreurPhotoPreview(null)
    if (livreurPhotoRef.current) livreurPhotoRef.current.value = ''
  }

  const openCreateLivreur = () => {
    setEditingLivreur(null)
    setLivreurForm({ disponible: true, actif: true })
    setLivreurPhotoFile(null)
    setLivreurPhotoPreview(null)
    setLivreurModal('create')
  }

  const openEditLivreur = (l: LivreurRow) => {
    setEditingLivreur(l)
    setLivreurForm({ ...l })
    setLivreurPhotoFile(null)
    setLivreurPhotoPreview(null)
    setLivreurModal('edit')
  }

  const saveLivreur = async () => {
    if (
      !livreurForm.nom?.trim() ||
      !livreurForm.telephone?.trim() ||
      !livreurForm.moto_immatriculation?.trim()
    ) {
      return
    }

    setSavingLivreur(true)
    try {
      let photoUrl = livreurForm.photo_url ?? ''
      if (livreurPhotoFile) {
        const ext = livreurPhotoFile.name.split('.').pop() ?? 'jpg'
        const path = `livreurs/${editingLivreur?.id ?? 'new'}-${Date.now()}.${ext}`
        try {
          photoUrl = await uploadToStorage(livreurPhotoFile, path)
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Erreur upload')
          return
        }
      }

      const payload = {
        nom: livreurForm.nom.trim(),
        telephone: livreurForm.telephone.trim(),
        photo_url: photoUrl || null,
        moto_immatriculation: livreurForm.moto_immatriculation.trim(),
        moto_modele: livreurForm.moto_modele?.trim() ?? null,
        disponible: livreurForm.disponible ?? true,
        actif: livreurForm.actif ?? true,
      }

      if (livreurModal === 'edit' && editingLivreur) {
        const { error } = await supabase
          .from('livreurs')
          .update(payload)
          .eq('id', editingLivreur.id)
        if (error) {
          alert(`Erreur : ${error.message}`)
          return
        }
      } else {
        // UUID explicite pour éviter l'erreur de FK dans deliveries
        const newId = crypto.randomUUID()
        const { error } = await supabase.from('livreurs').insert({ id: newId, ...payload })
        if (error) {
          alert(`Erreur : ${error.message}`)
          return
        }
      }

      await fetchLivreurs()
      closeLivreurModal()
    } finally {
      setSavingLivreur(false)
    }
  }

  const deleteLivreur = async (id: string) => {
    if (!window.confirm('Supprimer ce livreur ?')) return
    const { error } = await supabase.from('livreurs').delete().eq('id', id)
    if (error) {
      alert(`Erreur : ${error.message}`)
      return
    }
    setLivreurs((prev) => prev.filter((l) => l.id !== id))
  }

  const toggleLivreur = async (
    id: string,
    field: 'disponible' | 'actif',
    val: boolean,
  ) => {
    await supabase.from('livreurs').update({ [field]: val }).eq('id', id)
    setLivreurs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)),
    )
  }

  const openAssignForOrder = useCallback(
    async (order: OrderRow, options?: { highlight?: boolean }) => {
      setAssignModal(order)
      setAssignLivreurId('')
      setAssignEta(25)
      if (options?.highlight !== false) {
        setHighlightedOrderId(order.id)
      }
      const { data, error } = await supabase
        .from('livreurs')
        .select('*')
        .eq('actif', true)
        .order('nom')
      if (error) {
        console.error('fetch available livreurs error:', error)
      }
      setAvailableLivreurs((data as LivreurRow[]) ?? [])
      setAssignLivreurId('')
      window.setTimeout(() => {
        document
          .getElementById(`order-${order.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    },
    [supabase],
  )

  useEffect(() => {
    if (!isAuthed || loadingOrders) return
    if (role !== 'admin' && role !== 'chef') return

    const token = peekPendingAssignToken()
    if (!token) return

    const order = orders.find((o) => o.assign_token === token)
    if (!order) return

    consumePendingAssignToken()
    setTab('orders')
    void openAssignForOrder(order)
  }, [isAuthed, loadingOrders, orders, role, openAssignForOrder])

  useEffect(() => {
    if (!highlightedOrderId) return
    const timeout = window.setTimeout(() => setHighlightedOrderId(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [highlightedOrderId])

  const assignDelivery = async () => {
    if (!assignModal || !assignLivreurId) return
    setAssigningDelivery(true)

    const { data: livreurRow, error: livreurLookupError } = await supabase
      .from('livreurs')
      .select('id, nom, telephone')
      .eq('id', assignLivreurId)
      .eq('actif', true)
      .maybeSingle()

    if (livreurLookupError || !livreurRow) {
      alert(
        'Livreur introuvable en base de données.\n\n' +
          'Ajoutez-le ou réactivez-le dans l\'onglet « Livreurs », puis réessayez.',
      )
      setAssigningDelivery(false)
      void openAssignForOrder(assignModal)
      return
    }

    const { data: orderRow, error: orderLookupError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', assignModal.id)
      .maybeSingle()

    if (orderLookupError || !orderRow) {
      alert('Commande introuvable. Rafraîchissez la page et réessayez.')
      setAssigningDelivery(false)
      return
    }

    const { data, error } = await supabase
      .from('deliveries')
      .insert({
        order_id: assignModal.id,
        livreur_id: livreurRow.id,
        client_nom: assignModal.client_nom,
        client_telephone: assignModal.client_telephone,
        client_adresse: assignModal.quartier,
        statut: 'assignee',
        eta_minutes: assignEta,
      })
      .select()
      .single()

    if (error) {
      const hint =
        error.message.includes('livreur_id_fkey')
          ? '\n\nVérifiez que le livreur existe bien dans l\'onglet « Livreurs ».'
          : ''
      alert(`Erreur : ${error.message}${hint}`)
      setAssigningDelivery(false)
      return
    }

    const livreur = livreurRow

    const delivery = data as DeliveryRow
    const driverUrl = `${window.location.origin}/livreur/${delivery.id}`

    const driverMsg = encodeURIComponent(
      `🛵 NOUVELLE LIVRAISON - The Canteen's\n\n` +
        `Client : ${assignModal.client_nom}\n` +
        `📞 ${assignModal.client_telephone}\n` +
        `📍 ${assignModal.quartier}\n` +
        `⏱ ETA estimé : ${assignEta} min\n\n` +
        `Ouvre ton app de livraison :\n${driverUrl}`,
    )

    await supabase
      .from('orders')
      .update({ statut: 'en_livraison' })
      .eq('id', assignModal.id)
    await fetchOrders()
    await fetchDeliveries()

    setAssignModal(null)
    setAssigningDelivery(false)

    window.open(
      `https://api.whatsapp.com/send?phone=${livreur.telephone.replace(/\D/g, '')}&text=${driverMsg}`,
      '_blank',
    )
  }

  const updateDeliveryStatus = async (
    id: string,
    statut: DeliveryRow['statut'],
  ) => {
    const updates: Record<string, unknown> = { statut }
    if (statut === 'en_route') updates.started_at = new Date().toISOString()
    if (statut === 'livree') updates.delivered_at = new Date().toISOString()
    await supabase.from('deliveries').update(updates).eq('id', id)
    await fetchDeliveries()
  }

  const deliveriesLivreesAujourdhui = useMemo(
    () =>
      deliveries.filter((d) => {
        if (d.statut !== 'livree' || !d.delivered_at) return false
        return (
          new Date(d.delivered_at).toDateString() === new Date().toDateString()
        )
      }).length,
    [deliveries],
  )

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      alert('Lien copié !')
    } catch {
      alert(url)
    }
  }

  const closeMenuModal = () => {
    setMenuModal(null)
    setEditingItem(null)
    setMenuForm({})
    setMenuImageFile(null)
    if (menuImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(menuImagePreview)
    }
    setMenuImagePreview(null)
    if (menuImgRef.current) menuImgRef.current.value = ''
  }

  const closeMenuCatModal = () => {
    setMenuCatModal(null)
    setEditingMenuCat(null)
    setMenuCatForm({})
  }

  const openCreateMenuCat = (type: 'food' | 'drink') => {
    setEditingMenuCat(null)
    const pos = activeCats.filter((c) => c.type === type).length
    setMenuCatForm({ type, icon: '', label_en: '', position: pos })
    setMenuCatModal('create')
  }

  const openEditMenuCat = (cat: MenuCategoryRow) => {
    setEditingMenuCat(cat)
    setMenuCatForm({ ...cat })
    setMenuCatModal('edit')
  }

  const saveMenuCategory = async () => {
    if (!menuCatForm.label_fr?.trim() || !menuCatForm.type) return
    setSavingMenuCat(true)
    try {
      if (menuCatModal === 'edit' && editingMenuCat) {
        const { error } = await supabase
          .from('menu_categories')
          .update({
            label_fr: menuCatForm.label_fr.trim(),
            label_en: menuCatForm.label_en?.trim() ?? '',
            icon: menuCatForm.icon ?? '',
            type: menuCatForm.type,
            position: menuCatForm.position ?? 0,
          })
          .eq('id', editingMenuCat.id)
        if (error) { alert(`Erreur : ${error.message}`); return }
      } else {
        const id = menuCatForm.label_fr
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
        const pos = menuCatForm.position ?? activeCats.filter((c) => c.type === menuCatForm.type).length
        const { error } = await supabase.from('menu_categories').insert({
          id,
          label_fr: menuCatForm.label_fr.trim(),
          label_en: menuCatForm.label_en?.trim() ?? '',
          icon: menuCatForm.icon ?? '',
          type: menuCatForm.type,
          position: pos,
        })
        if (error) { alert(`Erreur : ${error.message}`); return }
      }
      await fetchMenuCategories()
      closeMenuCatModal()
    } finally {
      setSavingMenuCat(false)
    }
  }

  const deleteMenuCategory = async (id: string) => {
    const count = menuItems.filter((i) => i.category === id).length
    const msg = count > 0
      ? `Cette catégorie contient ${count} article(s). Supprimer quand même ? Les articles resteront mais n'auront plus de catégorie valide.`
      : 'Supprimer cette catégorie ?'
    if (!window.confirm(msg)) return
    const { error } = await supabase.from('menu_categories').delete().eq('id', id)
    if (error) { alert(`Erreur : ${error.message}`); return }
    setMenuCats((prev) => prev.filter((c) => c.id !== id))
  }

  const openCreateMenuItem = () => {
    setEditingItem(null)
    const defaultCat = menuTypeFilter === 'drink' ? 'cocktails' : 'plats-locaux'
    setMenuForm({ is_visible: true, is_popular: false, category: defaultCat })
    setMenuImageFile(null)
    setMenuImagePreview(null)
    setMenuModal('create')
  }

  const openEditMenuItem = (item: MenuItem) => {
    setEditingItem(item)
    setMenuForm({ ...item })
    setMenuImageFile(null)
    setMenuImagePreview(null)
    setMenuModal('edit')
  }

  const saveMenuItem = async () => {
    if (!menuForm.name_fr?.trim()) return

    setSavingItem(true)
    try {
      let imageUrl = menuForm.image ?? ''
      if (menuImageFile) {
        const ext = menuImageFile.name.split('.').pop() ?? 'webp'
        const path = `menu/${editingItem?.id ?? 'new'}-${Date.now()}.${ext}`
        try {
          imageUrl = await uploadToStorage(menuImageFile, path)
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Erreur upload')
          return
        }
      }

      const payload = {
        name_fr: menuForm.name_fr.trim(),
        name_en: menuForm.name_en ?? null,
        desc_fr: menuForm.desc_fr ?? null,
        price: Number(menuForm.price ?? 0),
        category: menuForm.category ?? 'plats-locaux',
        image: imageUrl || null,
        is_popular: menuForm.is_popular ?? false,
        is_visible: menuForm.is_visible ?? true,
      }

      if (menuModal === 'edit' && editingItem) {
        const result = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingItem.id)
          .select()
        if (result.error) {
          alert(`Erreur mise à jour : ${result.error.message}`)
          return
        }
        if (!result.data || result.data.length === 0) {
          alert(`Aucune ligne modifiée — vérifier les permissions.`)
          return
        }
      } else {
        const id =
          (menuForm.name_fr ?? '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '') +
          '-' +
          Date.now()
        const result = await supabase
          .from('menu_items')
          .insert({ id, ...payload })
          .select()
        if (result.error) {
          alert(`Erreur création : ${result.error.message}`)
          return
        }
      }

      await fetchMenuItems()
      closeMenuModal()
    } finally {
      setSavingItem(false)
    }
  }

  const deleteMenuItem = async (id: string) => {
    if (!window.confirm('Supprimer ce plat ?')) return
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) { alert(`Erreur suppression : ${error.message}`); return }
    setMenuItems((prev) => prev.filter((i) => i.id !== id))
  }

  const toggleMenuItem = async (
    id: string,
    field: 'is_visible' | 'is_popular',
    val: boolean,
  ) => {
    const { error } = await supabase.from('menu_items').update({ [field]: val }).eq('id', id)
    if (error) { alert(`Erreur toggle : ${error.message}`); return }
    setMenuItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)),
    )
  }

  const uploadFlyer = async (
    file: File,
    eventId: string,
    index: number,
  ): Promise<string> => {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `events/event_${eventId}_${index}.${ext}`
    try {
      return await uploadToStorage(file, path)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur upload flyer')
      throw err
    }
  }

  const closeEventModal = () => {
    setEventModal(null)
    setEditingEvent(null)
    setEventForm({})
    setPendingExistingFlyers([])
    setFlyerFiles([])
    if (flyerInputRef.current) flyerInputRef.current.value = ''
  }

  const openCreateEvent = () => {
    setEditingEvent(null)
    setPendingExistingFlyers([])
    setEventForm({
      is_visible: true,
      is_featured: false,
      type: 'special',
    })
    setFlyerFiles([])
    setEventModal('create')
  }

  const openEditEvent = (event: EventRow) => {
    setEditingEvent(event)
    setPendingExistingFlyers(event.flyers ?? [])
    const { type, custom_type } = eventTypeToForm(event.type)
    setEventForm({
      titre: event.titre,
      description: event.description ?? '',
      type,
      custom_type,
      date_event: event.date_event,
      date_end: event.date_end,
      deadline_reservation: event.deadline_reservation,
      places_total: event.places_total,
      is_featured: event.is_featured,
      is_visible: event.is_visible,
      flyers: [],
    })
    setFlyerFiles([])
    setEventModal('edit')
  }

  const saveEvent = async () => {
    if (!eventForm.titre?.trim() || !eventForm.date_event) return

    const resolvedType = resolveEventTypeForSave(eventForm)
    if (!resolvedType) {
      alert('Veuillez préciser le type d\'événement.')
      return
    }

    setSavingEvent(true)
    const isEdit = eventModal === 'edit' && editingEvent
    const existingFlyers = isEdit ? pendingExistingFlyers : []
    const newFlyerUrls: string[] = []
    const tempId = isEdit ? editingEvent!.id : crypto.randomUUID()

    try {
      try {
        for (let i = 0; i < flyerFiles.length; i++) {
          const url = await uploadFlyer(
            flyerFiles[i],
            tempId,
            existingFlyers.length + i,
          )
          newFlyerUrls.push(url)
        }
      } catch {
        return
      }

      const allFlyers = [...existingFlyers, ...newFlyerUrls]

      const payload = {
        titre: eventForm.titre.trim(),
        description: eventForm.description ?? '',
        type: resolvedType,
        date_event: new Date(eventForm.date_event).toISOString(),
        date_end: eventForm.date_end
          ? new Date(eventForm.date_end).toISOString()
          : null,
        deadline_reservation: eventForm.deadline_reservation
          ? new Date(eventForm.deadline_reservation).toISOString()
          : null,
        places_total: eventForm.places_total ?? null,
        is_featured: eventForm.is_featured ?? false,
        is_visible: eventForm.is_visible ?? true,
        flyers: allFlyers,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEvent!.id)
        if (error) {
          alert(`Erreur : ${error.message}`)
          return
        }
      } else {
        const { error } = await supabase
          .from('events')
          .insert({ id: tempId, ...payload })
        if (error) {
          alert(`Erreur : ${error.message}`)
          return
        }
      }

      await fetchEvents()
      closeEventModal()
    } finally {
      setSavingEvent(false)
    }
  }

  const deleteEvent = async (id: string) => {
    setDeletingId(id)
    await supabase.from('events').delete().eq('id', id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setDeletingId(null)
  }

  const toggleField = async (
    id: string,
    field: 'is_featured' | 'is_visible',
    value: boolean,
  ) => {
    await supabase.from('events').update({ [field]: value }).eq('id', id)
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    )
  }

  const submitPin = useCallback(async (value: string) => {
    if (!selectedNom) return

    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('pin', value)
      .eq('nom', selectedNom)
      .eq('actif', true)
      .single()

    if (data && isRole(data.role)) {
      const matchedRole = data.role
      sessionStorage.setItem(ACCESS_KEY, matchedRole)
      sessionStorage.setItem('tc_staff_nom', data.nom)
      setRole(matchedRole)
      setStaffNom(data.nom)
      setIsAuthed(true)
      setTab(peekPendingAssignToken() ? 'orders' : getInitialTab(matchedRole))
      setPin('')
      setPinError(false)
      return
    }

    setPinError(true)
    window.setTimeout(() => {
      setPin('')
      setPinError(false)
    }, 500)
  }, [selectedNom, supabase])

  useEffect(() => {
    if (selectedNom && pin.length === 4) void submitPin(pin)
  }, [pin, selectedNom, submitPin])

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
    sessionStorage.removeItem('tc_staff_nom')
    setIsAuthed(false)
    setRole(null)
    setStaffNom('')
    setSelectedNom(null)
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


  if (!isAuthed) {
    const pinKeypad = (
      <>
        <PinDots length={pin.length} error={pinError} />
        <Lock className="my-6 h-8 w-8 text-white/10" strokeWidth={1.25} aria-hidden />
        <div className="flex flex-col gap-3">
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
          className="mt-6 text-xs text-white/20 transition-colors hover:text-white/40"
        >
          ← Effacer
        </button>
      </>
    )

    if (!selectedNom) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4">
          <Image
            src={mediaUrls.logos.restaurant1}
            alt="The Canteen's"
            width={192}
            height={64}
            className="mb-2 h-16 w-48 object-contain brightness-0 invert"
            priority
          />
          <div className="mx-auto mb-8 h-px w-12 bg-tc-gold/40" />

          <p className="mb-8 text-[10px] uppercase tracking-[0.5em] text-white/25">
            Espace Staff
          </p>

          <div className="w-full max-w-xs">
            <p className="mb-4 text-center text-[10px] uppercase tracking-[0.3em] text-white/20">
              Qui êtes-vous ?
            </p>

            {loadingStaffList ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl bg-white/[0.03]"
                  />
                ))}
              </div>
            ) : staffList.length === 0 ? (
              <p className="text-center text-sm text-white/30">Aucun profil actif disponible.</p>
            ) : (
              <div className="max-h-72 w-full space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar]:w-1">
                {staffList.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      setSelectedNom(profile.nom)
                      setPin('')
                      setPinError(false)
                    }}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 text-left transition-all duration-200 hover:border-tc-gold/30 hover:bg-tc-gold/5 hover:shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-medium text-white/40 transition-colors group-hover:border-tc-gold/30 group-hover:text-tc-gold">
                      {profile.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/70 transition-colors group-hover:text-tc-cream">
                        {profile.nom}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-tc-gold/50"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0A0A0A] px-4">
        <button
          type="button"
          onClick={() => {
            setSelectedNom(null)
            setPin('')
            setPinError(false)
          }}
          className="mx-auto mb-10 flex items-center gap-2 text-xs text-white/25 transition hover:text-white/50"
        >
          ← Changer de profil
        </button>

        <div className="flex w-full max-w-xs flex-col items-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-tc-gold/20 bg-tc-gold/10 text-2xl font-bold text-tc-gold">
            {selectedNom.charAt(0).toUpperCase()}
          </div>

          <p className="mb-1 text-xl font-medium text-tc-cream">{selectedNom}</p>
          <p className="mb-8 text-xs tracking-wider text-white/25">Entrez votre code PIN</p>

          {pinKeypad}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-tc-cream">
      <div className="sticky top-0 z-30 bg-[#0A0A0A]">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.22em] text-white/35 sm:text-xs sm:tracking-widest">
            The Canteen&apos;s · Dashboard
          </p>
          {role ? (
            <p className="mt-0.5 truncate text-sm leading-snug">
              <span className={cn('font-medium', ROLE_STYLES[role].color)}>
                {staffNom || 'Staff'}
              </span>
              <span className="text-white/30"> · {ROLE_STYLES[role].label}</span>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden font-mono text-[10px] tabular-nums text-white/35 sm:inline sm:text-xs">
            {clock}
          </span>
          <Tooltip text="Se déconnecter" position="bottom">
            <button
              type="button"
              onClick={handleLogout}
              className="whitespace-nowrap text-[10px] text-white/30 transition-colors hover:text-red-400 sm:text-xs"
            >
              <span className="sm:hidden" aria-label="Déconnexion">⏻</span>
              <span className="hidden sm:inline">⏻ Déconnexion</span>
            </button>
          </Tooltip>
        </div>
      </header>

      <nav className="flex gap-5 overflow-x-auto border-b border-white/[0.07] px-4 sm:gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {availableTabs.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'relative shrink-0 py-3 text-sm tracking-wider transition-colors',
              tab === id ? 'text-tc-cream' : 'text-white/35 hover:text-white/55',
            )}
          >
            {TAB_LABELS[id]}
            {tab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-tc-gold" />
            )}
          </button>
        ))}
      </nav>
      </div>

      <div
        className={cn(
          'mx-auto space-y-4 px-4 py-6',
          tab === 'games' ||
            tab === 'galleries' ||
            tab === 'livreurs' ||
            tab === 'livraisons'
            ? 'max-w-5xl'
            : 'max-w-3xl',
        )}
      >
        {tab === 'events' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium text-tc-cream">Gestion des Événements</h2>
              <button
                type="button"
                onClick={openCreateEvent}
                className="rounded-full border border-tc-gold/40 px-4 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10"
              >
                + Créer un événement
              </button>
            </div>

            {loadingEvents ? (
              <p className="text-center text-sm text-white/30">Chargement…</p>
            ) : events.length === 0 ? (
              <p className="text-center text-sm text-white/30">Aucun événement.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {events.map((event) => {
                  const typeStyle = getEventTypeStyle(event.type)
                  const allFlyers = event.flyers ?? []
                  return (
                    <article
                      key={event.id}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                    >
                      {/* Flyers — un par un, pleine largeur */}
                      {allFlyers.length > 0 ? (
                        <div className={cn('grid gap-px', allFlyers.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                          {allFlyers.map((url, idx) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={idx}
                              src={url}
                              alt=""
                              className="w-full object-cover"
                              style={{ maxHeight: '340px' }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-white/[0.02] text-xs text-white/20">
                          Aucun flyer
                        </div>
                      )}

                      {/* Infos */}
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-base font-medium text-tc-cream">{event.titre}</h3>
                          <div className="flex items-center gap-2">
                            {event.is_featured && (
                              <span className="rounded-full bg-tc-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-tc-gold">
                                ★ Vedette
                              </span>
                            )}
                            {!event.is_visible && (
                              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/30">
                                Masqué
                              </span>
                            )}
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider',
                                typeStyle.pill,
                              )}
                            >
                              {getEventTypeLabel(event.type)}
                            </span>
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-white/50">
                          📅 {formatEventAdminDate(event.date_event)}
                          {event.date_end ? ` → ${formatEventAdminDate(event.date_end)}` : ''}
                        </p>

                        {event.places_total ? (
                          <p className="mt-1 text-xs text-white/40">
                            👥 {event.places_reserved} / {event.places_total} places
                          </p>
                        ) : null}

                        {event.description ? (
                          <p className="mt-3 text-sm leading-relaxed text-white/40">
                            {event.description}
                          </p>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/5 pt-4">
                          <ToggleSwitch
                            checked={event.is_featured}
                            onChange={(v) => void toggleField(event.id, 'is_featured', v)}
                            label="En vedette ★"
                          />
                          <ToggleSwitch
                            checked={event.is_visible}
                            onChange={(v) => void toggleField(event.id, 'is_visible', v)}
                            label="Visible"
                          />
                          <div className="ml-auto flex gap-3">
                            <button
                              type="button"
                              onClick={() => openEditEvent(event)}
                              className="rounded-full border border-tc-gold/30 px-3 py-1 text-xs text-tc-gold/80 transition hover:bg-tc-gold/10 hover:text-tc-gold"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === event.id}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Supprimer « ${event.titre} » ? Cette action est irréversible.`,
                                  )
                                ) {
                                  void deleteEvent(event.id)
                                }
                              }}
                              className="rounded-full border border-red-400/20 px-3 py-1 text-xs text-red-400/60 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                            >
                              {deletingId === event.id ? '…' : 'Supprimer'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        ) : tab === 'reservations' ? (
          loadingReservations ? (
            <p className="text-center text-sm text-white/30">Chargement…</p>
          ) : reservations.length === 0 ? (
            <p className="text-center text-sm text-white/30">Aucune réservation.</p>
          ) : (
            <div className="space-y-6">
              {(() => {
                const monthNames = [
                  'Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
                ]
                const groups: { key: string; label: string; items: typeof reservations }[] = []
                const groupMap = new Map<string, typeof reservations>()
                for (const r of reservations) {
                  const d = new Date(r.created_at)
                  const gKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                  const gLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
                  if (!groupMap.has(gKey)) {
                    groupMap.set(gKey, [])
                    groups.push({ key: gKey, label: gLabel, items: groupMap.get(gKey)! })
                  }
                  groupMap.get(gKey)!.push(r)
                }
                return groups.map(({ key: gKey, label: gLabel, items }) => (
                  <div key={gKey}>
                    {/* Month / year header */}
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/30">
                        📅 {gLabel}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/25">
                        {items.length} réservation{items.length > 1 ? 's' : ''}
                      </span>
                      <div className="flex-1 border-t border-white/5" />
                    </div>

                    <div className="space-y-4">
                      {items.map((r) => {
                        const statusConfig = {
                          nouveau: {
                            color: 'border-amber-500/40 bg-amber-500/5',
                            badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                            label: 'Nouveau',
                          },
                          confirme: {
                            color: 'border-emerald-500/40 bg-emerald-500/5',
                            badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                            label: 'Confirmé',
                          },
                          annule: {
                            color: 'border-red-500/30 bg-red-500/5',
                            badge: 'bg-red-500/20 text-red-400 border-red-500/30',
                            label: 'Annulé',
                          },
                        }[r.statut]

                        const dateObj = new Date(r.created_at)
                        const timeAgo = Math.floor(
                          (Date.now() - dateObj.getTime()) / 60000,
                        )
                        const timeLabel =
                          timeAgo < 60
                            ? `Il y a ${timeAgo} min`
                            : timeAgo < 1440
                              ? `Il y a ${Math.floor(timeAgo / 60)}h`
                              : `Il y a ${Math.floor(timeAgo / 1440)}j`

                        return (
                          <article
                            key={r.id}
                            className={cn(
                              'rounded-2xl border p-5 transition-all',
                              statusConfig.color,
                            )}
                          >
                            {/* Header */}
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-semibold text-tc-cream">
                                    {r.nom}
                                  </h3>
                                  <span
                                    className={cn(
                                      'rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                                      statusConfig.badge,
                                    )}
                                  >
                                    {statusConfig.label}
                                  </span>
                                </div>
                                <a
                                  href={`tel:${r.telephone}`}
                                  className="text-sm text-tc-gold hover:underline"
                                >
                                  📞 {r.telephone}
                                </a>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-[10px] text-white/20">
                                  {dateObj.toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                                <p className="mt-0.5 text-[10px] text-white/25">{timeLabel}</p>
                              </div>
                            </div>

                            {/* Details grid */}
                            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                                <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                                  Date souhaitée
                                </p>
                                <p className="text-sm font-medium text-tc-cream">
                                  {r.date_souhaitee}
                                </p>
                              </div>
                              <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                                <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                                  Heure d&apos;arrivée
                                </p>
                                <p className="text-sm font-medium text-tc-cream">
                                  {r.heure_arrivee}
                                </p>
                              </div>
                              <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                                <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                                  Personnes
                                </p>
                                <p className="text-2xl font-bold text-tc-gold">
                                  {r.nombre_personnes}
                                </p>
                              </div>
                              <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                                <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                                  Espace
                                </p>
                                <p className="text-sm font-medium capitalize text-tc-cream">
                                  {r.espace}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            {r.statut === 'nouveau' ? (
                              <div className="flex gap-2 border-t border-white/5 pt-3">
                                <button
                                  type="button"
                                  disabled={updatingReservationId === r.id}
                                  onClick={() =>
                                    void updateReservationStatus(r.id, 'confirme')
                                  }
                                  className="flex-1 rounded-full bg-emerald-600/80 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
                                >
                                  ✓ Confirmer
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingReservationId === r.id}
                                  onClick={() =>
                                    void updateReservationStatus(r.id, 'annule')
                                  }
                                  className="flex-1 rounded-full border border-red-400/30 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  ✗ Annuler
                                </button>
                              </div>
                            ) : r.statut === 'confirme' ? (
                              <div className="flex gap-2 border-t border-white/5 pt-3">
                                <button
                                  type="button"
                                  disabled={updatingReservationId === r.id}
                                  onClick={() =>
                                    void updateReservationStatus(r.id, 'annule')
                                  }
                                  className="w-full rounded-full border border-red-400/30 py-2 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  ✗ Annuler la réservation
                                </button>
                              </div>
                            ) : null}
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )
        ) : tab === 'orders' ? (
          loadingOrders ? (
            <p className="text-center text-sm text-white/30">Chargement…</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-sm text-white/30">Aucune commande.</p>
          ) : (
            <div className="space-y-6">
              {(() => {
                const monthNames = [
                  'Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
                ]
                const groups: { key: string; label: string; items: typeof orders }[] = []
                const groupMap = new Map<string, typeof orders>()
                for (const o of orders) {
                  const d = new Date(o.created_at)
                  const gKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                  const gLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
                  if (!groupMap.has(gKey)) {
                    groupMap.set(gKey, [])
                    groups.push({ key: gKey, label: gLabel, items: groupMap.get(gKey)! })
                  }
                  groupMap.get(gKey)!.push(o)
                }
                return groups.map(({ key: gKey, label: gLabel, items }) => (
                  <div key={gKey}>
                    {/* Month / year header */}
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/30">
                        📅 {gLabel}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/25">
                        {items.length} commande{items.length > 1 ? 's' : ''}
                      </span>
                      <div className="flex-1 border-t border-white/5" />
                    </div>

                    <div className="space-y-4">
                      {items.map((o) => {
                        const statusColors: Record<OrderStatus, string> = {
                          en_attente: 'border-amber-500/40 bg-amber-500/5',
                          confirme: 'border-blue-500/40 bg-blue-500/5',
                          en_preparation: 'border-purple-500/40 bg-purple-500/5',
                          en_livraison: 'border-tc-game-cyan/40 bg-tc-game-cyan/5',
                          livre: 'border-emerald-500/40 bg-emerald-500/5',
                        }
                        const nextStatus =
                          orderStatusFlow[orderStatusFlow.indexOf(o.statut) + 1]
                        const dateObj = new Date(o.created_at)
                        const timeAgo = Math.floor(
                          (Date.now() - dateObj.getTime()) / 60000,
                        )
                        const timeLabel =
                          timeAgo < 60
                            ? `Il y a ${timeAgo} min`
                            : timeAgo < 1440
                              ? `Il y a ${Math.floor(timeAgo / 60)}h`
                              : `Il y a ${Math.floor(timeAgo / 1440)}j`
                        const orderLineItems = o.order_items ?? []

                        return (
                          <article
                            key={o.id}
                            id={`order-${o.id}`}
                            className={cn(
                              'rounded-2xl border p-5 transition-all',
                              statusColors[o.statut],
                              highlightedOrderId === o.id &&
                                'ring-2 ring-tc-gold/60 ring-offset-2 ring-offset-[#0A0A0A]',
                            )}
                          >
                            {/* Header : numéro + client + prix */}
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <p className="font-mono text-xs font-bold text-tc-gold/80">
                                    {o.order_number ?? `#${o.id.slice(0, 8).toUpperCase()}`}
                                  </p>
                                  <span className="text-white/20">·</span>
                                  <p className="font-mono text-[10px] text-white/20">
                                    {dateObj.toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                                <h3 className="text-base font-semibold text-tc-cream">
                                  {o.client_nom}
                                </h3>
                                <a
                                  href={`tel:${o.client_telephone}`}
                                  className="text-sm text-tc-gold hover:underline"
                                >
                                  📞 {o.client_telephone}
                                </a>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-tc-cream">
                                  {formatAmount(o.total)}
                                </p>
                                {(o.sous_total != null || o.frais_livraison != null) && (
                                  <div className="mt-1 space-y-0.5">
                                    {o.sous_total != null && (
                                      <p className="text-[10px] text-white/30">
                                        Articles : {formatAmount(o.sous_total)}
                                      </p>
                                    )}
                                    {o.frais_livraison != null && (
                                      <p className="text-[10px] text-white/30">
                                        Livraison : {formatAmount(o.frais_livraison)}
                                      </p>
                                    )}
                                  </div>
                                )}
                                <p className="mt-1 text-[10px] text-white/25">{timeLabel}</p>
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="mb-4 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/60">
                                📍 {o.quartier}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/60">
                                💳 {PAYMENT_LABELS[o.mode_paiement] ?? o.mode_paiement}
                              </span>
                              {o.horaire ? (
                                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/60">
                                  ⏰{' '}
                                  {o.horaire === 'asap'
                                    ? 'Dès que possible'
                                    : o.heure_choisie ?? o.horaire}
                                </span>
                              ) : null}
                            </div>

                            {(o.adresse || o.repere || o.etage || o.instructions) ? (
                              <div className="mb-4 space-y-1 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-white/50">
                                {o.adresse ? <p>🏠 {o.adresse}</p> : null}
                                {o.repere ? <p>🗺️ {o.repere}</p> : null}
                                {o.etage ? <p>🏢 {o.etage}</p> : null}
                                {o.instructions ? (
                                  <p className="text-white/40">💬 {o.instructions}</p>
                                ) : null}
                              </div>
                            ) : null}

                            {/* Status pipeline */}
                            <div className="mb-4 flex flex-wrap items-center gap-1">
                              {orderStatusFlow.map((status, index) => {
                                const currentIndex = orderStatusFlow.indexOf(o.statut)
                                const done = index <= currentIndex
                                const active = index === currentIndex
                                return (
                                  <div key={status} className="flex items-center gap-1">
                                    <span
                                      className={cn(
                                        'rounded-full px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider transition-colors',
                                        active
                                          ? 'border border-tc-gold/30 bg-tc-gold/25 text-tc-gold'
                                          : done
                                            ? 'bg-emerald-500/15 text-emerald-400'
                                            : 'bg-white/[0.03] text-white/20',
                                      )}
                                    >
                                      {orderStatusLabel[status]}
                                    </span>
                                    {index < orderStatusFlow.length - 1 ? (
                                      <span
                                        className={cn(
                                          'text-[10px]',
                                          index < currentIndex
                                            ? 'text-emerald-400/50'
                                            : 'text-white/10',
                                        )}
                                      >
                                        →
                                      </span>
                                    ) : null}
                                  </div>
                                )
                              })}
                            </div>

                            {/* Articles commandés */}
                            <div className="mb-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                              <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40">
                                🛒 Articles commandés
                                {orderLineItems.length > 0
                                  ? ` (${orderLineItems.length})`
                                  : ''}
                              </p>
                              {orderLineItems.length === 0 ? (
                                <p className="text-center text-xs text-white/30">
                                  Aucun article enregistré pour cette commande.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {orderLineItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between gap-2"
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tc-gold/20 text-[10px] font-bold text-tc-gold">
                                          {item.quantite}
                                        </span>
                                        <span className="truncate text-xs text-tc-cream">
                                          {item.nom}
                                        </span>
                                      </div>
                                      <span className="shrink-0 text-xs text-white/40">
                                        {formatAmount(item.sous_total)}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="mt-2 flex justify-between border-t border-white/5 pt-2">
                                    <span className="text-xs text-white/30">
                                      Sous-total articles
                                    </span>
                                    <span className="text-xs font-medium text-tc-cream">
                                      {formatAmount(
                                        orderLineItems.reduce((s, i) => s + i.sous_total, 0),
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Advance status */}
                            {nextStatus ? (
                              <div className="border-t border-white/5 pt-3">
                                <button
                                  type="button"
                                  disabled={updatingOrderId === o.id}
                                  onClick={() => void advanceOrderStatus(o)}
                                  className="w-full rounded-full bg-tc-gold/90 py-2.5 text-sm font-bold text-tc-black transition hover:bg-tc-gold disabled:opacity-50"
                                >
                                  → Passer à : {orderStatusLabel[nextStatus]}
                                </button>
                              </div>
                            ) : null}

                            {/* Assign livreur */}
                            {o.statut !== 'livre' ? (
                              <div className="mt-3 flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => void openAssignForOrder(o)}
                                  className="w-full rounded-full border border-tc-gold/30 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10"
                                >
                                  🛵 Assigner un livreur
                                </button>
                                {o.assign_token ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const link = buildStaffAssignUrl(
                                        window.location.origin,
                                        locale,
                                        o.assign_token!,
                                      )
                                      void navigator.clipboard.writeText(link)
                                    }}
                                    className="w-full rounded-full border border-white/10 py-2 text-[10px] text-white/35 transition hover:border-white/20 hover:text-white/55"
                                  >
                                    📋 Copier le lien staff (assignation)
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )
        ) : tab === 'menu' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium text-tc-cream">Gestion du Menu</h2>
              {menuSubTab === 'items' && (
                <button
                  type="button"
                  onClick={openCreateMenuItem}
                  className="rounded-full border border-tc-gold/40 px-4 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10"
                >
                  {menuTypeFilter === 'food' ? '+ Ajouter un plat' : '+ Ajouter une boisson'}
                </button>
              )}
            </div>

            {/* Toggle Articles / Catégories */}
            <div className="mt-4 flex gap-1 rounded-full bg-white/5 p-1 w-fit">
              <button
                type="button"
                onClick={() => setMenuSubTab('items')}
                className={cn(
                  'rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                  menuSubTab === 'items' ? 'bg-tc-gold text-tc-black' : 'text-tc-cream/50 hover:text-tc-cream',
                )}
              >
                📋 Articles
              </button>
              <button
                type="button"
                onClick={() => setMenuSubTab('categories')}
                className={cn(
                  'rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                  menuSubTab === 'categories' ? 'bg-tc-gold text-tc-black' : 'text-tc-cream/50 hover:text-tc-cream',
                )}
              >
                🗂 Catégories
              </button>
            </div>

            {menuSubTab === 'items' ? (
              <>
                {/* Sous-onglets Plats / Boissons */}
                <div className="mt-4 flex gap-1 rounded-full bg-white/5 p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => { setMenuTypeFilter('food'); setMenuCatFilter('all'); setMenuSearch('') }}
                    className={cn(
                      'rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                      menuTypeFilter === 'food' ? 'bg-white/15 text-tc-cream' : 'text-tc-cream/50 hover:text-tc-cream',
                    )}
                  >
                    🍽 Plats
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuTypeFilter('drink'); setMenuCatFilter('all'); setMenuSearch('') }}
                    className={cn(
                      'rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                      menuTypeFilter === 'drink' ? 'bg-white/15 text-tc-cream' : 'text-tc-cream/50 hover:text-tc-cream',
                    )}
                  >
                    🍹 Boissons
                  </button>
                </div>

                <div className="mt-4 mb-6 flex flex-wrap gap-3">
                  <input
                    type="search"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className={cn(FORM_INPUT_CLASS, 'max-w-xs flex-1')}
                  />
                  <select
                    value={menuCatFilter}
                    onChange={(e) => setMenuCatFilter(e.target.value)}
                    className={cn(FORM_INPUT_CLASS, 'max-w-[200px]')}
                  >
                    <option value="all" className="bg-[#111]">Toutes les catégories</option>
                    {menuUniqueCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#111]">
                        {activeCats.find((c) => c.id === cat)?.label_fr ?? cat}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingMenu ? (
                  <p className="text-center text-sm text-white/30">Chargement…</p>
                ) : adminMenuFiltered.length === 0 ? (
                  <p className="text-center text-sm text-white/30">Aucun article trouvé.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {adminMenuFiltered.map((item) => {
                      const catLabel =
                        activeCats.find((c) => c.id === item.category)?.label_fr ?? item.category
                      return (
                        <article
                          key={item.id}
                          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
                        >
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-white/5 object-cover" />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] text-white/25">—</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-tc-cream">{item.name_fr}</p>
                            <p className="text-[10px] uppercase tracking-wider text-white/30">{catLabel}</p>
                            <p className="text-sm text-tc-gold">{formatAmount(item.price)}</p>
                            {item.desc_fr ? (
                              <p className="line-clamp-1 text-[10px] text-white/25">{item.desc_fr}</p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <div className="inline-flex flex-wrap items-center justify-end gap-2">
                              <ToggleSwitch checked={item.is_visible} onChange={(v) => void toggleMenuItem(item.id, 'is_visible', v)} label="Visible" />
                              <ToggleSwitch checked={item.is_popular} onChange={(v) => void toggleMenuItem(item.id, 'is_popular', v)} label="★" />
                            </div>
                            <div className="flex gap-2">
                              <Tooltip text="Modifier" position="top">
                                <button type="button" onClick={() => openEditMenuItem(item)} className="text-white/40 transition hover:text-tc-gold" aria-label="Modifier">✏️</button>
                              </Tooltip>
                              <Tooltip text="Supprimer" position="top">
                                <button type="button" onClick={() => void deleteMenuItem(item.id)} className="text-white/40 transition hover:text-red-400" aria-label="Supprimer">🗑️</button>
                              </Tooltip>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              /* ── Vue Catégories ── */
              <>
                {loadingMenuCats ? (
                  <p className="mt-6 text-center text-sm text-white/30">Chargement…</p>
                ) : (
                  <>
                    {(['food', 'drink'] as const).map((type) => {
                      const cats = sortAlphaBy(
                        activeCats.filter((c) => c.type === type),
                        (c) => c.label_fr,
                      )
                      return (
                        <div key={type} className="mt-6">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">
                              {type === 'food' ? '🍽 Plats' : '🍹 Boissons'}
                              <span className="ml-2 text-[10px] font-normal text-white/20">
                                {cats.length} catégorie{cats.length > 1 ? 's' : ''}
                              </span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => openCreateMenuCat(type)}
                              className="rounded-full border border-tc-gold/30 px-3 py-1 text-[10px] text-tc-gold/70 transition hover:bg-tc-gold/10 hover:text-tc-gold"
                            >
                              + Ajouter
                            </button>
                          </div>

                          {cats.length === 0 ? (
                            <p className="text-xs text-white/20">Aucune catégorie.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {cats.map((cat) => {
                                const itemCount = menuItems.filter((i) => i.category === cat.id).length
                                return (
                                  <div
                                    key={cat.id}
                                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
                                  >
                                    {cat.icon ? (
                                      <span className="text-xl">{cat.icon}</span>
                                    ) : (
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[10px] text-white/20">
                                        {type === 'food' ? '🍽' : '🍹'}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-tc-cream">{cat.label_fr}</p>
                                      {cat.label_en ? (
                                        <p className="text-[10px] text-white/30">{cat.label_en}</p>
                                      ) : null}
                                      <p className="text-[10px] text-white/20">
                                        {itemCount} article{itemCount > 1 ? 's' : ''} · id: {cat.id}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                      <Tooltip text="Modifier" position="top">
                                        <button
                                          type="button"
                                          onClick={() => openEditMenuCat(cat)}
                                          className="text-white/40 transition hover:text-tc-gold"
                                          aria-label="Modifier"
                                        >
                                          ✏️
                                        </button>
                                      </Tooltip>
                                      <Tooltip text="Supprimer" position="top">
                                        <button
                                          type="button"
                                          onClick={() => void deleteMenuCategory(cat.id)}
                                          className="text-white/40 transition hover:text-red-400"
                                          aria-label="Supprimer"
                                        >
                                          🗑️
                                        </button>
                                      </Tooltip>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </>
        ) : tab === 'games' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium text-tc-cream">Gestion des Jeux</h2>
              <button
                type="button"
                onClick={openCreateGame}
                className="rounded-full border border-tc-gold/40 px-4 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10"
              >
                + Ajouter un jeu
              </button>
            </div>

            {loadingGames ? (
              <p className="mt-6 text-center text-sm text-white/30">Chargement…</p>
            ) : gameItems.length === 0 ? (
              <p className="mt-6 text-center text-sm text-white/30">Aucun jeu.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {gameItems.map((game) => {
                  const catStyle =
                    GAME_CATEGORY_STYLES[game.category] ?? GAME_CATEGORY_STYLES.arcade
                  return (
                    <article
                      key={game.id}
                      className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03]"
                    >
                      {game.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={game.image}
                          alt=""
                          className="h-40 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-white/5 text-white/25">
                          —
                        </div>
                      )}
                      <span
                        className={cn(
                          'absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] uppercase',
                          catStyle.pill,
                        )}
                      >
                        {catStyle.label}
                      </span>
                      {game.is_highlight ? (
                        <span className="absolute right-2 top-2 rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] text-white">
                          ★ Vedette
                        </span>
                      ) : null}
                      <div className="p-4">
                        <p className="font-medium text-tc-cream">{game.name}</p>
                        <p className="mt-1 text-xs text-white/30">
                          {formatGamePrices(game.prices)}
                        </p>
                        {game.description ? (
                          <p className="mt-1 line-clamp-1 text-[11px] text-white/25">
                            {game.description}
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            <ToggleSwitch
                              checked={game.is_visible}
                              onChange={(v) => void toggleGame(game.id, 'is_visible', v)}
                              label="Visible"
                            />
                            <ToggleSwitch
                              checked={game.is_highlight}
                              onChange={(v) => void toggleGame(game.id, 'is_highlight', v)}
                              label="★"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Tooltip text="Modifier" position="top">
                              <button
                                type="button"
                                onClick={() => openEditGame(game)}
                                className="text-white/40 transition hover:text-tc-gold"
                                aria-label="Modifier"
                              >
                                ✏️
                              </button>
                            </Tooltip>
                            <Tooltip text="Supprimer" position="top">
                              <button
                                type="button"
                                onClick={() => void deleteGame(game.id)}
                                className="text-white/40 transition hover:text-red-400"
                                aria-label="Supprimer"
                              >
                                🗑️
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        ) : tab === 'galleries' ? (
          <>
            {!activeGallery ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GALLERY_DEFINITIONS.map((gallery) => (
                  <button
                    key={gallery.id}
                    type="button"
                    onClick={() => setActiveGallery(gallery.id)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4 text-left transition hover:border-tc-gold/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-tc-cream">
                        {gallery.labelFr}
                      </p>
                      <p className="mt-1 text-xs text-white/40">{gallery.description}</p>
                    </div>
                    <span className="text-white/30">→</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveGallery(null)}
                    className="text-xs text-white/40 transition hover:text-tc-cream"
                  >
                    ← Toutes les galeries
                  </button>
                  <p className="text-sm font-medium text-tc-cream">
                    {GALLERY_DEFINITIONS.find((g) => g.id === activeGallery)?.labelFr}
                  </p>
                </div>

                <input
                  ref={galleryFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    if (files.length > 0) void uploadGalleryPhotos(files)
                  }}
                />
                <button
                  type="button"
                  onClick={() => galleryFileRef.current?.click()}
                  disabled={uploadingGallery}
                  className="mt-4 rounded-full border border-tc-gold/40 px-4 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10 disabled:opacity-50"
                >
                  {galleryUploadProgress
                    ? `Envoi ${galleryUploadProgress.done}/${galleryUploadProgress.total}…`
                    : '+ Ajouter des photos'}
                </button>

                {loadingGallery ? (
                  <p className="mt-6 text-center text-sm text-white/30">Chargement…</p>
                ) : galleryPhotos.length === 0 ? (
                  <p className="mt-6 text-center text-sm text-white/30">
                    Aucune photo — ajoutez-en une ci-dessus.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {galleryPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative aspect-video overflow-hidden rounded-lg bg-white/5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                          <Tooltip text="Supprimer" position="top">
                            <button
                              type="button"
                              onClick={() => void deleteGalleryPhoto(photo.id)}
                              className="text-lg text-red-400"
                              aria-label="Supprimer"
                            >
                              🗑️
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : tab === 'livreurs' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium text-tc-cream">Équipe Livraison</h2>
              <button
                type="button"
                onClick={openCreateLivreur}
                className="rounded-full border border-tc-gold/40 px-4 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10"
              >
                + Ajouter un livreur
              </button>
            </div>

            {loadingLivreurs ? (
              <p className="mt-6 text-center text-sm text-white/30">Chargement…</p>
            ) : livreurs.length === 0 ? (
              <p className="mt-6 text-center text-sm text-white/30">Aucun livreur.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {livreurs.map((l) => (
                  <article
                    key={l.id}
                    className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]"
                  >
                    <div className="relative flex items-center gap-4 p-4">
                      {l.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.photo_url}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-full border-2 border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/5 text-xl text-white/20">
                          {l.nom.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pr-20">
                        <p className="text-base font-medium text-tc-cream">{l.nom}</p>
                        <p className="text-sm text-white/40">{l.telephone}</p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-tc-gold">
                          {l.moto_immatriculation}
                        </p>
                        {l.moto_modele ? (
                          <p className="text-xs text-white/30">{l.moto_modele}</p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          'absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px]',
                          l.disponible
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-white/30',
                        )}
                      >
                        {l.disponible ? '● Disponible' : '● Indisponible'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <ToggleSwitch
                          checked={l.disponible}
                          onChange={(v) => void toggleLivreur(l.id, 'disponible', v)}
                          label="Disponible"
                        />
                        <ToggleSwitch
                          checked={l.actif}
                          onChange={(v) => void toggleLivreur(l.id, 'actif', v)}
                          label="Actif"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Tooltip text="Modifier" position="top">
                          <button
                            type="button"
                            onClick={() => openEditLivreur(l)}
                            className="text-white/40 transition hover:text-tc-gold"
                            aria-label="Modifier"
                          >
                            ✏️
                          </button>
                        </Tooltip>
                        <Tooltip text="Supprimer" position="top">
                          <button
                            type="button"
                            onClick={() => void deleteLivreur(l.id)}
                            className="text-white/40 transition hover:text-red-400"
                            aria-label="Supprimer"
                          >
                            🗑️
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : tab === 'livraisons' ? (
          <>
            <h2 className="mb-6 font-medium text-tc-cream">Livraisons en cours</h2>

            <div className="mb-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <p className="text-2xl font-bold text-tc-cream">
                  {deliveries.filter((d) => d.statut === 'assignee').length}
                </p>
                <p className="text-[10px] uppercase text-white/30">En attente</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <p className="text-2xl font-bold text-tc-cream">
                  {deliveries.filter((d) => d.statut === 'en_route').length}
                </p>
                <p className="text-[10px] uppercase text-white/30">En route</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <p className="text-2xl font-bold text-tc-cream">
                  {deliveriesLivreesAujourdhui}
                </p>
                <p className="text-[10px] uppercase text-white/30">Livrées aujourd&apos;hui</p>
              </div>
            </div>

            {loadingDeliveries ? (
              <p className="text-center text-sm text-white/30">Chargement…</p>
            ) : deliveries.length === 0 ? (
              <p className="text-center text-sm text-white/30">Aucune livraison.</p>
            ) : (
              <div className="space-y-3">
                {deliveries.map((d) => {
                  const style = DELIVERY_STATUS_STYLE[d.statut]
                  const liv = Array.isArray(d.livreurs) ? d.livreurs[0] : d.livreurs
                  return (
                    <article
                      key={d.id}
                      className={cn('rounded-2xl border p-4', style.card)}
                    >
                      <div className="flex items-start gap-3">
                        {liv?.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={liv.photo_url}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm text-white/20">
                            {liv?.nom?.charAt(0) ?? '?'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-tc-cream">
                                {liv?.nom ?? '—'}
                              </p>
                              <p className="font-mono text-xs text-tc-gold">
                                {liv?.moto_immatriculation ?? '—'}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[10px]',
                                style.badge,
                              )}
                            >
                              {style.label}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-white/50">
                            👤 {d.client_nom}
                            {d.client_telephone ? (
                              <>
                                {' · '}
                                <a
                                  href={`tel:${d.client_telephone}`}
                                  className="text-tc-gold hover:underline"
                                >
                                  📞 {d.client_telephone}
                                </a>
                              </>
                            ) : null}
                          </p>
                          {d.client_adresse ? (
                            <p className="text-xs text-white/30">📍 {d.client_adresse}</p>
                          ) : null}
                          {d.statut === 'en_route' && d.started_at ? (
                            <p className="mt-1 text-xs text-blue-400/80">
                              ⏱ En route depuis{' '}
                              {Math.floor(
                                (Date.now() - new Date(d.started_at).getTime()) / 60000,
                              )}{' '}
                              min · ETA ~{d.eta_minutes ?? 25} min
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                        {d.statut === 'assignee' ? (
                          <button
                            type="button"
                            onClick={() => void updateDeliveryStatus(d.id, 'en_route')}
                            className="rounded-full border border-blue-400/30 px-3 py-1 text-xs text-blue-400 transition hover:bg-blue-500/10"
                          >
                            🛵 En route
                          </button>
                        ) : null}
                        {d.statut === 'en_route' ? (
                          <button
                            type="button"
                            onClick={() => void updateDeliveryStatus(d.id, 'livree')}
                            className="rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-400 transition hover:bg-emerald-500/10"
                          >
                            ✅ Livrée
                          </button>
                        ) : null}
                        {d.statut !== 'livree' && d.statut !== 'annulee' ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `${window.location.origin}/suivi/${d.lien_suivi}`,
                                  '_blank',
                                )
                              }
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40 transition hover:text-tc-gold"
                            >
                              📍 Position en direct
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const clientMsg = encodeURIComponent(
                                  `Bonjour ${d.client_nom} ! 👋\n\n` +
                                    `Votre commande The Canteen's est en route 🛵\n\n` +
                                    `Suivez la position de votre livreur en temps réel :\n` +
                                    `${window.location.origin}/suivi/${d.lien_suivi}\n\n` +
                                    `Merci de votre confiance ! 🍽️`,
                                )
                                window.open(
                                  `https://api.whatsapp.com/send?phone=${(d.client_telephone ?? '').replace(/\D/g, '')}&text=${clientMsg}`,
                                  '_blank',
                                )
                              }}
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40 transition hover:text-tc-gold"
                            >
                              📱 Notifier le client
                            </button>
                          </>
                        ) : null}
                        {d.statut !== 'livree' ? (
                          <button
                            type="button"
                            onClick={() => void updateDeliveryStatus(d.id, 'annulee')}
                            className="rounded-full border border-red-400/20 px-3 py-1 text-xs text-red-400/60 transition hover:bg-red-500/10"
                          >
                            Annuler
                          </button>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        ) : null}
      </div>

      {assignModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setAssignModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-medium text-tc-cream">Assigner une livraison</h3>
            <p className="mb-4 mt-1 text-xs text-white/40">
              Client : {assignModal.client_nom}
            </p>

            <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-tc-cream">
                👤 {assignModal.client_nom}
              </p>
              <p className="text-xs text-white/50">📞 {assignModal.client_telephone}</p>
              <p className="text-xs text-white/50">📍 {assignModal.quartier}</p>
              {assignModal.adresse ? (
                <p className="text-xs text-white/50">🏠 {assignModal.adresse}</p>
              ) : null}
              {assignModal.repere ? (
                <p className="text-xs text-white/50">🗺️ {assignModal.repere}</p>
              ) : null}
              <p className="text-xs text-white/50">
                💳 {PAYMENT_LABELS[assignModal.mode_paiement] ?? assignModal.mode_paiement}
              </p>
              {(assignModal.order_items ?? []).length > 0 ? (
                <div className="mt-3 space-y-1 border-t border-white/5 pt-3">
                  {(assignModal.order_items ?? []).map((item) => (
                    <p key={item.id} className="text-xs text-white/50">
                      · {item.quantite}× {item.nom} — {formatAmount(item.sous_total)}
                    </p>
                  ))}
                </div>
              ) : null}
              <p className="mt-2 text-sm font-bold text-tc-gold">
                💰 {formatAmount(assignModal.total)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40">Choisir le livreur *</label>
                {availableLivreurs.length === 0 ? (
                  <p className="mt-2 text-xs text-white/30">
                    Aucun livreur actif. Ajoutez-en un dans l&apos;onglet « Livreurs ».
                  </p>
                ) : (
                  <select
                    value={assignLivreurId}
                    onChange={(e) => setAssignLivreurId(e.target.value)}
                    className={cn(FORM_INPUT_CLASS, 'mt-1')}
                  >
                    <option value="" className="bg-[#111]">
                      — Sélectionner un livreur —
                    </option>
                    {availableLivreurs.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#111]">
                        {l.nom} — {l.moto_immatriculation}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs text-white/40">
                  Temps de livraison estimé (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={assignEta}
                  onChange={(e) => setAssignEta(Number(e.target.value))}
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:text-tc-cream"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={assigningDelivery || !assignLivreurId}
                onClick={() => void assignDelivery()}
                className="flex-1 rounded-full bg-tc-gold px-4 py-2 text-xs font-bold text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-50"
              >
                {assigningDelivery ? 'Assignation…' : '🛵 Assigner + Notifier le livreur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {gameModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={closeGameModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 font-medium text-tc-cream">
              {gameModal === 'create' ? 'Ajouter un jeu' : 'Modifier le jeu'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40">Nom *</label>
                <input
                  type="text"
                  value={gameForm.name ?? ''}
                  onChange={(e) =>
                    setGameForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Description</label>
                <textarea
                  rows={2}
                  value={gameForm.description ?? ''}
                  onChange={(e) =>
                    setGameForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1 resize-none')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Catégorie *</label>
                <select
                  value={gameForm.category ?? 'arcade'}
                  onChange={(e) =>
                    setGameForm((prev) => ({
                      ...prev,
                      category: e.target.value as DbGame['category'],
                    }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                >
                  <option value="vr" className="bg-[#111]">
                    Réalité Virtuelle
                  </option>
                  <option value="arcade" className="bg-[#111]">
                    Arcade
                  </option>
                  <option value="sport" className="bg-[#111]">
                    Sport
                  </option>
                  <option value="simulation" className="bg-[#111]">
                    Simulation
                  </option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40">Prix *</label>
                <input
                  type="text"
                  value={gameForm.pricesRaw ?? ''}
                  onChange={(e) =>
                    setGameForm((prev) => ({ ...prev, pricesRaw: e.target.value }))
                  }
                  placeholder="3-6 min:1500, 7-9 min:3000"
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={gameForm.is_visible ?? true}
                    onChange={(e) =>
                      setGameForm((prev) => ({
                        ...prev,
                        is_visible: e.target.checked,
                      }))
                    }
                    className="accent-tc-gold"
                  />
                  Visible
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={gameForm.is_highlight ?? false}
                    onChange={(e) =>
                      setGameForm((prev) => ({
                        ...prev,
                        is_highlight: e.target.checked,
                      }))
                    }
                    className="accent-tc-gold"
                  />
                  Vedette
                </label>
              </div>
              <div>
                <p className="mb-2 text-xs text-white/40">Photo</p>
                {gameImagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gameImagePreview}
                    alt=""
                    className="mb-2 h-32 w-full rounded-xl object-cover"
                  />
                ) : gameForm.image ? (
                  <div className="relative mb-2 h-32 w-full overflow-hidden rounded-xl">
                    <Image
                      src={gameForm.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="512px"
                    />
                  </div>
                ) : null}
                <input
                  ref={gameImgRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (gameImagePreview?.startsWith('blob:')) {
                      URL.revokeObjectURL(gameImagePreview)
                    }
                    setGameImageFile(file)
                    setGameImagePreview(URL.createObjectURL(file))
                  }}
                />
                <button
                  type="button"
                  onClick={() => gameImgRef.current?.click()}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:border-tc-gold/40 hover:text-tc-cream"
                >
                  Changer la photo
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={savingGame}
                onClick={closeGameModal}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:text-tc-cream disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={savingGame || !gameForm.name?.trim()}
                onClick={() => void saveGame()}
                className="flex-1 rounded-full bg-tc-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-50"
              >
                {savingGame ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catégorie */}
      {menuCatModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={closeMenuCatModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 font-medium text-tc-cream">
              {menuCatModal === 'create' ? 'Créer une catégorie' : 'Modifier la catégorie'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40">Nom FR *</label>
                <input
                  type="text"
                  value={menuCatForm.label_fr ?? ''}
                  onChange={(e) => setMenuCatForm((p) => ({ ...p, label_fr: e.target.value }))}
                  placeholder="ex: Plats Locaux"
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Nom EN</label>
                <input
                  type="text"
                  value={menuCatForm.label_en ?? ''}
                  onChange={(e) => setMenuCatForm((p) => ({ ...p, label_en: e.target.value }))}
                  placeholder="ex: Local Dishes"
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Icône (emoji)</label>
                <input
                  type="text"
                  value={menuCatForm.icon ?? ''}
                  onChange={(e) => setMenuCatForm((p) => ({ ...p, icon: e.target.value }))}
                  placeholder="ex: 🍲"
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Type *</label>
                <select
                  value={menuCatForm.type ?? 'food'}
                  onChange={(e) => setMenuCatForm((p) => ({ ...p, type: e.target.value as 'food' | 'drink' }))}
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                  disabled={menuCatModal === 'edit'}
                >
                  <option value="food" className="bg-[#111]">🍽 Plats</option>
                  <option value="drink" className="bg-[#111]">🍹 Boissons</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40">Position (ordre d&apos;affichage)</label>
                <input
                  type="number"
                  min={0}
                  value={menuCatForm.position ?? 0}
                  onChange={(e) => setMenuCatForm((p) => ({ ...p, position: Number(e.target.value) }))}
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              {menuCatModal === 'create' && (
                <p className="text-[10px] text-white/25">
                  L&apos;identifiant (id) sera généré automatiquement depuis le nom FR.
                </p>
              )}
              {menuCatModal === 'edit' && editingMenuCat && (
                <p className="text-[10px] text-white/25">
                  id: <span className="font-mono">{editingMenuCat.id}</span>
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={savingMenuCat}
                onClick={closeMenuCatModal}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:text-tc-cream disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={savingMenuCat || !menuCatForm.label_fr?.trim()}
                onClick={() => void saveMenuCategory()}
                className="flex-1 rounded-full bg-tc-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-50"
              >
                {savingMenuCat ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {menuModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={closeMenuModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 font-medium text-tc-cream">
              {menuModal === 'create' ? 'Créer un plat' : 'Modifier le plat'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40">Nom FR *</label>
                <input
                  type="text"
                  value={menuForm.name_fr ?? ''}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, name_fr: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Nom EN</label>
                <input
                  type="text"
                  value={menuForm.name_en ?? ''}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, name_en: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Description FR</label>
                <textarea
                  rows={2}
                  value={menuForm.desc_fr ?? ''}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, desc_fr: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1 resize-none')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Prix (FCFA) *</label>
                <input
                  type="number"
                  min={0}
                  value={menuForm.price ?? ''}
                  onChange={(e) =>
                    setMenuForm((prev) => ({
                      ...prev,
                      price: e.target.value ? Number(e.target.value) : 0,
                    }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Catégorie *</label>
                <select
                  value={menuForm.category ?? 'plats-locaux'}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                >
                  {sortedActiveCats.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#111]">
                      {cat.label_fr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs text-white/40">Photo</p>
                {menuImagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={menuImagePreview}
                    alt=""
                    className="mb-2 h-32 w-full rounded-xl object-cover"
                  />
                ) : menuForm.image ? (
                  <div className="relative mb-2 h-32 w-full overflow-hidden rounded-xl">
                    <Image
                      src={menuForm.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="512px"
                    />
                  </div>
                ) : null}
                <input
                  ref={menuImgRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (menuImagePreview?.startsWith('blob:')) {
                      URL.revokeObjectURL(menuImagePreview)
                    }
                    setMenuImageFile(file)
                    setMenuImagePreview(URL.createObjectURL(file))
                  }}
                />
                <button
                  type="button"
                  onClick={() => menuImgRef.current?.click()}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:border-tc-gold/40 hover:text-tc-cream"
                >
                  Changer la photo
                </button>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={menuForm.is_visible ?? true}
                    onChange={(e) =>
                      setMenuForm((prev) => ({
                        ...prev,
                        is_visible: e.target.checked,
                      }))
                    }
                    className="accent-tc-gold"
                  />
                  Visible
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={menuForm.is_popular ?? false}
                    onChange={(e) =>
                      setMenuForm((prev) => ({
                        ...prev,
                        is_popular: e.target.checked,
                      }))
                    }
                    className="accent-tc-gold"
                  />
                  Populaire
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={savingItem}
                onClick={closeMenuModal}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:text-tc-cream disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={savingItem || !menuForm.name_fr?.trim()}
                onClick={() => void saveMenuItem()}
                className="flex-1 rounded-full bg-tc-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-50"
              >
                {savingItem ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {livreurModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={closeLivreurModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 font-medium text-tc-cream">
              {livreurModal === 'create' ? 'Ajouter un livreur' : 'Modifier le livreur'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40">Nom *</label>
                <input
                  type="text"
                  value={livreurForm.nom ?? ''}
                  onChange={(e) =>
                    setLivreurForm((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Téléphone *</label>
                <input
                  type="tel"
                  value={livreurForm.telephone ?? ''}
                  onChange={(e) =>
                    setLivreurForm((prev) => ({ ...prev, telephone: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Immatriculation moto *</label>
                <input
                  type="text"
                  value={livreurForm.moto_immatriculation ?? ''}
                  onChange={(e) =>
                    setLivreurForm((prev) => ({
                      ...prev,
                      moto_immatriculation: e.target.value.toUpperCase(),
                    }))
                  }
                  className={cn(
                    FORM_INPUT_CLASS,
                    'mt-1 font-mono uppercase tracking-wider',
                  )}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Modèle moto</label>
                <input
                  type="text"
                  value={livreurForm.moto_modele ?? ''}
                  onChange={(e) =>
                    setLivreurForm((prev) => ({ ...prev, moto_modele: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <p className="mb-2 text-xs text-white/40">Photo</p>
                {livreurPhotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={livreurPhotoPreview}
                    alt=""
                    className="mb-2 h-32 w-32 rounded-full object-cover"
                  />
                ) : livreurForm.photo_url ? (
                  <div className="relative mb-2 h-32 w-32 overflow-hidden rounded-full">
                    <Image
                      src={livreurForm.photo_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                ) : null}
                <input
                  ref={livreurPhotoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (livreurPhotoPreview?.startsWith('blob:')) {
                      URL.revokeObjectURL(livreurPhotoPreview)
                    }
                    setLivreurPhotoFile(file)
                    setLivreurPhotoPreview(URL.createObjectURL(file))
                  }}
                />
                <button
                  type="button"
                  onClick={() => livreurPhotoRef.current?.click()}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:border-tc-gold/40 hover:text-tc-cream"
                >
                  Changer la photo
                </button>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={livreurForm.disponible ?? true}
                    onChange={(e) =>
                      setLivreurForm((prev) => ({
                        ...prev,
                        disponible: e.target.checked,
                      }))
                    }
                    className="accent-tc-gold"
                  />
                  Disponible
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={livreurForm.actif ?? true}
                    onChange={(e) =>
                      setLivreurForm((prev) => ({
                        ...prev,
                        actif: e.target.checked,
                      }))
                    }
                    className="accent-tc-gold"
                  />
                  Actif
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={savingLivreur}
                onClick={closeLivreurModal}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:text-tc-cream disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={
                  savingLivreur ||
                  !livreurForm.nom?.trim() ||
                  !livreurForm.telephone?.trim() ||
                  !livreurForm.moto_immatriculation?.trim()
                }
                onClick={() => void saveLivreur()}
                className="flex-1 rounded-full bg-tc-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-50"
              >
                {savingLivreur ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {eventModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={closeEventModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 font-medium text-tc-cream">
              {eventModal === 'create'
                ? 'Créer un événement'
                : 'Modifier l\'événement'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-white/40">Titre *</label>
                <input
                  type="text"
                  value={eventForm.titre ?? ''}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, titre: e.target.value }))
                  }
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/40">Description</label>
                <textarea
                  rows={3}
                  value={eventForm.description ?? ''}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'resize-none')}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/40">Type</label>
                <select
                  value={eventForm.type ?? 'special'}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      type: e.target.value as EventType,
                      custom_type:
                        e.target.value === 'autres' ? prev.custom_type : undefined,
                    }))
                  }
                  className={FORM_INPUT_CLASS}
                >
                  {EVENT_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-[#111]">
                      {EVENT_TYPE_STYLES[t].label}
                    </option>
                  ))}
                </select>
                {eventForm.type === 'autres' ? (
                  <input
                    type="text"
                    value={eventForm.custom_type ?? ''}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        custom_type: e.target.value,
                      }))
                    }
                    placeholder="Ex. Concert, DJ Set, Soirée privée…"
                    className={cn(FORM_INPUT_CLASS, 'mt-2')}
                  />
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/40">
                  Date de l&apos;événement *
                </label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(eventForm.date_event)}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      date_event: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : '',
                    }))
                  }
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/40">Date de fin</label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(eventForm.date_end)}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      date_end: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    }))
                  }
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/40">
                  Deadline réservation
                </label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(eventForm.deadline_reservation)}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      deadline_reservation: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    }))
                  }
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-white/40">Nombre de places</label>
                <input
                  type="number"
                  min={0}
                  value={eventForm.places_total ?? ''}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      places_total: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <ToggleSwitch
                  checked={eventForm.is_featured ?? false}
                  onChange={(v) =>
                    setEventForm((prev) => ({ ...prev, is_featured: v }))
                  }
                  label="Mettre en vedette"
                />
                <ToggleSwitch
                  checked={eventForm.is_visible ?? true}
                  onChange={(v) =>
                    setEventForm((prev) => ({ ...prev, is_visible: v }))
                  }
                  label="Publié"
                />
              </div>

              <div>
                <p className="mb-2 text-xs text-white/40">Flyers</p>
                {pendingExistingFlyers.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {pendingExistingFlyers.map((url, idx) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-20 w-16 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPendingExistingFlyers((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-xs text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {newFlyerPreviews.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {newFlyerPreviews.map((url, idx) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-20 w-16 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFlyerFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-xs text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <input
                  ref={flyerInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    if (files.length) setFlyerFiles((prev) => [...prev, ...files])
                    if (flyerInputRef.current) flyerInputRef.current.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => flyerInputRef.current?.click()}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:border-tc-gold/40 hover:text-tc-cream"
                >
                  Ajouter des flyers
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={savingEvent}
                onClick={closeEventModal}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:text-tc-cream disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={
                  savingEvent ||
                  !eventForm.titre?.trim() ||
                  !eventForm.date_event ||
                  (eventForm.type === 'autres' && !eventForm.custom_type?.trim())
                }
                onClick={() => void saveEvent()}
                className="flex-1 rounded-full bg-tc-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-50"
              >
                {savingEvent ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
