import Phaser from "phaser";

import type { ProjectileSystem } from "../../systems/ProjectileSystem";
import { DEPTH, PALETTE, DODGER_CONFIG } from "../../gameplayConfig";
import {
  resolveEvasion,
} from "../../systems/DodgerMovement";
import type { Vector2, EnemyType } from "../../../types/game";
import type { Enemy } from "./Enemy";
import { drawNeonShape } from "../../render/Neon";
import { setPursuitVector } from "../../systems/ChaserMovement";

export class Dodger implements Enemy {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly ship: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly playerProjectiles: ProjectileSystem;
  private readonly pursuitSpeed: number;

  private alive = true;
  private health = DODGER_CONFIG.maxHealth;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    playerProjectiles: ProjectileSystem,
    speedMultiplier: number,
  ) {
    this.playerProjectiles = playerProjectiles;
    
    this.pursuitSpeed = Math.min(
      DODGER_CONFIG.pursuitSpeed * speedMultiplier,
      DODGER_CONFIG.maxPursuitSpeed,
    );  

    const diameter = DODGER_CONFIG.radius * 2;

    this.hitbox = scene.add.rectangle(x, y, diameter, diameter, 0x000000);

    scene.physics.add.existing(this.hitbox);

    const body = this.hitbox.body;

    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error(
        "The dodger doesn't have an Arcade Physics body.",
      );
    }

    this.body = body;
    this.body.setAllowGravity(false);
    this.body.setCircle(DODGER_CONFIG.radius);
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

    this.ship.setPosition(this.hitbox.x, this.hitbox.y);
    this.ship.setRotation((time / 1000) * DODGER_CONFIG.spinRate);

    const evasion = this.resolveEvasion();

    if (evasion !== null) {
      this.body.setVelocity(
        evasion.x * DODGER_CONFIG.evasionSpeed,
        evasion.y * DODGER_CONFIG.evasionSpeed,
      );

      return;
    }

    const direction = setPursuitVector(
      this.hitbox.x,
      this.hitbox.y,
      targetX,
      targetY,
    );

    this.body.setVelocity(
      direction.x * this.pursuitSpeed,
      direction.y * this.pursuitSpeed,
    );

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
        DODGER_CONFIG.evasionRadius,
        DODGER_CONFIG.evasionLookaheadMs,
      );

      if (evasion !== null) {
        return evasion;
      }
    }

    return null;
  }

  private drawHull(): void {
    this.ship.clear();

    drawNeonShape(
      this.ship,
      DODGER_CONFIG.hullOutline,
      PALETTE.dodger,
      DODGER_CONFIG.hullLineWidth,
    );
  }

  public allowsDrop(): boolean {
    return true;
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
    return PALETTE.dodger;
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
      this.ship.setAlpha(0.4 + 0.6 * (this.health / DODGER_CONFIG.maxHealth));

      return false;
    }

    this.destroyObjects();

    return true;
  }

  public getRadius(): number {
    return DODGER_CONFIG.radius;
  }

  public getType(): EnemyType {
    return "dodger";
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