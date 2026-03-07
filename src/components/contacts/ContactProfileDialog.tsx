import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Mail, Pencil, Plus, Trash2, User, UserCheck, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CreateLeadFromContactDialog from "./CreateLeadFromContactDialog";
import CreateDealFromContactDialog from "./CreateDealFromContactDialog";
import EditLeadDialog from "./EditLeadDialog";
import EditDealDialog from "./EditDealDialog";
import ContactCommentsTab from "./ContactCommentsTab";
import ContactEmailsTab from "./ContactEmailsTab";
import type { Tables } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";

interface ContactProfileDialogProps {
  contact: Tables<"contacts"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getContactName(c: Tables<"contacts">) {
  if (c.type === "company") return c.company_name || "—";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center py-8 text-muted-foreground">{text}</p>;
}

function LoadingState() {
  return <div className="space-y-2 py-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-3/4" /></div>;
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

const statusLabels: Record<string, string> = {
  new: "Нов", contacted: "Контактуван", qualified: "Квалифициран", unqualified: "Неквалифициран",
  negotiation: "Преговори", proposal: "Оферта", won: "Спечелена", lost: "Загубена",
  draft: "Чернова", active: "Активен", completed: "Завършен", cancelled: "Отменен",
  scheduled: "Насрочена", created: "Създадено", updated: "Обновено", deleted: "Изтрито",
  status_changed: "Промяна на статус", payment_received: "Получено плащане",
  assigned: "Назначено", linked: "Свързано", unlinked: "Разкачено",
};

export default function ContactProfileDialog({ contact, open, onOpenChange }: ContactProfileDialogProps) {
  const contactId = contact?.id;
  const { user } = useAuth();
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [createDealOpen, setCreateDealOpen] = useState(false);
  const [editLead, setEditLead] = useState<Tables<"leads"> | null>(null);
  const [editDeal, setEditDeal] = useState<Tables<"deals"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "lead" | "deal"; id: string } | null>(null);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Sync local owner state from prop
  useEffect(() => {
    setCurrentOwnerId(contact?.owner_id ?? null);
  }, [contact?.owner_id, contact?.id]);

  // Fetch owner profile name
  const { data: ownerName } = useQuery({
    queryKey: ["contact-owner", currentOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", currentOwnerId!).single();
      return data?.full_name || "—";
    },
    enabled: !!currentOwnerId,
  });

  const assignMutation = useMutation({
    mutationFn: async (ownerId: string | null) => {
      const { error } = await supabase.from("contacts").update({ owner_id: ownerId }).eq("id", contactId!);
      if (error) throw error;
      return ownerId;
    },
    onSuccess: (ownerId) => {
      setCurrentOwnerId(ownerId);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact-owner"] });
      toast({ title: "Отговорникът е обновен." });
    },
    onError: () => toast({ title: "Грешка при обновяване.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: "lead" | "deal"; id: string }) => {
      const table = type === "lead" ? "leads" : "deals";
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { type }) => {
      const key = type === "lead" ? "contact-leads" : "contact-deals";
      queryClient.invalidateQueries({ queryKey: [key, contactId] });
      toast({ title: type === "lead" ? "Лийдът е изтрит" : "Сделката е изтрита" });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Грешка при изтриване", variant: "destructive" });
    },
  });
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["contact-leads", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("contact_id", contactId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ["contact-meetings", contactId],
    queryFn: async () => {
      const leadIds = leads.map((l) => l.id);
      if (leadIds.length === 0) return [];
      const { data, error } = await supabase.from("meetings").select("*").in("lead_id", leadIds).order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contactId && leads.length > 0,
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ["contact-deals", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").eq("contact_id", contactId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["contact-contracts", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*").eq("contact_id", contactId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["contact-documents", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("entity_type", "contact").eq("entity_id", contactId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const { data: auditTrail = [], isLoading: auditLoading } = useQuery({
    queryKey: ["contact-audit", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_trail").select("*").eq("entity_type", "contact").eq("entity_id", contactId!).order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch author names for entries with user_id
      const userIds = [...new Set(data.filter(e => e.user_id).map(e => e.user_id!))];
      const profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        profiles?.forEach(p => { profilesMap[p.user_id] = p.full_name || "—"; });
      }
      return data.map(e => ({ ...e, _authorName: e.user_id ? (profilesMap[e.user_id] || "—") : null }));
    },
    enabled: !!contactId,
  });

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <DialogTitle className="flex items-center gap-2">
              {contact.type === "company" ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
              {getContactName(contact)}
            </DialogTitle>
            <DialogDescription className="sr-only">Профил на контакт</DialogDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreateLeadOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Нов лийд
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreateDealOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Нова сделка
            </Button>
          </div>
        </DialogHeader>
        <Tabs defaultValue="info" className="flex-1 min-h-0">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="info">Информация</TabsTrigger>
            <TabsTrigger value="leads">Лийдове</TabsTrigger>
            <TabsTrigger value="meetings">Срещи</TabsTrigger>
            <TabsTrigger value="deals">Сделки</TabsTrigger>
            <TabsTrigger value="contracts">Договори</TabsTrigger>
            <TabsTrigger value="documents">Документи</TabsTrigger>
            <TabsTrigger value="comments">Коментари</TabsTrigger>
            <TabsTrigger value="audit">Хронология</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4" style={{ maxHeight: "55vh" }}>
            <TabsContent value="info" className="mt-0">
              <dl className="grid grid-cols-2 gap-4 p-2">
                <InfoField label="Тип" value={contact.type === "company" ? "Компания" : "Физическо лице"} />
                {contact.type === "company" ? (
                  <InfoField label="Име на компания" value={contact.company_name} />
                ) : (
                  <>
                    <InfoField label="Име" value={contact.first_name} />
                    <InfoField label="Фамилия" value={contact.last_name} />
                  </>
                )}
                <InfoField label="Имейл" value={contact.email} />
                <InfoField label="Телефон" value={contact.phone} />
                <InfoField label="Град" value={contact.city} />
                <InfoField label="Адрес" value={contact.address} />
                <div className="col-span-2">
                  <InfoField label="Бележки" value={contact.notes} />
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Отговорник</dt>
                  <dd className="mt-1 text-sm flex items-center gap-2">
                    {currentOwnerId ? (
                      <>
                        <UserCheck className="h-4 w-4 text-primary" />
                        <span>{ownerName || "—"}</span>
                        {currentOwnerId === user?.id ? (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => assignMutation.mutate(null)}>
                            <UserMinus className="h-3.5 w-3.5 mr-1" /> Премахни
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => assignMutation.mutate(user!.id)}>
                            <UserPlus className="h-3.5 w-3.5 mr-1" /> Поеми
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">Няма</span>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => assignMutation.mutate(user!.id)}>
                          <UserPlus className="h-3.5 w-3.5 mr-1" /> Поеми контакта
                        </Button>
                      </>
                    )}
                  </dd>
                </div>
                <InfoField label="Създаден" value={format(new Date(contact.created_at), "dd.MM.yyyy HH:mm")} />
              </dl>
            </TabsContent>

            <TabsContent value="leads" className="mt-0">
              {leadsLoading ? <LoadingState /> : leads.length === 0 ? <EmptyState text="Няма лийдове." /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Заглавие</TableHead><TableHead>Статус</TableHead><TableHead>Ест. стойност</TableHead><TableHead>Дата</TableHead><TableHead className="w-20">Действия</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {leads.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.title}</TableCell>
                        <TableCell><Badge variant="secondary">{statusLabels[l.status] || l.status}</Badge></TableCell>
                        <TableCell>{l.estimated_value != null ? `${l.estimated_value} лв.` : "—"}</TableCell>
                        <TableCell>{format(new Date(l.created_at), "dd.MM.yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditLead(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "lead", id: l.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="meetings" className="mt-0">
              {meetingsLoading || leadsLoading ? <LoadingState /> : meetings.length === 0 ? <EmptyState text="Няма срещи." /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Заглавие</TableHead><TableHead>Дата</TableHead><TableHead>Статус</TableHead><TableHead>Място</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {meetings.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.title}</TableCell>
                        <TableCell>{format(new Date(m.scheduled_at), "dd.MM.yyyy HH:mm")}</TableCell>
                        <TableCell><Badge variant="secondary">{statusLabels[m.status] || m.status}</Badge></TableCell>
                        <TableCell>{m.location || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="deals" className="mt-0">
              {dealsLoading ? <LoadingState /> : deals.length === 0 ? <EmptyState text="Няма сделки." /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Заглавие</TableHead><TableHead>Стойност</TableHead><TableHead>Статус</TableHead><TableHead className="w-20">Действия</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {deals.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.title}</TableCell>
                        <TableCell>{d.value != null ? `${d.value} лв.` : "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{statusLabels[d.status] || d.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditDeal(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "deal", id: d.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="contracts" className="mt-0">
              {contractsLoading ? <LoadingState /> : contracts.length === 0 ? <EmptyState text="Няма договори." /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Заглавие</TableHead><TableHead>Номер</TableHead><TableHead>Статус</TableHead><TableHead>Стойност</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {contracts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>{c.contract_number || "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{statusLabels[c.status] || c.status}</Badge></TableCell>
                        <TableCell>{c.total_value != null ? `${c.total_value} лв.` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              {documentsLoading ? <LoadingState /> : documents.length === 0 ? <EmptyState text="Няма документи." /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Заглавие</TableHead><TableHead>Тип</TableHead><TableHead>Дата</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>{doc.mime_type || "—"}</TableCell>
                        <TableCell>{format(new Date(doc.created_at), "dd.MM.yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <ContactCommentsTab contactId={contact.id} />
            </TabsContent>

            <TabsContent value="audit" className="mt-0">
              {auditLoading ? <LoadingState /> : auditTrail.length === 0 ? <EmptyState text="Няма записи в хронологията." /> : (
                <div className="space-y-3 p-2">
                  {auditTrail.map((entry) => {
                    const newData = entry.new_data as Record<string, any> | null;
                    const oldData = entry.old_data as Record<string, any> | null;
                    const comment = newData?.comment || oldData?.comment;
                    return (
                      <div key={entry.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{statusLabels[entry.action] || entry.action}</Badge>
                            {(entry as any)._authorName && (
                              <span className="text-xs font-medium text-foreground">{(entry as any)._authorName}</span>
                            )}
                          </div>
                          {comment && (
                            <p className="text-sm mt-1">
                              {newData?.comment ? "💬 Добавен коментар: " : "🗑️ Изтрит коментар: "}
                              <span className="italic text-muted-foreground">"{comment}"</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(entry.created_at), "dd.MM.yyyy HH:mm")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
      <CreateLeadFromContactDialog contactId={contact.id} open={createLeadOpen} onOpenChange={setCreateLeadOpen} />
      <CreateDealFromContactDialog contactId={contact.id} open={createDealOpen} onOpenChange={setCreateDealOpen} />
      <EditLeadDialog lead={editLead} open={!!editLead} onOpenChange={(o) => !o && setEditLead(null)} />
      <EditDealDialog deal={editDeal} open={!!editDeal} onOpenChange={(o) => !o && setEditDeal(null)} />
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Потвърждение за изтриване</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете {deleteTarget?.type === "lead" ? "този лийд" : "тази сделка"}? Действието е необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
