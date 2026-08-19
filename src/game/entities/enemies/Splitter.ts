import Phaser from "phaser";

import type { EnemyType } from "../../../types/game";
import { DEPTH, PALETTE, SPLITTER_CONFIG } from "../../gameplayConfig";
import { drawNeonShape } from "../../render/Neon";
import { setPursuitVector } from "../../systems/ChaserMovement";
import type { Enemy } from "./Enemy";

export class Splitter implements Enemy {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly ship: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly speed: number;

  private alive = true;
  private health = SPLITTER_CONFIG.maxHealth;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedMultiplier: number,
  ) {
    this.speed = Math.min(
      SPLITTER_CONFIG.speed * speedMultiplier,
      SPLITTER_CONFIG.maxSpeed,
    );

    const diameter = SPLITTER_CONFIG.radius * 2;

    this.hitbox = scene.add.rectangle(x, y, diameter, diameter, 0x000000);

    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The splitter doesn't have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(SPLITTER_CONFIG.radius);
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

    const direction = setPursuitVector(
      this.hitbox.x,
      this.hitbox.y,
      targetX,
      targetY,
    );

    this.body.setVelocity(direction.x * this.speed, direction.y * this.speed);

    this.ship.setPosition(this.hitbox.x, this.hitbox.y);
    this.ship.setRotation((time / 1000) * SPLITTER_CONFIG.spinRate);
  }

  public allowsDrop(): boolean {
    return false;
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
    return SPLITTER_CONFIG.radius;
  }

  public getType(): EnemyType {
    return "splitter";
  }

  public getColor(): number {
    return PALETTE.splitter;
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
        0.4 + 0.6 * (this.health / SPLITTER_CONFIG.maxHealth),
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
      SPLITTER_CONFIG.hullOutline,
      PALETTE.splitter,
      SPLITTER_CONFIG.hullLineWidth,
    );
  }

  public getBlockingParts(): ReadonlyArray<{ x: number; y: number; radius: number; }> {
    return [];
  }
}