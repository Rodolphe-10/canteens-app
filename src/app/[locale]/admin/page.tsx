'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import { menuCategories } from '@/data/menu'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const ROLES = {
  admin: { pin: '2024', label: 'Administrateur', color: 'text-tc-gold' },
  chef: { pin: '5678', label: 'Chef de Salle', color: 'text-blue-400' },
  cm: { pin: '1919', label: 'Community Manager', color: 'text-purple-400' },
} as const

type Role = keyof typeof ROLES
const ACCESS_KEY = 'tc_staff_auth_role'

type Tab = 'reservations' | 'orders' | 'events' | 'menu' | 'games' | 'galleries'

const TAB_LABELS: Record<Tab, string> = {
  reservations: 'Réservations',
  orders: 'Commandes',
  events: 'Événements',
  menu: 'Menu',
  games: 'Jeux',
  galleries: 'Galeries',
}

const AVAILABLE_TABS: Record<Role, Tab[]> = {
  admin: ['reservations', 'orders', 'events', 'menu', 'games', 'galleries'],
  chef: ['reservations', 'orders', 'menu'],
  cm: ['events', 'galleries'],
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
  return 'reservations'
}

function isRole(value: string | null): value is Role {
  return value === 'admin' || value === 'chef' || value === 'cm'
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

type EventType = 'showcase' | 'anniversaire' | 'brunch' | 'sport' | 'special'

type EventRow = {
  id: string
  titre: string
  description?: string
  type: EventType
  date_event: string
  date_end?: string
  deadline_reservation?: string
  places_total?: number
  places_reserved: number
  flyers: string[]
  is_featured: boolean
  is_visible: boolean
}

type EventForm = Omit<EventRow, 'id' | 'places_reserved' | 'flyers'> & { flyers: File[] }

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
}

const EVENT_TYPE_OPTIONS: EventType[] = [
  'showcase',
  'anniversaire',
  'brunch',
  'sport',
  'special',
]

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
  const [role, setRole] = useState<Role | null>(null)
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
  const supabase = useMemo(() => createClient(), [])

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

  useEffect(() => {
    const stored = sessionStorage.getItem(ACCESS_KEY)
    if (isRole(stored)) {
      setRole(stored)
      setIsAuthed(true)
      setTab(getInitialTab(stored))
    }
  }, [])

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
    const { error: storageError } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: false, contentType: file.type })
    if (storageError) {
      alert(`Erreur upload : ${storageError.message}`)
      setUploadingGallery(false)
      return
    }
    const { data: u } = supabase.storage.from('media').getPublicUrl(path)
    const nextPos = galleryPhotos.length
    const { error } = await supabase.from('gallery_photos').insert({
      gallery_id: activeGallery,
      image_url: u.publicUrl,
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
        const { error: storageError } = await supabase.storage
          .from('media')
          .upload(path, gameImageFile, {
            upsert: false,
            contentType: gameImageFile.type,
          })
        if (storageError) {
          alert(`Erreur upload : ${storageError.message}`)
          return
        }
        const { data: u } = supabase.storage.from('media').getPublicUrl(path)
        imageUrl = u.publicUrl
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
        // Chemin unique avec timestamp pour éviter le cache CDN Supabase
        const path = `menu/${editingItem?.id ?? 'new'}-${Date.now()}.${ext}`
        const { error: storageError } = await supabase.storage
          .from('media')
          .upload(path, menuImageFile, {
            upsert: false,
            contentType: menuImageFile.type,
          })
        if (storageError) {
          alert(`Erreur upload image : ${storageError.message}`)
          return
        }
        const { data: u } = supabase.storage.from('media').getPublicUrl(path)
        imageUrl = u.publicUrl
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

  const uploadFlyer = useCallback(
    async (file: File, eventId: string, index: number): Promise<string> => {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `events/event_${eventId}_${index}.${ext}`
      const { error } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) {
        alert(`Erreur upload flyer : ${error.message}`)
        throw error
      }
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      return data.publicUrl
    },
    [supabase],
  )

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
    setEventForm({
      titre: event.titre,
      description: event.description ?? '',
      type: event.type,
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
        type: eventForm.type ?? 'special',
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

  const submitPin = useCallback((value: string) => {
    const matched = (
      Object.entries(ROLES) as [Role, (typeof ROLES)[Role]][]
    ).find(([, r]) => r.pin === value)

    if (matched) {
      const [matchedRole] = matched
      sessionStorage.setItem(ACCESS_KEY, matchedRole)
      setRole(matchedRole)
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
  }, [])

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
    setRole(null)
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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4">
        <p className="text-xs uppercase tracking-[0.4em] text-white/30">
          THE CANTEEN&apos;S
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.6em] text-tc-gold/50">
          STAFF LOGIN
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {(Object.values(ROLES) as (typeof ROLES)[Role][]).map((r) => (
            <span
              key={r.label}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-widest text-white/20"
            >
              {r.label}
            </span>
          ))}
        </div>

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
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-xs tracking-widest text-white/50">
            THE CANTEEN&apos;S · DASHBOARD
          </p>
          {role ? (
            <span className={cn('text-xs font-medium', ROLES[role].color)}>
              {ROLES[role].label}
            </span>
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
          tab === 'games' || tab === 'galleries' ? 'max-w-5xl' : 'max-w-3xl',
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
                  const typeStyle = EVENT_TYPE_STYLES[event.type] ?? EVENT_TYPE_STYLES.special
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
                              {typeStyle.label}
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
        ) : null}
      </div>

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
                  savingEvent || !eventForm.titre?.trim() || !eventForm.date_event
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
