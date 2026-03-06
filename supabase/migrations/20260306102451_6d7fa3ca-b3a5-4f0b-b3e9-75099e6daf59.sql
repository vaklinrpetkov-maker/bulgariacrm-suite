
-- Restrict audit_trail SELECT to admins or the user who created the record
DROP POLICY "Audit trail readable" ON public.audit_trail;
CREATE POLICY "Audit trail readable" ON public.audit_trail
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  );
