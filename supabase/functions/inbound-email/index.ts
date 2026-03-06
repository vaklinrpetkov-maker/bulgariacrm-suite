import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    project: null,
    fullName: null,
    email: null,
    phone: null,
    message: null,
  };

  if (!text) return result;

  // Remove * wrappers used for bold formatting
  const clean = (v: string) => v.replace(/^\*+|\*+$/g, "").trim();

  // Try to extract "Проект:" field
  const projectMatch = text.match(/Проект:\s*\*?([^*\n]+)\*?/i);
  if (projectMatch) result.project = clean(projectMatch[1]);

  // Try to extract "Име и фамилия:" field
  const nameMatch = text.match(/Име и фамилия:\s*\*?([^*\n]+)\*?/i);
  if (nameMatch) result.fullName = clean(nameMatch[1]);

  // Try to extract "Имейл:" field
  const emailMatch = text.match(/Имейл:\s*\*?([^*\n\s]+)\*?/i);
  if (emailMatch) result.email = clean(emailMatch[1]).toLowerCase();

  // Try to extract "Телефон:" field
  const phoneMatch = text.match(/Телефон:\s*\*?([^*\n]+)\*?/i);
  if (phoneMatch) result.phone = clean(phoneMatch[1]);

  // Try to extract "Съобщение:" field - everything after it until end
  const msgMatch = text.match(/Съобщение:\s*\*?([\s\S]*?)(?:\*?\s*$)/i);
  if (msgMatch) result.message = clean(msgMatch[1]);

  return result;
}

function parseFromField(from: string): { email: string; name: string } {
  const match = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^\s>]+@[^\s>]+)>?$/);
  if (match) {
    return {
      name: (match[1] || "").trim(),
      email: match[2].trim().toLowerCase(),
    };
  }
  return { name: "", email: from.trim().toLowerCase() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate shared secret via header OR query parameter (SendGrid Inbound Parse can't send custom headers)
  const url = new URL(req.url);
  const webhookSecret = req.headers.get("x-webhook-secret") || url.searchParams.get("secret");
  const expectedSecret = Deno.env.get("INBOUND_EMAIL_SECRET");
  if (!expectedSecret || webhookSecret !== expectedSecret) {
    console.error("Auth failed. Got secret:", webhookSecret ? "(present)" : "(missing)");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let fromRaw = "";
    let subject = "";
    let textBody = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      fromRaw = (formData.get("from") as string) || "";
      subject = (formData.get("subject") as string) || "";
      textBody = (formData.get("text") as string) || "";
    } else {
      const body = await req.json();
      fromRaw = body.from || "";
      subject = body.subject || "";
      textBody = body.text || "";
    }

    // --- Filter: Subject must contain "форма" ---
    if (!subject || !subject.toLowerCase().includes("форма")) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "subject missing 'форма'" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fromRaw) {
      return new Response(JSON.stringify({ error: "Missing 'from' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email: fromEmail, name: fromName } = parseFromField(fromRaw);

    // Parse structured fields from email body
    const parsed = parseStructuredBody(textBody);

    // Determine contact email & name: prefer parsed fields, fallback to from header
    const contactEmail = parsed.email || fromEmail;
    const contactFullName = parsed.fullName || fromName || "";
    const contactPhone = parsed.phone || null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find existing contact by email first, then by name
    let contactId: string | null = null;

    // 1. Try email lookup
    if (contactEmail) {
      const { data: byEmail } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", contactEmail)
        .maybeSingle();
      if (byEmail) contactId = byEmail.id;
    }

    // 2. If no email match, try name lookup
    if (!contactId && contactFullName) {
      const nameParts = contactFullName.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      let query = supabase.from("contacts").select("id").eq("first_name", firstName);
      if (lastName) query = query.eq("last_name", lastName);

      const { data: byName } = await query.maybeSingle();
      if (byName) {
        contactId = byName.id;
        // Update phone/email on existing contact if missing
        const updates: Record<string, string> = {};
        if (contactEmail) updates.email = contactEmail;
        if (contactPhone) updates.phone = contactPhone;
        if (Object.keys(updates).length > 0) {
          await supabase.from("contacts").update(updates).eq("id", contactId).is("email", null);
        }
      }
    }

    // 3. Create new contact if not found
    if (!contactId) {
      const nameParts = contactFullName.split(/\s+/);
      const firstName = nameParts[0] || contactEmail.split("@")[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          email: contactEmail || null,
          first_name: firstName,
          last_name: lastName,
          phone: contactPhone,
          type: "person",
        })
        .select("id")
        .single();

      if (contactError) {
        throw new Error(`Contact creation failed: ${contactError.message}`);
      }
      contactId = newContact.id;
    }

    // Title = exact timestamp when lead entered the system
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const leadTitle = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const { error: leadError } = await supabase.from("leads").insert({
      contact_id: contactId,
      title: leadTitle,
      source: "email",
      status: "new",
      notes: textBody ? textBody.substring(0, 2000) : null,
      project_name: parsed.project || null,
    });

    if (leadError) {
      throw new Error(`Lead creation failed: ${leadError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, contact_id: contactId, parsed }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("inbound-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
