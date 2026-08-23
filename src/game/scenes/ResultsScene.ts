import Phaser from "phaser";

import { CANVAS, HUD_TEXT_STYLE, PALETTE } from "../gameplayConfig";
import { session } from "../../experiment/SessionManager";
import { AudioControls } from "../../ui/AudioControls";
import { QuestionnaireFlow } from "../../survey/questionnaireFlow";

export class ResultsScene extends Phaser.Scene {

  public constructor() {
    super({ key: "ResultsScene" });
  }

  public create(): void {
    new AudioControls(this);
    const centerX = CANVAS.width / 2;

    const heading =
      session.getTerminationReason() === "completed"
        ? "All waves complete"
        : "Out of lives";

    this.addCenteredText(centerX, 150, heading, "34px", PALETTE.hudPrimary);

    this.addCenteredText(
      centerX,
      220,
      `Final score ${String(session.getFinalScore())}`,
      "26px",
      PALETTE.hudPrimary,
    );

    this.addCenteredText(
      centerX,
      270,
      `Waves completed ${String(session.getCompletedWaveCount())}`,
      "20px",
      PALETTE.hudMuted,
    );

    this.addCenteredText(
      centerX,
      304,
      `Lives remaining ${String(session.getLivesRemaining())}`,
      "20px",
      PALETTE.hudMuted,
    );

    this.addCenteredText(
      centerX,
      380,
      "Please complete a short questionnaire about your experience.",
      "22px",
      PALETTE.hudMuted,
    );

    this.addCenteredText(
      centerX,
      412,
      "It takes about three minutes. Press SPACE to continue.",
      "22px",
      PALETTE.hudMuted,
    );

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    keyboard.once("keydown-SPACE", () => {
      void this.startQuestionnaire();
    });
  }

  private addCenteredText(
    x: number,
    y: number,
    text: string,
    fontSize: string,
    colour: string,
  ): void {
    const label = this.add.text(x, y, text, {
      ...HUD_TEXT_STYLE,
      fontSize,
      color: colour,
    });

    label.setOrigin(0.5, 0.5);
  }

  private async startQuestionnaire(): Promise<void> {
    const gameRoot = document.querySelector<HTMLElement>("#game-root");
    const surveyRoot = document.querySelector<HTMLElement>("#survey-root");

    if (gameRoot === null || surveyRoot === null) {
      throw new Error("The game or survey container is missing from the page.");
    }

    gameRoot.hidden = true;

    const flow = new QuestionnaireFlow(surveyRoot);
    const response = await flow.start();

    session.setQuestionnaire(response);
    session.setPhase("studyComplete");

    // TODO: replace with Supabase upload and debrief screen
    console.log("Questionnaire complete", response);

    gameRoot.hidden = false;

    session.resetRun();
    this.scene.start("CalibrationScene");
  }
}