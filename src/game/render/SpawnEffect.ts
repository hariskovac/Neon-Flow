import Phaser from "phaser";

import type { Vector2 } from "../../types/game";
import { DEPTH, SPAWN_EFFECT_CONFIG } from "../gameplayConfig";
import { drawNeonShape } from "./neon";

export interface SpawnShape {
  readonly durationMs: number;
  readonly echoCount: number;
  readonly echoStartScale: number;
  readonly echoSpacing: number;
  readonly lineWidth: number;
  readonly minAlpha: number;
}

export class SpawnEffect {
  private readonly view: Phaser.GameObjects.Graphics;

  private outline: readonly Vector2[] = [];
  private color = 0xffffff;
  private startedAt = 0;
  private active = false;
  private config: SpawnShape = SPAWN_EFFECT_CONFIG;

  public constructor(scene: Phaser.Scene) {
    this.view = scene.add.graphics();
    this.view.setDepth(DEPTH.enemy);
    this.view.setVisible(false);
  }

  public start(
    x: number,
    y: number,
    outline: readonly Vector2[],
    color: number,
    now: number,
    config: SpawnShape = SPAWN_EFFECT_CONFIG,
  ): void {
    this.outline = outline;
    this.color = color;
    this.startedAt = now;
    this.active = true;
    this.config = config;

    this.view.setPosition(x, y);
    this.view.setVisible(true);
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

    this.view.clear();

    for (let index = 0; index < this.config.echoCount; index += 1) {
      const offset = index * this.config.echoSpacing;

      const startScale = this.config.echoStartScale + offset;
      const scale = startScale + (1 - startScale) * progress;

      if (scale <= 1) {
        continue;
      }

      const alpha =
        SPAWN_EFFECT_CONFIG.minAlpha +
        (1 - SPAWN_EFFECT_CONFIG.minAlpha) *
          (1 - index / SPAWN_EFFECT_CONFIG.echoCount) *
          progress;

      const points = this.outline.map((point) => ({
        x: point.x * scale,
        y: point.y * scale,
      }));

      drawNeonShape(
        this.view,
        points,
        this.color,
        SPAWN_EFFECT_CONFIG.lineWidth,
        alpha,
      );
    }

    return true;
  }

  public setPosition(x: number, y: number): void {
    this.view.setPosition(x, y);
  }

  public setRotation(angle: number): void {
    this.view.setRotation(angle);
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