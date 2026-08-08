import Phaser from "phaser";

import type { ArenaBounds } from "../../types/game";
import { Projectile } from "../entities/Projectile";
import { ARENA, WEAPON_CONFIG } from "../gameplayConfig";
import type { ShotRequest } from "./WeaponSystem";

export class ProjectileSystem {
  private readonly pool: Projectile[] = [];
  private readonly bounds: ArenaBounds;

  public constructor(scene: Phaser.Scene, bounds: ArenaBounds = ARENA) {
    this.bounds = bounds;

    for (let index = 0; index < WEAPON_CONFIG.maxActiveProjectiles; index += 1) {
      this.pool.push(new Projectile(scene));
    }
  }

  public spawn(request: ShotRequest): Projectile {
    const projectile = this.claimProjectile();

    projectile.fire(request);

    return projectile;
  }

  // Deactivates expired and out-of-bounds projectiles
  public update(now: number): void {
    for (const projectile of this.pool) {
      if (!projectile.isActive()) {
        continue;
      }

      const expired =
        projectile.getAgeMs(now) >= WEAPON_CONFIG.projectileLifetimeMs;

      if (expired || this.isOutsideArena(projectile.getX(), projectile.getY())) {
        projectile.deactivate();
      }
    }
  }

  public getActiveProjectiles(): Projectile[] {
    return this.pool.filter((projectile) => projectile.isActive());
  }

  public getActiveCount(): number {
    let count = 0;

    for (const projectile of this.pool) {
      if (projectile.isActive()) {
        count += 1;
      }
    }

    return count;
  }

  // Clears all projectiles
  public reset(): void {
    for (const projectile of this.pool) {
      projectile.deactivate();
    }
  }

  public destroy(): void {
    for (const projectile of this.pool) {
      projectile.destroy();
    }

    this.pool.length = 0;
  }

  // Returns inactive projectile or destroys oldest if needed
  private claimProjectile(): Projectile {
    let oldest: Projectile | null = null;

    for (const projectile of this.pool) {
      if (!projectile.isActive()) {
        return projectile;
      }

      if (oldest === null || projectile.getFiredAt() < oldest.getFiredAt()) {
        oldest = projectile;
      }
    }

    if (oldest === null) {
      throw new Error("The projectile pool has not been initialised.");
    }

    oldest.deactivate();

    return oldest;
  }

  private isOutsideArena(x: number, y: number): boolean {
    const margin = WEAPON_CONFIG.projectileRadius * 2;

    return (
      x < this.bounds.x - margin ||
      x > this.bounds.x + this.bounds.width + margin ||
      y < this.bounds.y - margin ||
      y > this.bounds.y + this.bounds.height + margin
    );
  }
}