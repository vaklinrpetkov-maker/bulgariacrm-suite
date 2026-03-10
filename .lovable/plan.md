

## Plan: Add Empty State Illustrations to SLA Charts

Replace the plain "Няма данни" text in the SLA dashboard with styled empty state placeholders using Lucide icons and descriptive hints.

### Changes in `src/components/dashboard/SlaDashboard.tsx`

1. **Import** `PieChart as PieChartIcon`, `BarChart3`, `Clock` icons from `lucide-react`

2. **SLA KPI Card** (lines ~160-190): When `slaStats.total === 0`, show an empty state with a `Clock` icon, "Няма данни за SLA" title, and hint "Имейли с 'форма' ще се проследяват тук"

3. **Pie Chart** (line 221): Replace the plain text with a centered empty state using `PieChartIcon` icon + hint text "Данните ще се визуализират при получени имейли"

4. **Trend Chart** (lines 234-252): When all trend data values are 0, show empty state with `BarChart3` icon + hint "Тренд данни ще се появят с времето"

Each empty state will use a soft icon (muted color, ~32px), a short title, and a descriptive subtitle — consistent with the existing `EmptyState` component style but inline (smaller).

