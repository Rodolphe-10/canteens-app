CREATE TABLE IF NOT EXISTS public.livreurs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  photo_url TEXT,
  moto_immatriculation TEXT NOT NULL,
  moto_modele TEXT,
  disponible BOOLEAN DEFAULT true,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID,
  livreur_id UUID REFERENCES public.livreurs(id) ON DELETE SET NULL,
  client_nom TEXT,
  client_telephone TEXT,
  client_adresse TEXT,
  statut TEXT DEFAULT 'assignee' CHECK (statut IN ('assignee', 'en_route', 'livree', 'annulee')),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  lien_suivi UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

ALTER TABLE public.livreurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read livreurs" ON public.livreurs
  FOR SELECT USING (true);

CREATE POLICY "Public write livreurs" ON public.livreurs
  FOR ALL USING (true);

CREATE POLICY "Public read deliveries" ON public.deliveries
  FOR SELECT USING (true);

CREATE POLICY "Public write deliveries" ON public.deliveries
  FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
