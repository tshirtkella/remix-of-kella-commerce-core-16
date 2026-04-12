
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true);

CREATE POLICY "Review images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own review images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);
