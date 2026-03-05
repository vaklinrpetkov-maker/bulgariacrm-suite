

# Contact Profile Dialog

## What
Add a double-click handler on contact table rows that opens a comprehensive "Customer Profile" dialog showing all information related to that contact in one place.

## Components

### 1. `src/components/contacts/ContactProfileDialog.tsx` (Create)
A large dialog (max-w-4xl) with tabbed sections, all in Bulgarian:

- **Информация** tab: Contact details (name, type, email, phone, city, address, notes) displayed as read-only fields
- **Лийдове** tab: Fetches from `leads` where `contact_id = contact.id` — shows title, status, estimated value, date
- **Срещи** tab: Fetches meetings via leads (`leads.contact_id` → `meetings.lead_id`) — shows title, date, status, location
- **Сделки** tab: Fetches from `deals` where `contact_id = contact.id` — shows title, value, status
- **Договори** tab: Fetches from `contracts` where `contact_id = contact.id` — shows title, contract number, status, total value
- **Документи** tab: Fetches from `documents` where `entity_type = 'contact'` and `entity_id = contact.id`
- **Хронология** tab: Fetches from `audit_trail` where `entity_type = 'contact'` and `entity_id = contact.id` — chronological event list

Each tab shows a simple table or empty state. Data fetched via separate `useQuery` calls keyed to the contact ID.

### 2. Update `ContactsTable.tsx`
- Add `onDoubleClick` prop and attach `onDoubleClick` handler to each `TableRow`
- Add cursor-pointer styling to rows

### 3. Update `ContactsPage.tsx`
- Add `profileContact` state
- Pass `onDoubleClick` handler to `ContactsTable`
- Render `ContactProfileDialog`

## No database changes needed
All tables already exist with the right foreign keys/columns. The `contacts` table itself serves as the customer profile.

## Files
| File | Action |
|------|--------|
| `src/components/contacts/ContactProfileDialog.tsx` | Create |
| `src/components/contacts/ContactsTable.tsx` | Edit (add onDoubleClick) |
| `src/pages/crm/ContactsPage.tsx` | Edit (add profile state + dialog) |

