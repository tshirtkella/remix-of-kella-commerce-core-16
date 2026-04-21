-- Create bulk_orders table
CREATE TABLE public.bulk_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  quantity_range TEXT NOT NULL,
  product_categories TEXT[] NOT NULL DEFAULT '{}',
  custom_print BOOLEAN NOT NULL DEFAULT false,
  custom_print_details TEXT,
  custom_tag BOOLEAN NOT NULL DEFAULT false,
  custom_tag_details TEXT,
  order_purpose TEXT NOT NULL,
  order_purpose_other TEXT,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit a bulk order request
CREATE POLICY "Anyone can submit bulk orders"
  ON public.bulk_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read, update, delete
CREATE POLICY "Admins can manage bulk orders"
  ON public.bulk_orders FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Reuse existing update_updated_at_column trigger function if exists, otherwise create
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bulk_orders_updated_at
  BEFORE UPDATE ON public.bulk_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bulk_orders_created_at ON public.bulk_orders(created_at DESC);
CREATE INDEX idx_bulk_orders_status ON public.bulk_orders(status);