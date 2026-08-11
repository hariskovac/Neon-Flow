import Phaser from "phaser";

import type { GameEndReason, WavePerformance } from "../../types/game";
import { CANVAS, HUD_TEXT_STYLE, PALETTE } from "../gameplayConfig";

export interface ResultsData {
  readonly finalScore: number;
  readonly completedWaves: WavePerformance[];
  readonly gameEndReason: GameEndReason;
  readonly livesRemaining: number;
}

export class ResultsScene extends Phaser.Scene {
  private results!: ResultsData;

  public constructor() {
    super({ key: "ResultsScene" });
  }

  public init(data: ResultsData): void {
    this.results = data;
  }

  public create(): void {
    const centerX = CANVAS.width / 2;

    const heading =
      this.results.gameEndReason === "completed"
        ? "All waves complete"
        : "Out of lives";

    this.addCenteredText(centerX, 150, heading, "34px", PALETTE.hudPrimary);

    this.addCenteredText(
      centerX,
      220,
      `Final score ${String(this.results.finalScore)}`,
      "26px",
      PALETTE.hudPrimary,
    );

    this.addCenteredText(
      centerX,
      270,
      `Waves completed ${String(this.results.completedWaves.length)}`,
      "20px",
      PALETTE.hudMuted,
    );

    this.addCenteredText(
      centerX,
      304,
      `Lives remaining ${String(this.results.livesRemaining)}`,
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

    // Temporary: phase 9 replaces this with the questionnaire, and a research
    // session cannot be replayed as a recorded run (section 2.3).
    keyboard.once("keydown-SPACE", () => {
      this.scene.start("GameScene");
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