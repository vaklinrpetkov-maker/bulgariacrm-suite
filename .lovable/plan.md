

# Add Comments/Activity Tab to Contact Profile

## What
Add a new "Коментари" (Comments) tab in the contact profile dialog where users can leave timestamped notes about client activity, updates, interactions, etc. Each comment shows the author name, date, and text content with the ability to delete own comments.

## Database Changes

### New `contact_comments` table
```sql
CREATE TABLE public.contact_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments access" ON public.contact_comments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
```

## Code Changes

### 1. Create `src/components/contacts/ContactCommentsTab.tsx`
- Query `contact_comments` joined with `profiles` (for author name) ordered by `created_at DESC`
- Textarea + "Добави" button to insert new comment with current user's ID
- Each comment card shows: author name, relative timestamp, content, and a delete button (only for own comments)
- Uses `useMutation` for insert/delete, invalidates `contact-comments` query key

### 2. Update `src/components/contacts/ContactProfileDialog.tsx`
- Add new `<TabsTrigger value="comments">Коментари</TabsTrigger>` to the tab list (before "Хронология")
- Add `<TabsContent value="comments">` rendering the new `ContactCommentsTab` component
- Pass `contactId` to the new component

## Files
| File | Action |
|------|--------|
| Migration (new table) | Create via migration tool |
| `src/components/contacts/ContactCommentsTab.tsx` | Create |
| `src/components/contacts/ContactProfileDialog.tsx` | Edit (add tab) |

