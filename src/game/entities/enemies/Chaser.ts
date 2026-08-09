import Phaser from "phaser";

import { CHASER_CONFIG, DEPTH, PALETTE } from "../../gameplayConfig";
import {
  adjustChaserSpeed,
  setPursuitVector,
} from "../../systems/ChaserMovement";
import type { Enemy } from "./Enemy";
import type { EnemyType } from "../../../types/game";

export class Chaser implements Enemy {
  private readonly view: Phaser.GameObjects.Arc;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly spawnedAt: number;
  private alive = true;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    this.spawnedAt = scene.time.now;

    this.view = scene.add.circle(
      x,
      y,
      CHASER_CONFIG.radius,
      PALETTE.chaser,
    );

    this.view.setDepth(DEPTH.enemy);

    scene.physics.add.existing(this.view);

    const body = this.view.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The chaser doesn't have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(CHASER_CONFIG.radius);
    this.body.setCollideWorldBounds(true);
  }

  // steers toward the player and accelerates
  public update(time: number, targetX: number, targetY: number): void {
    if (!this.alive) {
      return;
    }

    const speed = adjustChaserSpeed(
      time - this.spawnedAt,
      CHASER_CONFIG.baseSpeed,
      CHASER_CONFIG.accelerationPerSecond,
      CHASER_CONFIG.maxSpeed,
    );

    const direction = setPursuitVector(
      this.view.x,
      this.view.y,
      targetX,
      targetY,
    );

    this.body.setVelocity(direction.x * speed, direction.y * speed);
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

  public kill(): void {
    if (!this.alive) {
      return;
    }

    this.alive = false;
    this.body.enable = false;
    this.view.destroy();
  }

  public setPosition(x: number, y: number): void {
    this.body.reset(x, y);
  }

  public getRadius(): number {
    return CHASER_CONFIG.radius;
  }

  public getType(): EnemyType {
    return "chaser";
  }
}