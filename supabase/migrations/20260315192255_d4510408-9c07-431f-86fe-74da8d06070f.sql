
-- Create user_email_accounts table for per-user email credentials
CREATE TABLE public.user_email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_address text NOT NULL,
  email_password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_must_be_vminvest CHECK (email_address LIKE '%@vminvest.bg')
);

ALTER TABLE public.user_email_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own email account
CREATE POLICY "Users read own email account" ON public.user_email_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own email account" ON public.user_email_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own email account" ON public.user_email_accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own email account" ON public.user_email_accounts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Update emails RLS: users only see emails they created/synced
DROP POLICY IF EXISTS "Emails select" ON public.emails;
CREATE POLICY "Emails select own" ON public.emails
  FOR SELECT TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Emails modify" ON public.emails;
CREATE POLICY "Emails modify own" ON public.emails
  FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- Clean existing shared emails (clean slate)
DELETE FROM public.emails;
