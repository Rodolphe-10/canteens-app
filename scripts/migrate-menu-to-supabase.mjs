/**
 * Migrate menu items from menu-ola.ts → Supabase table menu_items
 * Run: node scripts/migrate-menu-to-supabase.mjs
 */

import https from 'https'

const SUPABASE_URL = 'https://cqatekwthaiwvdabtfth.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'REMPLACER'
const M = `${SUPABASE_URL}/storage/v1/object/public/media/menu/`

// ─── Tous les items du menu (copie de menu-ola.ts) ───────────────────────────
const items = [
  // PIZZAS
  { id: 'margarita', name_fr: 'Margarita', desc_fr: 'Tomate, Mozzarella, Feuille de basilic', price: 6000, category: 'pizzas', is_popular: true, image: M+'margarita.webp' },
  { id: 'quatre-fromage', name_fr: 'Quatre Fromage', desc_fr: 'Tomate, Cheddar, Comte, Bleu, Mozzarella, Basilic', price: 8500, category: 'pizzas', is_popular: true, image: M+'quatre_fromage.webp' },
  { id: 'choupette', name_fr: 'Choupette', desc_fr: 'Pepperoni, Mozzarella, Tomate, Oignon', price: 9500, category: 'pizzas', is_popular: true, image: M+'choupette.webp' },
  { id: 'r-gina', name_fr: 'Régina', desc_fr: 'Tomate, Jambon, Champignons, Mozzarella', price: 10000, category: 'pizzas', image: M+'regina.webp' },
  { id: 'saumon-pizza', name_fr: 'Pizza Saumon', desc_fr: 'Crème fraiche, Saumon fumé, Oignon, Mozzarella', price: 11000, category: 'pizzas', image: M+'saumon.webp' },
  { id: 'fruits-de-mer-pizza', name_fr: 'Pizza Fruits de Mer', desc_fr: 'Crème fraiche, Fruits de mer, Oignon, Persillade, Mozzarella', price: 12500, category: 'pizzas', image: M+'fruits_de_mer.webp' },
  { id: 'canibale', name_fr: 'Canibale', desc_fr: 'Tomate, Viande hachée, Mozzarella, Oignon, Poivron, Olive noir', price: 8000, category: 'pizzas', image: M+'canibale.webp' },
  // BURGERS
  { id: 'black-burger', name_fr: 'Black Burger', desc_fr: 'Pain burger noir au sésames, Steak haché, Cheddar, Salade, Tomate, Oignons rouge', price: 8000, category: 'burgers', image: M+'black_burger.webp' },
  { id: 'cants-first', name_fr: "Cant's First", desc_fr: 'Pain burger classique, Blanc de poulet pané aux épices, Salade, Tomate, Oignon confit, Sauce maison', price: 6500, category: 'burgers', image: M+'cant_s_first.webp' },
  { id: 'cants-fish', name_fr: "Cant's Fish", desc_fr: 'Pain burger classique, Filet de capitaine, Salade, Tomate, Oignon confit, Sauce maison', price: 7500, category: 'burgers', image: M+'cant_s_fish.webp' },
  // VIANDES (BARBECUE GRILL)
  { id: 'la-fameuse-entrecote', name_fr: 'LA Fameuse Entrecote', desc_fr: 'Frite de pomme, Sauce bearnaise', price: 18000, category: 'viandes', is_popular: true, image: M+'la_fameuse_entrecote.webp' },
  { id: 'merguez', name_fr: 'Merguez', price: 11500, category: 'viandes', image: M+'merguez.webp' },
  { id: 'trio-de-saucisse-de-boeuf', name_fr: 'Trio de Saucisse de Bœuf', price: 7500, category: 'viandes', image: M+'trio_de_saucisse_de_b_uf.webp' },
  { id: 'demi-poulet', name_fr: 'Demi-Poulet', price: 8000, category: 'viandes', is_popular: true, image: M+'demi-poulet.webp' },
  { id: 'ailes-de-poulet', name_fr: 'Ailes de Poulet', price: 9000, category: 'viandes', image: M+'ailes_de_poulet.webp' },
  { id: 'cuisse-de-poulet', name_fr: 'Cuisse de Poulet', price: 6500, category: 'viandes', image: M+'cuisse_de_poulet.webp' },
  { id: 'brochette-kefta', name_fr: 'Brochette Kefta', price: 6500, category: 'viandes', image: M+'brochette_kefta.webp' },
  { id: 'brochette-boeuf', name_fr: 'Brochette Bœuf', price: 6000, category: 'viandes', image: M+'brochette_b_uf.webp' },
  { id: 'brochette-poulet', name_fr: 'Brochette Poulet', price: 7000, category: 'viandes', image: M+'brochette_poulet.webp' },
  { id: 'brochette-rognon', name_fr: 'Brochette Rognon', price: 7000, category: 'viandes', image: M+'brochette_rognon.webp' },
  { id: 'brochette-gesiers', name_fr: 'Brochette Gésiers', price: 7000, category: 'viandes', image: M+'brochette_gesiers.webp' },
  { id: 'mix-grill-petit', name_fr: 'Mix Grill Petit', price: 18000, category: 'viandes', image: M+'mix_grill_petit.webp' },
  { id: 'mix-grill-grand', name_fr: 'Mix Grill Grand', price: 45000, category: 'viandes', image: M+'mix_grill_grand.webp' },
  // POISSONS
  { id: 'trio-de-gambas', name_fr: 'Trio de Gambas', price: 15000, category: 'poissons', image: M+'trio_de_gambas.webp' },
  { id: 'carpe', name_fr: 'Carpe', price: 10500, category: 'poissons', image: M+'carpe.webp' },
  { id: 'sole', name_fr: 'Sole', price: 15000, category: 'poissons', image: M+'sole.webp' },
  { id: 'bar', name_fr: 'Bar', price: 12500, category: 'poissons', image: M+'bar.webp' },
  { id: 'brochette-poisson', name_fr: 'Brochette Poisson', price: 7500, category: 'poissons', image: M+'brochette_poisson.webp' },
  // DESSERTS
  { id: 'pain-perdu', name_fr: 'Pain Perdu', desc_fr: 'Pain trempé au lait cuit, sauce caramel, beurre salé, glace vanille', price: 6000, category: 'desserts', image: M+'pain_perdu.webp' },
  { id: 'creme-brulee', name_fr: 'Crème Brûlée', desc_fr: 'Crème cuite au bain marie, caramélisée', price: 6500, category: 'desserts', image: M+'creme_brulee.webp' },
  { id: 'tiramisu', name_fr: 'Tiramisu Parfum Café', desc_fr: 'Entremet à base de mascarpone, biscuit boudoirs, parfumé au café', price: 6500, category: 'desserts', image: M+'tiramisu_parfum_cafe.webp' },
  { id: 'mi-cuit', name_fr: 'Mi-Cuit au Chocolat', desc_fr: 'Fondant au chocolat, sauce anglaise, glace vanille', price: 6000, category: 'desserts', image: M+'mi-cuit_au_chocolat.webp' },
  { id: 'fruits-saison', name_fr: 'Assiette de Fruits de Saison', desc_fr: 'Assortiment de fruits de saison', price: 6000, category: 'desserts', image: M+'assiettes_de_fruits_de_saison.webp' },
  { id: 'dame-blanche', name_fr: 'Dame Blanche', desc_fr: 'Glace vanille, sauce choco, chantilly', price: 5500, category: 'desserts', image: M+'dame_blanche.webp' },
  { id: 'cafe-liegeois', name_fr: 'Café Liégeois', desc_fr: 'Glace café, coulis café, chantilly', price: 5500, category: 'desserts', image: M+'cafe_liegeois.webp' },
  { id: 'chocolat-liegeois', name_fr: 'Chocolat Liégeois', desc_fr: 'Glace choco, sauce choco, chantilly', price: 5500, category: 'desserts', image: M+'chocolat_liegeois.webp' },
  // POKE BOWL
  { id: 'poke-bowl-salmon', name_fr: 'Poke Bowl Salmon', desc_fr: 'Riz, Avocat, Saumon, Algue noir', price: 9500, category: 'poke-bowl', image: M+'poke_bowl_salmon.webp' },
  { id: 'poke-bowl-poulet', name_fr: 'Poke Bowl Poulet Tériyaki', desc_fr: 'Riz, Poulet, Carotte, Choux rouge', price: 8500, category: 'poke-bowl', image: M+'poke_bowl_poulet_teriyaki.webp' },
  { id: 'poke-bowl-vege', name_fr: 'Poke Bowl Végétarien', desc_fr: 'Riz, Avocat, Maïs, Concombre, Carotte, Jeune pousse', price: 7000, category: 'poke-bowl', image: M+'poke_bowl_vegetarien.webp' },
  // SALADES
  { id: 'salade-cesar', name_fr: 'Salade César', desc_fr: 'Blanc de poulet, Salade romaine, Parmesan, Croûton de pain', price: 6000, category: 'salades', image: M+'salade_cesar.webp' },
  { id: 'salade-russe', name_fr: 'Salade Russe', desc_fr: 'Macédoine de légumes', price: 8000, category: 'salades', image: M+'salade_russe.webp' },
  // ENTRÉES
  { id: 'carpaccio-boeuf', name_fr: 'Carpaccio de Bœuf', desc_fr: 'Copeaux de Parmesan, Roquette, Pignons de pin, Sauce pesto', price: 11500, category: 'entrees', is_popular: true, image: M+'carpaccio_de_boeuf.webp' },
  { id: 'saumon-gravelax', name_fr: 'Notre Saumon Gravelax', price: 12500, category: 'entrees', image: M+'saumon_gravelax.webp' },
  { id: 'cocktail-avocat', name_fr: 'Cocktail Avocat Crevettes', price: 8500, category: 'entrees', image: M+'cocktail_avocat_crevettes.webp' },
  // FINGER FOOD
  { id: 'samoussa', name_fr: 'Samoussa', desc_fr: 'Feuille de brick, Farce à la viande', price: 4500, category: 'finger-food', image: M+'samoussa.webp' },
  { id: 'nems', name_fr: 'Nems', desc_fr: 'Galette de riz, Farce au poulet', price: 5500, category: 'finger-food', image: M+'nems.webp' },
  { id: 'crevette-tempura', name_fr: 'Crevette Tempura', desc_fr: 'Crevette, Pâte à frire', price: 6500, category: 'finger-food', image: M+'crevette_tempura.webp' },
  { id: 'pain-ail', name_fr: "Pain à l'Ail", desc_fr: "Tranche de pain, Ail, Basilic", price: 3000, category: 'finger-food', image: M+'pain_a_l_ail.webp' },
  { id: 'legumes-croquants', name_fr: 'Légumes Croquants', desc_fr: 'Carotte, Concombre, Jus de citron', price: 3000, category: 'finger-food', image: M+'legumes_croquants.webp' },
  // TARTINES
  { id: 'bruschetta-vege', name_fr: 'Bruschetta Végétarien', desc_fr: "Pain frotté à l'ail, Tomate, Mozzarella, Pesto", price: 5500, category: 'tartine', image: M+'bruschetta_vegetarien.webp' },
  { id: 'toast-saumon-avocat', name_fr: 'Toast Saumon Avocat', desc_fr: 'Pain grillé, Avocat, Saumon, Œuf mollet', price: 7500, category: 'tartine', image: M+'toast_saumon_avocat.webp' },
  // PLATS LOCAUX
  { id: 'riz-saute', name_fr: "Riz Sauté The Canteen's", desc_fr: 'Au choix : Poulet, Viande ou Crevettes', price: 8000, category: 'plats-locaux', image: M+'riz_saute_the_canteens.webp' },
  { id: 'poulet-au-four', name_fr: 'Poulet au Four', desc_fr: 'Poulet mariné aux épices, pomme de terre cuit au four', price: 13500, category: 'plats-locaux', image: M+'poulet_au_four.webp' },
  { id: 'ndole-royal', name_fr: 'Ndolé Royal', desc_fr: 'Feuille de Ndolé, Arachides, Crevette, Viande de bœuf, Plantain vapeur', price: 12500, category: 'plats-locaux', is_popular: true, image: M+'ndole_royal.webp' },
  { id: 'ndole-viande', name_fr: 'Ndolé Viande', desc_fr: 'Feuille de Ndolé, Arachide, Crevette, Viande de bœuf, Plantain vapeur', price: 8500, category: 'plats-locaux', image: M+'ndole_viande.webp' },
  { id: 'piece-boucher', name_fr: 'Pièce du Boucher', desc_fr: "Navette d'Aleyou grillée, Beurre, Persil, Pomme de terre", price: 19500, category: 'plats-locaux', image: M+'piece_du_boucher.webp' },
  { id: 'cote-agneaux', name_fr: "Côte d'Agneaux Grillée", desc_fr: 'Sauce au poivre, Purée de pomme de terre', price: 18000, category: 'plats-locaux', image: M+'cote_d_agneaux_grillee.webp' },
  { id: 'souris-agneaux', name_fr: "Souris d'Agneaux", desc_fr: "Confit au miel, Herbe d'Atlas", price: 15000, category: 'plats-locaux', image: M+'souris_d_agneaux.webp' },
  { id: 'emince-viande', name_fr: 'Émincés de Viande Légumes', price: 8000, category: 'plats-locaux', image: M+'eminces_de_viande_legumes.webp' },
  { id: 'emince-poulet', name_fr: 'Émincés de Poulet Légumes', price: 7000, category: 'plats-locaux', image: M+'eminces_de_poulet_legumes.webp' },
  { id: 'bouillon-queue-boeuf', name_fr: 'Bouillon de Queue de Bœuf', price: 11500, category: 'plats-locaux', image: M+'bouillon_de_queue_de_boeuf.webp' },
  { id: 'bouillon-poisson', name_fr: 'Bouillon de Poisson', price: 12000, category: 'plats-locaux', image: M+'bouillon_de_poisson.webp' },
  { id: 'pave-saumon', name_fr: 'Pavé de Saumon', desc_fr: 'Pavé de saumon cuit à la poêle', price: 18000, category: 'plats-locaux', image: M+'pave_de_saumon.webp' },
  { id: 'pave-capitaine', name_fr: 'Pavé de Capitaine', desc_fr: 'Sauce crème', price: 12500, category: 'plats-locaux', image: M+'pave_de_capitaine.webp' },
  { id: 'poisson-four', name_fr: 'Poisson au Four', desc_fr: 'Poisson frais cuit au four, Sauce basquaise', price: 14500, category: 'plats-locaux', image: M+'poisson_au_four.webp' },
  { id: 'daurade-four', name_fr: 'Daurade au Four', desc_fr: 'Pomme de terre, Légumes', price: 12000, category: 'plats-locaux', image: M+'daurade_au_four.webp' },
  // PÂTES & RISOTTOS
  { id: 'linguine-pesto', name_fr: 'Linguine au Pesto', desc_fr: 'Pâtes linguine, Sauce basilic, Brocoli, Crème fraîche, Parmesan', price: 6500, category: 'pates', image: M+'linguine_au_pesto.webp' },
  { id: 'capellini', name_fr: 'Capellini', desc_fr: 'Capellini, Émincés de volailles, Crème de parmesan', price: 14500, category: 'pates', image: M+'capellini.webp' },
  { id: 'spaghetti-bolognaise', name_fr: 'Spaghetti Bolognaise', desc_fr: 'Spaghetti, Sauce bolognaise maison', price: 10000, category: 'pates', image: M+'spaguetti_bolognaise.webp' },
  { id: 'tagliatelles-saumon', name_fr: 'Tagliatelles au Saumon Frais', desc_fr: 'Saumon frais, Crème fraîche, Beurre, Parmesan râpé', price: 12000, category: 'pates', image: M+'tagliatelles_au_saumon_frais.webp' },
  { id: 'pasta-fruits-mer', name_fr: 'Pasta aux Fruits de Mer', desc_fr: 'Pâtes au choix, Fruits de mer, Sauce crème', price: 13500, category: 'pates', image: M+'pasta_aux_fruits_de_mer.webp' },
  { id: 'lasagne', name_fr: 'Lasagne', desc_fr: 'Pâtes italienne, Viande hachée, Béchamel gratinées au four', price: 10500, category: 'pates', image: M+'lasagne.webp' },
  { id: 'risotto-fruits-mer', name_fr: 'Risotto Fruits de Mer', desc_fr: 'Risotto, Crevettes et Calamars, Sauce rosée, Parmesan', price: 14500, category: 'pates', image: M+'risotto_fruits_de_mer.webp' },
  { id: 'risotto-champignons', name_fr: 'Risotto aux Champignons', desc_fr: 'Champignons, Parmesan', price: 12500, category: 'pates', image: M+'risotto_aux_champignons.webp' },
  { id: 'risotto-verdure', name_fr: 'Risotto Verdure', desc_fr: "Huile d'olive, Oignon, Tomates concassées, Basilic frais", price: 11500, category: 'pates', image: M+'risotto_verdure.webp' },
  // COCKTAILS SIGNATURE
  { id: 'upside-down', name_fr: 'Upside Down', desc_fr: 'Gin, Sucre de canne, Vin rouge, Blue curaçao, Jus de citron', price: 10500, category: 'cocktails', image: M+'upside_down.webp' },
  { id: 'rainbow-spirit', name_fr: 'Rainbow Spirit', desc_fr: "Vodka, Blue curaçao, Sirop de fraise, Jus d'orange", price: 9000, category: 'cocktails', image: M+'rainbow_spirit.webp' },
  { id: 'bora-bora', name_fr: 'Bora Bora', desc_fr: 'Whisky infusé, Miel, Jus de citron', price: 12500, category: 'cocktails', image: M+'bora_bora.webp' },
  { id: 'mojito', name_fr: 'Mojito', desc_fr: 'Rhum blanc, Jus de citron, Sucre de cannes, Eau gazeuse, feuille de menthe', price: 8500, category: 'cocktails', is_popular: true, image: M+'mojito.webp' },
  { id: 'old-fashioned', name_fr: 'Old Fashioned', desc_fr: 'Whiskey, Sucre brun, Eau gazeuse, Angostoura bitter', price: 8500, category: 'cocktails', image: M+'old_fashioned.webp' },
  { id: 'negroni', name_fr: 'Négroni', desc_fr: 'Gin, Campari, Vermouth rosso', price: 8500, category: 'cocktails', image: M+'negroni.webp' },
  { id: 'espresso-martini', name_fr: 'Espresso Martini', desc_fr: 'Espresso, Vodka, Triple sec', price: 8500, category: 'cocktails', image: M+'espresso_martini.webp' },
  { id: 'moscow-mule', name_fr: 'Moscow Mule', desc_fr: 'Gingembre frais, Vodka, Sucre de canne, Jus de citron', price: 8500, category: 'cocktails', image: M+'moscow_mule.webp' },
  { id: 'pina-colada', name_fr: 'Pina Colada', desc_fr: 'Rhum blanc, Lait de coco, Malibu, Jus de citron', price: 8500, category: 'cocktails', image: M+'pina_colada.webp' },
  { id: 'long-island', name_fr: 'Long Island', desc_fr: 'Cinq alcools blanc, Coca-cola', price: 8500, category: 'cocktails', image: M+'long_island.webp' },
  { id: 'sex-on-the-beach', name_fr: 'Sex on the Beach', desc_fr: "Vodka, Liqueur de Pêche, Jus d'Orange, Jus de Raisin", price: 8500, category: 'cocktails', image: M+'sex_on_the_beach.webp' },
  { id: 'kir-royal', name_fr: 'Kir Royal', desc_fr: 'Creme de cassis, Champagne', price: 10000, category: 'cocktails', image: M+'kir_royal.webp' },
  { id: 'blue-lagoon', name_fr: 'Blue Lagoon', desc_fr: 'Vodka, Blue coração, Jus de citron, Sprite', price: 8000, category: 'cocktails', image: M+'blue_lagoon.webp' },
  { id: 'margarita-cocktail', name_fr: 'Margarita', desc_fr: 'Téquila, Jus de citron, Triple sec', price: 8500, category: 'cocktails', image: M+'margarita.webp' },
  { id: 'aperol-spritz', name_fr: 'Aperol Spritz', desc_fr: 'Apérol, Eau gazeuse, Prosecco', price: 8500, category: 'cocktails', image: M+'aperol_spritz.webp' },
  { id: 'bullfrog', name_fr: 'Bullfrog', desc_fr: 'Cinq alcools blanc, Red bull', price: 9500, category: 'cocktails', image: M+'bullfrog.webp' },
  { id: 'mai-thai', name_fr: 'Maï-Thaï', desc_fr: "Rhum blanc, Rhum brun, Jus de citron, Sirop d'Orgeat", price: 8000, category: 'cocktails', image: M+'mai-thai.webp' },
  { id: 'passion-fruit-martini', name_fr: 'Passion Fruit Martini', desc_fr: 'Vodka, Sirop de passion, Jus de citron', price: 8500, category: 'cocktails', image: M+'passion_fruit_martini.webp' },
  { id: 'gin-basil', name_fr: 'Gin Basil', desc_fr: 'Gin, Sirop de canne, Basilique, Jus de citron', price: 8500, category: 'cocktails', image: M+'gin_basil.webp' },
  { id: 'pink-lady', name_fr: 'Pink Lady', desc_fr: 'Vodka, Sirop de passion, Jus de citron, Shot prosecco', price: 7500, category: 'cocktails', image: M+'pink_lady.webp' },
  { id: 'tom-collins', name_fr: 'Tom Collins', desc_fr: "Gin, Sucre blanc, Eau gazeuse, Jus de citron", price: 7500, category: 'cocktails', image: M+'tom_collins.webp' },
  // SANS ALCOOL
  { id: 'virgin-mojito', name_fr: 'Virgin Mojito', desc_fr: 'Jus de citron, feuille de menthe, sucre de canne, eau gazeuse', price: 6000, category: 'sans-alcool', image: M+'mojito.webp' },
  { id: 'bora-bora-sans', name_fr: 'Bora Bora Sans Alcool', desc_fr: "Sirop de passion, Sirop de fraise, Jus de citron, Jus d'Orange", price: 6000, category: 'sans-alcool', image: M+'bora_bora.webp' },
  { id: 'virgin-pina-colada', name_fr: 'Virgin Pina Colada', price: 6000, category: 'sans-alcool', image: M+'pina_colada.webp' },
  { id: 'mi-amor', name_fr: 'Mi Amor', desc_fr: 'Purée de passion, Purée de corosol, Purée de mangue', price: 6000, category: 'sans-alcool', image: M+'passion_mojito.webp' },
  // SHOTS
  { id: 'brain-damage', name_fr: 'Brain Damage', desc_fr: "Liqueur de pêche, Blue curaçao, Sirop de grenadine, Bailey's", price: 3500, category: 'shots', image: M+'jamaica.webp' },
  { id: 'b52', name_fr: 'B-52', desc_fr: "Bailey's, Liqueur de café, Rhum brun", price: 3000, category: 'shots', image: M+'jamaica.webp' },
  { id: 'blue-kamikaze', name_fr: 'Blue Kamikaze', desc_fr: 'Vodka, Blue curaçao, Jus de citron', price: 3000, category: 'shots', image: M+'blue_lagoon.webp' },
  // CHAMPAGNES
  { id: 'veuve-cliquot-rich', name_fr: 'Veuve Cliquot Rich', price: 115000, category: 'champagnes', image: M+'veuve_cliquot_rich.webp' },
  { id: 'veuve-cliquot-brut', name_fr: 'Veuve Cliquot Brut', price: 90000, category: 'champagnes', image: M+'veuve_cliquot_brut.webp' },
  { id: 'moet-brut', name_fr: 'Moët Brut', price: 75000, category: 'champagnes', image: M+'moet_brut.webp' },
  { id: 'moet-ice', name_fr: 'Moët Ice', price: 100000, category: 'champagnes', image: M+'moet_ice.webp' },
  { id: 'moet-nectar', name_fr: 'Moët Nectar Impérial', price: 110000, category: 'champagnes', image: M+'moet_nectar_imperial.webp' },
  { id: 'ruinart-rose', name_fr: 'Ruinart Rosé', price: 140000, category: 'champagnes', image: M+'ruinart_rose.webp' },
  { id: 'ruinart-blanc', name_fr: 'Ruinart Blanc', price: 130000, category: 'champagnes', image: M+'ruinart_blanc.webp' },
  { id: 'ruinart-brut', name_fr: 'Ruinart Brut', price: 90000, category: 'champagnes', image: M+'ruinart_brut.webp' },
  { id: 'dom-perignon-brut', name_fr: 'Dom Pérignon Brut', price: 250000, category: 'champagnes', image: M+'dom_perignon_brut.webp' },
  { id: 'dom-perignon-rose', name_fr: 'Dom Pérignon Rosé', price: 300000, category: 'champagnes', image: M+'dom_perignon_rose.webp' },
  { id: 'armand-de-brignac', name_fr: 'Armand de Brignac', price: 500000, category: 'champagnes', image: M+'armand_de_brignac.webp' },
  { id: 'louis-roederer', name_fr: 'Louis Roederer Cristal', price: 350000, category: 'champagnes', image: M+'louis_roederer_cristal.webp' },
  // PROSECCO
  { id: 'pnp-white', name_fr: 'PNP White', price: 30000, category: 'prosecco', image: M+'pnp_white.webp' },
  { id: 'pnp-silver', name_fr: 'PNP Silver', price: 30000, category: 'prosecco', image: M+'pnp_silver.webp' },
  { id: 'pnp-bronze', name_fr: 'PNP Bronze', price: 30000, category: 'prosecco', image: M+'pnp_bronze.webp' },
  { id: 'pnp-green', name_fr: 'PNP Green', price: 30000, category: 'prosecco', image: M+'pnp_green.webp' },
  { id: 'pnp-gold', name_fr: 'PNP Gold', price: 30000, category: 'prosecco', image: M+'pnp_gold.webp' },
  { id: 'pnp-black', name_fr: 'PNP Black', price: 30000, category: 'prosecco', image: M+'pnp_black.webp' },
  { id: 'absolo', name_fr: 'Absolo', price: 35000, category: 'prosecco', image: M+'absolo.webp' },
  // WHISKIES
  { id: 'johnnie-black', name_fr: 'Johnnie Walker Black Label', price: 65000, category: 'whiskies', image: M+'johnnie_walker_black_label.webp' },
  { id: 'johnnie-blue', name_fr: 'Johnnie Walker Blue Label', price: 300000, category: 'whiskies', image: M+'johnnie_walker_blue_label.webp' },
  { id: 'johnnie-gold', name_fr: 'Johnnie Walker Gold Label', price: 100000, category: 'whiskies', image: M+'johnnie_walker_gold_label.webp' },
  { id: 'chivas-12', name_fr: 'Chivas 12 ans', price: 60000, category: 'whiskies', image: M+'chivas_12_ans.webp' },
  { id: 'chivas-18', name_fr: 'Chivas 18 ans', price: 125000, category: 'whiskies', image: M+'chivas_18_ans.webp' },
  { id: 'monkey-shoulders', name_fr: 'Monkey Shoulders', price: 70000, category: 'whiskies', image: M+'monkey_shoulders.webp' },
  { id: 'dewars-12', name_fr: "Dewar's 12 ans", price: 60000, category: 'whiskies', image: M+"dewar_s_12_ans.webp" },
  { id: 'ballentines', name_fr: 'Ballentines', price: 35000, category: 'whiskies', image: M+'ballentines.webp' },
  { id: 'jb', name_fr: 'J&B', price: 35000, category: 'whiskies', image: M+'j_b.webp' },
  { id: 'jack-old', name_fr: "Jack Daniel's Old", price: 60000, category: 'whiskies', image: M+'jack_daniel_s_old.webp' },
  { id: 'jack-honey', name_fr: "Jack Daniel's Honey", price: 60000, category: 'whiskies', image: M+'jack_daniel_s_honey.webp' },
  // SINGLE MALT
  { id: 'glenfiddich-18', name_fr: 'Glenfiddich 18 ans', price: 150000, category: 'single-malt', image: M+'glenfiddish_18_ans.webp' },
  { id: 'glenfiddich-15', name_fr: 'Glenfiddich 15 ans', price: 120000, category: 'single-malt', image: M+'glenfiddish_15_ans.webp' },
  { id: 'glenfiddich-12', name_fr: 'Glenfiddich 12 ans', price: 70000, category: 'single-malt', image: M+'glenfiddish_12_ans.webp' },
  { id: 'macallan-15', name_fr: 'Macallan 15 ans', price: 290000, category: 'single-malt', image: M+'macallan_15_ans.webp' },
  { id: 'macallan-12', name_fr: 'Macallan 12 ans', price: 160000, category: 'single-malt', image: M+'macallan_12_ans.webp' },
  // COGNACS
  { id: 'hennessy-paradis', name_fr: 'Hennessy Paradis', price: 1500000, category: 'cognacs', image: M+'hennessy_paradis.webp' },
  { id: 'hennessy-xo', name_fr: 'Hennessy XO', price: 300000, category: 'cognacs', image: M+'hennessy_xo.webp' },
  { id: 'hennessy-camus', name_fr: 'Hennessy Camus XO', price: 500000, category: 'cognacs', image: M+'hennessy_camus_xo.webp' },
  { id: 'hennessy-vs', name_fr: 'Hennessy V.S', price: 80000, category: 'cognacs', image: M+'hennessy_v.s.webp' },
  // VODKAS
  { id: 'belvedere', name_fr: 'Belvedere', price: 80000, category: 'vodkas', image: M+'belevedere.webp' },
  { id: 'absolut', name_fr: 'Absolut 1L', price: 60000, category: 'vodkas', image: M+'absolut_1l.webp' },
  // VINS
  { id: 'chateau-talbot', name_fr: 'Château Talbot', price: 130000, category: 'vins', image: M+'chateau_talbot.webp' },
  { id: 'chateau-giscours', name_fr: 'Château de Giscours', price: 120000, category: 'vins', image: M+'chateau_de_giscours.webp' },
  // BIÈRES
  { id: 'beaufort', name_fr: 'Beaufort', price: 1500, category: 'bieres', image: M+'beaufort.webp' },
  { id: '33-export', name_fr: '33 Export', price: 1500, category: 'bieres', image: M+'33_export.webp' },
  { id: 'castel', name_fr: 'Castel', price: 1500, category: 'bieres', image: M+'castel.webp' },
  { id: 'mutzig', name_fr: 'Mutzig', price: 2000, category: 'bieres', image: M+'mutzig.webp' },
  // SOFTS
  { id: 'coca-cola', name_fr: 'Coca-Cola', price: 1500, category: 'softs', image: M+'coca_cola.webp' },
  { id: 'fanta', name_fr: 'Fanta', price: 1500, category: 'softs', image: M+'fanta.webp' },
  { id: 'sprite', name_fr: 'Sprite', price: 1500, category: 'softs', image: M+'sprite.webp' },
  { id: 'redbull', name_fr: 'Red Bull', price: 3500, category: 'softs', image: M+'red_bull.webp' },
  { id: 'eau-plate', name_fr: 'Eau Plate', price: 1000, category: 'softs', image: M+'eau_plate.webp' },
  { id: 'eau-gazeuse', name_fr: 'Eau Gazeuse', price: 1500, category: 'softs', image: M+'eau_gazeuse.webp' },
  // MILSHAKES
  { id: 'milshake-chocolat', name_fr: 'Milshake Chocolat', price: 6500, category: 'milshakes', image: M+'milshakes_chocolat.webp' },
  { id: 'milshake-vanille', name_fr: 'Milshake Vanille', price: 6000, category: 'milshakes', image: M+'milshakes_vanille.webp' },
  { id: 'milshake-fraise', name_fr: 'Milshake Fraise', price: 7000, category: 'milshakes', image: M+'milshakes_fraise.webp' },
  { id: 'milshake-cafe', name_fr: 'Milshake Café', price: 6500, category: 'milshakes', image: M+'milshakes_cafe.webp' },
  { id: 'milshake-cants', name_fr: "Milshake The Cant's", price: 8000, category: 'milshakes', is_popular: true, image: M+'milshakes_the_cant_s.webp' },
  // LIQUEURS
  { id: 'baileys', name_fr: "Bailey's", price: 35000, category: 'liqueurs', image: M+'bailey_s.webp' },
  { id: 'martini-rosso', name_fr: 'Martini Rosso', price: 35000, category: 'liqueurs', image: M+'martini_rosso.webp' },
  { id: 'martini-rosato', name_fr: 'Martini Rosato', price: 35000, category: 'liqueurs', image: M+'martini_rosato.webp' },
  { id: 'martini-bianco', name_fr: 'Martini Bianco', price: 35000, category: 'liqueurs', image: M+'martini_bianco.webp' },
]

