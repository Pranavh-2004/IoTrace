/*
  Create storage bucket and policies for logs

  1. Create logs bucket if it doesn't exist
  2. Enable RLS on the bucket
  3. Add policies for:
    - Users can read logs associated with their cases
*/

-- Create the logs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logs', 'logs', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their case logs
CREATE POLICY "Users can read their case logs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'logs' AND 
  EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.log_id::text = SPLIT_PART(storage.objects.name, '.', 1)
    AND cases.user_id = auth.uid()
  )
); 