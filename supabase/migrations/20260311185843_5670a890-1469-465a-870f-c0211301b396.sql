
-- Fix 1: Split meetings ALL policy into separate INSERT/UPDATE/DELETE policies
-- Keep SELECT as-is, restrict DELETE to admins only
DROP POLICY IF EXISTS "Meetings modify" ON public.meetings;

CREATE POLICY "Meetings insert" ON public.meetings
  FOR INSERT TO authenticated
  WITH CHECK (
    has_module_access(auth.uid(), 'meetings'::text)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'
    )
  );

CREATE POLICY "Meetings update" ON public.meetings
  FOR UPDATE TO authenticated
  USING (
    has_module_access(auth.uid(), 'meetings'::text)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'
    )
  )
  WITH CHECK (
    has_module_access(auth.uid(), 'meetings'::text)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = 'viewer'
    )
  );

CREATE POLICY "Meetings delete" ON public.meetings
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict notifications INSERT to own user_id
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;

CREATE POLICY "System inserts notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
