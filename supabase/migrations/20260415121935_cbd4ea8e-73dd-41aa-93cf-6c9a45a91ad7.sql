INSERT INTO page_templates (page_key, section_key, title, sort_order, content) VALUES
('home', 'top_bar', 'Top Announcement Bar', -1, '{"message": "🚚 Free Shipping on orders over ৳1000 • 24/7 Customer Support • Easy Returns"}')
ON CONFLICT DO NOTHING;