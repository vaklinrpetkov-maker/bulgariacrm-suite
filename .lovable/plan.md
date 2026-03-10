

## Email Signature Feature

### What
Add an "Email Signature" (Имейл подпис) section in Settings where users can compose and save an HTML email signature. This signature will be automatically appended to every outgoing email sent through the platform.

### Database
- New table `email_signatures` with columns: `id` (uuid PK), `user_id` (uuid, references auth.users, unique), `signature_html` (text), `created_at`, `updated_at`
- RLS: users can read/write only their own signature

### Settings Page
- Add a new tab "Имейл подпис" in `SettingsPage.tsx`
- Rich text area (or plain textarea for HTML) where the user types/pastes their signature
- Live preview below the editor
- Save button that upserts to `email_signatures`

### Edge Function (`send-email/index.ts`)
- After authenticating the user, fetch their signature from `email_signatures` table
- Append the signature HTML (separated by `<br><br>--<br>`) to the `html` field before sending
- For `text`, append a plain-text version

### Frontend Send Points (no changes needed)
- `ContactEmailsTab.tsx` and `MailPage.tsx` already send the body to the edge function — the signature append happens server-side, so no UI changes needed at the send call sites

### Summary of files to create/edit
1. **Migration SQL** -- create `email_signatures` table + RLS policies
2. **`src/pages/SettingsPage.tsx`** -- add "Имейл подпис" tab with textarea, preview, and save logic
3. **`supabase/functions/send-email/index.ts`** -- fetch user's signature and append to outgoing emails

