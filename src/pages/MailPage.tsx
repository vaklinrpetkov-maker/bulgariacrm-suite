import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Send, Mail, ArrowDownLeft, ArrowUpRight, RefreshCw, Search, X, User, Reply, MailOpen, MailIcon, Settings,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function MailPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "inbound" | "outbound">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  // Fetch user's email account
  const { data: emailAccount, isLoading: accountLoading } = useQuery({
    queryKey: ["user-email-account"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_email_accounts")
        .select("email_address")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch emails (RLS scopes to current user's created_by)
  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["all-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emails")
        .select("*, contacts(id, first_name, last_name, company_name)")
        .order("sent_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!emailAccount,
  });

  // Filtered + searched
  const filtered = useMemo(() => {
    let list = emails;
    if (filter !== "all") list = list.filter((e: any) => e.direction === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e: any) =>
          (e.subject || "").toLowerCase().includes(q) ||
          e.from_address.toLowerCase().includes(q) ||
          e.to_address.toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, filter, search]);

  const selected = useMemo(
    () => (selectedId ? emails.find((e: any) => e.id === selectedId) : null),
    [emails, selectedId]
  );

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("emails").update({ is_read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-emails"] });
      queryClient.invalidateQueries({ queryKey: ["unread-emails-count"] });
    },
  });

  // Auto-mark as read when selecting an unread email
  useEffect(() => {
    if (selected && !selected.is_read) {
      markReadMutation.mutate({ id: selected.id, is_read: true });
    }
  }, [selectedId]);

  // Sync - now uses per-user credentials
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-emails");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-emails"] });
      toast({ title: `Синхронизирани ${data?.synced || 0} нови имейла.` });
    },
    onError: (err) => toast({ title: err instanceof Error ? err.message : "Грешка при синхронизация.", variant: "destructive" }),
  });

  // Send
  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { to: composeTo, subject: composeSubject, body: composeBody },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Грешка");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-emails"] });
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      toast({ title: "Имейлът е изпратен." });
    },
    onError: (err) =>
      toast({ title: err instanceof Error ? err.message : "Грешка при изпращане.", variant: "destructive" }),
  });

  // Reply
  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Няма избран имейл");
      const replyTo = selected.from_address;
      const replySubject = selected.subject?.startsWith("Re:") ? selected.subject : `Re: ${selected.subject || ""}`;
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: replyTo,
          subject: replySubject,
          body: replyBody,
          contact_id: selected.contact_id,
          in_reply_to: selected.message_id,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Грешка");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-emails"] });
      setReplyOpen(false);
      setReplyBody("");
      toast({ title: "Отговорът е изпратен." });
    },
    onError: (err) =>
      toast({ title: err instanceof Error ? err.message : "Грешка при изпращане.", variant: "destructive" }),
  });

  const contactName = (email: any) => {
    const c = email.contacts;
    if (!c) return null;
    if (c.first_name || c.last_name) return [c.first_name, c.last_name].filter(Boolean).join(" ");
    return c.company_name || null;
  };

  // No email account configured
  if (!accountLoading && !emailAccount) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Поща" description="Конфигурирайте имейл акаунта си" sopKey="mail" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md space-y-4">
            <Mail className="h-16 w-16 mx-auto text-muted-foreground opacity-30" />
            <h2 className="text-lg font-semibold text-foreground">Няма конфигуриран имейл акаунт</h2>
            <p className="text-sm text-muted-foreground">
              За да използвате пощата, първо добавете вашия @vminvest.bg имейл акаунт в настройките.
            </p>
            <Button asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Отиди в Настройки
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Поща"
        description={emailAccount?.email_address || ""}
        sopKey="mail"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Синхронизирай
            </Button>
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              <Send className="h-4 w-4 mr-1" /> Нов имейл
            </Button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Всички</TabsTrigger>
            <TabsTrigger value="inbound">Входящи</TabsTrigger>
            <TabsTrigger value="outbound">Изходящи</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Търсене по тема, адрес..."
            className="pl-9 h-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} имейла</span>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="w-[420px] shrink-0 overflow-y-auto border-r border-border">
          {isLoading || accountLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">Няма имейли.</p>
          ) : (
            filtered.map((email: any) => {
              const name = contactName(email);
              const isSelected = email.id === selectedId;
              return (
                <button
                  key={email.id}
                  onClick={() => setSelectedId(email.id)}
                  className={`w-full text-left border-b border-border px-4 py-3 transition-colors ${
                    isSelected ? "bg-accent" : "hover:bg-muted/50"
                  } ${email.is_read ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {!email.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    {email.direction === "inbound" ? (
                      <ArrowDownLeft className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 text-accent-foreground shrink-0" />
                    )}
                    <span className={`text-xs truncate flex-1 ${!email.is_read ? "font-bold text-foreground" : "font-normal text-muted-foreground"}`}>
                      {email.direction === "inbound" ? email.from_address : email.to_address}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {format(new Date(email.sent_at), "dd.MM.yy HH:mm")}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${!email.is_read ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}`}>{email.subject || "(без тема)"}</p>
                  {name && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{name}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                {selected.direction === "inbound" ? (
                  <ArrowDownLeft className="h-5 w-5 text-primary mt-1 shrink-0" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-accent-foreground mt-1 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">{selected.subject || "(без тема)"}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span>От: {selected.from_address}</span>
                    <span>До: {selected.to_address}</span>
                    <span>{format(new Date(selected.sent_at), "dd.MM.yyyy HH:mm")}</span>
                  </div>
                  {contactName(selected) && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      <User className="h-3 w-3 mr-1" />
                      {contactName(selected)}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markReadMutation.mutate({ id: selected.id, is_read: !selected.is_read })}
                    title={selected.is_read ? "Маркирай като непрочетен" : "Маркирай като прочетен"}
                  >
                    {selected.is_read ? <MailIcon className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </Button>
                  {selected.direction === "inbound" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setReplyOpen(!replyOpen); setReplyBody(""); }}
                    >
                      <Reply className="h-4 w-4 mr-1" /> Отговори
                    </Button>
                  )}
                </div>
              </div>
              <div className="border-t border-border pt-4">
                {selected.body_html ? (
                  <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: selected.body_html }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{selected.body_text || "(празен имейл)"}</pre>
                )}
              </div>
              {replyOpen && selected.direction === "inbound" && (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Отговор до: <span className="font-medium text-foreground">{selected.from_address}</span>
                  </div>
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Напишете отговор..."
                    rows={5}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => replyMutation.mutate()}
                      disabled={!replyBody.trim() || replyMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" /> Изпрати отговор
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReplyOpen(false)}>
                      Отказ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Изберете имейл от списъка</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Нов имейл</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>До *</Label>
              <Input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <Label>Тема *</Label>
              <Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Тема" />
            </div>
            <div>
              <Label>Съдържание *</Label>
              <Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Текст..." rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Отказ</Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!composeTo || !composeSubject || !composeBody || sendMutation.isPending}
            >
              <Send className="h-4 w-4 mr-1" /> Изпрати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
