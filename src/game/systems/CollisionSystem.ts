import type { Chaser } from "../entities/enemies/Chaser";
import { CHASER_CONFIG, WEAPON_CONFIG } from "../gameplayConfig";
import type { ProjectileSystem } from "./ProjectileSystem";

export function circlesOverlap(
  aX: number,
  aY: number,
  aRadius: number,
  bX: number,
  bY: number,
  bRadius: number,
): boolean {
  const deltaX = bX - aX;
  const deltaY = bY - aY;
  const combinedRadius = aRadius + bRadius;

  return deltaX * deltaX + deltaY * deltaY <= combinedRadius * combinedRadius;
}

export class CollisionSystem {
  private readonly projectiles: ProjectileSystem;
  private readonly chasers: Chaser[];

  public constructor(projectiles: ProjectileSystem, chasers: Chaser[]) {
    this.projectiles = projectiles;
    this.chasers = chasers;
  }

  public update(): number {
    let chasersKilled = 0;

    for (const projectile of this.projectiles.getActiveProjectiles()) {
      for (const chaser of this.chasers) {
        if (!chaser.isAlive()) {
          continue;
        }

        const hit = circlesOverlap(
          projectile.getX(),
          projectile.getY(),
          WEAPON_CONFIG.projectileRadius,
          chaser.getX(),
          chaser.getY(),
          CHASER_CONFIG.radius,
        );

        if (hit) {
          projectile.deactivate();
          chaser.kill();
          chasersKilled += 1;

          break;
        }
      }
    }

    return chasersKilled;
  }
}