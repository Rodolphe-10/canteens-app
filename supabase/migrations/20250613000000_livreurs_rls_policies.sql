-- Politiques RLS explicites pour livreurs et deliveries (insert/update)
DROP POLICY IF EXISTS "Public write livreurs" ON public.livreurs;
DROP POLICY IF EXISTS "Public read livreurs" ON public.livreurs;

CREATE POLICY "Public read livreurs" ON public.livreurs
  FOR SELECT USING (true);

CREATE POLICY "Public insert livreurs" ON public.livreurs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update livreurs" ON public.livreurs
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public delete livreurs" ON public.livreurs
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public write deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Public read deliveries" ON public.deliveries;

CREATE POLICY "Public read deliveries" ON public.deliveries
  FOR SELECT USING (true);

CREATE POLICY "Public insert deliveries" ON public.deliveries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update deliveries" ON public.deliveries
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public delete deliveries" ON public.deliveries
  FOR DELETE USING (true);
