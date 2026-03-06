
-- Fix 1: Restrict audit_trail INSERT to enforce user_id = auth.uid()
DROP POLICY "Audit trail insertable" ON public.audit_trail;
CREATE POLICY "Audit trail insertable" ON public.audit_trail
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
