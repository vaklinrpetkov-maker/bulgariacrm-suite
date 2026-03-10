import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAYS_AHEAD = 3; // Notify 3 days before birthday

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all contacts with a birthdate
    const { data: contacts, error: contactsErr } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, company_name, type, birthdate, owner_id")
      .not("birthdate", "is", null);

    if (contactsErr) throw contactsErr;
    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ message: "No contacts with birthdays" }), { status: 200 });
    }

    const today = new Date();
    const upcomingBirthdays = contacts.filter((c) => {
      const bd = new Date(c.birthdate);
      const thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      const diffDays = Math.floor((thisYearBd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= DAYS_AHEAD;
    });

    if (upcomingBirthdays.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming birthdays" }), { status: 200 });
    }

    // Get all users to notify (admins + managers + owners)
    const { data: adminManagers } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "manager"]);

    const adminManagerIds = new Set((adminManagers || []).map((r) => r.user_id));

    // Check existing unread birthday notifications to avoid duplicates
    const { data: existing } = await supabase
      .from("notifications")
      .select("entity_id")
      .eq("entity_type", "birthday_reminder")
      .eq("is_read", false)
      .in("entity_id", upcomingBirthdays.map((c) => c.id));

    const existingIds = new Set((existing || []).map((n) => n.entity_id));
    const newBirthdays = upcomingBirthdays.filter((c) => !existingIds.has(c.id));

    if (newBirthdays.length === 0) {
      return new Response(JSON.stringify({ message: "All already notified" }), { status: 200 });
    }

    const notifications: Array<{
      user_id: string;
      title: string;
      message: string;
      type: "reminder";
      entity_type: string;
      entity_id: string;
    }> = [];

    for (const contact of newBirthdays) {
      const name = contact.type === "company"
        ? contact.company_name
        : [contact.first_name, contact.last_name].filter(Boolean).join(" ");

      const bd = new Date(contact.birthdate);
      const thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      const diffDays = Math.floor((thisYearBd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const dayText = diffDays === 0 ? "днес" : diffDays === 1 ? "утре" : `след ${diffDays} дни`;

      // Notify the owner if assigned
      const recipientIds = new Set<string>();
      if (contact.owner_id) recipientIds.add(contact.owner_id);
      adminManagerIds.forEach((id) => recipientIds.add(id));

      for (const userId of recipientIds) {
        notifications.push({
          user_id: userId,
          title: `🎂 Рожден ден: ${name} — ${dayText}`,
          message: `${name} има рожден ден на ${bd.getDate().toString().padStart(2, "0")}.${(bd.getMonth() + 1).toString().padStart(2, "0")}. Не забравяйте да поздравите!`,
          type: "reminder",
          entity_type: "birthday_reminder",
          entity_id: contact.id,
        });
      }
    }

    if (notifications.length > 0) {
      const { error: insertErr } = await supabase.from("notifications").insert(notifications);
      if (insertErr) throw insertErr;
    }

    return new Response(
      JSON.stringify({ message: `Created ${notifications.length} birthday reminders for ${newBirthdays.length} contacts` }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
