ALTER TABLE public.meetings DROP CONSTRAINT meetings_lead_id_fkey;
ALTER TABLE public.meetings ADD CONSTRAINT meetings_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;