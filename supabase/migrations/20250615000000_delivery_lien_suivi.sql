-- Créer lien_suivi si absent + auto-génération à l'INSERT
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS lien_suivi TEXT;

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS eta_minutes INTEGER DEFAULT 25;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deliveries'
      AND column_name = 'lien_suivi'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.deliveries
      ALTER COLUMN lien_suivi DROP DEFAULT;

    ALTER TABLE public.deliveries
      ALTER COLUMN lien_suivi TYPE TEXT USING lien_suivi::text;
  END IF;
END $$;

UPDATE public.deliveries
SET lien_suivi = gen_random_uuid()::text
WHERE lien_suivi IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.deliveries'::regclass
      AND conname = 'deliveries_lien_suivi_key'
  ) THEN
    ALTER TABLE public.deliveries
      ADD CONSTRAINT deliveries_lien_suivi_key UNIQUE (lien_suivi);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deliveries_livreur_id ON public.deliveries(livreur_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_statut ON public.deliveries(statut);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_lien_suivi ON public.deliveries(lien_suivi);

CREATE OR REPLACE FUNCTION set_lien_suivi()
RETURNS trigger AS $$
BEGIN
  IF NEW.lien_suivi IS NULL THEN
    NEW.lien_suivi := gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_lien_suivi ON public.deliveries;

CREATE TRIGGER trg_set_lien_suivi
  BEFORE INSERT ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION set_lien_suivi();
