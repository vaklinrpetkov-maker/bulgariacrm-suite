

## Plan: Remove recipient check from inbound-email webhook

**What**: Remove "Filter 1: Recipient check" from `supabase/functions/inbound-email/index.ts` — the block that verifies the `to`/`envelope` fields contain `leads@vminvest.bg`. This includes removing the `toRaw` and `envelope` variables since they're only used for that check.

**Why**: Since the SendGrid Inbound Parse is configured specifically for `parse.vminvest.bg`, only emails routed through that domain will hit the webhook. The recipient filter is redundant.

**Changes in `supabase/functions/inbound-email/index.ts`**:
- Remove `toRaw` and `envelope` variable declarations
- Remove reading `to` and `envelope` from formData and JSON body
- Remove the entire "Filter 1: Recipient check" block (lines ~53-70)
- Keep Filter 2 (subject must contain "форма") intact

