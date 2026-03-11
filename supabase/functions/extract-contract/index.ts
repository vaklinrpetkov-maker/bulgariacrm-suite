import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a specialized legal document parser for Bulgarian Real Estate Preliminary Contracts (Предварителен договор). Your task is to extract specific data points from uploaded documents.

EXTRACTION INSTRUCTIONS:
1. The document is in Bulgarian. Extract all values as they appear in the document.
2. If a single contract contains multiple properties (e.g., Apartment AND Garage), create a separate object for each property.
3. For Credit check [16]: Scan for "ипотечен кредит" or "банков кредит". If buyer declares they will use credit, return "Yes". Otherwise "No".
4. For Property Type [6]: Identify if it's "Апартамент", "Гараж", "Паркомясто", or "Склад" and include the number.

FIELDS TO EXTRACT (return as JSON array of objects):
- "Дата" [1]: Date of contract
- "Продавач" [2]: Selling entity name
- "Купувач" [3]: Full name of buyer
- "ЕГН" [4]: 10-digit Bulgarian ID number
- "Сграда" [5]: Building/complex name
- "Имот №" [6]: Type and number (e.g., "Апартамент 5", "Гараж 82")
- "Етаж" [7]: Floor level
- "Вход" [8]: Entrance (or "N/A")
- "Застроена площ" [9]: Net built-up area in sq.m.
- "Обща площ" [10]: Total area including common parts
- "Продажна цена" [11]: Total price for the unit
- "Първа вноска" [12]: 1st installment amount
- "Втора вноска" [13]: 2nd installment amount
- "Трета вноска" [14]: 3rd installment amount
- "Четвърта вноска" [15]: 4th installment amount
- "Кредит" [16]: "Yes" or "No"
- "Адрес" [17]: Buyer's correspondence address
- "e-mail" [18]: Buyer's email
- "Телефон" [19]: Buyer's phone number

If a field cannot be found, use "N/A".

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, just the JSON array.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName, filePath, userId } = await req.json();

    if (!fileContent) {
      return new Response(JSON.stringify({ error: "No file content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing document: ${fileName}`);

    // Build user message - if PDF, send as multimodal image_url; otherwise as text
    const isPdf = fileContent.startsWith("[BASE64_PDF]");
    let userMessage: any;
    if (isPdf) {
      const base64Data = fileContent.replace("[BASE64_PDF]\n", "");
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: "Please extract the contract data from the following document." },
          { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64Data}` } },
        ],
      };
    } else {
      userMessage = {
        role: "user",
        content: `Please extract the contract data from the following document content:\n\n${fileContent}`,
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          userMessage,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_contract_data",
              description: "Extract structured data from a Bulgarian real estate contract",
              parameters: {
                type: "object",
                properties: {
                  properties: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        "Дата": { type: "string" },
                        "Продавач": { type: "string" },
                        "Купувач": { type: "string" },
                        "ЕГН": { type: "string" },
                        "Сграда": { type: "string" },
                        "Имот №": { type: "string" },
                        "Етаж": { type: "string" },
                        "Вход": { type: "string" },
                        "Застроена площ": { type: "string" },
                        "Обща площ": { type: "string" },
                        "Продажна цена": { type: "string" },
                        "Първа вноска": { type: "string" },
                        "Втора вноска": { type: "string" },
                        "Трета вноска": { type: "string" },
                        "Четвърта вноска": { type: "string" },
                        "Кредит": { type: "string", enum: ["Yes", "No"] },
                        "Адрес": { type: "string" },
                        "e-mail": { type: "string" },
                        "Телефон": { type: "string" },
                      },
                      required: ["Дата", "Продавач", "Купувач", "ЕГН", "Сграда", "Имот №", "Етаж", "Вход", "Застроена площ", "Обща площ", "Продажна цена", "Първа вноска", "Втора вноска", "Трета вноска", "Четвърта вноска", "Кредит", "Адрес", "e-mail", "Телефон"],
                    },
                  },
                },
                required: ["properties"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_contract_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log("AI response:", JSON.stringify(aiResult));

    let extractedData;
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      extractedData = parsed.properties || parsed;
    } else {
      const content = aiResult.choices?.[0]?.message?.content || "";
      extractedData = JSON.parse(content);
    }

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const extractionId = crypto.randomUUID();
    const { error: dbError } = await supabase
      .from("contract_extractions")
      .insert({
        id: extractionId,
        file_name: fileName,
        file_path: filePath || null,
        extracted_data: extractedData,
        status: "completed",
        user_id: userId || null,
      });

    if (dbError) {
      console.error("DB error:", dbError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: extractedData,
      extraction_id: extractionId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Extract error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
