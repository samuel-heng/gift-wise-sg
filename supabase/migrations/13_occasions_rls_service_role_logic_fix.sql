-- Migration: Robust RLS for occasions (service_role logic fix)
ALTER POLICY "Authenticated users can update their own occasions"
  ON public.occasions
  USING ((user_id = auth.uid()) OR (current_setting('role', true) = 'service_role'));

ALTER POLICY "Authenticated users can insert their own occasions"
  ON public.occasions
  WITH CHECK ((user_id = auth.uid()) OR (current_setting('role', true) = 'service_role'));

ALTER POLICY "Authenticated users can delete their own occasions"
  ON public.occasions
  USING ((user_id = auth.uid()) OR (current_setting('role', true) = 'service_role'));

ALTER POLICY "Authenticated users can read their own occasions"
  ON public.occasions
  USING ((user_id = auth.uid()) OR (current_setting('role', true) = 'service_role')); 