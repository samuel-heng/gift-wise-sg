-- Migration: Robust RLS for occasions (authenticated users only)
DROP POLICY IF EXISTS "Allow insert/update for anon and default user" ON occasions;

-- Allow authenticated users to read their own occasions
CREATE POLICY "Authenticated users can read their own occasions" ON occasions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to insert occasions for themselves
CREATE POLICY "Authenticated users can insert their own occasions" ON occasions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own occasions
CREATE POLICY "Authenticated users can update their own occasions" ON occasions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to delete their own occasions
CREATE POLICY "Authenticated users can delete their own occasions" ON occasions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()); 