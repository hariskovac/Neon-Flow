import Phaser from "phaser";

import type { Vector2 } from "../../types/game";
import { DEPTH, PALETTE, PLAYER_CONFIG } from "../gameplayConfig";
import { drawNeonShape } from "../render/Neon";

export class Player {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly ship: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly flame: Phaser.GameObjects.Graphics;

  private isMoving = false;
  private invincibleUntil = 0;
  private speed: number = PLAYER_CONFIG.speed;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    const diameter = PLAYER_CONFIG.collisionRadius * 2;

    this.hitbox = scene.add.rectangle(x, y, diameter, diameter);
    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The player does not have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(PLAYER_CONFIG.collisionRadius);
    this.body.setCollideWorldBounds(true);

    this.hitbox.setVisible(false);

    this.flame = scene.add.graphics();
    this.flame.setDepth(DEPTH.player - 1);
    this.flame.setPosition(x, y);

    this.ship = scene.add.graphics();
    this.ship.setDepth(DEPTH.player);
    this.ship.setPosition(x, y);

    this.drawShip();
  }

  public update(time: number, movement: Vector2, aimAngle: number): void {
    this.body.setVelocity(movement.x * this.speed, movement.y * this.speed);

    this.isMoving = movement.x !== 0 || movement.y !== 0;

    this.ship.setPosition(this.hitbox.x, this.hitbox.y);
    this.ship.setRotation(aimAngle);

    this.flame.setPosition(this.hitbox.x, this.hitbox.y);
    this.flame.setRotation(aimAngle);

    this.drawFlame(time);
    this.updateInvincibilityFlash(time);
  }

  private drawShip(): void {
    this.ship.clear();

    drawNeonShape(
      this.ship,
      PLAYER_CONFIG.hullOutline,
      PALETTE.player,
      PLAYER_CONFIG.hullLineWidth,
    );
  }

  private drawFlame(time: number): void {
    this.flame.clear();

    if (!this.isMoving) {
      return;
    }

    const pulse = (Math.sin(time / PLAYER_CONFIG.flamePulseMs) + 1) / 2;

    const scale =
      PLAYER_CONFIG.flameMinScale +
      (PLAYER_CONFIG.flameMaxScale - PLAYER_CONFIG.flameMinScale) * pulse;

    const points = PLAYER_CONFIG.flameOutline.map((point) => ({
      x: point.x * scale,
      y: point.y,
    }));

    drawNeonShape(this.flame, points, PALETTE.playerFlame, 2, 0.85);
  }

  public respawn(time: number, x: number, y: number): void {
    this.body.reset(x, y);
    this.ship.setPosition(x, y);
    this.flame.setPosition(x, y);

    this.invincibleUntil = time + PLAYER_CONFIG.respawnInvincibilityMs;
  }

  public isInvincible(time: number): boolean {
    return time < this.invincibleUntil;
  }

  private updateInvincibilityFlash(time: number): void {
    const flashOn = Math.floor(time / PLAYER_CONFIG.respawnFlashIntervalMs) % 2 === 0;

    const visible = !this.isInvincible(time) || flashOn;

    this.ship.setVisible(visible);
    this.flame.setVisible(visible);
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.speed = PLAYER_CONFIG.speed * multiplier;
  }

  public clearSpeedMultiplier(): void {
    this.speed = PLAYER_CONFIG.speed;
  }

  public getX(): number {
    return this.hitbox.x;
  }

  public getY(): number {
    return this.hitbox.y;
  }

  public getRadius(): number {
    return PLAYER_CONFIG.collisionRadius;
  }
}