CREATE TABLE IF NOT EXISTS public.menu_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_images ENABLE ROW LEVEL SECURITY;

-- Lecture publique (le menu est public)
CREATE POLICY "Public read" ON public.menu_images
  FOR SELECT USING (true);

-- Écriture réservée aux utilisateurs authentifiés (admin)
CREATE POLICY "Authenticated write" ON public.menu_images
  FOR ALL USING (auth.role() = 'authenticated');

-- Créer aussi la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_images_updated_at
  BEFORE UPDATE ON public.menu_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
