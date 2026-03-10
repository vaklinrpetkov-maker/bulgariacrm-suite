import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Clock, AlertTriangle, User } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: "todo", label: "За изпълнение", color: "border-t-muted-foreground" },
  { key: "in_progress", label: "В процес", color: "border-t-primary" },
  { key: "done", label: "Завършени", color: "border-t-green-500" },
  { key: "cancelled", label: "Отказани", color: "border-t-destructive" },
];

const PRIORITY_DOTS: Record<string, string> = {
  low: "bg-muted-foreground",
  medium: "bg-primary",
  high: "bg-orange-500",
  urgent: "bg-destructive",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Нисък",
  medium: "Среден",
  high: "Висок",
  urgent: "Спешен",
};

interface TasksKanbanProps {
  tasks: (Tables<"tasks"> & { _assigneeName?: string | null })[];
  onEdit: (task: Tables<"tasks">) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export default function TasksKanban({ tasks, onEdit, onStatusChange }: TasksKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            className={cn("rounded-lg border border-border bg-card/50 border-t-4", col.color)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("taskId");
              if (taskId) onStatusChange(taskId, col.key);
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <Badge variant="outline" className="text-xs">{columnTasks.length}</Badge>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {columnTasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done" && task.status !== "cancelled";
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
                    onClick={() => onEdit(task)}
                    className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <span className={cn("h-2 w-2 rounded-full", PRIORITY_DOTS[task.priority])} />
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      {task.due_date && (
                        <span className={cn("inline-flex items-center gap-1 text-xs", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                          {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {format(new Date(task.due_date), "dd.MM")}
                        </span>
                      )}
                      {task._assigneeName && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <User className="h-3 w-3" />
                          {task._assigneeName.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
