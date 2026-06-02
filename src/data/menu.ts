export type MenuCategory =
  | 'entrees'
  | 'salades'
  | 'viandes'
  | 'poissons'
  | 'burgers'
  | 'pizzas'
  | 'pates'
  | 'plats-locaux'
  | 'accompagnements'
  | 'desserts'
  | 'cocktails'
  | 'vins'
  | 'whiskies'
  | 'cognacs'
  | 'vodkas'
  | 'bieres'
  | 'softs'
  | 'brunch'
  | 'champagnes'
  | 'hookah'
  | 'shots'
  | 'sans-alcool'

export interface MenuItem {
  id: string
  nameFr: string
  nameEn?: string
  descFr?: string
  descEn?: string
  price: number
  category: MenuCategory
  isPopular?: boolean
  image?: string
  options?: { label: string; price: number }[]
}

export interface MenuCategoryDef {
  id: MenuCategory
  labelFr: string
  labelEn: string
  icon: string
  type: 'food' | 'drink'
}

export const menuCategories: MenuCategoryDef[] = [
  { id: 'entrees', labelFr: 'Entrées', labelEn: 'Starters', icon: '', type: 'food' },
  { id: 'salades', labelFr: 'Salades', labelEn: 'Salads', icon: '', type: 'food' },
  { id: 'viandes', labelFr: 'Viandes', labelEn: 'Meats', icon: '', type: 'food' },
  { id: 'poissons', labelFr: 'Poissons', labelEn: 'Fish', icon: '', type: 'food' },
  { id: 'burgers', labelFr: 'Burgers', labelEn: 'Burgers', icon: '', type: 'food' },
  { id: 'pizzas', labelFr: 'Pizzas', labelEn: 'Pizzas', icon: '', type: 'food' },
  { id: 'pates', labelFr: 'Pâtes', labelEn: 'Pasta', icon: '', type: 'food' },
  { id: 'plats-locaux', labelFr: 'Plats Locaux', labelEn: 'Local Dishes', icon: '', type: 'food' },
  { id: 'accompagnements', labelFr: 'Accompagnements', labelEn: 'Sides', icon: '', type: 'food' },
  { id: 'desserts', labelFr: 'Desserts', labelEn: 'Desserts', icon: '', type: 'food' },
  { id: 'cocktails', labelFr: 'Cocktails', labelEn: 'Cocktails', icon: '', type: 'drink' },
  { id: 'vins', labelFr: 'Vins', labelEn: 'Wines', icon: '', type: 'drink' },
  { id: 'whiskies', labelFr: 'Whiskies', labelEn: 'Whiskies', icon: '', type: 'drink' },
  { id: 'cognacs', labelFr: 'Cognacs', labelEn: 'Cognacs', icon: '', type: 'drink' },
  { id: 'vodkas', labelFr: 'Vodkas', labelEn: 'Vodkas', icon: '', type: 'drink' },
  { id: 'bieres', labelFr: 'Bières', labelEn: 'Beers', icon: '', type: 'drink' },
  { id: 'softs', labelFr: 'Softs & Jus', labelEn: 'Softs & Juices', icon: '', type: 'drink' },
  { id: 'brunch', labelFr: 'Brunch', labelEn: 'Brunch', icon: '', type: 'food' },
  { id: 'champagnes', labelFr: 'Champagnes', labelEn: 'Champagnes', icon: '', type: 'drink' },
  { id: 'hookah', labelFr: 'Chicha', labelEn: 'Hookah', icon: '', type: 'drink' },
  { id: 'shots', labelFr: 'Shots', labelEn: 'Shots', icon: '', type: 'drink' },
  { id: 'sans-alcool', labelFr: 'Sans Alcool', labelEn: 'Non-Alcoholic', icon: '', type: 'drink' },
]

