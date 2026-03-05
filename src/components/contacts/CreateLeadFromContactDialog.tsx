import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CreateLeadFromContactDialogProps {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateLeadFromContactDialog({ contactId, open, onOpenChange }: CreateLeadFromContactDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").insert({
        contact_id: contactId,
        title,
        estimated_value: estimatedValue ? Number(estimatedValue) : null,
        source: source || null,
        notes: notes || null,
        owner_id: user?.id,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-leads", contactId] });
      toast({ title: "Лийдът е създаден успешно" });
      resetAndClose();
    },
    onError: () => {
      toast({ title: "Грешка при създаване на лийд", variant: "destructive" });
    },
  });

  function resetAndClose() {
    setTitle("");
    setEstimatedValue("");
    setSource("");
    setNotes("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Нов лийд</DialogTitle>
          <DialogDescription>Създайте нов лийд, свързан с този контакт.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="lead-title">Заглавие *</Label>
            <Input id="lead-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-value">Очаквана стойност (лв.)</Label>
            <Input id="lead-value" type="number" min="0" step="0.01" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-source">Източник</Label>
            <Input id="lead-source" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-notes">Бележки</Label>
            <Textarea id="lead-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetAndClose}>Отказ</Button>
            <Button type="submit" disabled={!title.trim() || mutation.isPending}>
              {mutation.isPending ? "Създаване..." : "Създай"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
