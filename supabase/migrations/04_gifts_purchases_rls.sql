-- This policy is for legacy/seed data only. The old user ID '00000000-0000-0000-0000-000000000001' is no longer used in production.
-- You may comment out the following lines if you wish to avoid confusion.

-- Allow insert/update for anon and Default User on gifts
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON gifts;
CREATE POLICY "Allow insert/update for anon and default user" ON gifts
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001' OR auth.uid() IS NULL);
 
-- Allow insert/update for anon and Default User on purchases
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON purchases;
CREATE POLICY "Allow insert/update for anon and default user" ON purchases
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001' OR auth.uid() IS NULL); 