-- Replace the permissive "all" policy with granular ones
DROP POLICY IF EXISTS "Leads access" ON public.leads;

-- Everyone authenticated can read leads
CREATE POLICY "Leads select" ON public.leads
  FOR SELECT TO authenticated USING (true);

-- Everyone authenticated can insert leads
CREATE POLICY "Leads insert" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (true);

-- Everyone authenticated can update leads
CREATE POLICY "Leads update" ON public.leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Only admins can delete leads
CREATE POLICY "Leads delete" ON public.leads
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));