import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Send, Mail, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";

interface ContactEmailsTabProps {
  contactId: string;
  contactEmail: string | null;
}

export default function ContactEmailsTab({ contactId, contactEmail }: ContactEmailsTabProps) {
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["contact-emails", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("contact_id", contactId)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-emails");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contact-emails", contactId] });
      toast({ title: `Синхронизирани ${data?.synced || 0} нови имейла.` });
    },
    onError: (err) => {
      console.error("Sync error:", err);
      toast({ title: "Грешка при синхронизация.", variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!contactEmail) throw new Error("Контактът няма имейл адрес");
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { to: contactEmail, subject, body, contact_id: contactId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Грешка при изпращане");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-emails", contactId] });
      setComposeOpen(false);
      setSubject("");
      setBody("");
      toast({ title: "Имейлът е изпратен успешно." });
    },
    onError: (err) => {
      console.error("Send error:", err);
      toast({ title: err instanceof Error ? err.message : "Грешка при изпращане.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="space-y-2 py-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>;
  }

  return (
    <div className="space-y-3 p-2">
      <div className="flex gap-2 items-center">
        <Button size="sm" onClick={() => setComposeOpen(true)} disabled={!contactEmail}>
          <Send className="h-4 w-4 mr-1" /> Нов имейл
        </Button>
        <Button size="sm" variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} /> Синхронизирай
        </Button>
        {!contactEmail && (
          <span className="text-xs text-muted-foreground">Контактът няма имейл адрес</span>
        )}
      </div>

      {emails.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Няма имейли за този контакт.</p>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                {email.direction === "inbound" ? (
                  <ArrowDownLeft className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {email.direction === "inbound" ? "Входящ" : "Изходящ"}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(email.sent_at), "dd.MM.yyyy HH:mm")}
                </span>
              </div>
              <p className="text-sm font-medium truncate">{email.subject || "(без тема)"}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {email.direction === "inbound" ? `От: ${email.from_address}` : `До: ${email.to_address}`}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Нов имейл</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>До</Label>
              <Input value={contactEmail || ""} disabled />
            </div>
            <div>
              <Label>Тема *</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Тема на имейла" />
            </div>
            <div>
              <Label>Съдържание *</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Текст на имейла..." rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Отказ</Button>
            <Button onClick={() => sendMutation.mutate()} disabled={!subject || !body || sendMutation.isPending}>
              <Send className="h-4 w-4 mr-1" /> Изпрати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Email Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(o) => !o && setSelectedEmail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEmail?.direction === "inbound" ? (
                <ArrowDownLeft className="h-5 w-5 text-blue-500" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              )}
              {selectedEmail?.subject || "(без тема)"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>От: {selectedEmail?.from_address}</span>
              <span>До: {selectedEmail?.to_address}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedEmail && format(new Date(selectedEmail.sent_at), "dd.MM.yyyy HH:mm")}
            </div>
            <div className="border-t border-border pt-3">
              <div className="text-sm whitespace-pre-wrap">
                {selectedEmail?.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                ) : (
                  selectedEmail?.body_text || "(празен имейл)"
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
