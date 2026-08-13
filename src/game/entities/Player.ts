import Phaser from "phaser";

import type { Vector2 } from "../../types/game";
import { DEPTH, PALETTE, PLAYER_CONFIG } from "../gameplayConfig";

export class Player {
  private readonly view: Phaser.GameObjects.Rectangle;
  private readonly turret: Phaser.GameObjects.Rectangle;
  private readonly body: Phaser.Physics.Arcade.Body;

  private invincibleUntil = 0;
  private speed: number = PLAYER_CONFIG.speed;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    this.turret = scene.add.rectangle(
      x,
      y,
      PLAYER_CONFIG.turretLength,
      PLAYER_CONFIG.turretThickness,
      PALETTE.turret,
    );

    this.turret.setOrigin(0, 0.5);
    this.turret.setDepth(DEPTH.turret);

    this.view = scene.add.rectangle(
      x,
      y,
      PLAYER_CONFIG.size,
      PLAYER_CONFIG.size,
      PALETTE.player,
    );

    this.view.setStrokeStyle(2, PALETTE.playerOutline);
    this.view.setDepth(DEPTH.player);

    scene.physics.add.existing(this.view);

    const body = this.view.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The player does not have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);
  }

  public update(time: number, movement: Vector2, aimAngle: number): void {
    this.body.setVelocity(movement.x * this.speed, movement.y * this.speed);

    this.turret.setPosition(this.view.x, this.view.y);
    this.turret.setRotation(aimAngle);
    this.updateInvincibilityFlash(time);
  }

  public respawn(time: number, x: number, y: number): void {
    this.body.reset(x, y);
    this.turret.setPosition(x, y);

    this.invincibleUntil = time + PLAYER_CONFIG.respawnInvincibilityMs;
  }

  public isInvincible(time: number): boolean {
    return time < this.invincibleUntil;
  }

  private updateInvincibilityFlash(time: number): void {
    const flashOn = Math.floor(time / PLAYER_CONFIG.respawnFlashIntervalMs) % 2 === 0;

    const visible = !this.isInvincible(time) || flashOn;

    this.view.setVisible(visible);
    this.turret.setVisible(visible);
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.speed = PLAYER_CONFIG.speed * multiplier;
  }

  public clearSpeedMultiplier(): void {
    this.speed = PLAYER_CONFIG.speed;
  }

  public getX(): number {
    return this.view.x;
  }

  public getY(): number {
    return this.view.y;
  }
}