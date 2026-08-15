import Phaser from "phaser";

import { session } from "../../experiment/SessionManager";
import { CANVAS, HUD_TEXT_STYLE, PALETTE } from "../gameplayConfig";

export class InstructionsScene extends Phaser.Scene {
  private static readonly COMMON_TEXT =
    "This is a timed arena-survival game with seven short waves. " +
    "Survive as long as you can and score as many points as possible. " +
    "You do not need to defeat every enemy before a wave ends.\n\n" +
    "The game may adjust its difficulty based on how you are performing. " +
    "Please play naturally and do not try to deliberately influence " +
    "how the game responds.";

  private static readonly TRANSPARENT_TEXT =
    "Between waves, the game will tell you whether the difficulty " +
    "changed, what changed, and why.";

  public constructor() {
    super({ key: "InstructionsScene" });
  }

  public create(): void {
    const centerX = CANVAS.width / 2;

    const heading = this.add.text(centerX, 70, "Before you begin", {
      ...HUD_TEXT_STYLE,
      fontSize: "28px",
    });

    heading.setOrigin(0.5, 0.5);

    const body = this.add.text(
      centerX,
      190,
      InstructionsScene.COMMON_TEXT,
      {
        ...HUD_TEXT_STYLE,
        fontSize: "17px",
        align: "left",
        wordWrap: { width: 720 },
      },
    );

    body.setOrigin(0.5, 0.5);

    if (session.isTransparent()) {
      const extra = this.add.text(
        centerX,
        340,
        InstructionsScene.TRANSPARENT_TEXT,
        {
          ...HUD_TEXT_STYLE,
          fontSize: "17px",
          color: PALETTE.hudMuted,
          align: "left",
          wordWrap: { width: 720 },
        },
      );

      extra.setOrigin(0.5, 0.5);
    }

    const prompt = this.add.text(
      centerX,
      450,
      "Press SPACE to begin the calibration round",
      { ...HUD_TEXT_STYLE, fontSize: "16px", color: PALETTE.hudMuted },
    );

    prompt.setOrigin(0.5, 0.5);

    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    keyboard.once("keydown-SPACE", () => {
      this.scene.start("CalibrationScene");
    });
  }
}