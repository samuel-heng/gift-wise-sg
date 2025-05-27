-- Migration: Robust RLS for occasions (pg_has_role service_role fix)
ALTER POLICY "Authenticated users can update their own occasions"
  ON public.occasions
  USING ((user_id = auth.uid()) OR pg_has_role('service_role', 'member'));

ALTER POLICY "Authenticated users can insert their own occasions"
  ON public.occasions
  WITH CHECK ((user_id = auth.uid()) OR pg_has_role('service_role', 'member'));

ALTER POLICY "Authenticated users can delete their own occasions"
  ON public.occasions
  USING ((user_id = auth.uid()) OR pg_has_role('service_role', 'member'));

ALTER POLICY "Authenticated users can read their own occasions"
  ON public.occasions
  USING ((user_id = auth.uid()) OR pg_has_role('service_role', 'member')); 