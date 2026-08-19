import Phaser from "phaser";

import type { EnemyType } from "../../../types/game";
import { DEPTH, PALETTE, SHARD_CONFIG } from "../../gameplayConfig";
import { drawNeonShape } from "../../render/Neon";
import type { Enemy } from "./Enemy";
import { setPursuitVector } from "../../systems/ChaserMovement";

export class Shard implements Enemy {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly ship: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly pursuitSpeed: number;
  private readonly canDrop: boolean;

  private partner: Shard | null = null;

  private alive = true;
  private health = SHARD_CONFIG.maxHealth;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedMultiplier: number,
    canDrop: boolean,
  ) {
    this.canDrop = canDrop;

    this.pursuitSpeed = Math.min(
      SHARD_CONFIG.pursuitSpeed * speedMultiplier,
      SHARD_CONFIG.maxPursuitSpeed,
    );

    const diameter = SHARD_CONFIG.radius * 2;

    this.hitbox = scene.add.rectangle(x, y, diameter, diameter, 0x000000);

    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The shard doesn't have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(SHARD_CONFIG.radius);
    this.body.setCollideWorldBounds(true);

    this.hitbox.setVisible(false);
    this.hitbox.setAlpha(0);

    this.ship = scene.add.graphics();
    this.ship.setDepth(DEPTH.enemy);
    this.ship.setPosition(x, y);

    this.drawHull();
  }

  public update(time: number, targetX: number, targetY: number): void {
    if (!this.alive) {
      return;
    }

    const forward = setPursuitVector(
      this.hitbox.x,
      this.hitbox.y,
      targetX,
      targetY,
    );

    let velocityX = forward.x * this.pursuitSpeed;
    let velocityY = forward.y * this.pursuitSpeed;

    if (this.partner !== null && this.partner.isAlive()) {
      const centreX = (this.hitbox.x + this.partner.getX()) / 2;
      const centreY = (this.hitbox.y + this.partner.getY()) / 2;

      const offsetX = this.hitbox.x - centreX;
      const offsetY = this.hitbox.y - centreY;
      const distance = Math.hypot(offsetX, offsetY);

      if (distance > 0) {
        const radialX = offsetX / distance;
        const radialY = offsetY / distance;

        velocityX += -radialY * SHARD_CONFIG.orbitSpeed;
        velocityY += radialX * SHARD_CONFIG.orbitSpeed;

        const error = SHARD_CONFIG.orbitRadius - distance;

        velocityX += radialX * error * SHARD_CONFIG.orbitTightness;
        velocityY += radialY * error * SHARD_CONFIG.orbitTightness;
      }
    }

    this.body.setVelocity(velocityX, velocityY);

    this.ship.setPosition(this.hitbox.x, this.hitbox.y);
    this.ship.setRotation((time / 1000) * SHARD_CONFIG.spinRate);
  }

  public setPartner(partner: Shard): void {
    this.partner = partner;
  }

  public allowsDrop(): boolean {
    return this.canDrop;
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
    return SHARD_CONFIG.radius;
  }

  public getType(): EnemyType {
    return "shard";
  }

  public getColor(): number {
    return PALETTE.shard;
  }

  public setPosition(x: number, y: number): void {
    this.body.reset(x, y);
    this.ship.setPosition(x, y);
  }

  public takeHit(): boolean {
    if (!this.alive) {
      return false;
    }

    this.health -= 1;

    if (this.health > 0) {
      this.ship.setAlpha(
        0.4 + 0.6 * (this.health / SHARD_CONFIG.maxHealth),
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
    this.ship.destroy();
    this.hitbox.destroy();
  }

  private drawHull(): void {
    this.ship.clear();

    drawNeonShape(
      this.ship,
      SHARD_CONFIG.hullOutline,
      PALETTE.shard,
      SHARD_CONFIG.hullLineWidth,
    );
  }
}