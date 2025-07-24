-- Create the statement-files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('statement-files', 'statement-files', false);

-- Set up RLS policies for the bucket
CREATE POLICY "Users can upload their own files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'statement-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'statement-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'statement-files' AND auth.uid()::text = (storage.foldername(name))[1]);