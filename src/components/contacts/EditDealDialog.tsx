import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

const statusOptions = [
  { value: "negotiation", label: "Преговори" },
  { value: "proposal", label: "Оферта" },
  { value: "won", label: "Спечелена" },
  { value: "lost", label: "Загубена" },
];

interface EditDealDialogProps {
  deal: Tables<"deals"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("negotiation");

  useEffect(() => {
    if (deal) {
      setTitle(deal.title);
      setValue(deal.value != null ? String(deal.value) : "");
      setNotes(deal.notes || "");
      setStatus(deal.status);
    }
  }, [deal]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("deals").update({
        title,
        value: value ? Number(value) : null,
        notes: notes || null,
        status: status as Tables<"deals">["status"],
      }).eq("id", deal!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-deals", deal!.contact_id] });
      toast({ title: "Сделката е обновена успешно" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Грешка при обновяване на сделка", variant: "destructive" });
    },
  });

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактиране на сделка</DialogTitle>
          <DialogDescription>Редактирайте данните на сделката.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Заглавие *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Стойност (лв.)</Label>
            <Input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Бележки</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
            <Button type="submit" disabled={!title.trim() || mutation.isPending}>
              {mutation.isPending ? "Запазване..." : "Запази"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
