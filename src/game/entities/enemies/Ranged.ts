import Phaser from "phaser";

import type { ProjectileSystem } from "../../systems/ProjectileSystem";
import { DEPTH, PALETTE, RANGED_CONFIG, ENEMY_WEAPON_CONFIG } from "../../gameplayConfig";
import {
  resolveEvasion,
  resolveStandoffVector,
} from "../../systems/RangedMovement";
import type { Vector2, EnemyType } from "../../../types/game";
import type { Enemy } from "./Enemy";
import { drawNeonShape } from "../../render/Neon";

export class Ranged implements Enemy {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly ship: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly playerProjectiles: ProjectileSystem;
  private readonly enemyProjectiles: ProjectileSystem;
  private readonly approachSpeed: number;
  private readonly retreatSpeed: number;
  private readonly attackIntervalMs: number;

  private alive = true;
  private lastShotAt: number;
  private health = RANGED_CONFIG.maxHealth;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerProjectiles: ProjectileSystem,
    enemyProjectiles: ProjectileSystem,
    speedMultiplier: number,
    attackIntervalMs: number,
  ) {
    this.playerProjectiles = playerProjectiles;
    this.enemyProjectiles = enemyProjectiles;
    
    this.approachSpeed = Math.min(
      RANGED_CONFIG.approachSpeed * speedMultiplier,
      RANGED_CONFIG.maxApproachSpeed,
    );

    this.retreatSpeed = Math.min(
      RANGED_CONFIG.retreatSpeed * speedMultiplier,
      RANGED_CONFIG.maxRetreatSpeed,
    );

    this.attackIntervalMs = attackIntervalMs;

    // prevents firing immediately upon spawn
    this.lastShotAt = scene.time.now;

    const diameter = RANGED_CONFIG.radius * 2;

    this.hitbox = scene.add.rectangle(x, y, diameter, diameter, 0x000000);

    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error(
        "The ranged attacker doesn't have an Arcade Physics body.",
      );
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(RANGED_CONFIG.radius);
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

    const deltaX = targetX - this.hitbox.x;
    const deltaY = targetY - this.hitbox.y;

    this.ship.setPosition(this.hitbox.x, this.hitbox.y);
    this.ship.setRotation((time / 1000) * RANGED_CONFIG.spinRate);

    const evasion = this.resolveEvasion();

    if (evasion !== null) {
      this.body.setVelocity(
        evasion.x * RANGED_CONFIG.evasionSpeed,
        evasion.y * RANGED_CONFIG.evasionSpeed,
      );

      return;
    }

    const standoff = resolveStandoffVector(
      this.hitbox.x,
      this.hitbox.y,
      targetX,
      targetY,
      RANGED_CONFIG.preferredDistance,
      RANGED_CONFIG.distanceTolerance,
    );

    const closing =
      Math.hypot(deltaX, deltaY) > RANGED_CONFIG.preferredDistance;

    const speed = closing
      ? this.approachSpeed
      : this.retreatSpeed;

    this.body.setVelocity(standoff.x * speed, standoff.y * speed);

    this.tryFire(time, targetX, targetY);
  }

  private resolveEvasion(): Vector2 | null {
    for (const projectile of this.playerProjectiles.getActiveProjectiles()) {
      const body = projectile.getBody();

      const evasion = resolveEvasion(
        this.hitbox.x,
        this.hitbox.y,
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
    if (time - this.lastShotAt < this.attackIntervalMs) {
      return;
    }

    const deltaX = targetX - this.hitbox.x;
    const deltaY = targetY - this.hitbox.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance === 0 || distance > ENEMY_WEAPON_CONFIG.maxFiringRange) {
      return;
    }

    const directionX = deltaX / distance;
    const directionY = deltaY / distance;

    this.lastShotAt = time;

    this.enemyProjectiles.spawn({
      originX: this.hitbox.x + directionX * ENEMY_WEAPON_CONFIG.muzzleOffset,
      originY: this.hitbox.y + directionY * ENEMY_WEAPON_CONFIG.muzzleOffset,
      velocityX: directionX * ENEMY_WEAPON_CONFIG.projectileSpeed,
      velocityY: directionY * ENEMY_WEAPON_CONFIG.projectileSpeed,
      angle: Math.atan2(deltaY, deltaX),
      firedAt: time,
    });
  }

  private drawHull(): void {
    this.ship.clear();

    drawNeonShape(
      this.ship,
      RANGED_CONFIG.hullOutline,
      PALETTE.ranged,
      RANGED_CONFIG.hullLineWidth,
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
    return PALETTE.ranged;
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
      this.ship.setAlpha(0.4 + 0.6 * (this.health / RANGED_CONFIG.maxHealth));

      return false;
    }

    this.destroyObjects();

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

    this.destroyObjects();
  }

  private destroyObjects(): void {
    this.alive = false;
    this.body.enable = false;
    this.ship.destroy();
    this.hitbox.destroy();
  }
}