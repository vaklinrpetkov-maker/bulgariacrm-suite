import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BulkDeleteBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
  isDeleting?: boolean;
}

export default function BulkDeleteBar({ count, onDelete, onClear, isDeleting }: BulkDeleteBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 animate-in slide-in-from-top-2">
        <span className="text-sm font-medium text-foreground">
          {count} избрани
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Изтрий избраните
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Отмени
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Потвърждение за изтриване</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете {count} записа? Действието е необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(); setConfirmOpen(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Изтрий {count} записа
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
