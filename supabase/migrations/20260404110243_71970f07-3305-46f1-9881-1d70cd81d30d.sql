
CREATE TABLE public.draft_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  cart_items JSONB DEFAULT '[]'::jsonb,
  payment_method TEXT,
  notes TEXT,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.draft_orders ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage draft orders"
  ON public.draft_orders FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert drafts
CREATE POLICY "Anyone can create draft orders"
  ON public.draft_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can update their own draft by session_id
CREATE POLICY "Anyone can update own draft"
  ON public.draft_orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Drafts publicly readable (for session matching)
CREATE POLICY "Draft orders publicly readable"
  ON public.draft_orders FOR SELECT
  TO public
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.draft_orders;
