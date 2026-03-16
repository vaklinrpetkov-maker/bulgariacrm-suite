import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Upload, Search, CalendarIcon, X, Sparkles, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { DateRange } from "react-day-picker";
import { exportToExcel } from "@/lib/exportToExcel";
import ContractExtractDialog from "@/components/contracts/ContractExtractDialog";
import ContractViewDialog from "@/components/contracts/ContractViewDialog";
import { ColumnFilter } from "@/components/ui/column-filter";
import { useColumnFilters } from "@/hooks/useColumnFilters";
import BulkDeleteBar from "@/components/BulkDeleteBar";
import { useRowSelection } from "@/hooks/useRowSelection";

const statusLabels: Record<string, string> = {
  draft: "Чернова", active: "Активен", completed: "Завършен", cancelled: "Анулиран",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary", active: "default", completed: "outline", cancelled: "destructive",
};

const contactNameFn = (c: any) => {
  if (!c.contacts) return "—";
  return c.contacts.type === "company" ? c.contacts.company_name : [c.contacts.first_name, c.contacts.last_name].filter(Boolean).join(" ");
};

const filterColumns = [
  { key: "title", getValue: (c: any) => c.title || "—" },
  { key: "number", getValue: (c: any) => c.contract_number || "—" },
  { key: "contact", getValue: (c: any) => contactNameFn(c) || "—" },
  { key: "value", getValue: (c: any) => c.total_value != null ? `${Number(c.total_value).toLocaleString("bg-BG")} €` : "—" },
  { key: "status", getValue: (c: any) => statusLabels[c.status] || c.status || "—" },
  { key: "created", getValue: (c: any) => format(new Date(c.created_at), "dd.MM.yyyy") },
];

const ContractsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [extractOpen, setExtractOpen] = useState(false);
  const [viewContract, setViewContract] = useState<any | null>(null);

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*, contacts(type, company_name, first_name, last_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const preFiltered = contracts.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (dateRange?.from) {
      const created = new Date(c.created_at);
      if (created < dateRange.from) return false;
      if (dateRange.to && created > dateRange.to) return false;
    }
    return true;
  });

  const { filters, uniqueValues, toggleFilter, setColumnFilter, clearFilter, filteredData: filtered } =
    useColumnFilters(preFiltered, filterColumns);

  const selection = useRowSelection(filtered);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("contracts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      selection.clearSelection();
      toast({ title: "Записите са изтрити" });
    },
    onError: () => toast({ title: "Грешка при изтриване", variant: "destructive" }),
  });

  const handleExport = async () => {
    await exportToExcel(
      filtered.map(c => ({
        title: c.title,
        contract_number: c.contract_number || "",
        contact: contactNameFn(c),
        total_value: c.total_value != null ? `${c.total_value} €` : "",
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
        sopKey="contracts"
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
            <Button variant="outline" onClick={() => setExtractOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />AI Извличане
            </Button>
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
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <BulkDeleteBar
          count={selection.selectedCount}
          onDelete={() => bulkDeleteMutation.mutate([...selection.selectedIds])}
          onClear={selection.clearSelection}
          isDeleting={bulkDeleteMutation.isPending}
        />

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Няма договори.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: "40px" }} resizable={false}>
                    <Checkbox
                      checked={selection.allSelected ? true : selection.someSelected ? "indeterminate" : false}
                      onCheckedChange={() => selection.toggleAll()}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnFilter title="Заглавие" columnKey="title" values={uniqueValues["title"] || []} selected={filters["title"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                  </TableHead>
                  <TableHead>
                    <ColumnFilter title="Номер" columnKey="number" values={uniqueValues["number"] || []} selected={filters["number"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
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
                    <ColumnFilter title="Създаден" columnKey="created" values={uniqueValues["created"] || []} selected={filters["created"]} onToggle={toggleFilter} onSetFilter={setColumnFilter} onClear={clearFilter} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const isChecked = selection.selectedIds.has(c.id);
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setViewContract(c)} data-state={isChecked ? "selected" : undefined}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isChecked} onCheckedChange={() => selection.toggle(c.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{c.contract_number || "—"}</TableCell>
                      <TableCell>{contactNameFn(c)}</TableCell>
                      <TableCell>{c.total_value != null ? `${Number(c.total_value).toLocaleString("bg-BG")} €` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[c.status] || "secondary"}>
                          {statusLabels[c.status] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(c.created_at), "dd.MM.yyyy")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ContractExtractDialog open={extractOpen} onOpenChange={setExtractOpen} />
      <ContractViewDialog contract={viewContract} open={!!viewContract} onOpenChange={(v) => { if (!v) setViewContract(null); }} onDeleted={() => setViewContract(null)} />
    </div>
  );
};

export default ContractsPage;
