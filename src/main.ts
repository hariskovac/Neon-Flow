import Phaser from "phaser";

import { gameConfig } from "./game/config";
import { ConsentFlow } from "./consent/ConsentFlow.ts";
import { session } from "./experiment/SessionManager";
import { beginSessionRequest } from "./experiment/sessionGate";
import "./style.css";

async function start(): Promise<void> {
  const consentRoot = document.querySelector<HTMLElement>("#consent-root");
  const gameRoot = document.querySelector<HTMLElement>("#game-root");

  if (consentRoot === null || gameRoot === null) {
    throw new Error("The consent or game container is missing from the page.");
  }

  if (session.getPhase() === "consent") {
    const flow = new ConsentFlow(consentRoot);
    const record = await flow.start();

    session.setConsent(record);
    session.setPhase("tutorial");
  }

  beginSessionRequest();

  gameRoot.hidden = false;

  new Phaser.Game(gameConfig);
}

void start();