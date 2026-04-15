
-- Add missing address field to footer content
UPDATE page_templates 
SET content = content || '{"address": "Dhaka, Bangladesh"}'::jsonb
WHERE page_key = 'footer' AND section_key = 'content'
AND NOT (content ? 'address');

-- Categories page
INSERT INTO page_templates (page_key, section_key, title, sort_order, content) VALUES
('categories', 'hero', 'Categories Header', 0, '{"heading": "All Categories", "subtitle": "Browse our curated collections"}')
ON CONFLICT DO NOTHING;

-- Profile page
INSERT INTO page_templates (page_key, section_key, title, sort_order, content) VALUES
('profile', 'header', 'Profile Header', 0, '{"heading": "My Account", "orders_title": "My Orders", "services_title": "Services", "reviews_title": "My Reviews", "wishlist_title": "My Wishlist"}')
ON CONFLICT DO NOTHING;

-- My Orders page
INSERT INTO page_templates (page_key, section_key, title, sort_order, content) VALUES
('my_orders', 'header', 'My Orders Header', 0, '{"heading": "My Orders", "empty_text": "No orders found", "empty_review_text": "No products to review", "review_hint": "Reviews become available after your order is delivered"}')
ON CONFLICT DO NOTHING;

-- 404 page
INSERT INTO page_templates (page_key, section_key, title, sort_order, content) VALUES
('not_found', 'content', '404 Page Content', 0, '{"heading": "Page Not Found", "subtitle": "Sorry, we couldn''t find what you''re looking for.", "button_text": "Back to Home"}')
ON CONFLICT DO NOTHING;
