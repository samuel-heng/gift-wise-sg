-- Migration: Allow authenticated users to insert their own user_profiles

CREATE POLICY "Authenticated users can insert their own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR pg_has_role('service_role', 'member')); 