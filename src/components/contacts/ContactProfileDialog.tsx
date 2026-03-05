import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, User } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

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
      return data;
    },
    enabled: !!contactId,
  });

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {contact.type === "company" ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
            {getContactName(contact)}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="flex-1 min-h-0">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="info">Информация</TabsTrigger>
            <TabsTrigger value="leads">Лийдове</TabsTrigger>
            <TabsTrigger value="meetings">Срещи</TabsTrigger>
            <TabsTrigger value="deals">Сделки</TabsTrigger>
            <TabsTrigger value="contracts">Договори</TabsTrigger>
            <TabsTrigger value="documents">Документи</TabsTrigger>
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
                <InfoField label="Създаден" value={format(new Date(contact.created_at), "dd.MM.yyyy HH:mm")} />
              </dl>
            </TabsContent>

            <TabsContent value="leads" className="mt-0">
              {leadsLoading ? <LoadingState /> : leads.length === 0 ? <EmptyState text="Няма лийдове." /> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Заглавие</TableHead><TableHead>Статус</TableHead><TableHead>Ест. стойност</TableHead><TableHead>Дата</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {leads.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.title}</TableCell>
                        <TableCell><Badge variant="secondary">{statusLabels[l.status] || l.status}</Badge></TableCell>
                        <TableCell>{l.estimated_value != null ? `${l.estimated_value} лв.` : "—"}</TableCell>
                        <TableCell>{format(new Date(l.created_at), "dd.MM.yyyy")}</TableCell>
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
                    <TableHead>Заглавие</TableHead><TableHead>Стойност</TableHead><TableHead>Статус</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {deals.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.title}</TableCell>
                        <TableCell>{d.value != null ? `${d.value} лв.` : "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{statusLabels[d.status] || d.status}</Badge></TableCell>
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

            <TabsContent value="audit" className="mt-0">
              {auditLoading ? <LoadingState /> : auditTrail.length === 0 ? <EmptyState text="Няма записи в хронологията." /> : (
                <div className="space-y-3 p-2">
                  {auditTrail.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-1">{statusLabels[entry.action] || entry.action}</Badge>
                        <p className="text-xs text-muted-foreground">{format(new Date(entry.created_at), "dd.MM.yyyy HH:mm")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
