import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Tables<"meetings"> | null;
}

const MeetingFormDialog = ({ open, onOpenChange, meeting }: MeetingFormDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("scheduled");
  const [leadId, setLeadId] = useState<string>("none");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-meeting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, title, contacts(first_name, last_name, company_name, type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      const d = new Date(meeting.scheduled_at);
      setScheduledDate(d);
      setScheduledTime(format(d, "HH:mm"));
      setDurationMinutes(String(meeting.duration_minutes ?? 60));
      setLocation(meeting.location || "");
      setDescription(meeting.description || "");
      setNotes(meeting.notes || "");
      setStatus(meeting.status);
      setLeadId(meeting.lead_id || "none");
    } else {
      setTitle("");
      setScheduledDate(undefined);
      setScheduledTime("10:00");
      setDurationMinutes("60");
      setLocation("");
      setDescription("");
      setNotes("");
      setStatus("scheduled");
      setLeadId("none");
    }
  }, [meeting, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!scheduledDate) throw new Error("Дата е задължителна");
      const [h, m] = scheduledTime.split(":").map(Number);
      const scheduled = new Date(scheduledDate);
      scheduled.setHours(h, m, 0, 0);

      const payload = {
        title,
        scheduled_at: scheduled.toISOString(),
        duration_minutes: parseInt(durationMinutes) || 60,
        location: location || null,
        description: description || null,
        notes: notes || null,
        status: status as any,
        lead_id: leadId === "none" ? null : leadId,
        owner_id: user?.id || null,
        created_by: user?.id || null,
      };

      if (meeting) {
        const { created_by, ...updatePayload } = payload;
        const { error } = await supabase.from("meetings").update(updatePayload).eq("id", meeting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meetings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      onOpenChange(false);
      toast({ title: meeting ? "Срещата е обновена." : "Срещата е създадена." });
    },
    onError: () => toast({ title: "Грешка при запис.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{meeting ? "Редактиране на среща" : "Нова среща"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Заглавие *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заглавие на срещата" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Дата *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "dd.MM.yyyy") : "Избери дата"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Час</Label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Продължителност (мин.)</Label>
              <Input type="number" min="15" step="15" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </div>
            <div>
              <Label>Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Насрочена</SelectItem>
                  <SelectItem value="completed">Проведена</SelectItem>
                  <SelectItem value="cancelled">Отказана</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Локация</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Офис, онлайн, адрес..." />
          </div>
          <div>
            <Label>Свързан лийд</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger><SelectValue placeholder="Без лийд" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без лийд</SelectItem>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Тема и дневен ред..." rows={2} />
          </div>
          <div>
            <Label>Бележки</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Вътрешни бележки..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
          <Button onClick={() => mutation.mutate()} disabled={!title || !scheduledDate || mutation.isPending}>
            {meeting ? "Запази" : "Създай"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingFormDialog;
