import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await request.json().catch(() => ({}));
    const note = typeof body.note === "string" ? body.note : "no note";

    const { data, error } = await client
      .from("deployment_test")
      .insert({ note })
      .select()
      .single();

    if (error !== null) {
      return new Response(
        JSON.stringify({ ok: false, stage: "insert", message: error.message }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ ok: true, row: data }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);

    return new Response(
      JSON.stringify({ ok: false, stage: "unexpected", message }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
});