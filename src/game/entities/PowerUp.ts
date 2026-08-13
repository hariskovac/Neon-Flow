import Phaser from "phaser";

import type { PowerUpType } from "../../types/game";
import { DEPTH, PALETTE, POWERUP_CONFIG } from "../gameplayConfig";

const TYPE_COLOURS: Record<PowerUpType, number> = {
  shield: PALETTE.powerUpShield,
  speed: PALETTE.powerUpSpeed,
  fireRate: PALETTE.powerUpFireRate,
};

export class PowerUp {
  private readonly view: Phaser.GameObjects.Rectangle;
  private readonly type: PowerUpType;
  private readonly expiresAt: number;

  private collected = false;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: PowerUpType,
    now: number,
  ) {
    this.type = type;
    this.expiresAt = now + POWERUP_CONFIG.lifetimeMs;

    const size = POWERUP_CONFIG.radius * 2;

    this.view = scene.add.rectangle(x, y, size, size, TYPE_COLOURS[type]);
    this.view.setStrokeStyle(2, 0xffffff);
    this.view.setAngle(45);
    this.view.setDepth(DEPTH.powerUp);
  }

  public update(time: number): void {
    if (this.collected) {
      return;
    }

    if (time >= this.expiresAt) {
      this.despawn();

      return;
    }

    const remaining = this.expiresAt - time;

    if (remaining > POWERUP_CONFIG.warningMs) {
      return;
    }

    const flashOn =
      Math.floor(time / POWERUP_CONFIG.flashIntervalMs) % 2 === 0;

    this.view.setVisible(flashOn);
  }

  public isActive(): boolean {
    return !this.collected;
  }

  public getX(): number {
    return this.view.x;
  }

  public getY(): number {
    return this.view.y;
  }

  public getType(): PowerUpType {
    return this.type;
  }

  public getRadius(): number {
    return POWERUP_CONFIG.radius;
  }

  public despawn(): void {
    if (this.collected) {
      return;
    }

    this.collected = true;
    this.view.destroy();
  }
}