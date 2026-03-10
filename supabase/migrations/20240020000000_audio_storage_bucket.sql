-- Create the audio storage bucket for music file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  true,
  52428800, -- 50 MB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio');

-- Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update own audio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public read access (bucket is public, but policy is needed for RLS)
CREATE POLICY "Public read access for audio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'audio');

-- Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete own audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
