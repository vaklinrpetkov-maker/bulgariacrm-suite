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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Download, CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { exportToExcel } from "@/lib/exportToExcel";
import LeadFormDialog from "@/components/leads/LeadFormDialog";
import LeadResponseTimer, { getTimerRowClass } from "@/components/leads/LeadResponseTimer";
import LeadsKpiBar from "@/components/leads/LeadsKpiBar";
import LeadsOverdueAlert from "@/components/leads/LeadsOverdueAlert";
import LeadMessageHoverCard from "@/components/leads/LeadMessageHoverCard";
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user?.id,
  });

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
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setDeleteLead(null);
      toast({ title: "Лийдът е изтрит." });
    },
    onError: (err) => {
      console.error("Delete lead error:", err);
      toast({ title: "Грешка при изтриване.", variant: "destructive" });
    },
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
    const createdDate = new Date(l.created_at);
    const matchesDateFrom = !dateRange?.from || createdDate >= new Date(format(dateRange.from, "yyyy-MM-dd"));
    const matchesDateTo = !dateRange?.to || createdDate <= new Date(format(dateRange.to, "yyyy-MM-dd") + "T23:59:59");
    return matchesSearch && matchesStatus && matchesOwner && matchesDateFrom && matchesDateTo;
  });

  const handleExport = async () => {
    const contactName = (l: any) => l.contacts ? getContactName(l.contacts) : "";
    exportToExcel(
      filtered.map(l => ({
        title: l.title,
        contact: contactName(l),
        project_name: (l as any).project_name || "",
        status: statusLabels[l.status] || l.status,
        estimated_value: l.estimated_value != null ? `${l.estimated_value} €` : "",
        source: l.source || "",
        owner: (l as any)._ownerName || "",
        created_at: format(new Date(l.created_at), "dd.MM.yyyy"),
      })),
      [
        { key: "title", label: "Заглавие" },
        { key: "contact", label: "Контакт" },
        { key: "project_name", label: "Проект" },
        { key: "status", label: "Статус" },
        { key: "estimated_value", label: "Търсене €" },
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
        sopKey="leads"
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
            <Input placeholder="Търсене по заглавие или контакт..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
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
          <Select value={ownerFilter} onValueChange={(v) => { setOwnerFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Всички отговорници" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички отговорници</SelectItem>
              <SelectItem value="mine">Мои лийдове</SelectItem>
              <SelectItem value="unassigned">Без отговорник</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-64 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>{format(dateRange.from, "dd.MM.yyyy")} – {format(dateRange.to, "dd.MM.yyyy")}</>
                  ) : (
                    format(dateRange.from, "dd.MM.yyyy")
                  )
                ) : (
                  "Период на създаване"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(r) => { setDateRange(r); setCurrentPage(1); }}
                numberOfMonths={2}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Зареждане...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Няма намерени лийдове.</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Заглавие</TableHead>
                    <TableHead>Контакт</TableHead>
                    <TableHead>Проект</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Време за отговор</TableHead>
                    <TableHead>Търсене €</TableHead>
                    <TableHead>Източник</TableHead>
                    <TableHead>Отговорник</TableHead>
                    <TableHead>Създаден</TableHead>
                    <TableHead className="w-24">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((lead) => {
                    const isRunning = !(lead as any).responded_at;
                    const elapsed = isRunning
                      ? Math.max(0, Date.now() - new Date(lead.created_at).getTime())
                      : Math.max(0, new Date((lead as any).responded_at).getTime() - new Date(lead.created_at).getTime());
                    return (
                    <TableRow key={lead.id} className={getTimerRowClass(elapsed, isRunning)}>
                      <TableCell className="font-medium">
                        <LeadMessageHoverCard notes={lead.notes}>
                          {lead.title}
                        </LeadMessageHoverCard>
                      </TableCell>
                      <TableCell>{lead.contacts ? getContactName(lead.contacts as any) : "—"}</TableCell>
                      <TableCell>{(lead as any).project_name || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{statusLabels[lead.status] || lead.status}</Badge></TableCell>
                      <TableCell>
                        <LeadResponseTimer
                          createdAt={lead.created_at}
                          respondedAt={(lead as any).responded_at}
                          onStop={() => stopTimerMutation.mutate(lead.id)}
                        />
                      </TableCell>
                      <TableCell>{lead.estimated_value != null ? `${lead.estimated_value} €` : "—"}</TableCell>
                      <TableCell>{lead.source || "—"}</TableCell>
                      <TableCell>{(lead as any)._ownerName || "—"}</TableCell>
                      <TableCell>{format(new Date(lead.created_at), "dd.MM.yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditLead(lead)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteLead(lead)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            {(() => {
              const totalPages = Math.ceil(filtered.length / pageSize);
              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Показване на</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span>от {filtered.length} резултата</span>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-3 text-sm text-muted-foreground">
                        {currentPage} / {totalPages}
                      </span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
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
            <AlertDialogAction onClick={() => deleteLead && deleteMutation.mutate(deleteLead.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeadsPage;
