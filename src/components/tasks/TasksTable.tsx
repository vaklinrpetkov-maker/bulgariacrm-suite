import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Tables } from "@/integrations/supabase/types";

const STATUS_LABELS: Record<string, string> = {
  todo: "За изпълнение",
  in_progress: "В процес",
  done: "Завършена",
  cancelled: "Отказана",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  todo: "outline",
  in_progress: "default",
  done: "secondary",
  cancelled: "destructive",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Нисък",
  medium: "Среден",
  high: "Висок",
  urgent: "Спешен",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  urgent: "bg-destructive/15 text-destructive",
};

interface TasksTableProps {
  tasks: (Tables<"tasks"> & { _assigneeName?: string | null })[];
  onEdit: (task: Tables<"tasks">) => void;
  onDelete: (task: Tables<"tasks">) => void;
}

export default function TasksTable({ tasks, onEdit, onDelete }: TasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Няма намерени задачи.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: "30%" }}>Заглавие</TableHead>
            <TableHead style={{ width: "12%" }}>Статус</TableHead>
            <TableHead style={{ width: "10%" }}>Приоритет</TableHead>
            <TableHead style={{ width: "15%" }}>Отговорник</TableHead>
            <TableHead style={{ width: "13%" }}>Краен срок</TableHead>
            <TableHead style={{ width: "12%" }}>Създадена</TableHead>
            <TableHead style={{ width: "8%" }} resizable={false}>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done" && task.status !== "cancelled";
            return (
              <TableRow key={task.id} className="cursor-pointer" onDoubleClick={() => onEdit(task)}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[task.status] ?? "outline"}>
                    {STATUS_LABELS[task.status] ?? task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority] ?? ""}`}>
                    {PRIORITY_LABELS[task.priority] ?? task.priority}
                  </span>
                </TableCell>
                <TableCell>{task._assigneeName || "—"}</TableCell>
                <TableCell className={isOverdue ? "text-destructive font-medium" : ""}>
                  {task.due_date ? format(new Date(task.due_date), "dd.MM.yyyy HH:mm") : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(task.created_at), "dd.MM.yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Редактирай</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Изтрий</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
