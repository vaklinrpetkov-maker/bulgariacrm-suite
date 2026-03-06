

# Filter Inbound Emails for Lead Creation

## Changes to `supabase/functions/inbound-email/index.ts`

Two filters will be added before processing:

1. **Recipient check**: Verify the email was sent to `leads@vminvest.bg` using SendGrid's `to` or `envelope` field. Reject with 200 (to avoid retries) if the recipient doesn't match.

2. **Subject filter**: Check if the subject contains "форма" (case-insensitive). If not present, skip lead creation and return 200.

Both checks happen early in the function, before any database operations. Non-matching emails get a 200 response with a `{ skipped: true }` body so SendGrid doesn't retry.

## Files

| File | Action |
|------|--------|
| `supabase/functions/inbound-email/index.ts` | Update — add recipient and subject filters |

