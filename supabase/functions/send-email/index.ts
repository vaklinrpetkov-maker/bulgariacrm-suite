import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";

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

    // Fetch user's email signature
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: sigData } = await serviceClient
      .from("email_signatures")
      .select("signature_html")
      .eq("user_id", user.id)
      .maybeSingle();

    let finalHtml = body;
    let finalText = body;
    if (sigData?.signature_html) {
      finalHtml = `${body}<br><br>--<br>${sigData.signature_html}`;
      // Strip HTML tags for plain text version
      const plainSig = sigData.signature_html.replace(/<[^>]*>/g, "");
      finalText = `${body}\n\n--\n${plainSig}`;
    }

    const transporter = nodemailer.createTransport({
      host: "mail.vminvest.bg",
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
    });

    const messageId = `<${crypto.randomUUID()}@vminvest.bg>`;

    await transporter.sendMail({
      from: emailUser,
      to,
      subject,
      text: finalText,
      html: finalHtml,
      messageId,
    });

    // Save to DB
    await serviceClient.from("emails").insert({
      direction: "outbound",
      from_address: emailUser,
      to_address: to,
      subject,
      body_text: finalText,
      body_html: finalHtml,
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
