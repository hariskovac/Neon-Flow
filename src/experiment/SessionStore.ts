import type { Condition, PersistedSession, StudyPhase } from "../types/game";

export class SessionStore {
  private static readonly KEY = "neon-flow-session";

  private static readonly MAX_AGE_MS = 24 * 60 * 60 * 1000;

  public load(): PersistedSession | null {
    try {
      const raw = window.localStorage.getItem(SessionStore.KEY);

      if (raw === null) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);

      if (!this.isPersistedSession(parsed)) {
        return null;
      }

      const age = Date.now() - Date.parse(parsed.startedAt);

      if (Number.isNaN(age) || age > SessionStore.MAX_AGE_MS) {
        this.clear();

        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  public save(persisted: PersistedSession): void {
    try {
      window.localStorage.setItem(
        SessionStore.KEY,
        JSON.stringify(persisted),
      );
    } catch {
    }
  }

  public clear(): void {
    try {
      window.localStorage.removeItem(SessionStore.KEY);
    } catch {
    }
  }

  public createLocal(): PersistedSession {
    return {
      sessionId: this.createLocalId(),
      condition: Math.random() < 0.5 ? "hidden" : "transparent",
      phase: "consent",
      startedAt: new Date().toISOString(),
    };
  }

  private createLocalId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `local-${String(Date.now())}-${String(Math.floor(Math.random() * 1e9))}`;
  }

  private isPersistedSession(value: unknown): value is PersistedSession {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const candidate = value as Record<string, unknown>;

    const phases: StudyPhase[] = [
      "consent",
      "tutorial",
      "calibration",
      "researchRun",
      "questionnaireRequired",
      "studyComplete",
    ];

    const conditions: Condition[] = ["hidden", "transparent"];

    return (
      typeof candidate.sessionId === "string" &&
      typeof candidate.startedAt === "string" &&
      typeof candidate.condition === "string" &&
      conditions.includes(candidate.condition as Condition) &&
      typeof candidate.phase === "string" &&
      phases.includes(candidate.phase as StudyPhase)
    );
  }
}

export const sessionStore = new SessionStore();