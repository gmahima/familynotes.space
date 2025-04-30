-- Create a storage bucket for memes
INSERT INTO storage.buckets (id, name, public)
VALUES ('memes', 'memes', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the memes bucket
-- Allow public read access to all files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'memes');

-- Allow authenticated users to insert files
CREATE POLICY "Authenticated Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'memes' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'templates' OR (storage.foldername(name))[1] = 'generated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'memes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'memes' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
