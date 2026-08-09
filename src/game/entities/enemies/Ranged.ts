import Phaser from "phaser";

import type { ProjectileSystem } from "../../systems/ProjectileSystem";
import { DEPTH, PALETTE, RANGED_CONFIG } from "../../gameplayConfig";
import {
  resolveEvasion,
  resolveStandoffVector,
} from "../../systems/RangedMovement";
import type { Vector2 } from "../../../types/game";

export class Ranged {
  private readonly view: Phaser.GameObjects.Arc;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly projectiles: ProjectileSystem;

  private alive = true;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    projectiles: ProjectileSystem,
  ) {
    this.projectiles = projectiles;

    this.view = scene.add.circle(x, y, RANGED_CONFIG.radius, PALETTE.ranged);
    this.view.setDepth(DEPTH.enemy);

    scene.physics.add.existing(this.view);

    const body = this.view.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error(
        "The ranged attacker doesn't have an Arcade Physics body.",
      );
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(RANGED_CONFIG.radius);
    this.body.setCollideWorldBounds(true);
  }

  public update(targetX: number, targetY: number): void {
    if (!this.alive) {
      return;
    }

    const evasion = this.resolveEvasion();

    if (evasion !== null) {
      this.body.setVelocity(
        evasion.x * RANGED_CONFIG.evasionSpeed,
        evasion.y * RANGED_CONFIG.evasionSpeed,
      );

      return;
    }

    const standoff = resolveStandoffVector(
      this.view.x,
      this.view.y,
      targetX,
      targetY,
      RANGED_CONFIG.preferredDistance,
      RANGED_CONFIG.distanceTolerance,
    );

    const closing =
      Math.hypot(targetX - this.view.x, targetY - this.view.y) >
      RANGED_CONFIG.preferredDistance;

    const speed = closing
      ? RANGED_CONFIG.approachSpeed
      : RANGED_CONFIG.retreatSpeed;

    this.body.setVelocity(standoff.x * speed, standoff.y * speed);
  }

  private resolveEvasion(): Vector2 | null {
    for (const projectile of this.projectiles.getActiveProjectiles()) {
      const body = projectile.getBody();

      const evasion = resolveEvasion(
        this.view.x,
        this.view.y,
        projectile.getX(),
        projectile.getY(),
        body.velocity.x,
        body.velocity.y,
        RANGED_CONFIG.evasionRadius,
        RANGED_CONFIG.evasionLookaheadMs,
      );

      if (evasion !== null) {
        return evasion;
      }
    }

    return null;
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

  public setPosition(x: number, y: number): void {
    this.body.reset(x, y);
  }

  public kill(): void {
    if (!this.alive) {
      return;
    }

    this.alive = false;
    this.body.enable = false;
    this.view.destroy();
  }
}