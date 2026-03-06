import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const OVERDUE_MINUTES = 120;

export default function LeadsOverdueAlert() {
  const { data: overdueLeads = [] } = useQuery({
    queryKey: ["leads-overdue"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - OVERDUE_MINUTES * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("leads")
        .select("id, title, created_at")
        .is("responded_at", null)
        .lte("created_at", cutoff)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });

  if (overdueLeads.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Просрочени лийдове</AlertTitle>
      <AlertDescription>
        {overdueLeads.length === 1
          ? `Лийд "${overdueLeads[0].title}" чака отговор повече от 2 часа.`
          : `${overdueLeads.length} лийда чакат отговор повече от 2 часа: ${overdueLeads.slice(0, 3).map(l => `"${l.title}"`).join(", ")}${overdueLeads.length > 3 ? ` и още ${overdueLeads.length - 3}` : ""}.`}
      </AlertDescription>
    </Alert>
  );
}
