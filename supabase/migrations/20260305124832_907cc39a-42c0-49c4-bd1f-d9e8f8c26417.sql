CREATE TABLE public.contact_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments access" ON public.contact_comments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);