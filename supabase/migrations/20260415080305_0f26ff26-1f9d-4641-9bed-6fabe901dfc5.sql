
-- Add more page templates for full customization

-- Shop page
INSERT INTO public.page_templates (page_key, section_key, title, content, sort_order)
VALUES ('shop', 'hero', 'Shop Header', '{"heading": "All Products", "subtitle": "Browse our complete collection of premium t-shirts"}', 0)
ON CONFLICT DO NOTHING;

-- Product Detail page
INSERT INTO public.page_templates (page_key, section_key, title, content, sort_order)
VALUES 
  ('product', 'delivery_info', 'Delivery Info', '{"free_shipping_threshold": "2000", "delivery_time": "2-5 business days", "return_policy": "7-day easy returns"}', 0),
  ('product', 'related_heading', 'Related Products Heading', '{"heading": "You May Also Like", "subtitle": "Similar products you might enjoy"}', 1)
ON CONFLICT DO NOTHING;

-- Checkout page
INSERT INTO public.page_templates (page_key, section_key, title, content, sort_order)
VALUES ('checkout', 'header', 'Checkout Header', '{"heading": "Checkout", "trust_message": "Your information is safe & secure"}', 0)
ON CONFLICT DO NOTHING;

-- Support page
INSERT INTO public.page_templates (page_key, section_key, title, content, sort_order)
VALUES 
  ('support', 'hero', 'Support Header', '{"heading": "How Can We Help?", "subtitle": "Get in touch with our support team"}', 0),
  ('support', 'contact', 'Contact Info', '{"email": "support@tshirtkella.com", "phone": "+880 1234 567890", "hours": "10:00 AM - 8:00 PM (Sat-Thu)"}', 1)
ON CONFLICT DO NOTHING;

-- Update login hero to include image_url field
UPDATE public.page_templates 
SET content = jsonb_set(content, '{hero_image}', '"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200"')
WHERE page_key = 'login' AND section_key = 'hero' AND NOT (content ? 'hero_image');
