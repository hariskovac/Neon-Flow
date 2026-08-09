import type { Chaser } from "../entities/enemies/Chaser";
import { CHASER_CONFIG, WEAPON_CONFIG, PLAYER_CONFIG } from "../gameplayConfig";
import type { ProjectileSystem } from "./ProjectileSystem";
import type { Player } from "../entities/Player";

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

export interface CollisionResult {
  readonly chasersKilled: number;
  readonly playerHit: boolean;
}

export class CollisionSystem {
  private readonly projectiles: ProjectileSystem;
  private readonly chasers: Chaser[];
  private readonly player: Player;

  public constructor(projectiles: ProjectileSystem, chasers: Chaser[], player: Player) {
    this.projectiles = projectiles;
    this.chasers = chasers;
    this.player = player;
  }


  public update(): CollisionResult {
    let chasersKilled = 0;
    let playerHit = false;

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

    for (const chaser of this.chasers) {
      if (!chaser.isAlive()) {
        continue;
      }

      const contact = circlesOverlap(
        this.player.getX(),
        this.player.getY(),
        PLAYER_CONFIG.size / 2,
        chaser.getX(),
        chaser.getY(),
        CHASER_CONFIG.radius,
      );

      if (contact) {
        playerHit = true;

        break;
      }
    }

    return  { chasersKilled, playerHit };
  }
}