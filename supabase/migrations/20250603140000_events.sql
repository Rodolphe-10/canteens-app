CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'soiree', -- soiree | brunch | game-night | prive | autre
  date_start TIMESTAMPTZ NOT NULL,
  date_end TIMESTAMPTZ,
  deadline_reservation TIMESTAMPTZ,
  places_total INTEGER,
  places_reserved INTEGER DEFAULT 0,
  flyers TEXT[] DEFAULT '{}', -- tableau d'URLs Supabase Storage
  is_featured BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.events
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Authenticated write" ON public.events
  FOR ALL USING (auth.role() = 'authenticated');

-- Données de test
INSERT INTO public.events (title, description, type, date_start, places_total, is_featured, flyers) VALUES
('Friday After Work Game Night', 'Tarifs réduits sur tous les jeux, ambiance DJ, cocktails signature.', 'game-night', NOW() + INTERVAL '5 days', 80, true, '{}'),
('Brunch du Dimanche', 'Buffet à volonté 10 000F — Karaoké + Live Music.', 'brunch', NOW() + INTERVAL '12 days', 60, false, '{}'),
('Soirée DJ Privée', 'Une nuit inoubliable au Canteen''s Lounge.', 'soiree', NOW() - INTERVAL '10 days', 120, false, '{}');
