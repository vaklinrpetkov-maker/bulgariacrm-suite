import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnitData {
  name: string;
  ref: string;
  status: string;
  entrance: string;
  floor: number;
  propertyType: string;
  sellingParty: string;
  expectedPrice: number | null;
  actualPrice: number | null;
  priceYardTerrace: number | null;
  totalArea: number | null;
  commonParts: number | null;
  cleanArea: number | null;
  bathrooms: number | null;
  yardM2: number | null;
  terraceM2: number | null;
  landM2: number | null;
  landPercent: number | null;
  yardPercent: number | null;
  credit: string;
  buyer: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { building_id, units } = await req.json() as { building_id: string; units: UnitData[] };

  // Fetch all contacts
  const { data: contacts } = await supabase.from("contacts").select("id, first_name, last_name, company_name, type");

  function normalizeStr(s: string): string {
    return s.toLowerCase().replace(/[^a-zа-яёіїєґ0-9\s]/gi, "").replace(/\s+/g, " ").trim();
  }

  function findContact(buyerName: string): string | null {
    if (!buyerName || !contacts) return null;
    const normalized = normalizeStr(buyerName);

    // Try exact full name match
    for (const c of contacts) {
      const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
      if (fullName && normalizeStr(fullName) === normalized) return c.id;
      if (c.company_name && normalizeStr(c.company_name) === normalized) return c.id;
    }

    // Try matching without parenthetical notes
    const withoutParens = normalized.replace(/\(.*?\)/g, "").trim();
    for (const c of contacts) {
      const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
      if (fullName && normalizeStr(fullName) === withoutParens) return c.id;
    }

    // Try first buyer name (before comma for multiple buyers)
    const firstName = normalized.split(",")[0].trim();
    if (firstName !== normalized) {
      for (const c of contacts) {
        const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
        if (fullName && normalizeStr(fullName) === firstName) return c.id;
      }
    }

    // Fuzzy: check if contact name is contained in buyer string
    for (const c of contacts) {
      const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
      if (fullName && fullName.length > 5 && normalized.includes(normalizeStr(fullName))) return c.id;
    }

    return null;
  }

  function mapStatus(s: string): string {
    const lower = s.toLowerCase();
    if (lower.includes("свободен")) return "available";
    if (lower.includes("запазен")) return "reserved";
    if (lower.includes("депозит")) return "reserved";
    if (lower.includes("предварителен")) return "reserved";
    if (lower.includes("продаден")) return "sold";
    return "available";
  }

  function mapType(t: string): { type: string; rooms: number | null } {
    const lower = t.toLowerCase();
    if (lower.includes("гараж")) return { type: "garage", rooms: null };
    if (lower.includes("впм")) return { type: "parking_inside", rooms: null };
    if (lower.includes("пм") && !lower.includes("впм")) return { type: "parking_outside", rooms: null };
    if (lower.includes("офис")) return { type: "office", rooms: null };
    if (lower.includes("едностаен")) return { type: "apartment", rooms: 1 };
    if (lower.includes("двустаен")) return { type: "apartment", rooms: 2 };
    if (lower.includes("тристаен")) return { type: "apartment", rooms: 3 };
    if (lower.includes("четиристаен")) return { type: "apartment", rooms: 4 };
    return { type: "apartment", rooms: null };
  }

  const results: { unit: string; contactMatch: string | null; contactId: string | null }[] = [];
  const toInsert = [];

  for (const u of units) {
    const { type, rooms } = mapType(u.propertyType);
    const contactId = findContact(u.buyer);
    results.push({ unit: u.name, contactMatch: u.buyer || null, contactId });

    toInsert.push({
      building_id,
      unit_number: u.ref || u.name,
      type,
      floor: u.floor || null,
      area_sqm: u.totalArea || null,
      rooms,
      price: u.actualPrice || u.expectedPrice || null,
      status: mapStatus(u.status),
      contact_id: contactId,
      specs: {
        name: u.name,
        ref: u.ref,
        entrance: u.entrance,
        selling_party: u.sellingParty,
        expected_price: u.expectedPrice,
        actual_price: u.actualPrice,
        price_yard_terrace: u.priceYardTerrace,
        common_parts: u.commonParts,
        clean_area: u.cleanArea,
        bathrooms: u.bathrooms,
        yard_m2: u.yardM2,
        terrace_m2: u.terraceM2,
        land_m2: u.landM2,
        land_percent: u.landPercent,
        yard_percent: u.yardPercent,
        credit: u.credit,
        buyer_name: u.buyer,
        original_status: u.status,
        property_type: u.propertyType,
      },
    });
  }

  // Insert in batches of 50
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { error } = await supabase.from("units").insert(batch);
    if (error) {
      return new Response(JSON.stringify({ error: error.message, results }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ success: true, inserted: toInsert.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
