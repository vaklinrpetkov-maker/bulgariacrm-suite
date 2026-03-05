import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

interface ContactDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  contact: Tables<"contacts"> | null;
  isLoading?: boolean;
}

export default function ContactDeleteDialog({ open, onOpenChange, onConfirm, contact, isLoading }: ContactDeleteDialogProps) {
  const name = contact?.type === "company"
    ? contact.company_name
    : [contact?.first_name, contact?.last_name].filter(Boolean).join(" ");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Изтриване на контакт</AlertDialogTitle>
          <AlertDialogDescription>
            Сигурни ли сте, че искате да изтриете <strong>{name}</strong>? Това действие е необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Отказ</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isLoading ? "Изтриване..." : "Изтрий"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
