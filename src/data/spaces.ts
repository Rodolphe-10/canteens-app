import type { SpaceConfig } from '@/components/restauration/SpacePage'
import { mediaUrls } from '@/lib/media'

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
  ambianceFr: [
    'Le soir, les lanternes rouges et le damier noir et blanc créent une atmosphère théâtrale unique au cœur de Yaoundé.',
    'Nappes immaculées, vaisselle soignée et service attentif : chaque détail est pensé pour une expérience gastronomique complète.',
    'Dîner romantique, anniversaire ou réunion en groupe — la salle s\'adapte à votre moment, jusqu\'aux premières lueurs du matin.',
  ],
  ambianceEn: [
    'In the evening, red lanterns and the black-and-white checkerboard floor create a theatrical atmosphere unique in Yaoundé.',
    'Immaculate tablecloths, refined tableware and attentive service — every detail is designed for a complete dining experience.',
    'Romantic dinner, birthday or group gathering — the room adapts to your occasion, until the first light of dawn.',
  ],
  featuresFr: [
    '80 couverts en salle',
    'Cuisine gastronomique',
    'Cuisine européenne & locale',
    'Carte des vins sélectionnée',
    'Ambiance feutrée le soir',
    'Événements & privatisation',
    "Ouvert jusqu'à 2H30 (lun–jeu & dim), 4H (ven–sam)",
    'Réservation recommandée',
  ],
  featuresEn: [
    '80 seats',
    'Gourmet cuisine',
    'European & local cooking',
    'Curated wine list',
    'Intimate evening atmosphere',
    'Events & private hire',
    'Open until 2:30 AM (Mon–Thu & Sun), 4 AM (Fri–Sat)',
    'Reservation recommended',
  ],
  images: [mediaUrls.restaurant.restaurant],
  reservationSlug: 'restaurant',
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
  ambianceFr: [
    'La lumière tamisée et le plafond en bulles transforment chaque visite en parenthèse hors du temps, entre velours bleu nuit et touches dorées.',
    'Au bar en marbre noir, les cocktails signature et la sélection spiritueuse alimentent les conversations jusqu\'au petit matin.',
    'Quand la nuit s\'installe vraiment, le DJ booth et l\'écran géant réveillent l\'espace pour des soirées mémorables.',
  ],
  ambianceEn: [
    'Soft lighting and the bubble ceiling turn every visit into a timeless escape, between navy velvet and golden accents.',
    'At the black marble bar, signature cocktails and a curated spirits selection keep conversations going until dawn.',
    'When night truly sets in, the DJ booth and giant screen bring the space to life for unforgettable evenings.',
  ],
  featuresFr: [
    'Bar en marbre noir',
    'DJ booth Pioneer',
    'Canapés velours premium',
    'Cocktails signature',
    'Écran TV grand format',
    'Soirées DJ & karaoké',
    'Ambiance lounge luxueuse',
    "Ouvert jusqu'à 2H30 (lun–jeu & dim), 4H (ven–sam)",
  ],
  featuresEn: [
    'Black marble bar',
    'Pioneer DJ booth',
    'Premium velvet sofas',
    'Signature cocktails',
    'Large format TV screen',
    'DJ nights & karaoke',
    'Luxurious lounge atmosphere',
    'Open until 2:30 AM (Mon–Thu & Sun), 4 AM (Fri–Sat)',
  ],
  images: [
    mediaUrls.lounge.lounge1,
    mediaUrls.lounge.lounge2,
    mediaUrls.lounge.photoBar1,
    mediaUrls.lounge.photoBar2,
    mediaUrls.lounge.photoBar3,
  ],
  reservationSlug: 'lounge',
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
  ambianceFr: [
    'L\'animation de la rue Dragage devient le décor naturel de vos déjeuners, brunchs et apéritifs en début de soirée.',
    'Les grandes baies laissent passer la brise tout en vous protégeant — un vrai salon en plein air, couvert et ventilé.',
    'Le matin pour le brunch, l\'après-midi pour un déjeuner décontracté, le soir pour l\'afterwork : la terrasse suit le rythme du quartier.',
  ],
  ambianceEn: [
    'The bustle of Dragage street becomes the natural backdrop for your lunches, brunches and early evening aperitifs.',
    'Large bay windows let in the breeze while keeping you sheltered — a true open-air lounge, covered and ventilated.',
    'Morning brunch, casual afternoon lunch or afterwork drinks — the terrace follows the neighborhood\'s rhythm.',
  ],
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
    mediaUrls.terrasse.terrasse1,
    mediaUrls.terrasse.terrasse2,
    mediaUrls.terrasse.terrasse3,
  ],
  reservationSlug: 'terrasse',
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
