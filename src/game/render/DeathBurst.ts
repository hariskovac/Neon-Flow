import Phaser from "phaser";

import { BURST_CONFIG, DEPTH } from "../gameplayConfig";
import { drawNeonLine } from "./Neon";

export class DeathBurst {
  private readonly view: Phaser.GameObjects.Graphics;

  private color = 0xffffff;
  private startedAt = 0;
  private active = false;

  public constructor(scene: Phaser.Scene) {
    this.view = scene.add.graphics();
    this.view.setDepth(DEPTH.enemy);
    this.view.setVisible(false);
  }

  public start(x: number, y: number, color: number, now: number): void {
    this.color = color;
    this.startedAt = now;
    this.active = true;

    this.view.setPosition(x, y);
    this.view.setVisible(true);
  }

  public update(now: number): boolean {
    if (!this.active) {
      return false;
    }

    const elapsed = now - this.startedAt;

    if (elapsed >= BURST_CONFIG.durationMs) {
      this.stop();

      return false;
    }

    const progress = elapsed / BURST_CONFIG.durationMs;
    const eased = 1 - (1 - progress) * (1 - progress);

    const inner = eased * BURST_CONFIG.travel;
    const length = BURST_CONFIG.segmentLength * (1 - progress);
    const alpha = 1 - progress;

    this.view.clear();

    for (let index = 0; index < BURST_CONFIG.particleCount; index += 1) {
      const angle = (index / BURST_CONFIG.particleCount) * Math.PI * 2;
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);

      drawNeonLine(
        this.view,
        { x: directionX * inner, y: directionY * inner },
        {
          x: directionX * (inner + length),
          y: directionY * (inner + length),
        },
        this.color,
        BURST_CONFIG.lineWidth,
        alpha,
      );
    }

    return true;
  }

  public isActive(): boolean {
    return this.active;
  }

  public stop(): void {
    this.active = false;

    this.view.clear();
    this.view.setVisible(false);
  }
}