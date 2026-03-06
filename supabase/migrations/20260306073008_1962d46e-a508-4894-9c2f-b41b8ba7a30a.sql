
ALTER TABLE public.leads ADD COLUMN responded_at timestamp with time zone DEFAULT NULL;

-- Auto-set responded_at when owner_id is assigned
CREATE OR REPLACE FUNCTION public.leads_auto_respond()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- If owner_id changed from NULL to a value and responded_at is still NULL, set it
  IF OLD.owner_id IS NULL AND NEW.owner_id IS NOT NULL AND NEW.responded_at IS NULL THEN
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_leads_auto_respond
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.leads_auto_respond();
