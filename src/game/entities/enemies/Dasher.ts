import Phaser from "phaser";

import type { EnemyType } from "../../../types/game";
import { DASHER_CONFIG, DEPTH, PALETTE } from "../../gameplayConfig";
import { resolveDash } from "../../systems/DasherMovement";
import type { Enemy } from "./Enemy";

type DasherState = "locking" | "dashing" | "pausing";

export class Dasher implements Enemy {
  private readonly view: Phaser.GameObjects.Arc;
  private readonly body: Phaser.Physics.Arcade.Body;

  private alive = true;
  private health = DASHER_CONFIG.maxHealth;
  private state: DasherState = "locking";
  private stateUntil: number;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    this.view = scene.add.circle(x, y, DASHER_CONFIG.radius, PALETTE.dasher);
    this.view.setDepth(DEPTH.enemy);

    scene.physics.add.existing(this.view);

    const body = this.view.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The dasher doesn't have an Arcade Physics body");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(DASHER_CONFIG.radius);
    this.body.setCollideWorldBounds(true);

    this.stateUntil = scene.time.now + DASHER_CONFIG.lockDurationMs;
  }

  public update(time: number, targetX: number, targetY: number): void {
    if (!this.alive || time < this.stateUntil) {
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
    const plan = resolveDash(
      this.view.x,
      this.view.y,
      targetX,
      targetY,
      DASHER_CONFIG.overshootDistance,
      DASHER_CONFIG.dashSpeed,
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

      this.view.setFillStyle(PALETTE.dasher, 0.35 + 0.65 * remaining);

      return false;
    }

    this.alive = false;
    this.body.enable = false;
    this.view.destroy();

    return true;
  }

  public isAlive(): boolean {
    return this.alive;
  }

  public getX(): number {
    return this.view.x;
  }

  public getY(): number {
    return this.view.y;
  }

  public getRadius(): number {
    return DASHER_CONFIG.radius;
  }

  public getType(): EnemyType {
    return "dasher";
  }

  public setPosition(x: number, y: number): void {
    this.body.reset(x, y);
  }
}