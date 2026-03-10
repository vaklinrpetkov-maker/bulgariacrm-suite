import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

interface TaskDeleteDialogProps {
  task: Tables<"tasks"> | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TaskDeleteDialog({ task, onConfirm, onCancel }: TaskDeleteDialogProps) {
  return (
    <AlertDialog open={!!task} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Изтриване на задача</AlertDialogTitle>
          <AlertDialogDescription>
            Сигурни ли сте, че искате да изтриете задачата „{task?.title}"? Това действие е необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Отказ</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Изтрий
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
