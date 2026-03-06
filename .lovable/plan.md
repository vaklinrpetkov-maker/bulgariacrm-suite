

# Email-to-Lead Webhook

## Overview
Create a backend function that receives parsed inbound emails (from SendGrid Inbound Parse) and automatically creates a contact + lead in the database.

## Architecture

```text
Gmail/Outlook  ──forwarding──>  leads@yourdomain.com
                                      │
                              SendGrid Inbound Parse
                                      │
                                  POST webhook
                                      │
                          Edge Function: inbound-email
                                      │
                        ┌─────────────┴──────────────┐
                        │                            │
                  Find or create              Create lead
                  contact by email         (title = subject)
```

## Implementation

### 1. Edge Function: `supabase/functions/inbound-email/index.ts`
- **Public endpoint** (no JWT) since SendGrid calls it
- Parses `multipart/form-data` from SendGrid (fields: `from`, `subject`, `text`, `envelope`)
- Extracts sender email and name from the `from` field
- Upserts a contact (finds existing by email or creates a new "person" contact)
- Creates a lead linked to that contact with `source: "email"` and `title` from the email subject
- Returns 200 to acknowledge receipt

### 2. Config: `supabase/config.toml`
- Add `[functions.inbound-email]` with `verify_jwt = false`

### 3. No database changes needed
The existing `contacts` and `leads` tables already have the required columns.

## Setup Steps (for user after deployment)
1. Create a free SendGrid account
2. Add and verify a domain (or subdomain like `parse.yourdomain.com`) with MX record pointing to `mx.sendgrid.net`
3. In SendGrid > Inbound Parse, set the webhook URL to the deployed function URL
4. Set up email forwarding from Gmail/Outlook to `leads@parse.yourdomain.com`

## Files
| File | Action |
|------|--------|
| `supabase/functions/inbound-email/index.ts` | Create |
| `supabase/config.toml` | Update (add function config) |

