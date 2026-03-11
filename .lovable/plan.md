

## Plan: Add SOP Help Button to Every Page

### Approach

1. **Create a reusable `SopHelpButton` component** that renders a help icon button (using `HelpCircle` from lucide-react). On click, it opens a Dialog/Sheet displaying the SOP documentation for the current page. Each page passes its SOP content as a prop or key.

2. **Create a `sopContent.ts` data file** containing all SOP documentation as a map of page keys to structured content (title + markdown-like sections in Bulgarian). This covers all 15 pages:
   - Dashboard, Contacts, Leads, Meetings, Deals, Contracts, Mail, Inventory, Documents, Tasks, Projects, Budgets, Commissions, Workflows, Settings, Notifications

3. **Integrate the button into `PageHeader`** by adding an optional `sopKey` prop. When provided, the SOP help button renders automatically at the right side of the header (before the `actions`). This avoids editing every single page file -- pages just pass `sopKey="tasks"` etc. to PageHeader.

### Component: `SopHelpButton`
- Renders a `HelpCircle` icon button with a tooltip "Стандартна оперативна процедура"
- Opens a `Dialog` with a `ScrollArea` containing the SOP text
- Receives `sopKey: string` prop, looks up content from the data file

### PageHeader Changes
- Add optional `sopKey?: string` prop
- When present, render `<SopHelpButton sopKey={sopKey} />` in the header bar between title and actions

### Page Changes (minimal)
Each page's `<PageHeader>` call gets a `sopKey` prop added:
- Dashboard: `sopKey="dashboard"`
- ContactsPage: `sopKey="contacts"`
- LeadsPage: `sopKey="leads"`
- MeetingsPage: `sopKey="meetings"`
- DealsPage: `sopKey="deals"`
- ContractsPage: `sopKey="contracts"`
- MailPage: `sopKey="mail"`
- InventoryPage: `sopKey="inventory"`
- DocumentsPage: `sopKey="documents"`
- TasksPage: `sopKey="tasks"`
- ProjectsPage: `sopKey="projects"`
- BudgetsPage: `sopKey="budgets"`
- CommissionsPage: `sopKey="commissions"`
- WorkflowsPage: `sopKey="workflows"`
- NotificationsPage: `sopKey="notifications"`
- SettingsPage: `sopKey="settings"`

### SOP Content (Bulgarian)
Each SOP document will include:
- **Цел** (Purpose) -- what the module is for
- **Достъп** (Access) -- how to navigate to it
- **Основни функции** (Key features) -- step-by-step for CRUD, filters, exports
- **Правила и добри практики** (Rules & best practices)
- **Често задавани въпроси** (FAQ)

Content will be tailored to each module's actual functionality (e.g., Tasks SOP covers table/kanban views, filters, KPI bar; Contacts SOP covers import, export, profile dialog, etc.).

### Files to Create
- `src/data/sopContent.ts` -- SOP documentation map
- `src/components/SopHelpButton.tsx` -- reusable help button + dialog

### Files to Edit
- `src/components/PageHeader.tsx` -- add `sopKey` prop and render help button
- All 16 page files -- add `sopKey` prop to their `<PageHeader>` calls

