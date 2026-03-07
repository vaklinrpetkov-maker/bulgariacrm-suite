
CREATE TABLE public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  from_address text NOT NULL,
  to_address text NOT NULL,
  subject text,
  body_text text,
  body_html text,
  message_id text UNIQUE,
  in_reply_to text,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Emails access" ON public.emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_emails_contact_id ON public.emails(contact_id);
CREATE INDEX idx_emails_message_id ON public.emails(message_id);
CREATE INDEX idx_emails_sent_at ON public.emails(sent_at DESC);
