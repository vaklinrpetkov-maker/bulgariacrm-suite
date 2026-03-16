

## Plan: Remove lead auto-creation from sync-emails

**Goal**: Eliminate the duplicate lead-creation logic in `sync-emails` so that only the `inbound-email` webhook (Path 1) creates leads from emails.

**Changes in `supabase/functions/sync-emails/index.ts`**:
1. Remove the `parseStructuredBody` function (lines ~20-50) — no longer needed here
2. Remove the `findOrCreateContact` helper function (lines ~52-95) — only used for lead creation
3. Remove the entire "Lead auto-creation for форма emails" block inside the message processing loop (roughly lines ~160-200) — this is the block that checks for "форма" in the subject, parses fields, finds/creates contacts, and inserts leads
4. Remove the `leadsCreated` counter variable and its reference in the response
5. Keep all standard email syncing logic intact (IMAP fetch, email upsert, contact linking by existing `contactByEmail` map)

No other files need changes. The `inbound-email` function remains untouched as the sole lead-creation path.

