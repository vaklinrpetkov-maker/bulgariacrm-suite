import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { bg } from "date-fns/locale";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Download, Upload, CalendarIcon, X, List, CalendarDays, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { DateRange } from "react-day-picker";
import { exportToExcel } from "@/lib/exportToExcel";
import MeetingFormDialog from "@/components/meetings/MeetingFormDialog";
import { ColumnFilter } from "@/components/ui/column-filter";
import { useColumnFilters } from "@/hooks/useColumnFilters";
import BulkDeleteBar from "@/components/BulkDeleteBar";
import { useRowSelection } from "@/hooks/useRowSelection";
import type { Tables } from "@/integrations/supabase/types";

const statusLabels: Record<string, string> = {
  scheduled: "Насрочена", completed: "Проведена", cancelled: "Отказана",
};
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const filterColumns = [
  { key: "title", getValue: (m: any) => m.title || "—" },
  { key: "datetime", getValue: (m: any) => format(new Date(m.scheduled_at), "dd.MM.yyyy HH:mm") },
  { key: "duration", getValue: (m: any) => m.duration_minutes ? `${m.duration_minutes} мин.` : "—" },
  { key: "location", getValue: (m: any) => m.location || "—" },
  { key: "lead", getValue: (m: any) => m.leads?.title || "—" },
  { key: "status", getValue: (m: any) => statusLabels[m.status] || m.status || "—" },
];

const MeetingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Tables<"meetings"> | null>(null);
  const [deleteMeeting, setDeleteMeeting] = useState<Tables<"meetings"> | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [calMonth, setCalMonth] = useState(new Date());

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user?.id,
  });

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*, leads(title)")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setDeleteMeeting(null);
      toast({ title: "Срещата е изтрита." });
    },
    onError: () => toast({ title: "Грешка при изтриване.", variant: "destructive" }),
  });

  const preFiltered = meetings.filter((m) => {
    const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.location || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const d = new Date(m.scheduled_at);
    const matchesDateFrom = !dateRange?.from || d >= new Date(format(dateRange.from, "yyyy-MM-dd"));
    const matchesDateTo = !dateRange?.to || d <= new Date(format(dateRange.to, "yyyy-MM-dd") + "T23:59:59");
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const { filters, uniqueValues, toggleFilter, setColumnFilter, clearFilter, filteredData: filtered } =
    useColumnFilters(preFiltered, filterColumns);

  const selection = useRowSelection(filtered);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("meetings").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      selection.clearSelection();
      toast({ title: "Записите са изтрити" });
    },
    onError: () => toast({ title: "Грешка при изтриване", variant: "destructive" }),
  });

  const handleExport = async () => {
    await exportToExcel(
      filtered.map((m) => ({
        title: m.title,
        scheduled_at: format(new Date(m.scheduled_at), "dd.MM.yyyy HH:mm"),
        duration: m.duration_minutes ? `${m.duration_minutes} мин.` : "",
        location: m.location || "",
        lead: (m as any).leads?.title || "",
        status: statusLabels[m.status] || m.status,
      })),
      [
        { key: "title", label: "Заглавие" },
        { key: "scheduled_at", label: "Дата/час" },
        { key: "duration", label: "Продължителност" },
        { key: "location", label: "Локация" },
        { key: "lead", label: "Лийд" },
        { key: "status", label: "Статус" },
      ],
      "Срещи"
    );
  };

  // Calendar helpers
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const dayNames = ["Пон", "Вто", "Сря", "Чет", "Пет", "Съб", "Нед"];

  const meetingsByDay = (day: Date) =>
    meetings.filter((m) => isSameDay(new Date(m.scheduled_at), day));

  return (
    <div>
      <PageHeader
        title="Срещи"
        description="Календар и управление на срещи"
        sopKey="meetings"
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {/* TODO: import */}}>
                  <Upload className="mr-2 h-4 w-4" />Импорт
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />Експорт
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Нова среща</Button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Търсене по заглавие или локация..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Всички статуси" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              <SelectItem value="scheduled">Насрочена</SelectItem>
              <SelectItem value="completed">Проведена</SelectItem>
              <SelectItem value="cancelled">Отказана</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-64 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "dd.MM.yyyy")} – {format(dateRange.to, "dd.MM.yyyy")}</> : format(dateRange.from, "dd.MM.yyyy")) : "Период"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {dateRange && <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}><X className="h-4 w-4" /></Button>}

          <div className="ml-auto flex gap-1 border border-border rounded-md p-0.5">
            <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")}><List className="h-4 w-4 mr-1" />Таблица</Button>
            <Button variant={view === "calendar" ? "secondary" : "ghost"} size="sm" onClick={() => setView("calendar")}><CalendarDays className="h-4 w-4 mr-1" />Календар</Button>
          </div>
        </div>

        <BulkDeleteBar
          count={selection.selectedCount}
          onDelete={() => bulkDeleteMutation.mutate([...selection.selectedIds])}
          onClear={selection.clearSelection}
          isDeleting={bulkDeleteMutation.isPending}
        />

        {view === "table" && (
          isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Зареждане...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">Няма намерени срещи.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "40px" }} resizable={false}>
                      <Checkbox
                        checked={selection.allSelected ? true : selection.someSelected ? "indeterminate" : false}
                        onCheckedChange={() => selection.toggleAll()}
                      />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter title="Заглавие" columnKey="title" values={uniqueValues["title"] || []} selected={filters["title"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter title="Дата/час" columnKey="datetime" values={uniqueValues["datetime"] || []} selected={filters["datetime"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter title="Продължителност" columnKey="duration" values={uniqueValues["duration"] || []} selected={filters["duration"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter title="Локация" columnKey="location" values={uniqueValues["location"] || []} selected={filters["location"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter title="Лийд" columnKey="lead" values={uniqueValues["lead"] || []} selected={filters["lead"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter title="Статус" columnKey="status" values={uniqueValues["status"] || []} selected={filters["status"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                    </TableHead>
                    <TableHead className="w-24">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const isChecked = selection.selectedIds.has(m.id);
                    return (
                      <TableRow key={m.id} data-state={isChecked ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox checked={isChecked} onCheckedChange={() => selection.toggle(m.id)} />
                        </TableCell>
                        <TableCell className="font-medium">{m.title}</TableCell>
                        <TableCell>{format(new Date(m.scheduled_at), "dd.MM.yyyy HH:mm")}</TableCell>
                        <TableCell>{m.duration_minutes ? `${m.duration_minutes} мин.` : "—"}</TableCell>
                        <TableCell>{m.location || "—"}</TableCell>
                        <TableCell>{(m as any).leads?.title || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[m.status]}>{statusLabels[m.status] || m.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditMeeting(m)}><Pencil className="h-4 w-4" /></Button>
                            {isAdmin && <Button variant="ghost" size="icon" onClick={() => setDeleteMeeting(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )
        )}

        {view === "calendar" && (
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Button variant="ghost" size="icon" onClick={() => setCalMonth(subMonths(calMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <h2 className="text-base font-semibold capitalize">{format(calMonth, "LLLL yyyy", { locale: bg })}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCalMonth(addMonths(calMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-7">
              {dayNames.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-border">{d}</div>
              ))}
              {calDays.map((day) => {
                const dayMeetings = meetingsByDay(day);
                const isCurrentMonth = isSameMonth(day, calMonth);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[100px] border-b border-r border-border p-1.5 transition-colors",
                      !isCurrentMonth && "bg-muted/30",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <div className={cn("text-xs font-medium mb-1", isToday ? "text-primary" : !isCurrentMonth ? "text-muted-foreground/50" : "text-foreground")}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayMeetings.slice(0, 3).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setEditMeeting(m)}
                          className={cn(
                            "w-full text-left text-[11px] leading-tight rounded px-1 py-0.5 truncate",
                            statusColors[m.status] || "bg-muted"
                          )}
                        >
                          <span className="font-medium">{format(new Date(m.scheduled_at), "HH:mm")}</span>{" "}
                          {m.title}
                        </button>
                      ))}
                      {dayMeetings.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">+{dayMeetings.length - 3} още</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <MeetingFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <MeetingFormDialog open={!!editMeeting} onOpenChange={(o) => { if (!o) setEditMeeting(null); }} meeting={editMeeting} />

      <AlertDialog open={!!deleteMeeting} onOpenChange={(o) => { if (!o) setDeleteMeeting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Потвърждение за изтриване</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете срещата "{deleteMeeting?.title}"? Действието е необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMeeting && deleteMutation.mutate(deleteMeeting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MeetingsPage;
