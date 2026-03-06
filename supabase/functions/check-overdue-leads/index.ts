import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OVERDUE_MINUTES = 120;

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoff = new Date(Date.now() - OVERDUE_MINUTES * 60 * 1000).toISOString();

    // Find overdue leads (no response, no owner, older than 120 min)
    const { data: overdueLeads, error: leadsErr } = await supabase
      .from("leads")
      .select("id, title, created_at")
      .is("responded_at", null)
      .lte("created_at", cutoff);

    if (leadsErr) throw leadsErr;
    if (!overdueLeads || overdueLeads.length === 0) {
      return new Response(JSON.stringify({ message: "No overdue leads" }), { status: 200 });
    }

    // Get all admin/manager users to notify
    const { data: recipients, error: rolesErr } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "manager"]);

    if (rolesErr) throw rolesErr;
    if (!recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ message: "No recipients" }), { status: 200 });
    }

    const userIds = [...new Set(recipients.map(r => r.user_id))];

    // Check existing unread notifications to avoid duplicates
    const { data: existing } = await supabase
      .from("notifications")
      .select("entity_id")
      .eq("entity_type", "lead_overdue")
      .eq("is_read", false)
      .in("entity_id", overdueLeads.map(l => l.id));

    const existingIds = new Set((existing || []).map(n => n.entity_id));
    const newOverdue = overdueLeads.filter(l => !existingIds.has(l.id));

    if (newOverdue.length === 0) {
      return new Response(JSON.stringify({ message: "All already notified" }), { status: 200 });
    }

    // Create notifications for each recipient × each new overdue lead
    const notifications = newOverdue.flatMap(lead =>
      userIds.map(userId => ({
        user_id: userId,
        title: `Лийд "${lead.title}" чака отговор повече от 2 часа`,
        message: `Лийдът е създаден на ${new Date(lead.created_at).toLocaleString("bg-BG")} и все още няма отговорник.`,
        type: "warning" as const,
        entity_type: "lead_overdue",
        entity_id: lead.id,
      }))
    );

    const { error: insertErr } = await supabase.from("notifications").insert(notifications);
    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ message: `Created ${notifications.length} notifications for ${newOverdue.length} overdue leads` }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
