import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Building, ChevronDown, ChevronRight, User, Filter } from "lucide-react";
import { exportToExcel } from "@/lib/exportToExcel";
import StatCard from "@/components/StatCard";

const unitTypeLabels: Record<string, string> = {
  apartment: "Апартамент",
  office: "Офис",
  parking_inside: "Паркомясто (вътр.)",
  parking_outside: "Паркомясто (външ.)",
  garage: "Гараж",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Свободен": "outline",
  "Запазен": "secondary",
  "Депозит": "secondary",
  "Предварителен договор": "secondary",
  "Продаден НА": "default",
};

const statusEmoji: Record<string, string> = {
  "Свободен": "🟢",
  "Запазен": "🟡",
  "Депозит": "🟠",
  "Предварителен договор": "🔵",
  "Продаден НА": "🔴",
};

const InventoryPage = () => {
  const [expandedComplex, setExpandedComplex] = useState<string | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: complexes = [] } = useQuery({
    queryKey: ["complexes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complexes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("*, complexes(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*, buildings(name, complexes(name)), contacts(first_name, last_name, company_name)")
        .order("floor", { ascending: true })
        .order("unit_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filteredUnits = statusFilter === "all"
    ? units
    : units.filter((u: any) => u.status === statusFilter);

  // Group counts by actual status
  const statusCounts = units.reduce((acc: Record<string, number>, u: any) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const allStatuses = Object.keys(statusCounts).sort();

  const handleExport = async () => {
    await exportToExcel(
      filteredUnits.map((u: any) => ({
        complex: u.buildings?.complexes?.name || "",
        building: u.buildings?.name || "",
        unit_number: u.unit_number,
        type: unitTypeLabels[u.type] || u.type,
        floor: u.floor ?? "",
        area: u.area_sqm ? `${u.area_sqm} кв.м` : "",
        rooms: u.rooms ?? "",
        price: u.price != null ? `${Number(u.price).toLocaleString("bg-BG")} лв.` : "",
        status: u.status,
        contact: u.contacts
          ? u.contacts.company_name || `${u.contacts.first_name || ""} ${u.contacts.last_name || ""}`.trim()
          : "",
      })),
      [
        { key: "complex", label: "Комплекс" },
        { key: "building", label: "Сграда" },
        { key: "unit_number", label: "Номер" },
        { key: "type", label: "Тип" },
        { key: "floor", label: "Етаж" },
        { key: "area", label: "Площ" },
        { key: "rooms", label: "Стаи" },
        { key: "price", label: "Цена" },
        { key: "status", label: "Статус" },
        { key: "contact", label: "Купувач" },
      ],
      "Имоти"
    );
  };

  const getContactName = (contact: any) => {
    if (!contact) return null;
    if (contact.company_name) return contact.company_name;
    return `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || null;
  };

  const getUnitsForBuilding = (buildingId: string) =>
    filteredUnits.filter((u: any) => u.building_id === buildingId);

  const getBuildingsForComplex = (complexId: string) =>
    buildings.filter((b: any) => b.complex_id === complexId);

  const toggleComplex = (id: string) =>
    setExpandedComplex((prev) => (prev === id ? null : id));

  const toggleBuilding = (id: string) =>
    setExpandedBuilding((prev) => (prev === id ? null : id));

  return (
    <div>
      <PageHeader
        title="Имоти"
        description="Комплекси → Сгради → Единици"
        sopKey="inventory"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button className="gradient-primary shadow-md shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Нов комплекс
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div onClick={() => setStatusFilter("all")} className="cursor-pointer">
            <StatCard title="Общо единици" value={totalUnits} emoji="🏠" description={statusFilter === "all" ? "● Активен филтър" : undefined} />
          </div>
          {allStatuses.map((s) => (
            <div key={s} onClick={() => setStatusFilter(s)} className="cursor-pointer">
              <StatCard title={s} value={statusCounts[s] || 0} emoji={statusEmoji[s] || "⚪"} description={statusFilter === s ? "● Активен филтър" : undefined} />
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Филтър по статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички</SelectItem>
              {allStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {complexes.length === 0 ? (
          <EmptyState
            icon={Building}
            title="Няма комплекси"
            description="Създайте първия комплекс, за да започнете да управлявате имотите."
          />
        ) : (
          <div className="space-y-4">
            {complexes.map((complex: any) => {
              const cBuildings = getBuildingsForComplex(complex.id);
              const isExpanded = expandedComplex === complex.id;
              const complexUnitsCount = cBuildings.reduce(
                (sum: number, b: any) => sum + getUnitsForBuilding(b.id).length,
                0
              );

              return (
                <Card key={complex.id}>
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleComplex(complex.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <Building className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{complex.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{cBuildings.length} сгради</span>
                        <span>·</span>
                        <span>{complexUnitsCount} единици</span>
                        {complex.city && (
                          <>
                            <span>·</span>
                            <span>{complex.city}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 pt-0">
                      {cBuildings.map((building: any) => {
                        const bUnits = getUnitsForBuilding(building.id);
                        const isBuildingExpanded = expandedBuilding === building.id;

                        return (
                          <Card key={building.id} className="border-dashed">
                            <CardHeader
                              className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                              onClick={() => toggleBuilding(building.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isBuildingExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="font-medium">{building.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  {building.floors && <span>{building.floors} етажа</span>}
                                  <span>·</span>
                                  <span>{bUnits.length} единици</span>
                                </div>
                              </div>
                            </CardHeader>

                            {isBuildingExpanded && (
                              <CardContent className="pt-0">
                                <div className="rounded-md border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Номер</TableHead>
                                        <TableHead>Тип</TableHead>
                                        <TableHead>Етаж</TableHead>
                                        <TableHead>Стаи</TableHead>
                                        <TableHead>Площ (кв.м)</TableHead>
                                        <TableHead>Цена (лв.)</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Купувач</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {bUnits.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            Няма единици {statusFilter !== "all" ? "с този статус" : ""}
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        bUnits.map((unit: any) => {
                                          const contactName = getContactName(unit.contacts);
                                          return (
                                            <TableRow key={unit.id}>
                                              <TableCell className="font-medium">{unit.unit_number}</TableCell>
                                              <TableCell>{unitTypeLabels[unit.type] || unit.type}</TableCell>
                                              <TableCell>{unit.floor ?? "—"}</TableCell>
                                              <TableCell>{unit.rooms ?? "—"}</TableCell>
                                              <TableCell>{unit.area_sqm ? Number(unit.area_sqm).toFixed(2) : "—"}</TableCell>
                                              <TableCell>
                                                {unit.price != null
                                                  ? Number(unit.price).toLocaleString("bg-BG")
                                                  : "—"}
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant={statusVariant[unit.status] || "outline"}>
                                                  {unit.status}
                                                </Badge>
                                              </TableCell>
                                              <TableCell>
                                                {contactName ? (
                                                  <div className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span className="text-sm">{contactName}</span>
                                                  </div>
                                                ) : (
                                                  <span className="text-muted-foreground">—</span>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
