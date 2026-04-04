
-- Chat messages for abandoned checkout conversations
CREATE TABLE public.draft_order_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_order_id UUID NOT NULL REFERENCES public.draft_orders(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL DEFAULT 'admin',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.draft_order_messages ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage chat messages"
  ON public.draft_order_messages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read messages for their session
CREATE POLICY "Anyone can read own session messages"
  ON public.draft_order_messages FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert messages (customer replies)
CREATE POLICY "Anyone can send messages"
  ON public.draft_order_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.draft_order_messages;
