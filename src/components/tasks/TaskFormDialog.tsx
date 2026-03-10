import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

const taskSchema = z.object({
  title: z.string().min(1, "Заглавието е задължително").max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["todo", "in_progress", "done", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskFormValues) => void;
  defaultValues?: Partial<TaskFormValues>;
  isEdit?: boolean;
  profiles?: { user_id: string; full_name: string | null; email: string | null }[];
}

const STATUS_LABELS: Record<string, string> = {
  todo: "За изпълнение",
  in_progress: "В процес",
  done: "Завършена",
  cancelled: "Отказана",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Нисък",
  medium: "Среден",
  high: "Висок",
  urgent: "Спешен",
};

export default function TaskFormDialog({ open, onOpenChange, onSubmit, defaultValues, isEdit, profiles = [] }: TaskFormDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "",
      assignee_id: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: "",
        assignee_id: "",
        ...defaultValues,
      });
    }
  }, [open, defaultValues]);

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактиране на задача" : "Нова задача"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Променете данните на задачата." : "Попълнете данните за новата задача."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Заглавие *</FormLabel>
                <FormControl><Input placeholder="Напр. Обаждане на клиент" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Описание</FormLabel>
                <FormControl><Textarea placeholder="Допълнителни детайли..." rows={3} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Приоритет</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Краен срок</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="assignee_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Отговорник</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)} value={field.value || "__none__"}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Изберете..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Без отговорник</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.full_name || p.email || "—"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
              <Button type="submit" className="gradient-primary shadow-md shadow-primary/20">
                {isEdit ? "Запази" : "Създай"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
