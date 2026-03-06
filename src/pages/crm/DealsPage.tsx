import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Download, Search, CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { exportToExcel } from "@/lib/exportToExcel";

const statusLabels: Record<string, string> = {
  negotiation: "Преговори", proposal: "Предложение", won: "Спечелена", lost: "Загубена",
};

const DealsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*, contacts(type, company_name, first_name, last_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    exportToExcel(
      deals.map(d => ({
        title: d.title,
        contact: d.contacts ? (d.contacts.type === "company" ? d.contacts.company_name : [d.contacts.first_name, d.contacts.last_name].filter(Boolean).join(" ")) : "",
        value: d.value != null ? `${d.value} лв.` : "",
        status: statusLabels[d.status] || d.status,
        created_at: format(new Date(d.created_at), "dd.MM.yyyy"),
      })),
      [
        { key: "title", label: "Заглавие" },
        { key: "contact", label: "Контакт" },
        { key: "value", label: "Стойност" },
        { key: "status", label: "Статус" },
        { key: "created_at", label: "Създадена" },
      ],
      "Сделки"
    );
  };

  return (
    <div>
      <PageHeader
        title="Сделки"
        description="Управление на търговски сделки"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Excel</Button>
            <Button><Plus className="mr-2 h-4 w-4" />Нова сделка</Button>
          </>
        }
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма сделки.</p>
        </div>
      </div>
    </div>
  );
};

export default DealsPage;
