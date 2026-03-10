import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImapFlow } from "npm:imapflow@1.0.164";
import { simpleParser } from "npm:mailparser@3.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedFields {
  project: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
}

function parseStructuredBody(text: string): ParsedFields {
  const result: ParsedFields = {
    project: null, fullName: null, email: null, phone: null, message: null,
  };
  if (!text) return result;

  const clean = (v: string) => v.replace(/^\*+|\*+$/g, "").trim();

  const projectMatch = text.match(/Проект:\s*\*?([^*\n]+)\*?/i);
  if (projectMatch) result.project = clean(projectMatch[1]);

  const nameMatch = text.match(/Име и фамилия:\s*\*?([^*\n]+)\*?/i);
  if (nameMatch) result.fullName = clean(nameMatch[1]);

  const emailMatch = text.match(/Имейл:\s*\*?([^*\n\s]+)\*?/i);
  if (emailMatch) result.email = clean(emailMatch[1]).toLowerCase();

  const phoneMatch = text.match(/Телефон:\s*\*?([^*\n]+)\*?/i);
  if (phoneMatch) result.phone = clean(phoneMatch[1]);

  const msgMatch = text.match(/Съобщение:\s*\*?([\s\S]*?)(?:\*?\s*$)/i);
  if (msgMatch) result.message = clean(msgMatch[1]);

  return result;
}

async function findOrCreateContact(
  supabase: any,
  contactEmail: string,
  contactFullName: string,
  contactPhone: string | null,
  contactByEmail: Record<string, string>
): Promise<string | null> {
  // 1. Check in-memory cache
  if (contactEmail && contactByEmail[contactEmail.toLowerCase()]) {
    return contactByEmail[contactEmail.toLowerCase()];
  }

  // 2. DB lookup by email
  if (contactEmail) {
    const { data: byEmail } = await supabase
      .from("contacts").select("id").eq("email", contactEmail).maybeSingle();
    if (byEmail) return byEmail.id;
  }

  // 3. DB lookup by name
  if (contactFullName) {
    const nameParts = contactFullName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
    let query = supabase.from("contacts").select("id").eq("first_name", firstName);
    if (lastName) query = query.eq("last_name", lastName);
    const { data: byName } = await query.maybeSingle();
    if (byName) {
      const updates: Record<string, string> = {};
      if (contactEmail) updates.email = contactEmail;
      if (contactPhone) updates.phone = contactPhone;
      if (Object.keys(updates).length > 0) {
        await supabase.from("contacts").update(updates).eq("id", byName.id).is("email", null);
      }
      return byName.id;
    }
  }

  // 4. Create new contact
  const nameParts = contactFullName.split(/\s+/);
  const firstName = nameParts[0] || (contactEmail ? contactEmail.split("@")[0] : "Unknown");
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  const { data: newContact, error } = await supabase
    .from("contacts")
    .insert({ email: contactEmail || null, first_name: firstName, last_name: lastName, phone: contactPhone, type: "person" })
    .select("id")
    .single();

  if (error) {
    console.error("Contact creation failed:", error.message);
    return null;
  }
  return newContact.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailUser = Deno.env.get("EMAIL_USER");
    const emailPass = Deno.env.get("EMAIL_PASSWORD");
    console.log("EMAIL_USER from environment:", emailUser);
    if (!emailUser || !emailPass) throw new Error("Email credentials not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

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
    let leadsCreated = 0;

    try {
      // Get all contacts for matching
      const { data: contacts } = await supabase.from("contacts").select("id, email");
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

          const { error, data: upsertedEmail } = await supabase.from("emails").upsert(
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
            },
            { onConflict: "message_id", ignoreDuplicates: true }
          ).select("id");

          if (!error) synced++;

          // --- Lead auto-creation for "форма" emails ---
          if (
            !error &&
            upsertedEmail?.length > 0 &&
            subject.toLowerCase().includes("форма")
          ) {
            // Check if a lead was already created for this email (by checking existing leads with same email message_id in notes)
            const emailIdTag = `[email:${messageId}]`;
            const { data: existingLead } = await supabase
              .from("leads")
              .select("id")
              .ilike("notes", `%${emailIdTag}%`)
              .maybeSingle();

            if (!existingLead) {
              // Parse structured body
              const fields = parseStructuredBody(bodyText);
              const contactEmail = fields.email || from;
              const contactFullName = fields.fullName || "";
              const contactPhone = fields.phone || null;

              const leadContactId = await findOrCreateContact(
                supabase, contactEmail, contactFullName, contactPhone, contactByEmail
              );

              if (leadContactId) {
                // Update cache
                if (contactEmail) contactByEmail[contactEmail.toLowerCase()] = leadContactId;

                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, "0");
                const leadTitle = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

                const notesText = bodyText ? bodyText.substring(0, 1900) : "";
                const { error: leadError } = await supabase.from("leads").insert({
                  contact_id: leadContactId,
                  title: leadTitle,
                  source: "email",
                  status: "new",
                  notes: `${notesText}\n\n${emailIdTag}`,
                  project_name: fields.project || null,
                });

                if (leadError) {
                  console.error("Lead creation failed:", leadError.message);
                } else {
                  leadsCreated++;
                  console.log(`Lead created from "форма" email: ${subject}`);
                }
              }
            }
          }
        } catch (fetchErr) {
          console.error(`Error processing message:`, fetchErr);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return new Response(JSON.stringify({ success: true, synced, leadsCreated }), {
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
