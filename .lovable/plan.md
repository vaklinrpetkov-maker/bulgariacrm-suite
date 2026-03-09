

## Add a standalone Inbox/Mail page

### What
A new top-level "Поща" (Mail) page accessible from the sidebar that shows ALL emails from the `emails` table — not filtered by a single contact. This gives a full inbox view of the shared `office@vminvest.bg` mailbox.

### Changes

1. **New page `src/pages/MailPage.tsx`**
   - Query all emails from the `emails` table, ordered by `sent_at` desc
   - Split-pane or list+detail layout: email list on the left, selected email content on the right
   - Filter tabs or badges for Inbound/Outbound/All
   - Show linked contact name (join or separate query) with a link to open their profile
   - "Синхронизирай" button to trigger `sync-emails` edge function
   - "Нов имейл" compose dialog (reuse pattern from ContactEmailsTab)
   - Search/filter by subject, sender, date range

2. **Update `src/components/AppSidebar.tsx`**
   - Add "Поща" nav item with `Mail` icon between CRM and Имоти

3. **Update `src/App.tsx`**
   - Add route `/mail` → `MailPage`

### UI Layout
```text
┌─────────────────────────────────────────────┐
│ [Синхронизирай] [Нов имейл]   🔍 Търсене   │
│ [Всички] [Входящи] [Изходящи]              │
├──────────────────┬──────────────────────────┤
│ Email list       │ Selected email preview   │
│ - Subject        │ From / To / Date         │
│ - From/To        │                          │
│ - Date           │ Body content             │
│ - Contact badge  │                          │
│                  │                          │
└──────────────────┴──────────────────────────┘
```

No database changes needed — the existing `emails` table has all required data.

