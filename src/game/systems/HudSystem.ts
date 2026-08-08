import Phaser from "phaser";

import {
  CANVAS,
  DEPTH,
  HUD_BAND_HEIGHT,
  HUD_TEXT_STYLE,
  PALETTE,
} from "../gameplayConfig";

export class HudSystem {
  private static readonly EDGE_PADDING = 20;
  private static readonly PIP_WIDTH = 18;
  private static readonly PIP_HEIGHT = 8;
  private static readonly PIP_GAP = 6;

  private readonly scoreLabel: Phaser.GameObjects.Text;
  private readonly livesLabel: Phaser.GameObjects.Text; 
  private readonly lifePips: Phaser.GameObjects.Rectangle[] = [];

  private lastScore = 0;
  private lastLivesRemaining = 0;
  private hasRendered = false;

  public constructor(scene: Phaser.Scene, startingLives: number) {
    const centreY = HUD_BAND_HEIGHT / 2;

    this.scoreLabel = scene.add.text(
      HudSystem.EDGE_PADDING,
      centreY,
      "Score 0",
      HUD_TEXT_STYLE,
    );

    this.scoreLabel.setOrigin(0, 0.5);
    this.scoreLabel.setDepth(DEPTH.hud);

    const pipWidth =
      startingLives * HudSystem.PIP_WIDTH +
      (startingLives - 1) * HudSystem.PIP_GAP;

    const pipRight = CANVAS.width - HudSystem.EDGE_PADDING;
    const pipLeft = pipRight - pipWidth;

    for (let index = 0; index < startingLives; index += 1) {
      const pip = scene.add.rectangle(
        pipLeft +
          index * (HudSystem.PIP_WIDTH + HudSystem.PIP_GAP) +
          HudSystem.PIP_WIDTH / 2,
        centreY,
        HudSystem.PIP_WIDTH,
        HudSystem.PIP_HEIGHT,
        PALETTE.lifePipFilled,
      );

      pip.setDepth(DEPTH.hud);

      this.lifePips.push(pip);
    }

    this.livesLabel = scene.add.text(pipLeft - 12, centreY, "Lives", {
      ...HUD_TEXT_STYLE,
      color: PALETTE.hudMuted,
    });

    this.livesLabel.setOrigin(1, 0.5);
    this.livesLabel.setDepth(DEPTH.hud);

    this.update(0, startingLives);
  }

  public update(score: number, livesRemaining: number): void {
    const isFirstUpdate = !this.hasRendered;

    if (isFirstUpdate || score !== this.lastScore) {
      this.scoreLabel.setText(`Score ${String(score)}`);
      this.lastScore = score;
    }

    if (isFirstUpdate || livesRemaining !== this.lastLivesRemaining) {
      this.lifePips.forEach((pip, index) => {
        pip.setFillStyle(
          index < livesRemaining
            ? PALETTE.lifePipFilled
            : PALETTE.lifePipEmpty,
        );
      });

      this.lastLivesRemaining = livesRemaining;
    }

    this.hasRendered = true;
  }
}