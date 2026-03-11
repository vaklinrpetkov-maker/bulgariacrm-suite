import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, currentModule } = await req.json();

    // Fetch workspace summary data for context
    const [
      { count: contactsCount },
      { count: leadsCount },
      { count: dealsCount },
      { count: contractsCount },
      { count: tasksCount },
      { count: meetingsCount },
      { data: recentLeads },
      { data: recentDeals },
      { data: recentContracts },
      { data: recentTasks },
    ] = await Promise.all([
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("deals").select("*", { count: "exact", head: true }),
      supabase.from("contracts").select("*", { count: "exact", head: true }),
      supabase.from("tasks").select("*", { count: "exact", head: true }),
      supabase.from("meetings").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("id, title, status, created_at, estimated_value, contacts(first_name, last_name, company_name, type)").order("created_at", { ascending: false }).limit(20),
      supabase.from("deals").select("id, title, status, value, created_at, contacts(first_name, last_name, company_name, type)").order("created_at", { ascending: false }).limit(20),
      supabase.from("contracts").select("id, title, status, total_value, contract_number, signed_at, contacts(first_name, last_name, company_name, type)").order("created_at", { ascending: false }).limit(20),
      supabase.from("tasks").select("id, title, status, priority, due_date, assignee_id").order("created_at", { ascending: false }).limit(20),
    ]);

    const workspaceContext = `
WORKSPACE DATA SUMMARY:
- Контакти: ${contactsCount || 0}
- Лийдове: ${leadsCount || 0}
- Сделки: ${dealsCount || 0}
- Договори: ${contractsCount || 0}
- Задачи: ${tasksCount || 0}
- Срещи: ${meetingsCount || 0}

ПОСЛЕДНИ ЛИЙДОВЕ (до 20):
${JSON.stringify(recentLeads || [], null, 1)}

ПОСЛЕДНИ СДЕЛКИ (до 20):
${JSON.stringify(recentDeals || [], null, 1)}

ПОСЛЕДНИ ДОГОВОРИ (до 20):
${JSON.stringify(recentContracts || [], null, 1)}

ПОСЛЕДНИ ЗАДАЧИ (до 20):
${JSON.stringify(recentTasks || [], null, 1)}
`;

    const systemPrompt = `Ти си BuildCRM AI Асистент — интелигентен помощник за CRM система за строителство и имоти. Отговаряй на БЪЛГАРСКИ език.

ТВОИТЕ РОЛИ:
1. **Навигатор по модулите** — обяснявай как работят модулите (Табло, Контакти, Лийдове, Срещи, Сделки, Договори, Поща, Имоти, Документи, Задачи, Проекти, Бюджети, Комисионни, Работни потоци, Известия, Настройки).
2. **Анализатор на данни** — отговаряй на въпроси за данните в workspace-а, като използваш предоставения контекст.

ОПИСАНИЕ НА МОДУЛИТЕ:
• **Табло** — обобщен преглед с KPI карти, графики за активност, лийдове/сделки по статус и SLA dashboard.
• **Контакти** — управление на физически лица и фирми. Поддържа категории (клиент, партньор, доставчик и др.), импорт от Excel, одит лог, коментари.
• **Лийдове** — проследяване на потенциални клиенти от „нов" до „квалифициран"/„неквалифициран". SLA таймер за време на отговор.
• **Срещи** — планиране и проследяване на срещи с клиенти. Статуси: планирана, проведена, отказана.
• **Сделки** — управление на сделки с етапи: преговори, оферта, спечелена, загубена.
• **Договори** — управление на договори с AI извличане от PDF. Плащания по Акт 14/15/16. Свързани имоти.
• **Поща** — входяща/изходяща поща, свързване с контакти.
• **Имоти** — комплекси, сгради, обекти (апартаменти, офиси, паркоместа, гаражи).
• **Документи** — управление на файлове с папки, версии, тагове.
• **Задачи** — Kanban/таблица, приоритети, назначаване, срокове.
• **Проекти** — управление на проекти със статуси и бюджети.
• **Бюджети** — планиране на бюджетни пера с план/факт.
• **Комисионни** — изчисляване и проследяване на комисионни.
• **Работни потоци** — дефиниране на стъпки за обработка на записи.
• **Настройки** — управление на екипи, роли, длъжности, достъп за viewer-и.

${currentModule ? `Потребителят в момента е в модул: ${currentModule}` : ""}

ДАННИ ОТ WORKSPACE-А:
${workspaceContext}

ПРАВИЛА:
- Отговаряй кратко и ясно.
- Ако потребителят пита за данни, използвай предоставения контекст.
- Ако данните не са достатъчни за отговор, кажи какво знаеш и предложи къде да потърсят.
- Форматирай отговорите с markdown (bold, списъци, и др.).
- Не измисляй данни, които не са в контекста.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Прекалено много заявки. Моля, опитайте отново след малко." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Нужно е допълване на кредити за AI функционалност." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Грешка при свързване с AI." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
