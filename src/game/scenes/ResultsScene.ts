import Phaser from "phaser";

import type { GameEndReason, WavePerformance } from "../../types/game";
import { CANVAS, HUD_TEXT_STYLE, PALETTE } from "../gameplayConfig";
import { session } from "../../experiment/SessionManager";

export interface ResultsData {
  readonly finalScore: number;
  readonly completedWaves: WavePerformance[];
  readonly gameEndReason: GameEndReason;
  readonly livesRemaining: number;
}

export class ResultsScene extends Phaser.Scene {

  public constructor() {
    super({ key: "ResultsScene" });
  }

  public create(): void {
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
      "Press SPACE to play again",
      "18px",
      PALETTE.hudMuted,
    );

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    keyboard.once("keydown-SPACE", () => {
      session.reset();
      this.scene.start("InstructionsScene");
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
}