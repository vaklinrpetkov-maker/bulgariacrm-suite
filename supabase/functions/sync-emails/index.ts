import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImapFlow } from "npm:imapflow@1.0.164";
import { simpleParser } from "npm:mailparser@3.7.1";

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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Get user's email credentials from user_email_accounts table
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const { data: emailAccount, error: accountError } = await serviceClient
      .from("user_email_accounts")
      .select("email_address, email_password")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountError || !emailAccount) {
      throw new Error("Няма конфигуриран имейл акаунт. Моля добавете го в Настройки.");
    }

    const emailUser = emailAccount.email_address;
    const emailPass = emailAccount.email_password;
    console.log("Syncing emails for:", emailUser);

    const client = new ImapFlow({
      host: "mail.vminvest.bg",
      port: 993,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
      logger: false,
    });

    await client.connect();

    const lock = await client.getMailboxLock("INBOX");
    let synced = 0;

    try {
      const { data: contacts } = await serviceClient.from("contacts").select("id, email");
      const contactByEmail: Record<string, string> = {};
      contacts?.forEach((c: any) => {
        if (c.email) contactByEmail[c.email.toLowerCase()] = c.id;
      });

      const messages = client.fetch("1:*", {
        envelope: true,
        source: true,
        uid: true,
      }, { changedSince: 0n });

      let count = 0;
      for await (const msg of messages) {
        if (count >= 50) break;
        count++;

        try {
          const parsed = await simpleParser(msg.source);
          const messageId = parsed.messageId || `<imap-uid-${msg.uid}@vminvest.bg>`;
          const from = parsed.from?.value?.[0]?.address || "unknown";
          const to = parsed.to ? (Array.isArray(parsed.to) ? parsed.to[0]?.value?.[0]?.address : parsed.to.value?.[0]?.address) : emailUser;
          const subject = parsed.subject || "(без тема)";
          const sentAt = parsed.date ? parsed.date.toISOString() : new Date().toISOString();
          const bodyText = parsed.text || "";
          const bodyHtml = parsed.html || null;

          const contactId = contactByEmail[from.toLowerCase()] || null;

          const { error, data: upsertedEmail } = await serviceClient.from("emails").upsert(
            {
              direction: "inbound",
              from_address: from,
              to_address: to || emailUser,
              subject,
              body_text: bodyText,
              body_html: bodyHtml,
              message_id: messageId,
              contact_id: contactId,
              sent_at: sentAt,
              is_read: false,
              created_by: user.id,
            },
            { onConflict: "message_id", ignoreDuplicates: true }
          ).select("id");

          if (!error) synced++;

        } catch (fetchErr) {
          console.error(`Error processing message:`, fetchErr);
        }
      }
    } finally {
      lock.release();
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
