-- Migration: Allow service_role to update, insert, delete, and select occasions for backend jobs
ALTER POLICY "Authenticated users can update their own occasions" ON public.occasions TO authenticated, service_role;
ALTER POLICY "Authenticated users can insert their own occasions" ON public.occasions TO authenticated, service_role;
ALTER POLICY "Authenticated users can delete their own occasions" ON public.occasions TO authenticated, service_role;
ALTER POLICY "Authenticated users can read their own occasions" ON public.occasions TO authenticated, service_role; 