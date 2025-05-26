-- This policy is for legacy/seed data only. The old user ID '00000000-0000-0000-0000-000000000001' is no longer used in production.
-- You may comment out the following lines if you wish to avoid confusion.
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON occasions;
CREATE POLICY "Allow insert/update for anon and default user" ON occasions
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001' OR auth.uid() IS NULL); 