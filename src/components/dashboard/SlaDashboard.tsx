import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PeriodSelector, { type Period } from "@/components/dashboard/PeriodSelector";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import { PieChart as PieChartIcon, BarChart3, Clock } from "lucide-react";

const SLA_MINUTES = 120; // 2 business hours

interface Lead {
  id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  source: string | null;
}

interface SlaChartProps {
  leads: Lead[];
}

const COLORS = {
  inSla: "hsl(142, 72%, 36%)",
  outSla: "hsl(0, 72%, 51%)",
  pending: "hsl(35, 92%, 50%)",
};

function getResponseMinutes(lead: Lead): number | null {
  if (!lead.responded_at) return null;
  const created = new Date(lead.created_at).getTime();
  const responded = new Date(lead.responded_at).getTime();
  return (responded - created) / 60000;
}

export default function SlaDashboard({ leads }: SlaChartProps) {
  const [slaPeriod, setSlaPeriod] = useState<Period>("month");

  // Filter only email-sourced leads (форма leads)
  const emailLeads = useMemo(() => leads.filter((l) => l.source === "email"), [leads]);

  // Filter by period
  const filteredLeads = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    if (slaPeriod === "week") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (slaPeriod === "quarter") {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    return emailLeads.filter((l) => new Date(l.created_at) >= cutoff);
  }, [emailLeads, slaPeriod]);

  // SLA calculations
  const slaStats = useMemo(() => {
    let inSla = 0;
    let outSla = 0;
    let pending = 0;
    let totalResponseMinutes = 0;
    let respondedCount = 0;

    filteredLeads.forEach((l) => {
      const minutes = getResponseMinutes(l);
      if (minutes === null) {
        pending++;
      } else {
        respondedCount++;
        totalResponseMinutes += minutes;
        if (minutes <= SLA_MINUTES) {
          inSla++;
        } else {
          outSla++;
        }
      }
    });

    const total = filteredLeads.length;
    const slaPercent = respondedCount > 0 ? Math.round((inSla / respondedCount) * 100) : 0;
    const avgMinutes = respondedCount > 0 ? Math.round(totalResponseMinutes / respondedCount) : 0;

    return { inSla, outSla, pending, total, slaPercent, avgMinutes, respondedCount };
  }, [filteredLeads]);

  // Pie data
  const pieData = [
    { name: "В SLA", value: slaStats.inSla },
    { name: "Извън SLA", value: slaStats.outSla },
    ...(slaStats.pending > 0 ? [{ name: "Без отговор", value: slaStats.pending }] : []),
  ].filter((d) => d.value > 0);

  const pieColors = [COLORS.inSla, COLORS.outSla, COLORS.pending];

  // Trend data by period
  const trendData = useMemo(() => {
    const now = new Date();
    const buckets: { period: string; "В SLA": number; "Извън SLA": number }[] = [];

    if (slaPeriod === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("bg-BG", { weekday: "short", day: "numeric" });
        const dayLeads = filteredLeads.filter((l) => l.created_at?.startsWith(key));
        buckets.push({
          period: label,
          "В SLA": dayLeads.filter((l) => { const m = getResponseMinutes(l); return m !== null && m <= SLA_MINUTES; }).length,
          "Извън SLA": dayLeads.filter((l) => { const m = getResponseMinutes(l); return m !== null && m > SLA_MINUTES; }).length,
        });
      }
    } else if (slaPeriod === "quarter") {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("bg-BG", { month: "long" });
        const monthLeads = filteredLeads.filter((l) => l.created_at?.startsWith(key));
        buckets.push({
          period: label,
          "В SLA": monthLeads.filter((l) => { const m = getResponseMinutes(l); return m !== null && m <= SLA_MINUTES; }).length,
          "Извън SLA": monthLeads.filter((l) => { const m = getResponseMinutes(l); return m !== null && m > SLA_MINUTES; }).length,
        });
      }
    } else {
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        const label = `${weekStart.toLocaleDateString("bg-BG", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("bg-BG", { day: "numeric", month: "short" })}`;
        const weekLeads = filteredLeads.filter((l) => {
          const d = new Date(l.created_at);
          return d >= weekStart && d <= weekEnd;
        });
        buckets.push({
          period: label,
          "В SLA": weekLeads.filter((l) => { const m = getResponseMinutes(l); return m !== null && m <= SLA_MINUTES; }).length,
          "Извън SLA": weekLeads.filter((l) => { const m = getResponseMinutes(l); return m !== null && m > SLA_MINUTES; }).length,
        });
      }
    }
    return buckets;
  }, [filteredLeads, slaPeriod]);

  const formatAvgTime = (min: number) => {
    if (min < 60) return `${min} мин`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}ч ${m}м`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* SLA KPI Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">SLA Отговор (2ч)</CardTitle>
        </CardHeader>
        <CardContent>
          {slaStats.total === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Няма данни за SLA</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">Имейли с „форма" ще се проследяват тук</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${slaStats.slaPercent >= 80 ? "text-green-500" : slaStats.slaPercent >= 50 ? "text-amber-500" : "text-destructive"}`}>
                  {slaStats.slaPercent}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">в рамките на SLA</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-500">{slaStats.inSla}</div>
                  <p className="text-[10px] text-muted-foreground">В SLA</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-destructive">{slaStats.outSla}</div>
                  <p className="text-[10px] text-muted-foreground">Извън SLA</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-amber-500">{slaStats.pending}</div>
                  <p className="text-[10px] text-muted-foreground">Без отговор</p>
                </div>
              </div>
              <div className="text-center pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Средно време</p>
                <div className="text-xl font-semibold">{slaStats.respondedCount > 0 ? formatAvgTime(slaStats.avgMinutes) : "—"}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SLA Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Разпределение</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Няма данни</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SLA Trend Chart */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">SLA Тренд</CardTitle>
          <PeriodSelector value={slaPeriod} onChange={setSlaPeriod} />
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barSize={16} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.5} />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 88%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="В SLA" fill={COLORS.inSla} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Извън SLA" fill={COLORS.outSla} radius={[3, 3, 0, 0]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
