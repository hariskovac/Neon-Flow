import { session } from "./SessionManager";
import { createSession, withRetries } from "./supabaseClient";

const BACKGROUND_ATTEMPTS = 5;
const BACKGROUND_DELAY_MS = 3000;

const MANUAL_ATTEMPTS = 1;

let inFlight: Promise<void> | null = null;

export function beginSessionRequest(): void {
  if (session.isVerified() || inFlight !== null) {
    return;
  }

  inFlight = withRetries(
    createSession,
    BACKGROUND_ATTEMPTS,
    BACKGROUND_DELAY_MS,
  )
    .then((result) => {
      session.setIdentity(result.sessionId, result.condition);
    })
    .catch(() => {
    })
    .finally(() => {
      inFlight = null;
    });
}

export async function requireVerifiedSession(
  root: HTMLElement,
): Promise<void> {
  if (session.isVerified()) {
    return;
  }

  if (inFlight !== null) {
    await inFlight;
  }

  if (session.isVerified()) {
    return;
  }

  await showGate(root);
}

function showGate(root: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    const render = (state: "waiting" | "failed"): void => {
      root.innerHTML = "";
      root.hidden = false;

      const page = document.createElement("article");

      page.className = "gate-page";

      const heading = document.createElement("h1");

      heading.textContent =
        state === "waiting" ? "Preparing study session" : "Connection problem";

      page.append(heading);

      const message = document.createElement("p");

      message.textContent =
        state === "waiting"
          ? "This will only take a moment."
          : "We couldn't reach the study server. Please check your connection and try again.";

      page.append(message);

      if (state === "failed") {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "consent-button";
        button.textContent = "Try again";

        button.addEventListener("click", () => {
          render("waiting");

          void attempt();
        });

        page.append(button);
      }

      root.append(page);
    };

    const attempt = async (): Promise<void> => {
      try {
        const result = await withRetries(
          createSession,
          MANUAL_ATTEMPTS,
          BACKGROUND_DELAY_MS,
        );

        session.setIdentity(result.sessionId, result.condition);

        root.innerHTML = "";
        root.hidden = true;

        resolve();
      } catch {
        render("failed");
      }
    };

    render("waiting");

    void attempt();
  });
}