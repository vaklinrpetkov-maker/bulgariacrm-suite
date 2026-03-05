

# Contacts CRUD Module - Implementation Plan

## Overview
Build a full CRUD interface for the Contacts module (Контакти) with Bulgarian labels. The `contacts` table already exists with fields: type (person/company), first_name, last_name, company_name, email, phone, city, address, notes, owner_id, created_by, team_id.

## Components to Create

### 1. Contact Form Dialog (`src/components/contacts/ContactFormDialog.tsx`)
- Dialog with form for creating/editing contacts
- Toggle between "Физическо лице" (person) / "Компания" (company) type
- Fields: first_name, last_name (person) or company_name (company), email, phone, city, address, notes
- Uses react-hook-form + zod validation
- On create: sets `owner_id` and `created_by` to current user

### 2. Contact Delete Confirmation (`src/components/contacts/ContactDeleteDialog.tsx`)
- AlertDialog confirming deletion with contact name

### 3. Contacts Table (`src/components/contacts/ContactsTable.tsx`)
- Table showing all contacts with columns: Type badge, Name, Email, Phone, City, Created date
- Row actions: Edit, Delete
- Empty state when no contacts

### 4. Updated ContactsPage (`src/pages/crm/ContactsPage.tsx`)
- Integrates all components
- Uses `@tanstack/react-query` for data fetching (`useQuery` / `useMutation`)
- Search/filter bar (by name, type)
- "Нов контакт" button opens the form dialog
- Toast notifications on success/error

## Data Flow
- **Read**: `supabase.from('contacts').select('*').order('created_at', { ascending: false })`
- **Create**: `supabase.from('contacts').insert({...data, owner_id: user.id, created_by: user.id})`
- **Update**: `supabase.from('contacts').update(data).eq('id', id)`
- **Delete**: `supabase.from('contacts').delete().eq('id', id)`

## No Database Changes Needed
The `contacts` table and RLS policies already exist and allow all operations for authenticated users.

## Files
| File | Action |
|------|--------|
| `src/components/contacts/ContactFormDialog.tsx` | Create |
| `src/components/contacts/ContactDeleteDialog.tsx` | Create |
| `src/components/contacts/ContactsTable.tsx` | Create |
| `src/pages/crm/ContactsPage.tsx` | Rewrite |

