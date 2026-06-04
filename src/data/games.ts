export interface Game {
  id: string
  name: string
  description: string
  prices: { label: string; amount: number }[]
  image?: string
  category: 'vr' | 'arcade' | 'sport' | 'simulation'
  isHighlight?: boolean
}

export const games: Game[] = [
  {
    id: 'billard',
    name: 'Billard',
    description: 'Table de billard professionnelle',
    prices: [{ label: 'La partie', amount: 2500 }],
    image: '/games/billard.jpg',
    category: 'sport',
  },
  {
    id: 'vr-power',
    name: 'VR Power',
    description: 'Capsules de réalité virtuelle immersive',
    prices: [
      { label: '3-6 min', amount: 1500 },
      { label: '7-9 min', amount: 3000 },
    ],
    image: '/games/vr-power.jpg',
    category: 'vr',
    isHighlight: true,
  },
  {
    id: 'vr-infinite-battle',
    name: 'VR Infinite Battle',
    description: 'Combat en réalité virtuelle sur écran géant',
    prices: [
      { label: '10 min', amount: 3000 },
      { label: '15 min', amount: 5000 },
    ],
    image: '/games/vr-infinite-battle.jpg',
    category: 'vr',
    isHighlight: true,
  },
  {
    id: 'boxer',
    name: 'Boxer Game',
    description: 'Testez la puissance de votre coup de poing',
    prices: [{ label: '3 coups', amount: 1000 }],
    image: '/games/boxer-darts.jpg',
    category: 'arcade',
  },
  {
    id: 'darts',
    name: 'Fléchettes',
    description: 'Jeu de fléchettes électronique Zone Dart',
    prices: [{ label: 'La partie', amount: 1000 }],
    image: '/games/boxer-darts.jpg',
    category: 'arcade',
  },
  {
    id: 'energy-drink-buster',
    name: 'Energy Drink Buster',
    description: 'Testez votre force',
    prices: [
      { label: '3 coups', amount: 1000 },
      { label: '7 coups', amount: 2000 },
    ],
    image: '/games/energy-flipper.jpg',
    category: 'arcade',
  },
  {
    id: 'flipper',
    name: 'Flipper Star Wars',
    description: 'Flipper collector Star Wars',
    prices: [{ label: '1 jeton', amount: 1000 }],
    image: '/games/energy-flipper.jpg',
    category: 'arcade',
  },
  {
    id: 'big-buck-hunter',
    name: 'Big Buck Hunters',
    description: 'Jeu de tir arcade Big Buck Hunter Reloaded',
    prices: [
      { label: '1 jeton', amount: 1000 },
      { label: '2 jetons', amount: 2000 },
      { label: '3 jetons', amount: 2500 },
      { label: '4 jetons', amount: 3500 },
    ],
    image: '/games/big-buck-hunters.jpg',
    category: 'arcade',
  },
  {
    id: 'babyfoot',
    name: 'Baby-foot',
    description: 'Tables de baby-foot compétition',
    prices: [{ label: 'La partie', amount: 1000 }],
    image: '/games/babyfoot.jpg',
    category: 'sport',
  },
  {
    id: 'simulateur',
    name: 'Simulateur de Rallye',
    description: 'Simulateurs de course automobile',
    prices: [{ label: '10 min', amount: 2500 }],
    image: '/games/simulateur.jpg',
    category: 'simulation',
    isHighlight: true,
  },
]
