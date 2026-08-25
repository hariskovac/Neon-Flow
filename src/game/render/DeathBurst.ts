import Phaser from "phaser";

import { BURST_CONFIG, PLAYER_BURST_CONFIG, DEPTH } from "../gameplayConfig";
import { drawNeonLine, drawNeonCircle } from "./neon";

interface BurstShape {
  readonly particleCount: number;
  readonly travel: number;
  readonly segmentLength: number;
  readonly lineWidth: number;
  readonly durationMs: number;
}

export class DeathBurst {
  private readonly view: Phaser.GameObjects.Graphics;

  private color = 0xffffff;
  private startedAt = 0;
  private active = false;
  private config: BurstShape = BURST_CONFIG;
  private ring = false;

  public constructor(scene: Phaser.Scene) {
    this.view = scene.add.graphics();
    this.view.setDepth(DEPTH.enemy);
    this.view.setVisible(false);
  }

  public update(now: number): boolean {
    if (!this.active) {
      return false;
    }

    const elapsed = now - this.startedAt;

    if (elapsed >= this.config.durationMs) {
      this.stop();

      return false;
    }

    const progress = elapsed / this.config.durationMs;
    const eased = 1 - (1 - progress) * (1 - progress);

    const inner = eased * this.config.travel;
    const length = this.config.segmentLength * (1 - progress);
    const alpha = 1 - progress;

    this.view.clear();

    if (this.ring) {
      this.drawRing(elapsed);
    }

    for (let index = 0; index < this.config.particleCount; index += 1) {
      const angle = (index / this.config.particleCount) * Math.PI * 2;
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
        this.config.lineWidth,
        alpha,
      );
    }

    return true;
  }

    public start(
    x: number,
    y: number,
    color: number,
    now: number,
    config: BurstShape = BURST_CONFIG,
    ring = false,
  ): void {
    this.config = config;
    this.ring = ring;
    this.color = color;
    this.startedAt = now;
    this.active = true;

    this.view.setPosition(x, y);
    this.view.setVisible(true);
  }

  private drawRing(elapsed: number): void {
    const progress = Math.min(elapsed / PLAYER_BURST_CONFIG.ringDurationMs, 1);

    if (progress >= 1) {
      return;
    }

    const eased = 1 - Math.pow(1 - progress, 3);
    const radius = eased * PLAYER_BURST_CONFIG.ringMaxRadius;

    drawNeonCircle(
      this.view,
      radius,
      this.color,
      PLAYER_BURST_CONFIG.ringLineWidth,
      (1 - progress) * 0.8,
    );
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