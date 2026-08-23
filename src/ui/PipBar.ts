import Phaser from "phaser";

import { PIP_BAR_CONFIG } from "../game/gameplayConfig";

export class PipBar {
  private readonly pips: Phaser.GameObjects.Rectangle[] = [];

  public constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
    for (let index = 0; index < PIP_BAR_CONFIG.pipCount; index += 1) {
      const pip = scene.add.rectangle(
        0,
        0,
        PIP_BAR_CONFIG.pipWidth,
        PIP_BAR_CONFIG.pipHeight,
        PIP_BAR_CONFIG.emptyColor,
      );

      pip.setOrigin(0, 0.5);

      this.pips.push(pip);
      container.add(pip);
    }
  }

  public update(
    x: number,
    y: number,
    previousPressure: number,
    nextPressure: number,
  ): void {
    const previousFilled = this.resolveFilled(previousPressure);
    const nextFilled = this.resolveFilled(nextPressure);

    this.pips.forEach((pip, index) => {
      pip.setPosition(x + index * PIP_BAR_CONFIG.pipWidth, y);
      pip.setVisible(true);

      const inPrevious = index < previousFilled;
      const inNext = index < nextFilled;

      if (inPrevious && inNext) {
        pip.setFillStyle(PIP_BAR_CONFIG.heldColor, 1);
      } else if (inNext) {
        pip.setFillStyle(PIP_BAR_CONFIG.addedColor, 1);
      } else if (inPrevious) {
        pip.setFillStyle(PIP_BAR_CONFIG.removedColor, PIP_BAR_CONFIG.removedAlpha);
      } else {
        pip.setFillStyle(PIP_BAR_CONFIG.emptyColor, 1);
      }
    });
  }

  public setVisible(visible: boolean): void {
    for (const pip of this.pips) {
      pip.setVisible(visible);
    }
  }

  public static getWidth(): number {
    return PIP_BAR_CONFIG.pipCount * PIP_BAR_CONFIG.pipWidth;
  }

  private resolveFilled(pressure: number): number {
    const clamped = Math.min(Math.max(pressure, 0), 1);
    const filled = Math.round(clamped * PIP_BAR_CONFIG.pipCount);

    return Math.max(filled, PIP_BAR_CONFIG.minimumFilled);
  }
}