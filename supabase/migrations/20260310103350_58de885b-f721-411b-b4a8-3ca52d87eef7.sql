
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS egn text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'client';
