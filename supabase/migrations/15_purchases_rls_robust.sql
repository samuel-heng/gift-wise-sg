-- Migration: Robust RLS for purchases (authenticated users and service_role)

-- Remove legacy/seed policies
DROP POLICY IF EXISTS "Allow insert/update for anon and default user" ON purchases;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON purchases;
DROP POLICY IF EXISTS "Allow read for anon" ON purchases;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON purchases;

-- Allow authenticated users to read their own purchases
CREATE POLICY "Authenticated users can read their own purchases" ON purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to insert purchases for themselves
CREATE POLICY "Authenticated users can insert their own purchases" ON purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to update their own purchases
CREATE POLICY "Authenticated users can update their own purchases" ON purchases
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to delete their own purchases
CREATE POLICY "Authenticated users can delete their own purchases" ON purchases
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow service_role to do anything (for backend jobs)
CREATE POLICY "Allow service role full access" ON purchases
  FOR ALL TO service_role
  USING (true); 