export const menuItems: MenuItem[] = [
  {
    id: 'carpaccio',
    nameFr: 'Carpaccio de Bœuf',
    descFr:
      "Bœuf tranché finement, câpres, parmesan, huile d'olive",
    price: 11500,
    category: 'entrees',
    isPopular: true,
  },
  {
    id: 'nems',
    nameFr: 'Nems Croustillants',
    descFr: 'Nems maison, sauce aigre-douce',
    price: 6500,
    category: 'entrees',
  },
  {
    id: 'bruschetta',
    nameFr: 'Bruschetta',
    descFr: "Pain grillé, tomates fraîches, basilic, huile d'olive",
    price: 5500,
    category: 'entrees',
  },
  {
    id: 'foie-gras',
    nameFr: 'Foie Gras Maison',
    descFr: 'Foie gras mi-cuit, chutney de mangue, brioche toastée',
    price: 14500,
    category: 'entrees',
    isPopular: true,
  },

  {
    id: 'salade-cesar',
    nameFr: 'Salade César',
    descFr: 'Laitue romaine, poulet grillé, croûtons, parmesan, sauce César',
    price: 9000,
    category: 'salades',
    isPopular: true,
  },
  {
    id: 'salade-composee',
    nameFr: 'Salade Composée',
    descFr: 'Mélange de crudités, vinaigrette maison',
    price: 9000,
    category: 'salades',
  },
  {
    id: 'salade-sicilienne',
    nameFr: 'Salade Sicilienne',
    descFr: 'Thon, olives, tomates, œuf, anchois',
    price: 9000,
    category: 'salades',
  },
  {
    id: 'salade-chef',
    nameFr: 'Salade du Chef',
    descFr: 'Composition du jour selon les arrivages',
    price: 9500,
    category: 'salades',
  },

  {
    id: 'entrecote',
    nameFr: 'Entrecôte Maturée — The Famous',
    descFr:
      'Notre pièce signature. Entrecôte maturée 21 jours, grillée à la perfection, sauce au choix',
    price: 18000,
    category: 'viandes',
    isPopular: true,
  },
  {
    id: 'cote-boeuf',
    nameFr: 'Côte de Bœuf (à partager)',
    descFr: 'Grande pièce grillée, sauce béarnaise, gratin dauphinois',
    price: 28000,
    category: 'viandes',
  },
  {
    id: 'filet-boeuf',
    nameFr: 'Filet de Bœuf',
    descFr: 'Filet tendre, sauce au poivre ou roquefort',
    price: 16000,
    category: 'viandes',
  },
  {
    id: 'magret',
    nameFr: 'Magret de Canard',
    descFr: 'Magret rosé, sauce aux fruits rouges, légumes de saison',
    price: 14000,
    category: 'viandes',
  },
  {
    id: 'poulet-grille',
    nameFr: 'Poulet Grillé',
    descFr: 'Demi-poulet mariné, frites maison',
    price: 8500,
    category: 'viandes',
  },

  {
    id: 'poisson-braise',
    nameFr: 'Poisson Braisé',
    descFr: 'Poisson entier braisé au feu de bois, sauce tomate pimentée',
    price: 12000,
    category: 'poissons',
    isPopular: true,
  },
  {
    id: 'crevettes',
    nameFr: 'Crevettes Sautées',
    descFr: "Crevettes géantes à l'ail et au beurre, riz pilaf",
    price: 13500,
    category: 'poissons',
  },
  {
    id: 'saumon',
    nameFr: 'Pavé de Saumon',
    descFr: 'Saumon grillé, sauce vierge, légumes vapeur',
    price: 14000,
    category: 'poissons',
  },

  {
    id: 'burger-classic',
    nameFr: "The Canteen's Classic",
    descFr: 'Bœuf 180g, cheddar, laitue, tomate, cornichon, sauce maison',
    price: 6000,
    category: 'burgers',
  },
  {
    id: 'burger-bacon',
    nameFr: 'Bacon Lover',
    descFr: 'Double bœuf, bacon croustillant, cheddar fondu, oignons caramélisés',
    price: 7500,
    category: 'burgers',
    isPopular: true,
  },
  {
    id: 'burger-chicken',
    nameFr: 'Crispy Chicken',
    descFr: 'Poulet croustillant, coleslaw, sauce buffalo',
    price: 6500,
    category: 'burgers',
  },
  {
    id: 'burger-prestige',
    nameFr: 'Prestige Burger',
    descFr: 'Wagyu 200g, foie gras poêlé, truffe, sauce périgueux',
    price: 8000,
    category: 'burgers',
    isPopular: true,
  },

  {
    id: 'pizza-margherita',
    nameFr: 'Margherita',
    descFr: 'Sauce tomate, mozzarella, basilic frais',
    price: 8500,
    category: 'pizzas',
  },
  {
    id: 'pizza-4-fromages',
    nameFr: 'Quatre Fromages',
    descFr: 'Mozzarella, gorgonzola, chèvre, parmesan',
    price: 9500,
    category: 'pizzas',
    isPopular: true,
  },
  {
    id: 'pizza-royale',
    nameFr: 'Royale',
    descFr: 'Jambon, champignons, olives, mozzarella',
    price: 9000,
    category: 'pizzas',
  },
  {
    id: 'pizza-canteens',
    nameFr: "The Canteen's Special",
    descFr: 'Crevettes, avocat, sauce crémeuse, roquette',
    price: 10500,
    category: 'pizzas',
    isPopular: true,
  },

  {
    id: 'carbonara',
    nameFr: 'Carbonara',
    descFr: 'Spaghetti, lardons, œuf, parmesan, crème',
    price: 8000,
    category: 'pates',
  },
  {
    id: 'bolognaise',
    nameFr: 'Bolognaise',
    descFr: 'Tagliatelles, sauce bœuf mijotée',
    price: 7500,
    category: 'pates',
  },
  {
    id: 'pates-crevettes',
    nameFr: 'Penne aux Crevettes',
    descFr: 'Penne, crevettes, sauce tomate épicée, basilic',
    price: 9000,
    category: 'pates',
  },

  {
    id: 'ndole',
    nameFr: 'Ndolè Royal',
    descFr: 'Ndolè aux crevettes et viande, bâtons de manioc',
    price: 9000,
    category: 'plats-locaux',
    isPopular: true,
  },
  {
    id: 'gombo-crabes',
    nameFr: 'Gombo aux Crabes',
    descFr: 'Sauce gombo, crabes, riz blanc',
    price: 10000,
    category: 'plats-locaux',
    isPopular: true,
  },
  {
    id: 'poulet-moutarde',
    nameFr: 'Poulet à la Sauce Moutarde',
    descFr: 'Poulet en sauce moutarde crémeuse, accompagnement au choix',
    price: 9500,
    category: 'plats-locaux',
  },
  {
    id: 'blanquette-veau',
    nameFr: 'Blanquette de Veau',
    descFr: 'Veau mijoté à la crème, champignons, riz pilaf',
    price: 11000,
    category: 'plats-locaux',
  },

  { id: 'frites', nameFr: 'Frites Maison', price: 2000, category: 'accompagnements' },
  {
    id: 'frites-plantain',
    nameFr: 'Frites de Plantain',
    price: 2000,
    category: 'accompagnements',
  },
  {
    id: 'batons-manioc',
    nameFr: 'Bâtons de Manioc',
    price: 2000,
    category: 'accompagnements',
  },
  { id: 'riz', nameFr: 'Riz Pilaf', price: 2000, category: 'accompagnements' },
  { id: 'couscous', nameFr: 'Couscous', price: 2500, category: 'accompagnements' },

  {
    id: 'tiramisu',
    nameFr: 'Tiramisu Maison',
    descFr: 'Recette traditionnelle, mascarpone, biscuits café',
    price: 4500,
    category: 'desserts',
    isPopular: true,
  },
  {
    id: 'mi-cuit',
    nameFr: 'Mi-Cuit au Chocolat',
    descFr: 'Coulant chocolat noir, boule de glace vanille',
    price: 4500,
    category: 'desserts',
    isPopular: true,
  },
  {
    id: 'iles-flottantes',
    nameFr: 'Îles Flottantes',
    descFr: 'Blancs en neige, crème anglaise, caramel',
    price: 4000,
    category: 'desserts',
  },
  {
    id: 'fruits-frais',
    nameFr: 'Assortiment de Fruits Frais',
    descFr: 'Sélection de fruits de saison',
    price: 3500,
    category: 'desserts',
  },

  {
    id: 'mojito',
    nameFr: 'Mojito',
    descFr: 'Rhum blanc, citron vert, menthe, sucre de canne',
    price: 5000,
    category: 'cocktails',
    isPopular: true,
  },
  {
    id: 'cosmopolitan',
    nameFr: 'Cosmopolitan',
    descFr: 'Vodka, triple sec, jus de cranberry, citron vert',
    price: 5500,
    category: 'cocktails',
  },
  {
    id: 'signature-canteens',
    nameFr: "Signature Canteen's",
    descFr: 'Notre cocktail maison — une surprise',
    price: 6000,
    category: 'cocktails',
    isPopular: true,
  },
  {
    id: 'passion-fruit',
    nameFr: 'Passion Fruit Daiquiri',
    descFr: 'Rhum, fruit de la passion, citron, sucre',
    price: 5500,
    category: 'cocktails',
  },
  {
    id: 'sex-on-beach',
    nameFr: 'Sex on the Beach',
    descFr: "Vodka, pêche, jus d'orange, grenadine",
    price: 5000,
    category: 'cocktails',
  },

  { id: 'vin-rouge-verre', nameFr: 'Vin Rouge — Verre', price: 3500, category: 'vins' },
  { id: 'vin-blanc-verre', nameFr: 'Vin Blanc — Verre', price: 3500, category: 'vins' },
  { id: 'rose-verre', nameFr: 'Rosé — Verre', price: 3500, category: 'vins' },

  {
    id: 'johnnie-black',
    nameFr: 'Johnnie Walker Black',
    price: 5000,
    category: 'whiskies',
  },
  { id: 'jameson', nameFr: 'Jameson', price: 4500, category: 'whiskies' },
  {
    id: 'chivas',
    nameFr: 'Chivas Regal 12',
    price: 6000,
    category: 'whiskies',
    isPopular: true,
  },
  {
    id: 'jack-daniels',
    nameFr: "Jack Daniel's",
    price: 5000,
    category: 'whiskies',
  },

  {
    id: 'hennessy-vs',
    nameFr: 'Hennessy VS',
    price: 7000,
    category: 'cognacs',
    isPopular: true,
  },
  {
    id: 'remy-vsop',
    nameFr: 'Rémy Martin VSOP',
    price: 8000,
    category: 'cognacs',
  },

  {
    id: 'grey-goose',
    nameFr: 'Grey Goose',
    price: 5500,
    category: 'vodkas',
    isPopular: true,
  },
  { id: 'absolut', nameFr: 'Absolut', price: 4000, category: 'vodkas' },

  { id: '33-export', nameFr: '33 Export', price: 2000, category: 'bieres' },
  { id: 'castel', nameFr: 'Castel Bière', price: 2000, category: 'bieres' },
  { id: 'mutzig', nameFr: 'Mutzig', price: 2000, category: 'bieres' },
  { id: 'heineken', nameFr: 'Heineken', price: 2500, category: 'bieres' },
  { id: 'guinness', nameFr: 'Guinness', price: 3000, category: 'bieres' },

  {
    id: 'jus-frais',
    nameFr: 'Jus Frais du Jour',
    descFr: 'Gingembre, bissap, jus de fruits frais',
    price: 2000,
    category: 'softs',
    isPopular: true,
  },
  { id: 'eau-minerale', nameFr: 'Eau Minérale', price: 1000, category: 'softs' },
  { id: 'coca', nameFr: 'Coca-Cola', price: 1500, category: 'softs' },
  { id: 'malta', nameFr: 'Malta', price: 1500, category: 'softs' },

  {
    id: 'brunch-formule',
    nameFr: 'Formule Brunch',
    descFr: 'Entrée + plat ou plat + dessert du jour',
    price: 5000,
    category: 'brunch',
    isPopular: true,
  },
]
