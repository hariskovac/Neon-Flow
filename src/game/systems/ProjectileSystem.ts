import Phaser from "phaser";

import type { ArenaBounds } from "../../types/game";
import { Projectile } from "../entities/Projectile";
import type { ShotRequest } from "./WeaponSystem";

export interface ProjectilePoolConfig {
  readonly projectileRadius: number;
  readonly projectileLifetimeMs: number;
  readonly maxActiveProjectiles: number;
  readonly color: number;
}

export class ProjectileSystem {
  private readonly pool: Projectile[] = [];
  private readonly bounds: ArenaBounds;
  private readonly config: ProjectilePoolConfig;

  public constructor(scene: Phaser.Scene, bounds: ArenaBounds, config: ProjectilePoolConfig) {
    this.bounds = bounds;
    this.config = config;

    for (let index = 0; index < config.maxActiveProjectiles; index += 1) {
      this.pool.push(new Projectile(scene, config.projectileRadius, config.color));
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
        projectile.getAgeMs(now) >= this.config.projectileLifetimeMs;

      if (expired || this.isOutsideArena(projectile.getX(), projectile.getY())) {
        projectile.deactivate();
      }
    }
  }

  public getActiveProjectiles(): Projectile[] {
    return this.pool.filter((projectile) => projectile.isActive());
  }

  public getProjectileRadius(): number {
    return this.config.projectileRadius;
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
      throw new Error("The projectile pool hasn't been initialised");
    }

    oldest.deactivate();

    return oldest;
  }

  private isOutsideArena(x: number, y: number): boolean {
    const margin = this.config.projectileRadius * 2;

    return (
      x < this.bounds.x - margin ||
      x > this.bounds.x + this.bounds.width + margin ||
      y < this.bounds.y - margin ||
      y > this.bounds.y + this.bounds.height + margin
    );
  }
}