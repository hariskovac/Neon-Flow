import Phaser from "phaser";

import { CANVAS, DEPTH, HUD_TEXT_STYLE, PALETTE } from "../game/gameplayConfig";

export class PauseOverlay {
  private readonly container: Phaser.GameObjects.Container;

  public constructor(scene: Phaser.Scene) {
    const backdrop = scene.add.rectangle(
      CANVAS.width / 2,
      CANVAS.height / 2,
      CANVAS.width,
      CANVAS.height,
      PALETTE.arenaFloor,
      1,
    );

    const heading = scene.add.text(CANVAS.width / 2, CANVAS.height / 2 - 30, "Paused", {
      ...HUD_TEXT_STYLE,
      fontSize: "34px",
      color: PALETTE.textAccent,
    });

    heading.setOrigin(0.5, 0.5);

    const prompt = scene.add.text(
      CANVAS.width / 2,
      CANVAS.height / 2 + 24,
      "Press ESC to resume",
      { ...HUD_TEXT_STYLE, fontSize: "17px", color: PALETTE.textMuted },
    );

    prompt.setOrigin(0.5, 0.5);

    this.container = scene.add.container(0, 0, [backdrop, heading, prompt]);
    this.container.setDepth(DEPTH.overlay + 10);
    this.container.setVisible(false);
  }

  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }
}