-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Leads access" ON public.leads;
CREATE POLICY "Leads access" ON public.leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);