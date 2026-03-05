
-- Enable RLS on tables that were missing it
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Roles viewable by authenticated" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON public.roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Permissions viewable by authenticated" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage permissions" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job titles viewable by authenticated" ON public.job_titles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage job titles" ON public.job_titles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
