import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportToExcel";
import LeadFormDialog from "@/components/leads/LeadFormDialog";
import LeadResponseTimer from "@/components/leads/LeadResponseTimer";
import LeadsKpiBar from "@/components/leads/LeadsKpiBar";
import LeadsOverdueAlert from "@/components/leads/LeadsOverdueAlert";
import type { Tables } from "@/integrations/supabase/types";

const statusLabels: Record<string, string> = {
  new: "Нов", contacted: "Контактуван", qualified: "Квалифициран", unqualified: "Неквалифициран",
};

function getContactName(c: { type: string; company_name: string | null; first_name: string | null; last_name: string | null }) {
  if (c.type === "company") return c.company_name || "—";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

const LeadsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Tables<"leads"> | null>(null);
  const [deleteLead, setDeleteLead] = useState<Tables<"leads"> | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, contacts(type, company_name, first_name, last_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch owner names
      const ownerIds = [...new Set(data.filter(l => l.owner_id).map(l => l.owner_id!))];
      const ownerMap: Record<string, string> = {};
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ownerIds);
        profiles?.forEach(p => { ownerMap[p.user_id] = p.full_name || "—"; });
      }
      return data.map(l => ({ ...l, _ownerName: l.owner_id ? (ownerMap[l.owner_id] || "—") : null }));
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from("leads").update({ responded_at: new Date().toISOString() } as any).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Таймерът е спрян." });
    },
    onError: () => toast({ title: "Грешка при спиране на таймера.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").delete().eq("id", deleteLead!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setDeleteLead(null);
      toast({ title: "Лийдът е изтрит." });
    },
    onError: () => toast({ title: "Грешка при изтриване.", variant: "destructive" }),
  });

  const filtered = leads.filter((l) => {
    const contactName = l.contacts ? getContactName(l.contacts as any) : "";
    const matchesSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      contactName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const matchesOwner = ownerFilter === "all" ||
      (ownerFilter === "mine" && l.owner_id === user?.id) ||
      (ownerFilter === "unassigned" && !l.owner_id);
    return matchesSearch && matchesStatus && matchesOwner;
  });

  const handleExport = () => {
    const contactName = (l: any) => l.contacts ? getContactName(l.contacts) : "";
    exportToExcel(
      filtered.map(l => ({
        title: l.title,
        contact: contactName(l),
        status: statusLabels[l.status] || l.status,
        estimated_value: l.estimated_value != null ? `${l.estimated_value} лв.` : "",
        source: l.source || "",
        owner: (l as any)._ownerName || "",
        created_at: format(new Date(l.created_at), "dd.MM.yyyy"),
      })),
      [
        { key: "title", label: "Заглавие" },
        { key: "contact", label: "Контакт" },
        { key: "status", label: "Статус" },
        { key: "estimated_value", label: "Ест. стойност" },
        { key: "source", label: "Източник" },
        { key: "owner", label: "Отговорник" },
        { key: "created_at", label: "Създаден" },
      ],
      "Лийдове"
    );
  };

  return (
    <div>
      <PageHeader
        title="Лийдове"
        description="Проследяване на потенциални клиенти"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Excel</Button>
            <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Нов лийд</Button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <LeadsOverdueAlert />
        <LeadsKpiBar />
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Търсене по заглавие или контакт..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Всички статуси" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              <SelectItem value="new">Нов</SelectItem>
              <SelectItem value="contacted">Контактуван</SelectItem>
              <SelectItem value="qualified">Квалифициран</SelectItem>
              <SelectItem value="unqualified">Неквалифициран</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Всички отговорници" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички отговорници</SelectItem>
              <SelectItem value="mine">Мои лийдове</SelectItem>
              <SelectItem value="unassigned">Без отговорник</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Зареждане...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Няма намерени лийдове.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заглавие</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Време за отговор</TableHead>
                  <TableHead>Ест. стойност</TableHead>
                  <TableHead>Източник</TableHead>
                  <TableHead>Отговорник</TableHead>
                  <TableHead>Създаден</TableHead>
                  <TableHead className="w-24">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.title}</TableCell>
                    <TableCell>{lead.contacts ? getContactName(lead.contacts as any) : "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{statusLabels[lead.status] || lead.status}</Badge></TableCell>
                    <TableCell>
                      <LeadResponseTimer
                        createdAt={lead.created_at}
                        respondedAt={(lead as any).responded_at}
                        onStop={() => stopTimerMutation.mutate(lead.id)}
                      />
                    </TableCell>
                    <TableCell>{lead.estimated_value != null ? `${lead.estimated_value} лв.` : "—"}</TableCell>
                    <TableCell>{lead.source || "—"}</TableCell>
                    <TableCell>{(lead as any)._ownerName || "—"}</TableCell>
                    <TableCell>{format(new Date(lead.created_at), "dd.MM.yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditLead(lead)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteLead(lead)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <LeadFormDialog open={!!editLead} onOpenChange={(o) => { if (!o) setEditLead(null); }} lead={editLead} />

      <AlertDialog open={!!deleteLead} onOpenChange={(o) => { if (!o) setDeleteLead(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Потвърждение за изтриване</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете лийда "{deleteLead?.title}"? Действието е необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeadsPage;
