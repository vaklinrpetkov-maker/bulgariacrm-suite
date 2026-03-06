import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportToExcel";

const statusLabels: Record<string, string> = {
  draft: "Чернова", active: "Активен", completed: "Завършен", cancelled: "Анулиран",
};

const ContractsPage = () => {
  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*, contacts(type, company_name, first_name, last_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    exportToExcel(
      contracts.map(c => ({
        title: c.title,
        contract_number: c.contract_number || "",
        contact: c.contacts ? (c.contacts.type === "company" ? c.contacts.company_name : [c.contacts.first_name, c.contacts.last_name].filter(Boolean).join(" ")) : "",
        total_value: c.total_value != null ? `${c.total_value} лв.` : "",
        status: statusLabels[c.status] || c.status,
        signed_at: c.signed_at ? format(new Date(c.signed_at), "dd.MM.yyyy") : "",
        created_at: format(new Date(c.created_at), "dd.MM.yyyy"),
      })),
      [
        { key: "title", label: "Заглавие" },
        { key: "contract_number", label: "Номер" },
        { key: "contact", label: "Контакт" },
        { key: "total_value", label: "Стойност" },
        { key: "status", label: "Статус" },
        { key: "signed_at", label: "Подписан" },
        { key: "created_at", label: "Създаден" },
      ],
      "Договори"
    );
  };

  return (
    <div>
      <PageHeader
        title="Договори"
        description="Управление на договори и плащания (Акт 14/15/16)"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Excel</Button>
            <Button><Plus className="mr-2 h-4 w-4" />Нов договор</Button>
          </>
        }
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма договори.</p>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
