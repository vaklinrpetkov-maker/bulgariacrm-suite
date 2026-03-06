import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, TrendingDown, TrendingUp, Clock, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "day" | "week" | "month";

function formatDuration(ms: number) {
  if (ms <= 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
}

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "day": return startOfDay(now);
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
  }
}

function getPreviousPeriodRange(period: Period): { start: Date; end: Date } {
  const currentStart = getPeriodStart(period);
  switch (period) {
    case "day": return { start: subDays(currentStart, 1), end: currentStart };
    case "week": return { start: subWeeks(currentStart, 1), end: currentStart };
    case "month": return { start: subMonths(currentStart, 1), end: currentStart };
  }
}

export default function LeadsKpiBar() {
  const [period, setPeriod] = useState<Period>("week");

  const { data: allLeads = [] } = useQuery({
    queryKey: ["leads-kpi"],
    queryFn: async () => {
      const since = subMonths(new Date(), 2).toISOString();
      const { data, error } = await supabase
        .from("leads")
        .select("id, created_at, responded_at, owner_id, status")
        .gte("created_at", since);
      if (error) throw error;
      return data as Array<{
        id: string;
        created_at: string;
        responded_at: string | null;
        owner_id: string | null;
        status: string;
      }>;
    },
  });

  const stats = useMemo(() => {
    const periodStart = getPeriodStart(period);
    const prev = getPreviousPeriodRange(period);

    const currentLeads = allLeads.filter(l => new Date(l.created_at) >= periodStart);
    const prevLeads = allLeads.filter(l => {
      const d = new Date(l.created_at);
      return d >= prev.start && d < prev.end;
    });

    const calcAvg = (leads: typeof allLeads) => {
      const responded = leads.filter(l => l.responded_at);
      if (responded.length === 0) return null;
      const totalMs = responded.reduce((sum, l) => {
        return sum + (new Date(l.responded_at!).getTime() - new Date(l.created_at).getTime());
      }, 0);
      return totalMs / responded.length;
    };

    const currentAvg = calcAvg(currentLeads);
    const prevAvg = calcAvg(prevLeads);

    const respondedCount = currentLeads.filter(l => l.responded_at).length;
    const pendingCount = currentLeads.filter(l => !l.responded_at).length;
    const responseRate = currentLeads.length > 0
      ? Math.round((respondedCount / currentLeads.length) * 100)
      : null;

    // Fastest response
    const respondedCurrent = currentLeads.filter(l => l.responded_at);
    let fastest: number | null = null;
    if (respondedCurrent.length > 0) {
      fastest = Math.min(...respondedCurrent.map(l =>
        new Date(l.responded_at!).getTime() - new Date(l.created_at).getTime()
      ));
    }

    // Trend: negative = improved (faster), positive = slower
    let trend: number | null = null;
    if (currentAvg != null && prevAvg != null && prevAvg > 0) {
      trend = Math.round(((currentAvg - prevAvg) / prevAvg) * 100);
    }

    return { currentAvg, prevAvg, trend, totalLeads: currentLeads.length, respondedCount, pendingCount, responseRate, fastest };
  }, [allLeads, period]);

  const periodLabels: Record<Period, string> = { day: "Ден", week: "Седмица", month: "Месец" };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI — Време за отговор</h3>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-8">
            {(["day", "week", "month"] as Period[]).map(p => (
              <TabsTrigger key={p} value={p} className="text-xs px-3 h-7">{periodLabels[p]}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Average response time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Ср. време за отговор</span>
            </div>
            <div className="text-xl font-bold font-mono">
              {stats.currentAvg != null ? formatDuration(stats.currentAvg) : "—"}
            </div>
            {stats.trend != null && (
              <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium",
                stats.trend <= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
              )}>
                {stats.trend <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {Math.abs(stats.trend)}% {stats.trend <= 0 ? "по-бързо" : "по-бавно"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fastest response */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Най-бърз отговор</span>
            </div>
            <div className="text-xl font-bold font-mono">
              {stats.fastest != null ? formatDuration(stats.fastest) : "—"}
            </div>
          </CardContent>
        </Card>

        {/* Response rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Обработени</span>
            </div>
            <div className="text-xl font-bold">
              {stats.respondedCount}<span className="text-sm text-muted-foreground font-normal">/{stats.totalLeads}</span>
            </div>
            {stats.responseRate != null && (
              <div className="text-xs text-muted-foreground mt-1">{stats.responseRate}% отговорени</div>
            )}
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Чакащи отговор</span>
            </div>
            <div className={cn("text-xl font-bold", stats.pendingCount > 0 ? "text-orange-600 dark:text-orange-400" : "")}>
              {stats.pendingCount}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
