import type { SpaceConfig } from '@/components/restauration/SpacePage'

export const restaurantConfig: SpaceConfig = {
  id: 'restaurant',
  nameFr: 'Le Restaurant',
  nameEn: 'The Restaurant',
  taglineFr: 'Gastronomie & Élégance',
  taglineEn: 'Gastronomy & Elegance',
  descriptionFr:
    "Un écrin noir et blanc, sol damier, nappes immaculées, lanternes rouges… Le restaurant The Canteen's propose une cuisine gastronomique entre terroir camerounais, saveurs européennes et touches orientales. Une adresse incontournable pour les amateurs de bonne table à Yaoundé.",
  descriptionEn:
    "A black and white setting, checkered floor, immaculate tablecloths, red lanterns… The Canteen's restaurant offers gourmet cuisine blending Cameroonian heritage, European flavors and Oriental touches. A must-visit address for food lovers in Yaoundé.",
  featuresFr: [
    '80 couverts en salle',
    'Cuisine gastronomique',
    'Cuisine européenne & locale',
    'Carte des vins sélectionnée',
    'Ambiance feutrée le soir',
    'Événements & privatisation',
    "Ouvert jusqu'à 6H du matin",
    'Réservation recommandée',
  ],
  featuresEn: [
    '80 seats',
    'Gourmet cuisine',
    'European & local cooking',
    'Curated wine list',
    'Intimate evening atmosphere',
    'Events & private hire',
    'Open until 6AM',
    'Reservation recommended',
  ],
  images: ['/images/restaurant/restaurant.jpg'],
  fallbackGradient: 'from-red-950 via-neutral-900 to-tc-black',
  accentColor: 'text-red-400',
  borderColor: 'border-red-500/30',
  badgeColor: 'bg-red-500',
  nextSpace: {
    hrefSuffix: 'lounge',
    labelFr: 'Le Lounge',
    labelEn: 'The Lounge',
  },
}

export const loungeConfig: SpaceConfig = {
  id: 'lounge',
  nameFr: 'Le Lounge',
  nameEn: 'The Lounge',
  taglineFr: 'Cocktails & Ambiance',
  taglineEn: 'Cocktails & Atmosphere',
  descriptionFr:
    "Canapés bleu nuit et émeraude, coussins dorés, plafond sculpté en bulles blanches, bar en marbre noir impressionnant… Le Lounge The Canteen's est l'espace de la détente absolue. DJ booth, écran géant, cocktails signature — l'endroit parfait pour terminer la soirée ou démarrer la nuit.",
  descriptionEn:
    "Navy and emerald sofas, golden cushions, sculptured white bubble ceiling, impressive black marble bar… The Canteen's Lounge is the ultimate relaxation space. DJ booth, giant screen, signature cocktails — the perfect place to end the evening or start the night.",
  featuresFr: [
    'Bar en marbre noir',
    'DJ booth Pioneer',
    'Canapés velours premium',
    'Cocktails signature',
    'Écran TV grand format',
    'Soirées DJ & karaoké',
    'Ambiance lounge luxueuse',
    "Ouvert jusqu'à 6H du matin",
  ],
  featuresEn: [
    'Black marble bar',
    'Pioneer DJ booth',
    'Premium velvet sofas',
    'Signature cocktails',
    'Large format TV screen',
    'DJ nights & karaoke',
    'Luxurious lounge atmosphere',
    'Open until 6AM',
  ],
  images: [
    '/images/lounge/lounge1.jpg',
    '/images/lounge/lounge2.jpg',
    '/images/lounge/photo_bar1.jpg',
    '/images/lounge/photo_bar2.jpg',
    '/images/lounge/photo_bar3.jpg',
  ],
  fallbackGradient: 'from-tc-navy via-slate-900 to-tc-black',
  accentColor: 'text-tc-gold',
  borderColor: 'border-tc-gold/30',
  badgeColor: 'bg-tc-gold',
  prevSpace: {
    hrefSuffix: 'restaurant',
    labelFr: 'Le Restaurant',
    labelEn: 'The Restaurant',
  },
  nextSpace: {
    hrefSuffix: 'terrasse',
    labelFr: 'La Terrasse',
    labelEn: 'The Terrace',
  },
}

export const terrasseConfig: SpaceConfig = {
  id: 'terrasse',
  nameFr: 'La Terrasse',
  nameEn: 'The Terrace',
  taglineFr: 'En plein air, à Dragage',
  taglineEn: 'Open air, in Dragage',
  descriptionFr:
    "Longue galerie couverte ouverte sur la rue de Dragage, avec ses grandes baies vitrées et son plafond industriel. La terrasse The Canteen's offre une vue directe sur l'animation du quartier. Tables noires, mobilier sobre, lanternes suspendues — l'endroit idéal pour un déjeuner décontracté ou un apéritif en début de soirée.",
  descriptionEn:
    "Long covered gallery open to Dragage street, with large glass bays and industrial ceiling. The Canteen's terrace offers a direct view on the neighborhood's life. Black tables, simple furniture, hanging lanterns — the ideal spot for a casual lunch or early evening aperitif.",
  featuresFr: [
    'Vue sur la rue Dragage',
    'Grandes baies vitrées',
    'Espace couvert & ventilé',
    'Idéal pour le brunch',
    'Ambiance décontractée',
    "Parfait pour l'afterwork",
    'Accès direct depuis la rue',
    'Disponible en privatisation',
  ],
  featuresEn: [
    'View over Dragage street',
    'Large glass bay windows',
    'Covered & ventilated space',
    'Ideal for brunch',
    'Relaxed atmosphere',
    'Perfect for afterwork',
    'Direct street access',
    'Available for private hire',
  ],
  images: [
    '/images/terrasse/terrasse1.jpg',
    '/images/terrasse/terrasse2.jpg',
    '/images/terrasse/terrasse3.jpg',
  ],
  fallbackGradient: 'from-stone-800 via-neutral-900 to-tc-black',
  accentColor: 'text-amber-400',
  borderColor: 'border-amber-500/30',
  badgeColor: 'bg-amber-500',
  prevSpace: {
    hrefSuffix: 'lounge',
    labelFr: 'Le Lounge',
    labelEn: 'The Lounge',
  },
}
