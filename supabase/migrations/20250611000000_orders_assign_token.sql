ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assign_token UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_assign_token_idx ON public.orders(assign_token);
