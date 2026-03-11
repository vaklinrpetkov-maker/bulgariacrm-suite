import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Download, Building } from "lucide-react";
import { exportToExcel } from "@/lib/exportToExcel";

const unitTypeLabels: Record<string, string> = {
  apartment: "Апартамент", office: "Офис", parking_inside: "Паркомясто (вътр.)", parking_outside: "Паркомясто (външ.)", garage: "Гараж",
};

const InventoryPage = () => {
  const { data: units = [] } = useQuery({
    queryKey: ["units-export"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("*, buildings(name, complexes(name))").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    exportToExcel(
      units.map((u: any) => ({
        complex: u.buildings?.complexes?.name || "",
        building: u.buildings?.name || "",
        unit_number: u.unit_number,
        type: unitTypeLabels[u.type] || u.type,
        floor: u.floor ?? "",
        area: u.area_sqm ? `${u.area_sqm} кв.м` : "",
        rooms: u.rooms ?? "",
        price: u.price != null ? `${u.price} лв.` : "",
        status: u.status,
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
      ],
      "Имоти"
    );
  };

  return (
    <div>
      <PageHeader
        title="Имоти"
        description="Комплекси → Сгради → Единици"
        sopKey="inventory"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Excel</Button>
            <Button className="gradient-primary shadow-md shadow-primary/20"><Plus className="mr-2 h-4 w-4" />Нов комплекс</Button>
          </>
        }
      />
      <div className="p-6">
        <EmptyState icon={Building} title="Няма комплекси" description="Създайте първия комплекс, за да започнете да управлявате имотите." />
      </div>
    </div>
  );
};

export default InventoryPage;
