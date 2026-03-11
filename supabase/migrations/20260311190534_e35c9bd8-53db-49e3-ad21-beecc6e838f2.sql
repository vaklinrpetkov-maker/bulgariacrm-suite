
-- 1. automation_rules: restrict write to admin/manager, keep read for all authenticated
DROP POLICY IF EXISTS "Automation rules access" ON public.automation_rules;

CREATE POLICY "Automation rules select" ON public.automation_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Automation rules modify" ON public.automation_rules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 2. contract_payments: restrict write to non-viewers, read via module access
DROP POLICY IF EXISTS "Contract payments access" ON public.contract_payments;

CREATE POLICY "Contract payments select" ON public.contract_payments
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'contracts'::text));

CREATE POLICY "Contract payments modify" ON public.contract_payments
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'));

-- 3. payment_installments: same pattern
DROP POLICY IF EXISTS "Payment installments access" ON public.payment_installments;

CREATE POLICY "Payment installments select" ON public.payment_installments
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'contracts'::text));

CREATE POLICY "Payment installments modify" ON public.payment_installments
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'));

-- 4. contact_comments: restrict update/delete to author or admin
DROP POLICY IF EXISTS "Comments access" ON public.contact_comments;

CREATE POLICY "Contact comments select" ON public.contact_comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Contact comments insert" ON public.contact_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Contact comments update" ON public.contact_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Contact comments delete" ON public.contact_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 5. document_folders: restrict write to non-viewers
DROP POLICY IF EXISTS "Document folders access" ON public.document_folders;

CREATE POLICY "Document folders select" ON public.document_folders
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'documents'::text));

CREATE POLICY "Document folders modify" ON public.document_folders
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'));

-- 6. document_versions: restrict write to non-viewers
DROP POLICY IF EXISTS "Document versions access" ON public.document_versions;

CREATE POLICY "Document versions select" ON public.document_versions
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'documents'::text));

CREATE POLICY "Document versions modify" ON public.document_versions
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'));

-- 7. workflow_steps: restrict write to admin/manager
DROP POLICY IF EXISTS "Workflow steps access" ON public.workflow_steps;

CREATE POLICY "Workflow steps select" ON public.workflow_steps
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'workflows'::text));

CREATE POLICY "Workflow steps modify" ON public.workflow_steps
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 8. workflow_runs: restrict write to non-viewers
DROP POLICY IF EXISTS "Workflow runs access" ON public.workflow_runs;

CREATE POLICY "Workflow runs select" ON public.workflow_runs
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'workflows'::text));

CREATE POLICY "Workflow runs modify" ON public.workflow_runs
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'));

-- 9. workflow_run_steps: restrict write to non-viewers
DROP POLICY IF EXISTS "Workflow run steps access" ON public.workflow_run_steps;

CREATE POLICY "Workflow run steps select" ON public.workflow_run_steps
  FOR SELECT TO authenticated
  USING (has_module_access(auth.uid(), 'workflows'::text));

CREATE POLICY "Workflow run steps modify" ON public.workflow_run_steps
  FOR ALL TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'));
