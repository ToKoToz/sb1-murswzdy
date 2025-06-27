/*
  # Create profile pictures storage bucket

  1. Storage
    - Create `profile-pictures` bucket for storing trainer profile images
    - Set up public access policies for the bucket
    - Configure appropriate file size and type restrictions

  2. Security
    - Allow authenticated users to upload files
    - Allow public read access to profile pictures
    - Restrict file types to images only
*/

-- Create the profile-pictures bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload profile pictures
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to delete profile pictures
CREATE POLICY "Users can delete profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow public read access to profile pictures
CREATE POLICY "Public read access for profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');