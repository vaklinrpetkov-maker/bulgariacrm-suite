
-- Update SELECT policies on main data tables to enforce viewer module access
-- Contacts
DROP POLICY IF EXISTS "Contacts select" ON public.contacts;
CREATE POLICY "Contacts select" ON public.contacts
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'contacts'));

-- Leads
DROP POLICY IF EXISTS "Leads select" ON public.leads;
CREATE POLICY "Leads select" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'leads'));

-- Meetings
DROP POLICY IF EXISTS "Meetings access" ON public.meetings;
CREATE POLICY "Meetings select" ON public.meetings
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'meetings'));
CREATE POLICY "Meetings modify" ON public.meetings
  FOR ALL TO authenticated
  USING (public.has_module_access(auth.uid(), 'meetings') AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (public.has_module_access(auth.uid(), 'meetings') AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Deals
DROP POLICY IF EXISTS "Deals access" ON public.deals;
CREATE POLICY "Deals select" ON public.deals
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'deals'));
CREATE POLICY "Deals modify" ON public.deals
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Contracts
DROP POLICY IF EXISTS "Contracts access" ON public.contracts;
CREATE POLICY "Contracts select" ON public.contracts
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'contracts'));
CREATE POLICY "Contracts modify" ON public.contracts
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Tasks
DROP POLICY IF EXISTS "Tasks access" ON public.tasks;
CREATE POLICY "Tasks select" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'tasks'));
CREATE POLICY "Tasks modify" ON public.tasks
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Projects
DROP POLICY IF EXISTS "Projects access" ON public.projects;
CREATE POLICY "Projects select" ON public.projects
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'projects'));
CREATE POLICY "Projects modify" ON public.projects
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Emails
DROP POLICY IF EXISTS "Emails access" ON public.emails;
CREATE POLICY "Emails select" ON public.emails
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'mail'));
CREATE POLICY "Emails modify" ON public.emails
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Documents
DROP POLICY IF EXISTS "Documents access" ON public.documents;
CREATE POLICY "Documents select" ON public.documents
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'documents'));
CREATE POLICY "Documents modify" ON public.documents
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Budget items
DROP POLICY IF EXISTS "Budget items access" ON public.budget_items;
CREATE POLICY "Budget items select" ON public.budget_items
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'budgets'));
CREATE POLICY "Budget items modify" ON public.budget_items
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Commissions
DROP POLICY IF EXISTS "Commissions access" ON public.commissions;
CREATE POLICY "Commissions select" ON public.commissions
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'commissions'));
CREATE POLICY "Commissions modify" ON public.commissions
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Inventory (complexes, buildings, units)
DROP POLICY IF EXISTS "Complexes access" ON public.complexes;
CREATE POLICY "Complexes select" ON public.complexes
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'inventory'));
CREATE POLICY "Complexes modify" ON public.complexes
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

DROP POLICY IF EXISTS "Buildings access" ON public.buildings;
CREATE POLICY "Buildings select" ON public.buildings
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'inventory'));
CREATE POLICY "Buildings modify" ON public.buildings
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

DROP POLICY IF EXISTS "Units access" ON public.units;
CREATE POLICY "Units select" ON public.units
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'inventory'));
CREATE POLICY "Units modify" ON public.units
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));

-- Workflows
DROP POLICY IF EXISTS "Workflows access" ON public.workflows;
CREATE POLICY "Workflows select" ON public.workflows
  FOR SELECT TO authenticated
  USING (public.has_module_access(auth.uid(), 'workflows'));
CREATE POLICY "Workflows modify" ON public.workflows
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));
