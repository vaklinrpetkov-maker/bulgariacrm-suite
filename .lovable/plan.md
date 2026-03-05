

# Add "Create Lead" Button to Contact Profile

## What
Add a single convenience button in the Contact Profile dialog header that creates a new lead linked to the current contact. Clicking it opens a small dialog/form to enter lead details (title, estimated value, source, notes) with the contact already pre-associated.

## Changes

### 1. Create `src/components/contacts/CreateLeadFromContactDialog.tsx`
- Small dialog with form fields: title (required), estimated_value, source, notes
- Pre-sets `contact_id` to the current contact
- Uses `useMutation` to insert into `leads` table with `owner_id` and `created_by` from auth context
- On success: invalidates `contact-leads` query key, shows toast, closes

### 2. Update `src/components/contacts/ContactProfileDialog.tsx`
- Add a "Нов лийд" button next to the contact name in the `DialogHeader`
- Button opens the `CreateLeadFromContactDialog`
- Pass `contact.id` to the new dialog

## No database changes needed
The `leads` table already has `contact_id`, `title`, `estimated_value`, `source`, `notes`, `owner_id`, `created_by` columns with appropriate RLS.

## Files
| File | Action |
|------|--------|
| `src/components/contacts/CreateLeadFromContactDialog.tsx` | Create |
| `src/components/contacts/ContactProfileDialog.tsx` | Edit (add button + render dialog) |

