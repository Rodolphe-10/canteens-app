-- Sécurise la colonne `pin` des livreurs : le rôle anon (clé publique du client)
-- ne doit jamais pouvoir lire ni écrire le PIN. La vérification du PIN se fait
-- exclusivement côté serveur via /api/livreur/login (service_role).

-- Repart d'une base propre sur les droits colonnes
REVOKE ALL ON TABLE public.livreurs FROM anon, authenticated;

-- Lecture : toutes les colonnes SAUF pin
GRANT SELECT (
  id,
  nom,
  telephone,
  photo_url,
  moto_immatriculation,
  moto_modele,
  disponible,
  actif,
  created_at
) ON public.livreurs TO anon, authenticated;

-- Écriture (toggles disponible/actif depuis l'admin et la home livreur) : sauf pin
GRANT UPDATE (
  nom,
  telephone,
  photo_url,
  moto_immatriculation,
  moto_modele,
  disponible,
  actif
) ON public.livreurs TO anon, authenticated;

GRANT DELETE ON public.livreurs TO anon, authenticated;

-- Le service_role (routes serveur) conserve l'accès complet, pin compris
GRANT ALL ON TABLE public.livreurs TO service_role;
