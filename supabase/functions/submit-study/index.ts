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

function fail(
  cors: Record<string, string>,
  status: number,
  message: string,
): Response {
  return new Response(JSON.stringify({ ok: false, message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  const cors = resolveCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (request.method !== "POST") {
    return fail(cors, 405, "Method not allowed.");
  }

  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const payload = await request.json().catch(() => null);

    if (payload === null || typeof payload.sessionId !== "string") {
      return fail(cors, 400, "A session identifier is required.");
    }

    const sessionId: string = payload.sessionId;

    const { data: existing, error: lookupError } = await client
      .from("sessions")
      .select("id, condition, completed_at, submission_count")
      .eq("id", sessionId)
      .maybeSingle();

    if (lookupError !== null) {
      return fail(cors, 500, lookupError.message);
    }

    if (existing === null) {
      return fail(cors, 404, "Unknown session.");
    }

    // repeat submission is recorded rather than rejected
    // original data is not overwritten
    if (existing.completed_at !== null) {
      await client
        .from("sessions")
        .update({ submission_count: existing.submission_count + 1 })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({ ok: true, duplicate: true }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const waves: unknown[] = Array.isArray(payload.waves) ? payload.waves : [];

    if (waves.length > 0) {
      const rows = waves.map((wave) => {
        const entry = wave as Record<string, number | object>;

        return {
          session_id: sessionId,
          wave_number: entry.waveNumber,
          duration_ms: Math.round(entry.durationMs as number),
          kills_by_type: entry.killsByType,
          lives_lost: entry.livesLost,
          shield_hits_absorbed: entry.shieldHitsAbsorbed,
          enemy_persistence: entry.enemyPersistence,
          enemies_tracked: entry.enemiesTracked,
          enemies_cleared_by_death: entry.enemiesClearedByDeath,
          enemies_spawned: entry.enemiesSpawned,
          shots_fired: entry.shotsFired,
          shots_hit: entry.shotsHit,
          power_ups_spawned: entry.powerUpsSpawned,
          power_ups_collected: entry.powerUpsCollected,
        };
      });

      const { error: waveError } = await client
        .from("wave_performance")
        .insert(rows);

      if (waveError !== null) {
        return fail(cors, 500, `Waves: ${waveError.message}`);
      }
    }

    const events: unknown[] = Array.isArray(payload.ddaEvents)
      ? payload.ddaEvents
      : [];

    if (events.length > 0) {
      const rows = events.map((event) => {
        const entry = event as Record<string, number | string | boolean | object>;

        return {
          session_id: sessionId,
          wave_number: entry.waveNumber,
          elapsed_time_ms: Math.round(entry.elapsedTimeMs as number),
          previous_level: entry.previousLevel,
          next_level: entry.nextLevel,
          direction: entry.direction,
          performance_score: entry.performanceScore,
          metric_snapshot: entry.metricSnapshot,
          parameter_changes: entry.parameterChanges,
          reasons: entry.reasons,
          explanation: entry.explanation,
          displayed: entry.displayed,
          suppressed_by_hysteresis: entry.suppressedByHysteresis,
          safety_override: entry.safetyOverride,
          used_accelerated_step: entry.usedAcceleratedStep,
        };
      });

      const { error: eventError } = await client
        .from("dda_events")
        .insert(rows);

      if (eventError !== null) {
        return fail(cors, 500, `Events: ${eventError.message}`);
      }
    }

    // consent is first/separate (no foreign key)
    if (payload.consent !== undefined && payload.consent !== null) {
      const { error: consentError } = await client.from("consent").insert({
        session_reference: sessionId,
        answers: payload.consent.answers,
        signature: payload.consent.signature,
        printed_name: payload.consent.printedName,
        signed_at: payload.consent.signedAt.slice(0, 10),
      });

      if (consentError !== null) {
        return fail(cors, 500, `Consent: ${consentError.message}`);
      }
    }

    const { error: updateError } = await client
      .from("sessions")
      .update({
        completed_at: new Date().toISOString(),
        termination_reason: payload.terminationReason,
        final_score: payload.finalScore,
        lives_remaining: payload.livesRemaining,
        waves_completed: waves.length,
        starting_level: payload.startingLevel,
        calibration: payload.calibration,
        power_ups_collected: payload.powerUpsCollected,
        pause_count: payload.pauseCount,
        total_paused_ms: Math.round((payload.totalPausedMs as number) ?? 0),
        music_enabled: payload.musicEnabled,
        sfx_enabled: payload.sfxEnabled,
        questionnaire: payload.questionnaire,
        submission_count: existing.submission_count + 1,
      })
      .eq("id", sessionId);

    if (updateError !== null) {
      return fail(cors, 500, `Session: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ ok: true, duplicate: false }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);

    return fail(cors, 500, message);
  }
});