import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://hariskovac.github.io",
  "http://localhost:5173",
];

function resolveCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function assignCondition(): "hidden" | "transparent" {
  return Math.random() < 0.5 ? "hidden" : "transparent";
}

Deno.serve(async (request: Request): Promise<Response> => {
  const cors = resolveCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, message: "Method not allowed." }),
      { status: 405, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const condition = assignCondition();

    const { data, error } = await client
      .from("sessions")
      .insert({ condition, server_assigned: true })
      .select("id, condition")
      .single();

    if (error !== null) {
      return new Response(
        JSON.stringify({ ok: false, message: error.message }),
        {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sessionId: data.id,
        condition: data.condition,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);

    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});