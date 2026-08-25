import { mapCalibration } from "../dda/calibrationMapper";
import { session } from "./SessionManager";
import { submitStudy, withRetries } from "./supabaseClient";

const ATTEMPTS = 3;
const DELAY_MS = 2000;

function buildPayload(): Record<string, unknown> {
  const calibration = session.getCalibration();

  return {
    sessionId: session.getSessionId(),

    consent: session.getConsent(),

    terminationReason: session.getTerminationReason(),
    finalScore: session.getFinalScore(),
    livesRemaining: session.getLivesRemaining(),

    startingLevel: mapCalibration(calibration).startingLevel,

    calibration,
    waves: session.getCompletedWaves(),
    ddaEvents: session.getDDAEvents(),

    powerUpsCollected: session.getPowerUpsCollectedByType(),
    questionnaire: session.getQuestionnaire(),

    pauseCount: session.getPauseCount(),
    totalPausedMs: session.getTotalPausedMs(),
    musicEnabled: session.getMusicEnabled(),
    sfxEnabled: session.getSfxEnabled(),
  };
}

// submits and shows a retry screen if it fails
export function submitWithRetry(root: HTMLElement): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const render = (state: "sending" | "failed"): void => {
      root.innerHTML = "";
      root.hidden = false;

      const page = document.createElement("article");

      page.className = "gate-page";

      const heading = document.createElement("h1");

      heading.textContent =
        state === "sending" ? "Saving your responses" : "Could not save";

      page.append(heading);

      const message = document.createElement("p");

      message.textContent =
        state === "sending"
          ? "This will only take a moment."
          : "We couldn't reach the study server. Please check your connection and try again.";

      page.append(message);

      if (state === "failed") {
        const retry = document.createElement("button");

        retry.type = "button";
        retry.className = "consent-button";
        retry.textContent = "Try again";

        retry.addEventListener("click", () => {
          render("sending");

          void attempt();
        });

        page.append(retry);

        const skip = document.createElement("button");

        skip.type = "button";
        skip.className = "consent-button-secondary";
        skip.textContent = "Continue without saving";

        skip.addEventListener("click", () => {
          root.innerHTML = "";
          root.hidden = true;

          resolve(false);
        });

        page.append(skip);
      }

      root.append(page);
    };

    const attempt = async (): Promise<void> => {
      try {
        await withRetries(
          () => submitStudy(buildPayload()),
          ATTEMPTS,
          DELAY_MS,
        );

        root.innerHTML = "";
        root.hidden = true;

        resolve(true);
      } catch {
        render("failed");
      }
    };

    render("sending");

    void attempt();
  });
}