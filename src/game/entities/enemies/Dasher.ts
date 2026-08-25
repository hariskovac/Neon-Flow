import Phaser from "phaser";

import type { EnemyType } from "../../../types/game";
import { DASHER_CONFIG, DEPTH, PALETTE } from "../../gameplayConfig";
import { resolveDash } from "../../systems/splitterMovement.ts";
import type { Enemy } from "./Enemy";
import { drawNeonShape } from "../../render/neon";

type DasherState = "locking" | "dashing" | "pausing";

export class Dasher implements Enemy {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly ship: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly dashSpeed: number;

  private facing = 0;

  private alive = true;
  private health = DASHER_CONFIG.maxHealth;
  private healthAlpha = 1;
  private state: DasherState = "locking";
  private stateUntil: number;
  private persistenceHandle = -1;

  public constructor(scene: Phaser.Scene, x: number, y: number, speedMultiplier: number, now: number ) {
    this.dashSpeed = Math.min(
      DASHER_CONFIG.dashSpeed * speedMultiplier,
      DASHER_CONFIG.maxDashSpeed,
    );

    const diameter = DASHER_CONFIG.collisionRadius * 2;

    this.hitbox = scene.add.rectangle(x, y, diameter, diameter);

    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The dasher does not have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(DASHER_CONFIG.collisionRadius);
    this.body.setCollideWorldBounds(true);

    this.hitbox.setVisible(false);

    this.ship = scene.add.graphics();
    this.ship.setDepth(DEPTH.enemy);
    this.ship.setPosition(x, y);

    this.drawHull();

    this.stateUntil = now + DASHER_CONFIG.lockDurationMs;
  }

  public update(time: number, targetX: number, targetY: number): void {
    if (!this.alive) {
      return;
    }

    if (this.state === "locking") {
      const deltaX = targetX - this.hitbox.x;
      const deltaY = targetY - this.hitbox.y;

      if (deltaX !== 0 || deltaY !== 0) {
        this.facing = Math.atan2(deltaY, deltaX);
      }

      const pulse = (Math.sin(time / DASHER_CONFIG.lockPulseMs) + 1) / 2;

      const pulseAlpha =
        DASHER_CONFIG.lockPulseMinAlpha +
        (1 - DASHER_CONFIG.lockPulseMinAlpha) * pulse;

      this.ship.setAlpha(this.healthAlpha * pulseAlpha);
    } else {
      this.ship.setAlpha(this.healthAlpha);
    }

    this.ship.setPosition(this.hitbox.x, this.hitbox.y);
    this.ship.setRotation(this.facing);

    if (time < this.stateUntil) {
      return;
    }

    if (this.state === "locking") {
      this.beginDash(time, targetX, targetY);

      return;
    }

    if (this.state === "dashing") {
      this.beginPause(time);

      return;
    }

    this.beginLock(time);
  }

  private beginLock(time: number): void {
    this.state = "locking";
    this.stateUntil = time + DASHER_CONFIG.lockDurationMs;
    this.body.setVelocity(0, 0);
  }

  private beginDash(time: number, targetX: number, targetY: number): void {
    const distanceToTarget = Math.hypot(
      targetX - this.hitbox.x,
      targetY - this.hitbox.y,
    );

    const plan = resolveDash(
      this.facing,
      distanceToTarget,
      DASHER_CONFIG.overshootDistance,
      this.dashSpeed,
    );

    if (plan === null) {
      this.beginLock(time);

      return;
    }

    this.state = "dashing";
    this.stateUntil = time + plan.durationMs;
    this.body.setVelocity(plan.velocityX, plan.velocityY);
  }

  private beginPause(time: number): void {
    this.state = "pausing";
    this.stateUntil = time + DASHER_CONFIG.pauseDurationMs;
    this.body.setVelocity(0, 0);
  }

  public takeHit(): boolean {
    if (!this.alive) {
      return false;
    }

    this.health -= 1;

    if (this.health > 0) {
      const remaining = this.health / DASHER_CONFIG.maxHealth;

      this.ship.setAlpha(0.4 + 0.6 * remaining);

      return false;
    }

    this.alive = false;
    this.body.enable = false;
    this.ship.destroy();
    this.hitbox.destroy();

    return true;
  }

  private drawHull(): void {
    this.ship.clear();

    drawNeonShape(
      this.ship,
      DASHER_CONFIG.hullOutline,
      PALETTE.dasher,
      DASHER_CONFIG.hullLineWidth,
    );
  }

  public allowsDrop(): boolean {
    return true;
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

  public getColor(): number {
    return PALETTE.dasher;
  }

  public getRadius(): number {
    return DASHER_CONFIG.collisionRadius;
  }

  public getType(): EnemyType {
    return "dasher";
  }

  public setPosition(x: number, y: number): void {
    this.body.reset(x, y);
  }

  public getPersistenceHandle(): number {
      return this.persistenceHandle;
  }

  public setPersistenceHandle(handle: number): void {
      this.persistenceHandle = handle;
  }

  public despawn(): void {
    if (!this.alive) {
      return;
    }

    this.alive = false;
    this.body.enable = false;
    this.ship.destroy();
    this.hitbox.destroy();
  }

  public getBlockingParts(): ReadonlyArray<{ x: number; y: number; radius: number; }> {
    return [];
  }
}