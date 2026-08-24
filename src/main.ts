import Phaser from "phaser";

import { gameConfig } from "./game/config";
import { ConsentFlow } from "./consent/ConsentFlow.ts";
import { session } from "./experiment/SessionManager";
import "./style.css";

async function start(): Promise<void> {
  const consentRoot = document.querySelector<HTMLElement>("#consent-root");
  const gameRoot = document.querySelector<HTMLElement>("#game-root");

  if (consentRoot === null || gameRoot === null) {
    throw new Error("The consent or game container is missing from the page.");
  }

  const button = document.createElement("button");

  button.textContent = "Test Supabase";
  button.style.cssText = "position:fixed;top:8px;right:8px;z-index:9999";

  button.addEventListener("click", () => {
  void fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ping`,
      {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ note: "from browser" }),
      },
  )
      .then((response) => response.json())
      .then((result: unknown) => {
      console.log("ping result", result);
      })
      .catch((error: unknown) => {
      console.error("ping failed", error);
      });
  });

  document.body.append(button);

  const flow = new ConsentFlow(consentRoot);
  const record = await flow.start();

  session.setConsent(record);
  session.setConsent(record);
  session.setPhase("tutorial");

  gameRoot.hidden = false;

  new Phaser.Game(gameConfig);
}

void start();