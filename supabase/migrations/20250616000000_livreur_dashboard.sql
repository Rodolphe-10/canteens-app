ALTER TABLE public.livreurs
  ADD COLUMN IF NOT EXISTS pin TEXT;

CREATE INDEX IF NOT EXISTS idx_deliveries_livreur_statut
  ON public.deliveries(livreur_id, statut);

CREATE INDEX IF NOT EXISTS idx_deliveries_livreur_delivered
  ON public.deliveries(livreur_id, delivered_at DESC NULLS LAST);
