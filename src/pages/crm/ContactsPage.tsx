import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import ContactFormDialog, { type ContactFormValues } from "@/components/contacts/ContactFormDialog";
import ContactDeleteDialog from "@/components/contacts/ContactDeleteDialog";
import ContactsTable from "@/components/contacts/ContactsTable";
import type { Tables } from "@/integrations/supabase/types";

const ContactsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<Tables<"contacts"> | null>(null);
  const [deleteContact, setDeleteContact] = useState<Tables<"contacts"> | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").delete().eq("id", deleteContact!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setDeleteContact(null);
      toast({ title: "Контактът е изтрит." });
    },
    onError: () => toast({ title: "Грешка при изтриване.", variant: "destructive" }),
  });

  const filtered = contacts.filter((c) => {
    const name = c.type === "company"
      ? (c.company_name || "")
      : `${c.first_name || ""} ${c.last_name || ""}`;
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <PageHeader
        title="Контакти"
        description="Управление на клиенти и компании"
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Нов контакт</Button>}
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center">
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
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Зареждане...</div>
        ) : (
          <ContactsTable
            contacts={filtered}
            onEdit={(c) => setEditContact(c)}
            onDelete={(c) => setDeleteContact(c)}
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
        onConfirm={() => deleteMutation.mutate()}
        contact={deleteContact}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ContactsPage;
