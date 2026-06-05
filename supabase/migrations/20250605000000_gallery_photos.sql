CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gallery_photos_gallery_id_idx ON public.gallery_photos (gallery_id);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read gallery_photos" ON public.gallery_photos
  FOR SELECT USING (true);

CREATE POLICY "Public write gallery_photos" ON public.gallery_photos
  FOR ALL USING (true);
