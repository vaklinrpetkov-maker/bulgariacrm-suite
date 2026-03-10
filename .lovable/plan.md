

## Add "Mark as Read" functionality to the Mail page

Currently there's no way to mark emails as read from the UI. The `emails` table already has an `is_read` boolean column, so no database changes are needed.

### Changes

**`src/pages/MailPage.tsx`**:
1. **Auto-mark as read on selection**: When a user clicks an email in the list, automatically set `is_read = true` via a mutation (only if currently unread). This updates the database and invalidates the unread badge count query.
2. **Visual distinction for unread**: Style unread emails in the list with a bolder font weight or a small dot indicator, so the user can distinguish read vs unread at a glance.
3. **Manual toggle**: Add a small button (e.g., envelope icon) in the email detail header to toggle read/unread status, in case the user wants to mark something as unread again.

### Flow
- User clicks email → detail panel opens → if `is_read === false`, fire an update mutation → invalidate both `all-emails` and `unread-emails-count` queries
- Unread emails in the list get a blue dot or bold styling
- Toggle button in detail view allows marking back as unread

