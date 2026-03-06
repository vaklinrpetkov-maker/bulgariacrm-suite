import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Check, CheckCheck, Info, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Notification = Tables<"notifications">;

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  info: { icon: Info, color: "text-blue-500", label: "Информация" },
  warning: { icon: AlertTriangle, color: "text-orange-500", label: "Предупреждение" },
  action_required: { icon: AlertCircle, color: "text-destructive", label: "Изисква действие" },
  reminder: { icon: Clock, color: "text-primary", label: "Напомняне" },
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Всички известия са маркирани като прочетени." });
    },
  });

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="Известия"
        description="Вашите известия и напомняния"
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllReadMutation.mutate()}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Маркирай всички като прочетени
            </Button>
          ) : undefined
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-sm px-4">
                Всички
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-sm px-4">
                Непрочетени
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Зареждане...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <BellOff className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {filter === "unread" ? "Няма непрочетени известия." : "Няма известия."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => {
              const config = typeConfig[n.type] || typeConfig.info;
              const Icon = config.icon;
              return (
                <Card
                  key={n.id}
                  className={cn(
                    "transition-colors cursor-pointer hover:bg-accent/50",
                    !n.is_read && "border-l-4 border-l-primary bg-primary/5"
                  )}
                  onClick={() => {
                    if (!n.is_read) markReadMutation.mutate(n.id);
                  }}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={cn("mt-0.5 shrink-0", config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("text-sm font-medium", !n.is_read && "font-semibold")}>
                          {n.title}
                        </span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {config.label}
                        </Badge>
                      </div>
                      {n.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(n.created_at), "dd.MM.yyyy, HH:mm")}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {!n.is_read ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate(n.id);
                          }}
                          title="Маркирай като прочетено"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="h-8 w-8 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
