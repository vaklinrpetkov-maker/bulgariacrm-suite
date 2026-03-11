
CREATE TABLE public.sop_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL UNIQUE,
  title text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.sop_documents ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "SOP documents readable by authenticated"
  ON public.sop_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins manage SOP documents"
  ON public.sop_documents
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
