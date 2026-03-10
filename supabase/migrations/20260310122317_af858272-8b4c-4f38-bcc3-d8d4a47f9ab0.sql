
-- Create helper function to check viewer module access (using text cast to avoid enum validation at parse time)
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Non-viewers always have access
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'viewer'
  ) THEN
    RETURN true;
  END IF;
  
  -- Viewers need explicit module grant
  RETURN EXISTS (
    SELECT 1 FROM public.viewer_module_access WHERE user_id = _user_id AND module = _module
  );
END;
$$;
