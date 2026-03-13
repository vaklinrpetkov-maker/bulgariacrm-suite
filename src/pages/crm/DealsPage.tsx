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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload, Search, CalendarIcon, X, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { DateRange } from "react-day-picker";
import { exportToExcel } from "@/lib/exportToExcel";
import { ColumnFilter } from "@/components/ui/column-filter";
import { useColumnFilters } from "@/hooks/useColumnFilters";

const statusLabels: Record<string, string> = {
  negotiation: "Преговори", proposal: "Предложение", won: "Спечелена", lost: "Загубена",
};

const contactNameFn = (d: any) => {
  if (!d.contacts) return "—";
  return d.contacts.type === "company" ? (d.contacts.company_name || "—") : [d.contacts.first_name, d.contacts.last_name].filter(Boolean).join(" ") || "—";
};

const filterColumns = [
  { key: "title", getValue: (d: any) => d.title || "—" },
  { key: "contact", getValue: (d: any) => contactNameFn(d) },
  { key: "value", getValue: (d: any) => d.value != null ? `${Number(d.value).toLocaleString("bg-BG")} лв.` : "—" },
  { key: "status", getValue: (d: any) => statusLabels[d.status] || d.status || "—" },
  { key: "created", getValue: (d: any) => format(new Date(d.created_at), "dd.MM.yyyy") },
];

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

  const preFiltered = deals.filter((d) => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (dateRange?.from) {
      const created = new Date(d.created_at);
      if (created < dateRange.from) return false;
      if (dateRange.to && created > dateRange.to) return false;
    }
    return true;
  });

  const { filters, uniqueValues, toggleFilter, setColumnFilter, clearFilter, filteredData: filtered } =
    useColumnFilters(preFiltered, filterColumns);

  const handleExport = async () => {
    await exportToExcel(
      filtered.map(d => ({
        title: d.title,
        contact: contactNameFn(d),
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
        sopKey="deals"
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {/* TODO: import */}}>
                  <Upload className="mr-2 h-4 w-4" />Импорт
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />Експорт
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button><Plus className="mr-2 h-4 w-4" />Нова сделка</Button>
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
              <SelectItem value="negotiation">Преговори</SelectItem>
              <SelectItem value="proposal">Предложение</SelectItem>
              <SelectItem value="won">Спечелена</SelectItem>
              <SelectItem value="lost">Загубена</SelectItem>
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
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Няма сделки.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <ColumnFilter title="Заглавие" columnKey="title" values={uniqueValues["title"] || []} selected={filters["title"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                  </TableHead>
                  <TableHead>
                    <ColumnFilter title="Контакт" columnKey="contact" values={uniqueValues["contact"] || []} selected={filters["contact"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                  </TableHead>
                  <TableHead>
                    <ColumnFilter title="Стойност" columnKey="value" values={uniqueValues["value"] || []} selected={filters["value"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                  </TableHead>
                  <TableHead>
                    <ColumnFilter title="Статус" columnKey="status" values={uniqueValues["status"] || []} selected={filters["status"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                  </TableHead>
                  <TableHead>
                    <ColumnFilter title="Създадена" columnKey="created" values={uniqueValues["created"] || []} selected={filters["created"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>{contactNameFn(d)}</TableCell>
                    <TableCell>{d.value != null ? `${Number(d.value).toLocaleString("bg-BG")} лв.` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{statusLabels[d.status] || d.status}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(d.created_at), "dd.MM.yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsPage;
