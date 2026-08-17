import Phaser from "phaser";

import { CHASER_CONFIG, DEPTH, PALETTE } from "../../gameplayConfig";
import {
  adjustChaserSpeed,
  setPursuitVector,
} from "../../systems/ChaserMovement";
import type { Enemy } from "./Enemy";
import type { EnemyType } from "../../../types/game";
import { drawNeonShape } from "../../render/Neon";

export class Chaser implements Enemy {
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly spawnedAt: number;
  private readonly speedMultiplier: number;
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly ship: Phaser.GameObjects.Graphics;

  private alive = true;
  private health = CHASER_CONFIG.maxHealth;

  public constructor(scene: Phaser.Scene, x: number, y: number, speedMultiplier: number) {
    this.spawnedAt = scene.time.now;
    this.speedMultiplier = speedMultiplier;

    const diameter = CHASER_CONFIG.radius * 2;

    this.hitbox = scene.add.rectangle(x, y, diameter, diameter, 0x000000);

    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The chaser doesn't have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(CHASER_CONFIG.radius);
    this.body.setCollideWorldBounds(true);

    this.hitbox.setVisible(false);

    this.ship = scene.add.graphics();
    this.ship.setDepth(DEPTH.enemy);
    this.ship.setPosition(x, y);

    this.drawHull();
  }

  // steers toward the player and accelerates
  public update(time: number, targetX: number, targetY: number): void {
    if (!this.alive) {
      return;
    }

    const speed = adjustChaserSpeed(
      time - this.spawnedAt,
      CHASER_CONFIG.baseSpeed * this.speedMultiplier,
      CHASER_CONFIG.accelerationPerSecond,
      CHASER_CONFIG.maxSpeed,
    );

    const direction = setPursuitVector(
      this.hitbox.x,
      this.hitbox.y,
      targetX,
      targetY,
    );

    this.body.setVelocity(direction.x * speed, direction.y * speed);
    this.ship.setPosition(this.hitbox.x, this.hitbox.y);
    this.ship.setRotation((time / 1000) * CHASER_CONFIG.spinRate);
  }

  private drawHull(): void {
    this.ship.clear();

    drawNeonShape(
      this.ship,
      CHASER_CONFIG.hullOutline,
      PALETTE.chaser,
      CHASER_CONFIG.hullLineWidth,
    );
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
    return PALETTE.chaser;
  }

  public takeHit(): boolean {
    if (!this.alive) {
      return false;
    }

    this.health -= 1;

    if (this.health > 0) {
      this.ship.setAlpha(0.4 + 0.6 * (this.health / CHASER_CONFIG.maxHealth));

      return false;
    }

    this.destroyObjects();

    return true;
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

  private destroyObjects(): void {
    this.alive = false;
    this.body.enable = false;
    this.ship.destroy();
    this.hitbox.destroy();
  }

  public despawn(): void {
    if (!this.alive) {
      return;
    }

    this.destroyObjects();
  }
}