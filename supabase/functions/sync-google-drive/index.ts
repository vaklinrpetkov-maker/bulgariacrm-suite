import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!GOOGLE_DRIVE_API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY is not configured");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Validate JWT - admin only
  const authHeader = req.headers.get("authorization");
  const supabaseClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check admin role
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: roles } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const isAdmin = roles?.some((r: any) => r.role === "admin");
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const driveHeaders = {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
  };

  try {
    // 1. Find or create root backup folder
    const rootFolderId = await findOrCreateFolder("VM Invest CRM Backup", null, driveHeaders);
    const docsFolderId = await findOrCreateFolder("Documents", rootFolderId, driveHeaders);
    const crmFolderId = await findOrCreateFolder("CRM Exports", rootFolderId, driveHeaders);

    let filesUploaded = 0;

    // 2. Sync documents from storage bucket
    const { data: documents } = await adminClient.from("documents").select("*");
    if (documents) {
      for (const doc of documents) {
        if (!doc.file_path) continue;
        try {
          const { data: fileData } = await adminClient.storage
            .from("documents")
            .download(doc.file_path);
          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            await uploadFileToDrive(
              doc.title || doc.file_path.split("/").pop() || "file",
              doc.mime_type || "application/octet-stream",
              new Uint8Array(arrayBuffer),
              docsFolderId,
              driveHeaders
            );
            filesUploaded++;
          }
        } catch (e) {
          console.error(`Failed to sync doc ${doc.id}:`, e);
        }
      }
    }

    // 3. Export CRM tables as CSV
    const tables = [
      { name: "contacts", query: adminClient.from("contacts").select("*") },
      { name: "leads", query: adminClient.from("leads").select("*") },
      { name: "deals", query: adminClient.from("deals").select("*") },
      { name: "contracts", query: adminClient.from("contracts").select("*") },
      { name: "meetings", query: adminClient.from("meetings").select("*") },
      { name: "tasks", query: adminClient.from("tasks").select("*") },
    ];

    for (const table of tables) {
      try {
        const { data: rows } = await table.query;
        if (rows && rows.length > 0) {
          const csv = convertToCsv(rows);
          const encoder = new TextEncoder();
          const csvBytes = encoder.encode(csv);
          const timestamp = new Date().toISOString().slice(0, 10);
          await uploadFileToDrive(
            `${table.name}_${timestamp}.csv`,
            "text/csv",
            csvBytes,
            crmFolderId,
            driveHeaders
          );
          filesUploaded++;
        }
      } catch (e) {
        console.error(`Failed to export ${table.name}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        filesUploaded,
        syncedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Google Drive sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function findOrCreateFolder(
  name: string,
  parentId: string | null,
  headers: Record<string, string>
): Promise<string> {
  // Search for existing folder
  let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;

  const searchRes = await fetch(
    `${GATEWAY_URL}/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { ...headers, "Content-Type": "application/json" } }
  );
  if (!searchRes.ok) {
    const body = await searchRes.text();
    throw new Error(`Drive search failed [${searchRes.status}]: ${body}`);
  }
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const metadata: any = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) metadata.parents = [parentId];

  const createRes = await fetch(`${GATEWAY_URL}/drive/v3/files`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Drive folder create failed [${createRes.status}]: ${body}`);
  }
  const folder = await createRes.json();
  return folder.id;
}

async function uploadFileToDrive(
  fileName: string,
  mimeType: string,
  content: Uint8Array,
  folderId: string,
  headers: Record<string, string>
) {
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const boundary = "boundary_" + crypto.randomUUID().replace(/-/g, "");
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;

  const encoder = new TextEncoder();
  const metadataPart = encoder.encode(
    `${delimiter}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
  );
  const mediaPart = encoder.encode(
    `${delimiter}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`
  );
  const base64Content = encoder.encode(btoa(String.fromCharCode(...content)));
  const closing = encoder.encode(`\r\n${closeDelimiter}`);

  const body = new Uint8Array(
    metadataPart.length + mediaPart.length + base64Content.length + closing.length
  );
  let offset = 0;
  body.set(metadataPart, offset); offset += metadataPart.length;
  body.set(mediaPart, offset); offset += mediaPart.length;
  body.set(base64Content, offset); offset += base64Content.length;
  body.set(closing, offset);

  const res = await fetch(
    `${GATEWAY_URL}/upload/drive/v3/files?uploadType=multipart`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive upload failed [${res.status}]: ${errBody}`);
  }
  return await res.json();
}

function convertToCsv(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}
