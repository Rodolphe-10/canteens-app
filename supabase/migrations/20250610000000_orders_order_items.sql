CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT,
  client_nom TEXT NOT NULL,
  client_telephone TEXT NOT NULL,
  quartier TEXT NOT NULL,
  adresse TEXT,
  repere TEXT,
  etage TEXT,
  instructions TEXT,
  horaire TEXT,
  heure_choisie TEXT,
  mode_paiement TEXT NOT NULL DEFAULT 'especes',
  sous_total NUMERIC(12, 2) DEFAULT 0,
  frais_livraison NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (
    statut IN ('en_attente', 'confirme', 'en_preparation', 'en_livraison', 'livre')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  categorie TEXT,
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_unitaire NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sous_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Public read orders'
  ) THEN
    CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Public write orders'
  ) THEN
    CREATE POLICY "Public write orders" ON public.orders FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'Public read order_items'
  ) THEN
    CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'Public write order_items'
  ) THEN
    CREATE POLICY "Public write order_items" ON public.order_items FOR ALL USING (true);
  END IF;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
