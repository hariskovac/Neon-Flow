import type { Condition } from "../types/game";

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export interface CreateSessionResult {
  readonly sessionId: string;
  readonly condition: Condition;
}

export interface SubmitResult {
  readonly duplicate: boolean;
}

export class StudyServerError extends Error {
  public constructor(message: string) {
    super(message);

    this.name = "StudyServerError";
  }
}

async function callFunction(
  name: string,
  body: unknown,
): Promise<Record<string, unknown>> {
  if (SUPABASE_URL === "" || SUPABASE_ANON_KEY === "") {
    throw new StudyServerError("The study server is not configured.");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok || payload === null) {
    const message =
      payload !== null && typeof payload === "object" && "message" in payload
        ? String((payload as Record<string, unknown>).message)
        : `Request failed with status ${String(response.status)}.`;

    throw new StudyServerError(message);
  }

  const result = payload as Record<string, unknown>;

  if (result.ok !== true) {
    throw new StudyServerError(
      typeof result.message === "string"
        ? result.message
        : "The study server rejected the request.",
    );
  }

  return result;
}

export async function createSession(): Promise<CreateSessionResult> {
  const result = await callFunction("create-session", {});

  const sessionId = result.sessionId;
  const condition = result.condition;

  if (
    typeof sessionId !== "string" ||
    (condition !== "hidden" && condition !== "transparent")
  ) {
    throw new StudyServerError("The study server returned an invalid session.");
  }

  return { sessionId, condition };
}

export async function submitStudy(payload: unknown): Promise<SubmitResult> {
  const result = await callFunction("submit-study", payload);

  return { duplicate: result.duplicate === true };
}

export async function withRetries<T>(
  operation: () => Promise<T>,
  attempts: number,
  baseDelayMs: number,
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (caught) {
      lastError = caught;

      if (attempt < attempts - 1) {
        await delay(baseDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new StudyServerError("The study server could not be reached.");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}