// ─── Upload vers Supabase ─────────────────────────────────────────────────────
function supabasePost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = https.request({
      method: 'POST',
      hostname: 'cqatekwthaiwvdabtfth.supabase.co',
      path,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Prefer': 'resolution=merge-duplicates,return=minimal',
        'Content-Length': Buffer.byteLength(data),
      }
    }, res => {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

// Normaliser tous les objets avec les mêmes clés
const normalized = items.map(item => ({
  id: item.id,
  name_fr: item.name_fr,
  name_en: item.name_en ?? null,
  desc_fr: item.desc_fr ?? null,
  desc_en: item.desc_en ?? null,
  price: item.price,
  category: item.category,
  image: item.image ?? null,
  is_popular: item.is_popular ?? false,
  is_visible: true,
}))

// Batch par 50
const BATCH = 50
console.log(`\n🚀 Migration de ${normalized.length} items vers Supabase...\n`)
let ok = 0, fail = 0

for (let i = 0; i < normalized.length; i += BATCH) {
  const batch = normalized.slice(i, i + BATCH)
  const res = await supabasePost('/rest/v1/menu_items?on_conflict=id', batch)
  if (res.status >= 200 && res.status < 300) {
    ok += batch.length
    console.log(`  ✅ Batch ${Math.floor(i/BATCH)+1} — ${batch.length} items (total: ${ok})`)
  } else {
    fail += batch.length
    console.log(`  ❌ Batch ${Math.floor(i/BATCH)+1} — HTTP ${res.status}: ${res.body.slice(0,100)}`)
  }
}

console.log(`\n✅ ${ok} migrés | ❌ ${fail} échoués\n`)
