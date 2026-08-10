import Phaser from "phaser";

import type { ProjectileSystem } from "../../systems/ProjectileSystem";
import { DEPTH, PALETTE, RANGED_CONFIG, ENEMY_WEAPON_CONFIG } from "../../gameplayConfig";
import {
  resolveEvasion,
  resolveStandoffVector,
} from "../../systems/RangedMovement";
import type { Vector2 } from "../../../types/game";
import type { Enemy } from "./Enemy";
import type { EnemyType } from "../../../types/game";

export class Ranged implements Enemy {
  private readonly view: Phaser.GameObjects.Arc;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly playerProjectiles: ProjectileSystem;
  private readonly enemyProjectiles: ProjectileSystem;

  private alive = true;
  private lastShotAt: number;
  private health = RANGED_CONFIG.maxHealth;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerProjectiles: ProjectileSystem,
    enemyProjectiles: ProjectileSystem,
  ) {
    this.playerProjectiles = playerProjectiles;
    this.enemyProjectiles = enemyProjectiles;

    // prevents firing immediately upon spawn
    this.lastShotAt = scene.time.now;

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

  public update(time: number, targetX: number, targetY: number): void {
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

    this.tryFire(time, targetX, targetY);
  }

  private resolveEvasion(): Vector2 | null {
    for (const projectile of this.playerProjectiles.getActiveProjectiles()) {
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

  private tryFire(time: number, targetX: number, targetY: number): void {
    if (time - this.lastShotAt < ENEMY_WEAPON_CONFIG.attackIntervalMs) {
      return;
    }

    const deltaX = targetX - this.view.x;
    const deltaY = targetY - this.view.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance === 0 || distance > ENEMY_WEAPON_CONFIG.maxFiringRange) {
      return;
    }

    const directionX = deltaX / distance;
    const directionY = deltaY / distance;

    this.lastShotAt = time;

    this.enemyProjectiles.spawn({
      originX: this.view.x + directionX * ENEMY_WEAPON_CONFIG.muzzleOffset,
      originY: this.view.y + directionY * ENEMY_WEAPON_CONFIG.muzzleOffset,
      velocityX: directionX * ENEMY_WEAPON_CONFIG.projectileSpeed,
      velocityY: directionY * ENEMY_WEAPON_CONFIG.projectileSpeed,
      angle: Math.atan2(deltaY, deltaX),
      firedAt: time,
    });
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

  public takeHit(): boolean {
    if (!this.alive) {
      return false;
    }

    this.health -= 1;

    if (this.health > 0) {
      this.view.setFillStyle(
        PALETTE.ranged,
        0.35 + 0.65 * (this.health / RANGED_CONFIG.maxHealth),
      );

      return false;
    }

    this.alive = false;
    this.body.enable = false;
    this.view.destroy();

    return true;
  }
  public getRadius(): number {
    return RANGED_CONFIG.radius;
  }

  public getType(): EnemyType {
    return "ranged";
  }

  public despawn(): void {
    if (!this.alive) {
      return;
    }

    this.alive = false;
    this.body.enable = false;
    this.view.destroy();
  }
}