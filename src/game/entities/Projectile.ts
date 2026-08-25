import Phaser from "phaser";

import { DEPTH } from "../gameplayConfig";
import type { ShotRequest } from "../systems/WeaponSystem";
import { drawNeonCircle } from "../render/neon";

export class Projectile {
  private readonly view: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly hitbox: Phaser.GameObjects.Rectangle;

  private firedAt = 0;

  public constructor(scene: Phaser.Scene, radius: number, color: number, lineWidth: number) {
    const diameter = radius * 2;

    this.hitbox = scene.add.rectangle(0, 0, diameter, diameter);

    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The projectile does not have an Arcade Physics body.");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(radius);

    this.hitbox.setVisible(false);
    this.hitbox.setAlpha(0);

    this.view = scene.add.graphics();
    this.view.setDepth(DEPTH.projectile);

    drawNeonCircle(this.view, radius, color, lineWidth);

    this.deactivate();
  }

  // Activates projectile and sets position and velocity
  public fire(request: ShotRequest): void {
    this.firedAt = request.firedAt;

    this.view.setVisible(true);
    this.view.setPosition(request.originX, request.originY);

    this.hitbox.setActive(true);
    this.body.enable = true;
    this.body.reset(request.originX, request.originY);
    this.body.setVelocity(request.velocityX, request.velocityY);
  }

  public syncView(): void {
    this.view.setPosition(this.hitbox.x, this.hitbox.y);
  }

  // Deactivates projectile and moves it offscreen
  public deactivate(): void {
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.hitbox.setActive(false);
    this.view.setVisible(false);
    this.view.setPosition(-100, -100);
  }

  public isActive(): boolean {
    return this.hitbox.active;
  }

  public getAgeMs(now: number): number {
    return now - this.firedAt;
  }

  public getFiredAt(): number {
    return this.firedAt;
  }

  public getX(): number {
    return this.hitbox.x;
  }

  public getY(): number {
    return this.hitbox.y;
  }

  public getView(): Phaser.GameObjects.Graphics {
    return this.view;
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return this.body;
  }

  public destroy(): void {
    this.view.destroy();
    this.hitbox.destroy();
  }
}