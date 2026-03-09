

## Fix: Update EMAIL_USER secret and fix duplicate sync bug

### Problem
The `EMAIL_USER` secret is currently set to `contact@vminvest.bg` instead of `office@vminvest.bg`. This is why the sync pulls emails from the wrong mailbox. Additionally, the sync function has a duplication bug — the fallback `message_id` uses `Date.now()`, causing the same message to get a new ID on every sync run.

### Changes

1. **Update the `EMAIL_USER` secret** to `office@vminvest.bg` (and update `EMAIL_PASSWORD` if the password differs for this account).

2. **Fix `supabase/functions/sync-emails/index.ts`**
   - Change fallback message_id from `<imap-${msg.uid}-${Date.now()}@vminvest.bg>` to `<imap-uid-${msg.uid}@vminvest.bg>` so upsert deduplication works correctly.

3. **Database cleanup migration**
   - Delete duplicate email rows that were created by the broken sync, keeping only the earliest entry per unique `(from_address, to_address, subject, sent_at)`.

4. **Update `src/pages/MailPage.tsx`**
   - The header already says `office@vminvest.bg` — no change needed there.

