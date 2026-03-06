import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function parseFromField(from: string): { email: string; name: string } {
  // Handles: "John Doe <john@example.com>" or "john@example.com"
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
      // fallback JSON
      const body = await req.json();
      fromRaw = body.from || "";
      subject = body.subject || "";
      textBody = body.text || "";
    }

    if (!fromRaw) {
      return new Response(JSON.stringify({ error: "Missing 'from' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, name } = parseFromField(fromRaw);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find or create contact by email
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let contactId: string;

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const nameParts = name.split(/\s+/);
      const firstName = nameParts[0] || email.split("@")[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          type: "person",
        })
        .select("id")
        .single();

      if (contactError) {
        throw new Error(`Contact creation failed: ${contactError.message}`);
      }
      contactId = newContact.id;
    }

    // Create lead
    const leadTitle = subject || `Email from ${email}`;
    const { error: leadError } = await supabase.from("leads").insert({
      contact_id: contactId,
      title: leadTitle,
      source: "email",
      status: "new",
      notes: textBody ? textBody.substring(0, 2000) : null,
    });

    if (leadError) {
      throw new Error(`Lead creation failed: ${leadError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, contact_id: contactId }),
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
