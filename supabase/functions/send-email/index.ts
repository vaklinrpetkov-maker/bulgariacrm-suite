import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { to, subject, body, contact_id } = await req.json();
    if (!to || !subject || !body) throw new Error("Missing required fields: to, subject, body");

    const emailUser = Deno.env.get("EMAIL_USER");
    const emailPass = Deno.env.get("EMAIL_PASSWORD");
    if (!emailUser || !emailPass) throw new Error("Email credentials not configured");

    const client = new SMTPClient({
      connection: {
        hostname: "mail.vminvest.bg",
        port: 465,
        tls: true,
        auth: { username: emailUser, password: emailPass },
      },
    });

    const messageId = `<${crypto.randomUUID()}@vminvest.bg>`;

    await client.send({
      from: emailUser,
      to,
      subject,
      content: body,
      html: body,
      headers: { "Message-ID": messageId },
    });

    await client.close();

    // Save to DB
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await serviceClient.from("emails").insert({
      direction: "outbound",
      from_address: emailUser,
      to_address: to,
      subject,
      body_text: body,
      body_html: body,
      message_id: messageId,
      contact_id: contact_id || null,
      sent_at: new Date().toISOString(),
      created_by: user.id,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
