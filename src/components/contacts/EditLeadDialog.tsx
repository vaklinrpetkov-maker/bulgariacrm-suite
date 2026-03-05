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
  { value: "new", label: "Нов" },
  { value: "contacted", label: "Контактуван" },
  { value: "qualified", label: "Квалифициран" },
  { value: "unqualified", label: "Неквалифициран" },
];

interface EditLeadDialogProps {
  lead: Tables<"leads"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditLeadDialog({ lead, open, onOpenChange }: EditLeadDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");

  useEffect(() => {
    if (lead) {
      setTitle(lead.title);
      setEstimatedValue(lead.estimated_value != null ? String(lead.estimated_value) : "");
      setSource(lead.source || "");
      setNotes(lead.notes || "");
      setStatus(lead.status);
    }
  }, [lead]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").update({
        title,
        estimated_value: estimatedValue ? Number(estimatedValue) : null,
        source: source || null,
        notes: notes || null,
        status: status as Tables<"leads">["status"],
      }).eq("id", lead!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-leads", lead!.contact_id] });
      toast({ title: "Лийдът е обновен успешно" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Грешка при обновяване на лийд", variant: "destructive" });
    },
  });

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактиране на лийд</DialogTitle>
          <DialogDescription>Редактирайте данните на лийда.</DialogDescription>
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
            <Label>Очаквана стойност (лв.)</Label>
            <Input type="number" min="0" step="0.01" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Източник</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} />
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
