import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

function getContactName(c: Tables<"contacts">) {
  if (c.type === "company") return c.company_name || "—";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Tables<"leads"> | null;
}

export default function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!lead;

  const [contactId, setContactId] = useState("");
  const [title, setTitle] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");
  const [projectName, setProjectName] = useState("");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false }).limit(9999);
      if (error) throw error;
      return data;
    },
    enabled: open && !isEdit,
  });

  useEffect(() => {
    if (lead) {
      setContactId(lead.contact_id);
      setTitle(lead.title);
      setEstimatedValue(lead.estimated_value != null ? String(lead.estimated_value) : "");
      setSource(lead.source || "");
      setNotes(lead.notes || "");
      setStatus(lead.status);
      setProjectName((lead as any).project_name || "");
    } else {
      setContactId("");
      setTitle("");
      setEstimatedValue("");
      setSource("");
      setNotes("");
      setStatus("new");
      setProjectName("");
    }
  }, [lead, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const { error } = await supabase.from("leads").update({
          title,
          estimated_value: estimatedValue ? Number(estimatedValue) : null,
          source: source || null,
          notes: notes || null,
          status: status as Tables<"leads">["status"],
          project_name: projectName || null,
        } as any).eq("id", lead!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads").insert({
          contact_id: contactId,
          title,
          estimated_value: estimatedValue ? Number(estimatedValue) : null,
          source: source || null,
          notes: notes || null,
          owner_id: user?.id,
          created_by: user?.id,
          project_name: projectName || null,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ["contact-leads", lead!.contact_id] });
      }
      toast({ title: isEdit ? "Лийдът е обновен" : "Лийдът е създаден" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Грешка при запазване", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактиране на лийд" : "Нов лийд"}</DialogTitle>
          <DialogDescription>{isEdit ? "Редактирайте данните на лийда." : "Създайте нов лийд."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label>Контакт *</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger><SelectValue placeholder="Изберете контакт" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{getContactName(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Заглавие *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          {isEdit && (
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Търсене € (бюджет на клиента)</Label>
            <Input type="number" min="0" step="0.01" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="Сума в евро" />
          </div>
          <div className="space-y-2">
            <Label>Проект</Label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Име на проекта" />
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
            <Button type="submit" disabled={(!isEdit && !contactId) || !title.trim() || mutation.isPending}>
              {mutation.isPending ? "Запазване..." : isEdit ? "Запази" : "Създай"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
