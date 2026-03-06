import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

const actionLabels: Record<string, string> = {
  created: "Създаден",
  updated: "Обновен",
  deleted: "Изтрит",
  status_changed: "Смяна на статус",
  assigned: "Назначен",
  linked: "Свързан",
  unlinked: "Разкачен",
  payment_received: "Плащане",
};

interface ContactAuditHoverCardProps {
  contactId: string;
  children: React.ReactNode;
}

export default function ContactAuditHoverCard({ contactId, children }: ContactAuditHoverCardProps) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit-hover", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_trail")
        .select("*")
        .eq("entity_type", "contact")
        .eq("entity_id", contactId)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set(data.filter(e => e.user_id).map(e => e.user_id!))];
      const nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        profiles?.forEach(p => { nameMap[p.user_id] = p.full_name || "—"; });
      }
      return data.map(e => ({ ...e, _userName: e.user_id ? (nameMap[e.user_id] || "—") : "Система" }));
    },
    staleTime: 30_000,
  });

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" side="right" align="start">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Хронология</span>
        </div>
        <ScrollArea className="max-h-64">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Зареждане...</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Няма записи</p>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.id} className="px-3 py-2 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {actionLabels[entry.action] || entry.action}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(entry.created_at), "dd.MM.yy HH:mm", { locale: bg })}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {(entry as any)._userName}
                    {entry.new_data && typeof entry.new_data === "object" && (entry.new_data as any).comment
                      ? `: ${(entry.new_data as any).comment}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </HoverCardContent>
    </HoverCard>
  );
}
