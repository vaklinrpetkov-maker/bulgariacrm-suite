import { useState, useMemo } from "react";
import { } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, LayoutList, Kanban } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskFormDialog, { type TaskFormValues } from "@/components/tasks/TaskFormDialog";
import TaskDeleteDialog from "@/components/tasks/TaskDeleteDialog";
import TasksTable from "@/components/tasks/TasksTable";
import TasksKanban from "@/components/tasks/TasksKanban";
import type { Tables } from "@/integrations/supabase/types";

const TasksPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Tables<"tasks"> | null>(null);
  const [deleteTask, setDeleteTask] = useState<Tables<"tasks"> | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email");
      return data ?? [];
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.user_id, p.full_name || p.email || "—"]));

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t) => ({ ...t, _assigneeName: t.assignee_id ? profileMap.get(t.assignee_id) ?? null : null }));
    },
    enabled: profiles.length > 0 || true,
  });

  const createMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const { error } = await supabase.from("tasks").insert({
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        due_date: values.due_date || null,
        assignee_id: values.assignee_id || null,
        owner_id: user?.id,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Задачата е създадена" });
    },
    onError: () => toast({ title: "Грешка при създаване", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TaskFormValues }) => {
      const { error } = await supabase.from("tasks").update({
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        due_date: values.due_date || null,
        assignee_id: values.assignee_id || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Задачата е обновена" });
    },
    onError: () => toast({ title: "Грешка при обновяване", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Задачата е изтрита" });
    },
    onError: () => toast({ title: "Грешка при изтриване", variant: "destructive" }),
  });

  const statusChangeMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Статусът е обновен" });
    },
  });

  const enrichedTasks = tasks.map((t) => ({
    ...t,
    _assigneeName: t.assignee_id ? profileMap.get(t.assignee_id) ?? null : null,
  }));

  const filtered = enrichedTasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (ownerFilter !== "all" && t.assignee_id !== ownerFilter) return false;
    return true;
  });

  const handleEdit = (task: Tables<"tasks">) => {
    setEditTask(task);
    setFormOpen(true);
  };

  const handleFormSubmit = (values: TaskFormValues) => {
    if (editTask) {
      updateMutation.mutate({ id: editTask.id, values });
    } else {
      createMutation.mutate(values);
    }
    setEditTask(null);
  };

  return (
    <div>
      <PageHeader
        title="Задачи"
        description="Ежедневни задачи и операции"
        actions={
          <Button className="gradient-primary shadow-md shadow-primary/20" onClick={() => { setEditTask(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Нова задача
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {/* KPI Bar */}
        {(() => {
          const now = new Date();
          const total = filtered.length;
          const inProgress = filtered.filter((t) => t.status === "in_progress").length;
          const overdue = filtered.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== "done" && t.status !== "cancelled").length;
          const doneOnTime = filtered.filter((t) => t.status === "done" && (!t.due_date || new Date(t.updated_at) <= new Date(t.due_date))).length;
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard emoji="📋" title="Общо задачи" value={total} />
              <StatCard emoji="🔄" title="В процес" value={inProgress} />
              <StatCard emoji="⚠️" title="Просрочени" value={overdue} description={overdue > 0 ? "Изискват внимание" : undefined} />
              <StatCard emoji="✅" title="В срок" value={doneOnTime} description="Завършени навреме" />
            </div>
          );
        })()}
        {/* Filters & view toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Търсене..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Статус" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              <SelectItem value="todo">За изпълнение</SelectItem>
              <SelectItem value="in_progress">В процес</SelectItem>
              <SelectItem value="done">Завършени</SelectItem>
              <SelectItem value="cancelled">Отказани</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Приоритет" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички</SelectItem>
              <SelectItem value="low">Нисък</SelectItem>
              <SelectItem value="medium">Среден</SelectItem>
              <SelectItem value="high">Висок</SelectItem>
              <SelectItem value="urgent">Спешен</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Отговорник" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички отговорници</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email || "—"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")} className="ml-auto">
            <TabsList>
              <TabsTrigger value="table"><LayoutList className="h-4 w-4 mr-1" />Таблица</TabsTrigger>
              <TabsTrigger value="kanban"><Kanban className="h-4 w-4 mr-1" />Канбан</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Зареждане...</div>
        ) : view === "table" ? (
          <TasksTable tasks={filtered} onEdit={handleEdit} onDelete={setDeleteTask} />
        ) : (
          <TasksKanban
            tasks={filtered}
            onEdit={handleEdit}
            onStatusChange={(id, status) => statusChangeMutation.mutate({ id, status })}
          />
        )}
      </div>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditTask(null); }}
        onSubmit={handleFormSubmit}
        isEdit={!!editTask}
        profiles={profiles}
        defaultValues={editTask ? {
          title: editTask.title,
          description: editTask.description,
          status: editTask.status,
          priority: editTask.priority,
          due_date: editTask.due_date ? editTask.due_date.slice(0, 16) : "",
          assignee_id: editTask.assignee_id ?? "",
        } : undefined}
      />

      <TaskDeleteDialog
        task={deleteTask}
        onConfirm={() => { if (deleteTask) deleteMutation.mutate(deleteTask.id); setDeleteTask(null); }}
        onCancel={() => setDeleteTask(null)}
      />
    </div>
  );
};

export default TasksPage;
