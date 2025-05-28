-- Migration: Robust RLS for gifts, contacts, and user_profiles (authenticated users and service_role)

-- GIFTS TABLE --
DROP POLICY IF EXISTS "Allow insert/update for anon and default user" ON gifts;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON gifts;
DROP POLICY IF EXISTS "Allow read for anon" ON gifts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON gifts;

-- Allow authenticated users to read their own gifts
CREATE POLICY "Authenticated users can read their own gifts" ON gifts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to insert gifts for themselves
CREATE POLICY "Authenticated users can insert their own gifts" ON gifts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to update their own gifts
CREATE POLICY "Authenticated users can update their own gifts" ON gifts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to delete their own gifts
CREATE POLICY "Authenticated users can delete their own gifts" ON gifts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow service_role to do anything (for backend jobs)
CREATE POLICY "Allow service role full access" ON gifts
  FOR ALL TO service_role
  USING (true);

-- CONTACTS TABLE --
DROP POLICY IF EXISTS "Allow insert/update for anon and default user" ON contacts;
DROP POLICY IF EXISTS "Allow read for anon" ON contacts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON contacts;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON contacts;

-- Allow authenticated users to read their own contacts
CREATE POLICY "Authenticated users can read their own contacts" ON contacts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to insert contacts for themselves
CREATE POLICY "Authenticated users can insert their own contacts" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to update their own contacts
CREATE POLICY "Authenticated users can update their own contacts" ON contacts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to delete their own contacts
CREATE POLICY "Authenticated users can delete their own contacts" ON contacts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow service_role to do anything (for backend jobs)
CREATE POLICY "Allow service role full access" ON contacts
  FOR ALL TO service_role
  USING (true);

-- USER_PROFILES TABLE --
DROP POLICY IF EXISTS "Allow anon read" ON user_profiles;
DROP POLICY IF EXISTS "Allow anon update" ON user_profiles;
DROP POLICY IF EXISTS "Allow read for anon" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON user_profiles;

-- Allow authenticated users to read their own profile
CREATE POLICY "Authenticated users can read their own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow authenticated users to update their own profile
CREATE POLICY "Authenticated users can update their own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR pg_has_role('service_role', 'member'));

-- Allow service_role to do anything (for backend jobs)
CREATE POLICY "Allow service role full access" ON user_profiles
  FOR ALL TO service_role
  USING (true); 