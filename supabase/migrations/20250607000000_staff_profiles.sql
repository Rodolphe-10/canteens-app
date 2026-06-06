CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'chef', 'cm', 'livreur')),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read staff_profiles" ON public.staff_profiles
  FOR SELECT USING (true);

CREATE POLICY "Public write staff_profiles" ON public.staff_profiles
  FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_profiles;
