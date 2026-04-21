
CREATE TABLE public.share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_slug text,
  product_name text,
  network text NOT NULL,
  action text NOT NULL DEFAULT 'click',
  url text,
  user_agent text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_events_created_at ON public.share_events(created_at DESC);
CREATE INDEX idx_share_events_network ON public.share_events(network);
CREATE INDEX idx_share_events_product ON public.share_events(product_id);

ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log share events"
  ON public.share_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view share events"
  ON public.share_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage share events"
  ON public.share_events FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
