
CREATE TABLE public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_code text NOT NULL,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  attempts int DEFAULT 0
);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for phone verification"
ON public.phone_verifications FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public select for phone verification"
ON public.phone_verifications FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow public update for phone verification"
ON public.phone_verifications FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone, verified);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;
END $$;
