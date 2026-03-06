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
  draft: "Чернова", active: "Активен", completed: "Завършен", cancelled: "Анулиран",
};

const ContractsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Търсене по заглавие..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Всички статуси" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              <SelectItem value="draft">Чернова</SelectItem>
              <SelectItem value="active">Активен</SelectItem>
              <SelectItem value="completed">Завършен</SelectItem>
              <SelectItem value="cancelled">Анулиран</SelectItem>
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
                onSelect={setDateRange}
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
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма договори.</p>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
