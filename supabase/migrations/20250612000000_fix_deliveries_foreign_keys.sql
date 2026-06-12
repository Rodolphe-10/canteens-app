-- Corrige les clés étrangères deliveries → livreurs / orders
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_livreur_id_fkey;

ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_livreur_id_fkey
  FOREIGN KEY (livreur_id) REFERENCES public.livreurs(id) ON DELETE SET NULL;

ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_order_id_fkey;

ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
