'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Lock } from 'lucide-react'
import { mediaUrls } from '@/lib/media'
import { menuCategories } from '@/data/menu'
import Tooltip from '@/components/ui/Tooltip'
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
  client_nom: string
  client_telephone: string
  total: number
  mode_paiement: string
  statut: OrderStatus
  quartier: string
  created_at: string
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

const EVENT_TYPE_OPTIONS: EventType[] = [
  'showcase',
  'anniversaire',
  'brunch',
  'sport',
  'special',
  'live',
  'autres',
]

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
  const [menuCatFilter, setMenuCatFilter] = useState('all')
  const [menuModal, setMenuModal] = useState<'create' | 'edit' | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({})
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null)
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null)
  const [savingItem, setSavingItem] = useState(false)
  const menuImgRef = useRef<HTMLInputElement>(null)
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
  const [galleryUploadFile, setGalleryUploadFile] = useState<File | null>(null)
  const [uploadingGallery, setUploadingGallery] = useState(false)
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
  const [deliveryModal, setDeliveryModal] = useState(false)
  const [deliveryForm, setDeliveryForm] = useState<{
    client_nom: string
    client_telephone: string
    client_adresse: string
    livreur_id: string
  }>({ client_nom: '', client_telephone: '', client_adresse: '', livreur_id: '' })
  const [savingDelivery, setSavingDelivery] = useState(false)
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

  const menuUniqueCategories = useMemo(
    () => [...new Set(menuItems.map((i) => i.category))].sort(),
    [menuItems],
  )

  const adminMenuFiltered = useMemo(() => {
    const q = menuSearch.trim().toLowerCase()
    return menuItems
      .filter((i) => menuCatFilter === 'all' || i.category === menuCatFilter)
      .filter((i) => i.name_fr.toLowerCase().includes(q))
  }, [menuItems, menuCatFilter, menuSearch])

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
    const stored = sessionStorage.getItem(ACCESS_KEY)
    const storedNom = sessionStorage.getItem('tc_staff_nom')
    if (storedNom) setStaffNom(storedNom)
    if (isRole(stored)) {
      setRole(stored)
      setIsAuthed(true)
      setTab(getInitialTab(stored))
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
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    setOrders((data as OrderRow[]) ?? [])
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
      .order('category')
      .order('name_fr')
    setMenuItems((data as MenuItem[]) ?? [])
    setLoadingMenu(false)
  }, [supabase])

  useEffect(() => {
    if (tab === 'menu' && isAuthed) void fetchMenuItems()
  }, [tab, fetchMenuItems, isAuthed])

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

  useEffect(() => {
    if (!deliveryModal) return
    void (async () => {
      const { data } = await supabase
        .from('livreurs')
        .select('*')
        .eq('disponible', true)
        .eq('actif', true)
      setAvailableLivreurs((data as LivreurRow[]) ?? [])
    })()
  }, [deliveryModal, supabase])

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

  const uploadGalleryPhoto = async (file: File) => {
    if (!activeGallery) return
    setUploadingGallery(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `galleries/${activeGallery}/${Date.now()}.${ext}`
    let imageUrl: string
    try {
      imageUrl = await uploadToStorage(file, path)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur upload')
      setUploadingGallery(false)
      return
    }
    const nextPos = galleryPhotos.length
    const { error } = await supabase.from('gallery_photos').insert({
      gallery_id: activeGallery,
      image_url: imageUrl,
      position: nextPos,
    })
    if (error) {
      alert(`Erreur : ${error.message}`)
      setUploadingGallery(false)
      return
    }
    await fetchGalleryPhotos(activeGallery)
    setGalleryUploadFile(null)
    if (galleryFileRef.current) galleryFileRef.current.value = ''
    setUploadingGallery(false)
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
        const { error } = await supabase.from('livreurs').insert(payload)
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

  const createDelivery = async () => {
    if (!deliveryForm.client_nom.trim() || !deliveryForm.livreur_id) return
    setSavingDelivery(true)
    const { data, error } = await supabase
      .from('deliveries')
      .insert({
        client_nom: deliveryForm.client_nom,
        client_telephone: deliveryForm.client_telephone,
        client_adresse: deliveryForm.client_adresse,
        livreur_id: deliveryForm.livreur_id,
        statut: 'assignee',
      })
      .select()
      .single()
    if (error) {
      alert(`Erreur : ${error.message}`)
      setSavingDelivery(false)
      return
    }
    const delivery = data as DeliveryRow
    const trackingUrl = `${window.location.origin}/suivi/${delivery.lien_suivi}`
    const driverUrl = `${window.location.origin}/livreur/${delivery.id}`
    alert(
      `✅ Livraison créée !\n\nLien livreur :\n${driverUrl}\n\nLien suivi client :\n${trackingUrl}`,
    )
    await fetchDeliveries()
    setDeliveryModal(false)
    setDeliveryForm({
      client_nom: '',
      client_telephone: '',
      client_adresse: '',
      livreur_id: '',
    })
    setSavingDelivery(false)
  }

  const updateDeliveryStatus = async (
    id: string,
    statut: DeliveryRow['statut'],
  ) => {
    const updates: Record<string, unknown> = { statut }
    if (statut === 'livree') updates.delivered_at = new Date().toISOString()
    await supabase.from('deliveries').update(updates).eq('id', id)
    await fetchDeliveries()
  }

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

  const openCreateMenuItem = () => {
    setEditingItem(null)
    setMenuForm({ is_visible: true, is_popular: false, category: 'plats-locaux' })
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
      setTab(getInitialTab(matchedRole))
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
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#0A0A0A] px-4">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-xs tracking-widest text-white/50">
            THE CANTEEN&apos;S · DASHBOARD
          </p>
          {role ? (
            <div className="flex flex-col">
              <span className={cn('text-xs font-medium', ROLE_STYLES[role ?? 'cm'].color)}>
                {staffNom || ROLE_STYLES[role ?? 'cm'].label}
              </span>
              <span className="text-[10px] text-white/25">{ROLE_STYLES[role ?? 'cm'].label}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs tabular-nums text-white/40">{clock}</span>
          <Tooltip text="Se déconnecter" position="bottom">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-white/30 transition-colors hover:text-red-400"
            >
              ⏻ Déconnexion
            </button>
          </Tooltip>
        </div>
      </header>

      <nav className="sticky top-14 z-20 flex gap-8 overflow-x-auto border-b border-white/[0.07] bg-[#0A0A0A] px-4">
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
            <div className="space-y-4">
              {reservations.map((r) => {
                const statusConfig = {
                  nouveau: {
                    color: 'border-amber-500/40 bg-amber-500/5',
                    badge:
                      'bg-amber-500/20 text-amber-400 border-amber-500/30',
                    label: 'Nouveau',
                  },
                  confirme: {
                    color: 'border-emerald-500/40 bg-emerald-500/5',
                    badge:
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
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
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
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
                      <span className="shrink-0 text-[10px] text-white/25">
                        {timeLabel}
                      </span>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                          Date
                        </p>
                        <p className="text-sm font-medium text-tc-cream">
                          {r.date_souhaitee}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/[0.04] p-3 text-center">
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                          Heure
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
                    ) : null}
                  </article>
                )
              })}
            </div>
          )
        ) : tab === 'orders' ? (
          loadingOrders ? (
            <p className="text-center text-sm text-white/30">Chargement…</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-sm text-white/30">Aucune commande.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => {
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

                return (
                  <article
                    key={o.id}
                    className={cn(
                      'rounded-2xl border p-5 transition-all',
                      statusColors[o.statut],
                    )}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 font-mono text-xs text-white/30">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </p>
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
                        <p className="mt-1 text-[10px] text-white/25">{timeLabel}</p>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/60">
                        📍 {o.quartier}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/60">
                        💳 {o.mode_paiement}
                      </span>
                    </div>

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
                  </article>
                )
              })}
            </div>
          )
        ) : tab === 'menu' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium text-tc-cream">Gestion du Menu</h2>
              <button
                type="button"
                onClick={openCreateMenuItem}
                className="rounded-full border border-tc-gold/40 px-4 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10"
              >
                + Ajouter un plat
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
                <option value="all" className="bg-[#111]">
                  Toutes
                </option>
                {menuUniqueCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#111]">
                    {menuCategories.find((c) => c.id === cat)?.labelFr ?? cat}
                  </option>
                ))}
              </select>
            </div>

            {loadingMenu ? (
              <p className="text-center text-sm text-white/30">Chargement…</p>
            ) : adminMenuFiltered.length === 0 ? (
              <p className="text-center text-sm text-white/30">Aucun plat trouvé.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {adminMenuFiltered.map((item) => {
                  const catLabel =
                    menuCategories.find((c) => c.id === item.category)?.labelFr ??
                    item.category
                  return (
                    <article
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
                    >
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg bg-white/5 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] text-white/25">
                          —
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-tc-cream">{item.name_fr}</p>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">
                          {catLabel}
                        </p>
                        <p className="text-sm text-tc-gold">{formatAmount(item.price)}</p>
                        {item.desc_fr ? (
                          <p className="line-clamp-1 text-[10px] text-white/25">
                            {item.desc_fr}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <ToggleSwitch
                            checked={item.is_visible}
                            onChange={(v) => void toggleMenuItem(item.id, 'is_visible', v)}
                            label="Visible"
                          />
                          <ToggleSwitch
                            checked={item.is_popular}
                            onChange={(v) => void toggleMenuItem(item.id, 'is_popular', v)}
                            label="★"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Tooltip text="Modifier" position="top">
                            <button
                              type="button"
                              onClick={() => openEditMenuItem(item)}
                              className="text-white/40 transition hover:text-tc-gold"
                              aria-label="Modifier"
                            >
                              ✏️
                            </button>
                          </Tooltip>
                          <Tooltip text="Supprimer" position="top">
                            <button
                              type="button"
                              onClick={() => void deleteMenuItem(item.id)}
                              className="text-white/40 transition hover:text-red-400"
                              aria-label="Supprimer"
                            >
                              🗑️
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
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
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setGalleryUploadFile(f)
                      void uploadGalleryPhoto(f)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => galleryFileRef.current?.click()}
                  disabled={uploadingGallery}
                  className="mt-4 rounded-full border border-tc-gold/40 px-4 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10 disabled:opacity-50"
                >
                  {uploadingGallery ? 'Envoi…' : '+ Ajouter une photo'}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium text-tc-cream">Livraisons</h2>
              <button
                type="button"
                onClick={() => setDeliveryModal(true)}
                className="rounded-full border border-tc-gold/40 px-4 py-2 text-xs text-tc-gold transition hover:bg-tc-gold/10"
              >
                + Nouvelle livraison
              </button>
            </div>

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
                  {deliveries.filter((d) => d.statut === 'livree').length}
                </p>
                <p className="text-[10px] uppercase text-white/30">Livrées</p>
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
                            {d.client_nom}
                            {d.client_telephone ? ` · ${d.client_telephone}` : ''}
                          </p>
                          {d.client_adresse ? (
                            <p className="text-xs text-white/30">{d.client_adresse}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                        {d.statut === 'assignee' ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                void updateDeliveryStatus(d.id, 'en_route')
                              }
                              className="rounded-full border border-blue-400/30 px-3 py-1 text-xs text-blue-400 transition hover:bg-blue-500/10"
                            >
                              🛵 En route
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void updateDeliveryStatus(d.id, 'annulee')
                              }
                              className="rounded-full border border-red-400/20 px-3 py-1 text-xs text-red-400/70 transition hover:bg-red-500/10"
                            >
                              Annuler
                            </button>
                          </>
                        ) : null}
                        {d.statut === 'en_route' ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                void updateDeliveryStatus(d.id, 'livree')
                              }
                              className="rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-400 transition hover:bg-emerald-500/10"
                            >
                              ✅ Livrée
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void updateDeliveryStatus(d.id, 'annulee')
                              }
                              className="rounded-full border border-red-400/20 px-3 py-1 text-xs text-red-400/70 transition hover:bg-red-500/10"
                            >
                              Annuler
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(
                              `${window.location.origin}/livreur/${d.id}`,
                            )
                          }
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40 transition hover:text-tc-gold"
                        >
                          📋 Lien livreur
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(
                              `${window.location.origin}/suivi/${d.lien_suivi}`,
                            )
                          }
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40 transition hover:text-tc-gold"
                        >
                          📍 Suivi client
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        ) : null}
      </div>

      {deliveryModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setDeliveryModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 font-medium text-tc-cream">Nouvelle livraison</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40">Nom client *</label>
                <input
                  type="text"
                  value={deliveryForm.client_nom}
                  onChange={(e) =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      client_nom: e.target.value,
                    }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Téléphone client</label>
                <input
                  type="tel"
                  value={deliveryForm.client_telephone}
                  onChange={(e) =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      client_telephone: e.target.value,
                    }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Adresse / Quartier</label>
                <textarea
                  rows={2}
                  value={deliveryForm.client_adresse}
                  onChange={(e) =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      client_adresse: e.target.value,
                    }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1 resize-none')}
                />
              </div>
              <div>
                <label className="text-xs text-white/40">Livreur *</label>
                <select
                  value={deliveryForm.livreur_id}
                  onChange={(e) =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      livreur_id: e.target.value,
                    }))
                  }
                  className={cn(FORM_INPUT_CLASS, 'mt-1')}
                >
                  <option value="" className="bg-[#111]">
                    Choisir un livreur…
                  </option>
                  {availableLivreurs.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#111]">
                        {l.nom} — {l.moto_immatriculation}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={savingDelivery}
                onClick={() => setDeliveryModal(false)}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs text-white/50 transition hover:text-tc-cream disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={
                  savingDelivery ||
                  !deliveryForm.client_nom.trim() ||
                  !deliveryForm.livreur_id
                }
                onClick={() => void createDelivery()}
                className="flex-1 rounded-full bg-tc-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-50"
              >
                {savingDelivery ? 'Création…' : 'Créer la livraison'}
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
                  {menuCategories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#111]">
                      {cat.labelFr}
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
