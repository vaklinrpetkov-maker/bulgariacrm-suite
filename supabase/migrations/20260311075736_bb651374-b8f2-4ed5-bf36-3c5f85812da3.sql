
CREATE TABLE public.contract_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  property_type text,
  property_number text,
  floor text,
  entrance text,
  built_area text,
  total_area text,
  sale_price text,
  installment_1 text,
  installment_2 text,
  installment_3 text,
  installment_4 text,
  notes jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract properties select"
  ON public.contract_properties
  FOR SELECT
  TO authenticated
  USING (has_module_access(auth.uid(), 'contracts'::text));

CREATE POLICY "Contract properties modify"
  ON public.contract_properties
  FOR ALL
  TO authenticated
  USING (NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'))
  WITH CHECK (NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text = 'viewer'));
