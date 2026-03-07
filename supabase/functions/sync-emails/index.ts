import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImapClient } from "https://deno.land/x/deno_imap@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailUser = Deno.env.get("EMAIL_USER");
    const emailPass = Deno.env.get("EMAIL_PASSWORD");
    if (!emailUser || !emailPass) throw new Error("Email credentials not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Connect to IMAP
    const client = new ImapClient({
      hostname: "mail.vminvest.bg",
      port: 993,
      tls: true,
      username: emailUser,
      password: emailPass,
    });

    await client.connect();
    await client.login();
    await client.select("INBOX");

    // Fetch recent emails (last 50 unseen or recent)
    const searchResult = await client.search("UNSEEN");
    const uids = searchResult.slice(-50);

    if (uids.length === 0) {
      await client.logout();
      return new Response(JSON.stringify({ success: true, synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all contacts for matching
    const { data: contacts } = await supabase.from("contacts").select("id, email");
    const contactByEmail: Record<string, string> = {};
    contacts?.forEach((c) => {
      if (c.email) contactByEmail[c.email.toLowerCase()] = c.id;
    });

    let synced = 0;

    for (const uid of uids) {
      try {
        const msg = await client.fetch(uid, { envelope: true, bodyStructure: true, body: true });
        
        const messageId = msg.envelope?.messageId || `<imap-${uid}-${Date.now()}@vminvest.bg>`;
        const from = msg.envelope?.from?.[0]?.mailbox && msg.envelope?.from?.[0]?.host
          ? `${msg.envelope.from[0].mailbox}@${msg.envelope.from[0].host}`
          : "unknown";
        const to = msg.envelope?.to?.[0]?.mailbox && msg.envelope?.to?.[0]?.host
          ? `${msg.envelope.to[0].mailbox}@${msg.envelope.to[0].host}`
          : emailUser;
        const subject = msg.envelope?.subject || "(без тема)";
        const sentAt = msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : new Date().toISOString();
        const bodyText = msg.body || "";

        // Match contact by from email
        const contactId = contactByEmail[from.toLowerCase()] || null;

        // Upsert (skip if message_id exists)
        const { error } = await supabase.from("emails").upsert(
          {
            direction: "inbound",
            from_address: from,
            to_address: to,
            subject,
            body_text: bodyText,
            message_id: messageId,
            contact_id: contactId,
            sent_at: sentAt,
            is_read: false,
          },
          { onConflict: "message_id", ignoreDuplicates: true }
        );

        if (!error) synced++;
      } catch (fetchErr) {
        console.error(`Error fetching UID ${uid}:`, fetchErr);
      }
    }

    await client.logout();

    return new Response(JSON.stringify({ success: true, synced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync emails error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
