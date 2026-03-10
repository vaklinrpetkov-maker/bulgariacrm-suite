import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PeriodSelector, { type Period } from "@/components/dashboard/PeriodSelector";
import {
  Users, Target, Handshake, FileText, Building, CheckSquare, Mail, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, CartesianGrid,
} from "recharts";

const CHART_COLORS = [
  "hsl(215, 80%, 55%)",
  "hsl(35, 92%, 50%)",
  "hsl(142, 72%, 36%)",
  "hsl(0, 72%, 51%)",
  "hsl(270, 60%, 55%)",
  "hsl(190, 80%, 42%)",
];

const STATUS_LABELS: Record<string, string> = {
  new: "Нов",
  contacted: "Контактуван",
  qualified: "Квалифициран",
  unqualified: "Некваліф.",
  negotiation: "Договаряне",
  proposal: "Оферта",
  won: "Спечелена",
  lost: "Загубена",
  todo: "За изпълнение",
  in_progress: "В процес",
  done: "Завършена",
  cancelled: "Отменена",
  draft: "Чернова",
  active: "Активен",
  completed: "Завършен",
  scheduled: "Планирана",
};

export default function Dashboard() {
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["dash-contacts"],
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("id, created_at");
      return data || [];
    },
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["dash-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, status, created_at, estimated_value");
      return data || [];
    },
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ["dash-deals"],
    queryFn: async () => {
      const { data } = await supabase.from("deals").select("id, status, value, created_at");
      return data || [];
    },
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["dash-contracts"],
    queryFn: async () => {
      const { data } = await supabase.from("contracts").select("id, status, total_value");
      return data || [];
    },
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["dash-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("id, status, priority, created_at");
      return data || [];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["dash-units"],
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, status");
      return data || [];
    },
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["dash-meetings"],
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("id, status, scheduled_at");
      return data || [];
    },
  });

  const { data: emails = [] } = useQuery({
    queryKey: ["dash-emails"],
    queryFn: async () => {
      const { data } = await supabase.from("emails").select("id, direction, is_read, sent_at");
      return data || [];
    },
  });

  const isLoading = loadingContacts || loadingLeads || loadingDeals || loadingContracts || loadingTasks;

  // KPI calculations
  const activeLeads = leads.filter((l) => l.status === "new" || l.status === "contacted");
  const activeDeals = deals.filter((d) => d.status === "negotiation" || d.status === "proposal");
  const activeContracts = contracts.filter((c) => c.status === "active");
  const pendingTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress");
  const availableUnits = units.filter((u) => u.status === "available");
  const unreadEmails = emails.filter((e) => !e.is_read && e.direction === "inbound");
  const upcomingMeetings = meetings.filter(
    (m) => m.status === "scheduled" && new Date(m.scheduled_at) >= new Date()
  );

  // Deals pipeline value
  const dealsValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const contractsValue = activeContracts.reduce((sum, c) => sum + (c.total_value || 0), 0);

  // --- Chart data ---

  // Leads by status
  const leadsByStatus = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count }));

  // Deals by status
  const dealsByStatus = Object.entries(
    deals.reduce<Record<string, number>>((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count }));

  // Tasks by status
  const tasksByStatus = Object.entries(
    tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count }));

  // Monthly activity (last 6 months: contacts + leads created)
  const monthlyActivity = (() => {
    const months: { month: string; Контакти: number; Лийдове: number; Сделки: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("bg-BG", { month: "short", year: "2-digit" });
      const contactsCount = contacts.filter((c) => c.created_at?.startsWith(key)).length;
      const leadsCount = leads.filter((l) => l.created_at?.startsWith(key)).length;
      const dealsCount = deals.filter((dd) => dd.created_at?.startsWith(key)).length;
      months.push({ month: label, Контакти: contactsCount, Лийдове: leadsCount, Сделки: dealsCount });
    }
    return months;
  })();

  // Email volume (last 7 days)
  const emailVolume = (() => {
    const days: { day: string; Входящи: number; Изходящи: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("bg-BG", { weekday: "short", day: "numeric" });
      const inbound = emails.filter((e) => e.direction === "inbound" && e.sent_at?.startsWith(key)).length;
      const outbound = emails.filter((e) => e.direction === "outbound" && e.sent_at?.startsWith(key)).length;
      days.push({ day: label, Входящи: inbound, Изходящи: outbound });
    }
    return days;
  })();

  const formatBGN = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M лв` : v >= 1000 ? `${(v / 1000).toFixed(0)}K лв` : `${v} лв`;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Табло" description="Преглед на ключови показатели" />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Табло" description="Преглед на ключови показатели" />
      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <StatCard title="Контакти" value={contacts.length} icon={Users} description="Общо" />
          <StatCard title="Лийдове" value={activeLeads.length} icon={Target} description={`от ${leads.length}`} />
          <StatCard title="Сделки" value={activeDeals.length} icon={Handshake} description={formatBGN(dealsValue)} />
          <StatCard title="Договори" value={activeContracts.length} icon={FileText} description={formatBGN(contractsValue)} />
          <StatCard title="Имоти" value={availableUnits.length} icon={Building} description={`от ${units.length}`} />
          <StatCard title="Задачи" value={pendingTasks.length} icon={CheckSquare} description={`от ${tasks.length}`} />
          <StatCard title="Срещи" value={upcomingMeetings.length} icon={Calendar} description="Предстоящи" />
          <StatCard title="Поща" value={unreadEmails.length} icon={Mail} description="Непрочетени" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Monthly Activity Area Chart */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Активност (последни 6 месеца)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyActivity}>
                    <defs>
                      <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[2]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS[2]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(220, 13%, 88%)",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <Area type="monotone" dataKey="Контакти" stroke={CHART_COLORS[0]} fill="url(#colorContacts)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Лийдове" stroke={CHART_COLORS[1]} fill="url(#colorLeads)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Сделки" stroke={CHART_COLORS[2]} fill="url(#colorDeals)" strokeWidth={2} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Status Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Лийдове по статус</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {leadsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {leadsByStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Няма данни</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Deals Pipeline Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Сделки по етап</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {dealsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dealsByStatus} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 100%)",
                          border: "1px solid hsl(220, 13%, 88%)",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      />
                      <Bar dataKey="value" name="Сделки" radius={[4, 4, 0, 0]}>
                        {dealsByStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Няма данни</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks Breakdown Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Задачи по статус</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {tasksByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tasksByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {tasksByStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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

          {/* Email Volume Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Имейл активност (7 дни)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emailVolume} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(220, 13%, 88%)",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="Входящи" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Изходящи" fill={CHART_COLORS[2]} radius={[3, 3, 0, 0]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
