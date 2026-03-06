import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportToExcel";

const statusLabels: Record<string, string> = {
  scheduled: "Насрочена", completed: "Проведена", cancelled: "Отказана",
};

const MeetingsPage = () => {
  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meetings").select("*").order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    exportToExcel(
      meetings.map(m => ({
        title: m.title,
        scheduled_at: format(new Date(m.scheduled_at), "dd.MM.yyyy HH:mm"),
        duration: m.duration_minutes ? `${m.duration_minutes} мин.` : "",
        location: m.location || "",
        status: statusLabels[m.status] || m.status,
      })),
      [
        { key: "title", label: "Заглавие" },
        { key: "scheduled_at", label: "Дата/час" },
        { key: "duration", label: "Продължителност" },
        { key: "location", label: "Локация" },
        { key: "status", label: "Статус" },
      ],
      "Срещи"
    );
  };

  return (
    <div>
      <PageHeader
        title="Срещи"
        description="Календар и управление на срещи"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Excel</Button>
            <Button><Plus className="mr-2 h-4 w-4" />Нова среща</Button>
          </>
        }
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Няма насрочени срещи.</p>
          <p className="mt-2 text-xs text-muted-foreground">Синхронизация с Google Calendar / Outlook — очаквайте скоро</p>
        </div>
      </div>
    </div>
  );
};

export default MeetingsPage;
