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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Search, CalendarIcon, X, Download } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { exportToExcel } from "@/lib/exportToExcel";
import ContactFormDialog, { type ContactFormValues } from "@/components/contacts/ContactFormDialog";
import ContactDeleteDialog from "@/components/contacts/ContactDeleteDialog";
import ContactsTable from "@/components/contacts/ContactsTable";
import ContactProfileDialog from "@/components/contacts/ContactProfileDialog";
import type { Tables } from "@/integrations/supabase/types";
import CreateLeadFromContactDialog from "@/components/contacts/CreateLeadFromContactDialog";

const ContactsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<Tables<"contacts"> | null>(null);
  const [deleteContact, setDeleteContact] = useState<Tables<"contacts"> | null>(null);
  const [profileContact, setProfileContact] = useState<Tables<"contacts"> | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [createLeadContact, setCreateLeadContact] = useState<Tables<"contacts"> | null>(null);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch owner names
      const ownerIds = [...new Set(data.filter(c => c.owner_id).map(c => c.owner_id!))];
      const ownerMap: Record<string, string> = {};
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ownerIds);
        profiles?.forEach(p => { ownerMap[p.user_id] = p.full_name || "—"; });
      }
      return data.map(c => ({ ...c, _ownerName: c.owner_id ? (ownerMap[c.owner_id] || "—") : null }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const { error } = await supabase.from("contacts").insert({
        ...values,
        owner_id: user!.id,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setFormOpen(false);
      toast({ title: "Контактът е създаден успешно." });
    },
    onError: () => toast({ title: "Грешка при създаване.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const { error } = await supabase.from("contacts").update(values).eq("id", editContact!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditContact(null);
      toast({ title: "Контактът е обновен." });
    },
    onError: () => toast({ title: "Грешка при обновяване.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setDeleteContact(null);
      toast({ title: "Контактът е изтрит." });
    },
    onError: (err: any) => toast({ title: "Грешка при изтриване.", description: err?.message || "", variant: "destructive" }),
  });

  const filtered = contacts.filter((c) => {
    const name = c.type === "company"
      ? (c.company_name || "")
      : `${c.first_name || ""} ${c.last_name || ""}`;
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    const matchesOwner = ownerFilter === "all" || 
      (ownerFilter === "mine" && c.owner_id === user?.id) || 
      (ownerFilter === "unassigned" && !c.owner_id);
     const createdDate = new Date(c.created_at);
     const matchesDateFrom = !dateRange?.from || createdDate >= new Date(format(dateRange.from, "yyyy-MM-dd"));
     const matchesDateTo = !dateRange?.to || createdDate <= new Date(format(dateRange.to, "yyyy-MM-dd") + "T23:59:59");
     return matchesSearch && matchesType && matchesOwner && matchesDateFrom && matchesDateTo;
  });

  const handleExport = () => {
    exportToExcel(
      filtered.map(c => ({
        type: c.type === "company" ? "Компания" : "Лице",
        name: c.type === "company" ? (c.company_name || "") : [c.first_name, c.last_name].filter(Boolean).join(" "),
        email: c.email || "",
        phone: c.phone || "",
        city: c.city || "",
        owner: (c as any)._ownerName || "",
        created_at: format(new Date(c.created_at), "dd.MM.yyyy"),
      })),
      [
        { key: "type", label: "Тип" },
        { key: "name", label: "Име" },
        { key: "email", label: "Имейл" },
        { key: "phone", label: "Телефон" },
        { key: "city", label: "Град" },
        { key: "owner", label: "Отговорник" },
        { key: "created_at", label: "Създаден" },
      ],
      "Контакти"
    );
  };

  return (
    <div>
      <PageHeader
        title="Контакти"
        description="Управление на клиенти и компании"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Excel</Button>
            <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Нов контакт</Button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Търсене по име или имейл..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Всички типове" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички типове</SelectItem>
              <SelectItem value="person">Физическо лице</SelectItem>
              <SelectItem value="company">Компания</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Всички отговорници" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички отговорници</SelectItem>
              <SelectItem value="mine">Мои контакти</SelectItem>
              <SelectItem value="unassigned">Без отговорник</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-48 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd.MM.yyyy") : "От дата"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-48 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd.MM.yyyy") : "До дата"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Зареждане...</div>
        ) : (
          <ContactsTable
            contacts={filtered}
            onEdit={(c) => setEditContact(c)}
            onDelete={isAdmin ? (c) => setDeleteContact(c) : undefined}
            onDoubleClick={(c) => setProfileContact(c)}
            onCreateLead={(c) => setCreateLeadContact(c)}
          />
        )}
      </div>

      <ContactFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(v) => createMutation.mutate(v)}
        isLoading={createMutation.isPending}
      />

      <ContactFormDialog
        open={!!editContact}
        onOpenChange={(open) => { if (!open) setEditContact(null); }}
        onSubmit={(v) => updateMutation.mutate(v)}
        contact={editContact}
        isLoading={updateMutation.isPending}
      />

      <ContactDeleteDialog
        open={!!deleteContact}
        onOpenChange={(open) => { if (!open) setDeleteContact(null); }}
        onConfirm={() => deleteContact && deleteMutation.mutate(deleteContact.id)}
        contact={deleteContact}
        isLoading={deleteMutation.isPending}
      />

      <ContactProfileDialog
        contact={profileContact}
        open={!!profileContact}
        onOpenChange={(open) => { if (!open) setProfileContact(null); }}
      />

      <CreateLeadFromContactDialog
        contactId={createLeadContact?.id || ""}
        open={!!createLeadContact}
        onOpenChange={(open) => { if (!open) setCreateLeadContact(null); }}
      />
    </div>
  );
};

export default ContactsPage;
