
-- Page templates for editable storefront content
CREATE TABLE public.page_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  section_key text NOT NULL,
  title text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_key, section_key)
);

ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page templates publicly readable"
  ON public.page_templates FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage page templates"
  ON public.page_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Email templates for editable email content
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  subject text NOT NULL,
  heading text,
  body_text text,
  button_text text,
  footer_text text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email templates publicly readable"
  ON public.email_templates FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default email templates
INSERT INTO public.email_templates (template_key, subject, heading, body_text, button_text, footer_text) VALUES
  ('signup_verification', 'Verify your email address', 'Welcome to our store!', 'Thank you for signing up. Please verify your email address to activate your account.', 'Verify Email', 'If you did not create an account, please ignore this email.'),
  ('password_reset', 'Reset your password', 'Reset Your Password', 'We received a request to reset your password. Click the button below to set a new password.', 'Reset Password', 'If you did not request a password reset, please ignore this email.'),
  ('order_confirmation', 'Order Confirmation', 'Thank you for your order!', 'Your order has been received and is being processed. You will receive a shipping notification once your order has been dispatched.', 'View Order', 'Thank you for shopping with us!'),
  ('shipping_notification', 'Your order has been shipped', 'Your Order is On Its Way!', 'Great news! Your order has been shipped and is on its way to you.', 'Track Order', 'Thank you for your patience!'),
  ('welcome_email', 'Welcome to our store', 'Welcome Aboard!', 'We are thrilled to have you join our community. Explore our latest collections and enjoy exclusive offers.', 'Start Shopping', 'You are receiving this because you signed up for an account.');

-- Seed default page templates
INSERT INTO public.page_templates (page_key, section_key, title, content, sort_order) VALUES
  ('home', 'hero', 'Hero Section', '{"heading": "Step into Style", "subheading": "From everyday essentials to luxury brands, find fashion that fits your world.", "cta_text": "Shop Now", "cta_link": "/shop"}', 0),
  ('home', 'trust_badges', 'Trust Badges', '{"badges": [{"icon": "truck", "title": "Free Delivery", "description": "On orders over ৳500"}, {"icon": "shield", "title": "Secure Payment", "description": "100% secure checkout"}, {"icon": "refresh", "title": "Easy Returns", "description": "30-day return policy"}, {"icon": "headphones", "title": "24/7 Support", "description": "Contact us anytime"}]}', 1),
  ('home', 'categories', 'Categories Section', '{"heading": "Shop by Category", "subheading": "Browse our curated collections"}', 2),
  ('home', 'flash_sale', 'Flash Sale Section', '{"heading": "Flash Sale", "subheading": "Hurry! Limited time deals"}', 3),
  ('home', 'just_for_you', 'Just For You Section', '{"heading": "Just For You", "subheading": "Handpicked products based on your preferences"}', 4),
  ('home', 'reviews', 'Customer Reviews Section', '{"heading": "What Our Customers Say", "subheading": "Real reviews from real customers"}', 5),
  ('about', 'hero', 'About Hero', '{"heading": "About Us", "subheading": "Learn more about our story and mission"}', 0),
  ('about', 'story', 'Our Story', '{"heading": "Our Story", "body": "We started with a simple idea: make fashion accessible to everyone. Today, we serve thousands of happy customers across Bangladesh and beyond."}', 1),
  ('login', 'hero', 'Login Hero', '{"heading": "Step into Style", "subheading": "From everyday essentials to luxury brands, find fashion that fits your world."}', 0),
  ('footer', 'content', 'Footer Content', '{"about_text": "Your one-stop destination for trendy and affordable fashion.", "contact_email": "support@tshirtkella.com", "contact_phone": "+880 1712-345678"}', 0);
