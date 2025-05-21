-- Update RLS policy for occasions to allow insert/update for anon and default user
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON occasions;
CREATE POLICY "Allow insert/update for anon and default user" ON occasions
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001' OR auth.uid() IS NULL); 