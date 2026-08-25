import Phaser from "phaser";

import type { EnemyType, Vector2 } from "../../../types/game";
import { DEPTH, PALETTE, WINDER_CONFIG } from "../../gameplayConfig";
import type { Enemy } from "./Enemy";
import type { PathSample } from "../../systems/winderMovement";
import { drawNeonShape } from "../../render/neon";
import {
  resolveWinderHeading,
  samplePathAt,
} from "../../systems/winderMovement";

export class Winder implements Enemy {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly headView: Phaser.GameObjects.Graphics;
  private readonly segmentViews: Phaser.GameObjects.Graphics[] = [];
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly speed: number;
  private readonly weavePhase: number;
  private readonly weavePeriodMs: number;
  private readonly segmentDelayMs: number;

  private readonly history: PathSample[] = [];
  private readonly historyMs: number;

  private readonly blockingParts: Array<{
    x: number;
    y: number;
    radius: number;
  }> = [];

  private alive = true;
  private health = WINDER_CONFIG.maxHealth;
  private facing: number;
  private lastUpdatedAt: number | null = null;
  private persistenceHandle = -1;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedMultiplier: number,
    initialFacing: number,
  ) {
    this.speed = Math.min(
      WINDER_CONFIG.speed * speedMultiplier,
      WINDER_CONFIG.maxSpeed,
    );

    this.facing = initialFacing;

    this.segmentDelayMs = (WINDER_CONFIG.segmentSpacing / this.speed) * 1000;
    this.historyMs = this.segmentDelayMs * (WINDER_CONFIG.segmentCount + 2);

    this.weavePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    this.weavePeriodMs =
      WINDER_CONFIG.weavePeriodMs *
      Phaser.Math.FloatBetween(
        1 - WINDER_CONFIG.weavePeriodVariance,
        1 + WINDER_CONFIG.weavePeriodVariance,
      );

    const diameter = WINDER_CONFIG.headRadius * 2;

    this.hitbox = scene.add.rectangle(x, y, diameter, diameter, 0x000000);

    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The winder doesn't have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(WINDER_CONFIG.headRadius);
    this.body.setCollideWorldBounds(true);

    this.hitbox.setVisible(false);
    this.hitbox.setAlpha(0);

    for (let index = 0; index < WINDER_CONFIG.segmentCount; index += 1) {
      const view = scene.add.graphics();

      view.setDepth(DEPTH.enemy - 1);
      view.setPosition(x, y);

      drawNeonShape(
        view,
        WINDER_CONFIG.segmentOutline,
        PALETTE.winder,
        WINDER_CONFIG.lineWidth,
        WINDER_CONFIG.segmentAlpha,
      );

      this.segmentViews.push(view);

      this.blockingParts.push({
        x,
        y,
        radius: WINDER_CONFIG.segmentRadius,
      });
    }

    this.headView = scene.add.graphics();
    this.headView.setDepth(DEPTH.enemy);
    this.headView.setPosition(x, y);

    this.drawHead();
  }

  public update(time: number, targetX: number, targetY: number): void {
    if (!this.alive) {
      return;
    }

    const deltaMs =
      this.lastUpdatedAt === null ? 16 : time - this.lastUpdatedAt;

    this.lastUpdatedAt = time;

    this.facing = resolveWinderHeading(
      this.hitbox.x,
      this.hitbox.y,
      targetX,
      targetY,
      this.facing,
      time,
      deltaMs,
      WINDER_CONFIG.weaveAmplitude,
      this.weavePeriodMs,
      this.weavePhase,
      WINDER_CONFIG.turnRateRadians,
    );

    this.body.setVelocity(
      Math.cos(this.facing) * this.speed,
      Math.sin(this.facing) * this.speed,
    );

    this.headView.setPosition(this.hitbox.x, this.hitbox.y);
    this.headView.setRotation(this.facing);

    this.recordPosition(time);
    this.updateSegments(time);
  }

  public isAlive(): boolean {
    return this.alive;
  }

  public getX(): number {
    return this.hitbox.x;
  }

  public getY(): number {
    return this.hitbox.y;
  }

  public getRadius(): number {
    return WINDER_CONFIG.headRadius;
  }

  public getType(): EnemyType {
    return "winder";
  }

  public getColor(): number {
    return PALETTE.winderHead;
  }

  public getPersistenceHandle(): number {
      return this.persistenceHandle;
  }

  public setPersistenceHandle(handle: number): void {
      this.persistenceHandle = handle;
  }

  public allowsDrop(): boolean {
    return true;
  }

  public getBlockingParts(): ReadonlyArray<{
    x: number;
    y: number;
    radius: number;
  }> {
    return this.blockingParts;
  }

  public getSegmentPositions(): ReadonlyArray<Vector2> {
    return this.blockingParts.map((part) => ({ x: part.x, y: part.y }));
  }

  public setPosition(x: number, y: number): void {
    this.body.reset(x, y);
    this.headView.setPosition(x, y);

    this.history.length = 0;
  }

  public takeHit(): boolean {
    if (!this.alive) {
      return false;
    }

    this.health -= 1;

    if (this.health > 0) {
      this.headView.setAlpha(
        0.4 + 0.6 * (this.health / WINDER_CONFIG.maxHealth),
      );

      return false;
    }

    this.destroyObjects();

    return true;
  }

  public despawn(): void {
    if (!this.alive) {
      return;
    }

    this.destroyObjects();
  }

  private destroyObjects(): void {
    this.alive = false;
    this.body.enable = false;

    this.headView.destroy();
    this.hitbox.destroy();

    for (const view of this.segmentViews) {
      view.destroy();
    }

    this.segmentViews.length = 0;
  }

  private recordPosition(time: number): void {
    this.history.push({ x: this.hitbox.x, y: this.hitbox.y, time });

    const cutoff = time - this.historyMs;

    while (this.history.length > 0 && this.history[0].time < cutoff) {
      this.history.shift();
    }
  }

  private updateSegments(time: number): void {
    this.segmentViews.forEach((view, index) => {
      const delay = (index + 1) * this.segmentDelayMs;
      const position = samplePathAt(this.history, time - delay);

      if (position === null) {
        return;
      }

      view.setPosition(position.x, position.y);

      const part = this.blockingParts[index];

      part.x = position.x;
      part.y = position.y;
    });
  }

  private drawHead(): void {
    this.headView.clear();

    drawNeonShape(
      this.headView,
      WINDER_CONFIG.headOutline,
      PALETTE.winderHead,
      WINDER_CONFIG.lineWidth,
    );
  }
}