import Phaser from "phaser";

import { DEPTH, WEAPON_CONFIG } from "../gameplayConfig";
import type { ShotRequest } from "../systems/WeaponSystem";

export class Projectile {
  private readonly view: Phaser.GameObjects.Arc;
  private readonly body: Phaser.Physics.Arcade.Body;

  private firedAt = 0;

  public constructor(scene: Phaser.Scene, radius: number, color: number) {
    this.view = scene.add.circle(
      0,
      0,
      radius,
      color,
    );

    this.view.setDepth(DEPTH.projectile);
    scene.physics.add.existing(this.view);
    const body = this.view.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("The projectile doesn't have a body");
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(WEAPON_CONFIG.projectileRadius);

    this.deactivate();
  }

  // Activates projectile and sets position and velocity
  public fire(request: ShotRequest): void {
    this.firedAt = request.firedAt;

    this.view.setActive(true);
    this.view.setVisible(true);
    this.body.enable = true;
    this.body.reset(request.originX, request.originY);
    this.body.setVelocity(request.velocityX, request.velocityY);
  }

  // Deactivates projectile and moves it offscreen
  public deactivate(): void {
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.view.setActive(false);
    this.view.setVisible(false);
    this.view.setPosition(-100, -100);
  }

  public isActive(): boolean {
    return this.view.active;
  }

  public getAgeMs(now: number): number {
    return now - this.firedAt;
  }

  public getFiredAt(): number {
    return this.firedAt;
  }

  public getX(): number {
    return this.view.x;
  }

  public getY(): number {
    return this.view.y;
  }

  public getView(): Phaser.GameObjects.Arc {
    return this.view;
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return this.body;
  }

  public destroy(): void {
    this.view.destroy();
  }
}