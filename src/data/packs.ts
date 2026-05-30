export interface Pack {
  id: string
  name: string
  subtitle: string
  description: string
  price?: number
  priceLabel?: string
  schedule: string
  color: 'restaurant' | 'game' | 'mixed'
  highlights: string[]
  badge?: string
}

export const packs: Pack[] = [
  {
    id: 'friday-afterwork',
    name: 'Friday After Work',
    subtitle: 'Game Night',
    description:
      'Finis le boulot et lance la partie. Tous les vendredis dès 18h avec des tarifs spéciaux.',
    schedule: 'Tous les vendredis dès 18H',
    color: 'game',
    badge: 'VENDREDI',
    highlights: [
      'Billard à 1 000F',
      'Fléchettes à 1 000F',
      'Boxer à 500F/3 coups',
      'Simulateur à 2 000F',
      'VR à 2 000F',
      'Baby-foot à 500F',
      'Flipper à 1 000F',
    ],
  },
  {
    id: 'sunday-brunch-game',
    name: 'Dimanche',
    subtitle: 'Brunch + Game Room',
    description:
      'Le dimanche, on brunche et on joue ! Accès 1 heure à la salle de jeux.',
    price: 5000,
    priceLabel: '5 000F / personne / heure',
    schedule: 'Tous les dimanches',
    color: 'mixed',
    badge: 'DIMANCHE',
    highlights: [
      'Accès 1H à la salle',
      'Réalité Virtuelle incluse',
      'Billard inclus',
      'Baby-foot inclus',
      'Ambiance fun & chill',
    ],
  },
  {
    id: 'sunday-brunch-resto',
    name: 'Brunch du Dimanche',
    subtitle: 'Buffet Premium',
    description:
      'Un voyage gourmand entre terroir et raffinement. Karaoké, live music, ambiance lounge.',
    price: 10000,
    priceLabel: 'Buffet à volonté — 10 000 FCFA',
    schedule: 'Tous les dimanches à partir de 12H',
    color: 'restaurant',
    badge: 'DIMANCHE',
    highlights: [
      'Finger food à volonté',
      'Plats chauds (Ndolè, Gombo crabes...)',
      'Salades variées',
      'Desserts maison',
      'Karaoké + Live Music',
    ],
  },
  {
    id: 'brunch-mystere',
    name: 'Brunch Mystère',
    subtitle: 'Laissez-vous surprendre',
    description:
      "Un menu surprise. Des saveurs inattendues. Une expérience signée The Canteen's.",
    schedule: 'Tous les dimanches à partir de 12H',
    color: 'restaurant',
    badge: '?',
    highlights: [
      'Menu 100% surprise',
      'Saveurs inattendues',
      'Expérience exclusive',
      'Réservation conseillée',
    ],
  },
]
