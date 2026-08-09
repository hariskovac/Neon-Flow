import type { Chaser } from "../entities/enemies/Chaser";
import { CHASER_CONFIG, PLAYER_CONFIG, RANGED_CONFIG } from "../gameplayConfig";
import type { ProjectileSystem } from "./ProjectileSystem";
import type { Player } from "../entities/Player";
import type { Ranged } from "../entities/enemies/Ranged";

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
  readonly rangedKilled: number;
  readonly playerHit: boolean;
}

export class CollisionSystem {
  private readonly playerProjectiles: ProjectileSystem;
  private readonly enemyProjectiles: ProjectileSystem;
  private readonly chasers: Chaser[];
  private readonly player: Player;
  private readonly ranged: Ranged[];

  public constructor(playerProjectiles: ProjectileSystem, enemyProjectiles: ProjectileSystem, chasers: Chaser[], ranged: Ranged[], player: Player) {
    this.playerProjectiles = playerProjectiles;
    this.enemyProjectiles = enemyProjectiles;
    this.chasers = chasers;
    this.ranged = ranged;
    this.player = player;
  }


  public update(): CollisionResult {
    let chasersKilled = 0;
    let rangedKilled = 0;
    let playerHit = false;

    const projectileRadius = this.playerProjectiles.getProjectileRadius();

    for (const projectile of this.playerProjectiles.getActiveProjectiles()) {
      for (const chaser of this.chasers) {
        if (!chaser.isAlive()) {
          continue;
        }

        const hit = circlesOverlap(
          projectile.getX(),
          projectile.getY(),
          projectileRadius,
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

    for (const projectile of this.playerProjectiles.getActiveProjectiles()) {
      for (const attacker of this.ranged) {
        if (!attacker.isAlive()) {
          continue;
        }

        const hit = circlesOverlap(
          projectile.getX(),
          projectile.getY(),
          projectileRadius,
          attacker.getX(),
          attacker.getY(),
          RANGED_CONFIG.radius,
        );

        if (hit) {
          projectile.deactivate();
          attacker.kill();
          rangedKilled += 1;

          break;
        }
      }
    }

    const playerRadius = PLAYER_CONFIG.size / 2;

    for (const chaser of this.chasers) {
      if (!chaser.isAlive()) {
        continue;
      }

      const contact = circlesOverlap(
        this.player.getX(),
        this.player.getY(),
        playerRadius,
        chaser.getX(),
        chaser.getY(),
        CHASER_CONFIG.radius,
      );

      if (contact) {
        playerHit = true;

        break;
      }
    }

    for (const ranged of this.ranged) {
      if (!ranged.isAlive()) {
        continue;
      }

      const contact = circlesOverlap(
        this.player.getX(),
        this.player.getY(),
        playerRadius,
        ranged.getX(),
        ranged.getY(),
        RANGED_CONFIG.radius,
      );

      if (contact) {
        playerHit = true;

        break;
      }
    }

    for (const projectile of this.enemyProjectiles.getActiveProjectiles()) {
      const contact = circlesOverlap(
        this.player.getX(),
        this.player.getY(),
        playerRadius,
        projectile.getX(),
        projectile.getY(),
        this.enemyProjectiles.getProjectileRadius(),
      );

      if (contact) {
        projectile.deactivate();
        playerHit = true;

        break;
      }
    }

    return  { chasersKilled, rangedKilled, playerHit };
  }

  public clearRespawnArea(x: number, y: number, radius: number): void {
    const liveChasers = this.chasers.filter((chaser) => chaser.isAlive());
    const liveRanged = this.ranged.filter((ranged) => ranged.isAlive());
    const chaserStep = (Math.PI * 2) / Math.max(liveChasers.length, 1);
    const rangedStep = (Math.PI * 2) / Math.max(liveRanged.length, 1);

    liveChasers.forEach((chaser, index) => {
      const deltaX = chaser.getX() - x;
      const deltaY = chaser.getY() - y;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance >= radius) {
        return;
      }

      // fan out chasers around spawn point
      const bearing = distance === 0 ? 
        -Math.PI / 2 : Math.atan2(deltaY, deltaX);

      const angle = bearing + index * chaserStep;

      chaser.setPosition(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
      );
    });

    liveRanged.forEach((ranged, index) => {
      const deltaX = ranged.getX() - x;
      const deltaY = ranged.getY() - y;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance >= radius) {
        return;
      }

      // fan out ranged attackers around spawn point
      const bearing = distance === 0 ? 
        -Math.PI / 2 : Math.atan2(deltaY, deltaX);

      const angle = bearing + index * rangedStep;

      ranged.setPosition(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
      );
    });
  }
}