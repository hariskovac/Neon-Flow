import { PLAYER_CONFIG } from "../gameplayConfig";
import type { ProjectileSystem } from "./ProjectileSystem";
import type { Player } from "../entities/Player";
import type { EnemyType } from "../../types/game";
import type { Enemy } from "../entities/enemies/Enemy";

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
  readonly killed: EnemyType[];
  readonly playerHit: boolean;
}

export class CollisionSystem {
  private readonly playerProjectiles: ProjectileSystem;
  private readonly enemyProjectiles: ProjectileSystem;
  private readonly enemies: Enemy[];
  private readonly player: Player;

  public constructor(playerProjectiles: ProjectileSystem, enemyProjectiles: ProjectileSystem, enemies: Enemy[],player: Player) {
    this.playerProjectiles = playerProjectiles;
    this.enemyProjectiles = enemyProjectiles;
    this.enemies = enemies;
    this.player = player;
  }

  public update(): CollisionResult {
    const killed: EnemyType[] = [];
    let playerHit = false;

    const projectileRadius = this.playerProjectiles.getProjectileRadius();

    for (const projectile of this.playerProjectiles.getActiveProjectiles()) {
      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) {
          continue;
        }

        const hit = circlesOverlap(
          projectile.getX(),
          projectile.getY(),
          projectileRadius,
          enemy.getX(),
          enemy.getY(),
          enemy.getRadius(),
        );

        if (hit) {
          projectile.deactivate();

          if (enemy.takeHit()) {
            killed.push(enemy.getType());
          }

          break;
        }
      }
    }

    const playerRadius = PLAYER_CONFIG.size / 2;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) {
        continue;
      }

      const contact = circlesOverlap(
        this.player.getX(),
        this.player.getY(),
        playerRadius,
        enemy.getX(),
        enemy.getY(),
        enemy.getRadius(),
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
    return { killed, playerHit };
  }


  public clearRespawnArea(x: number, y: number, radius: number): void {
    const liveEnemies = this.enemies.filter((enemy) => enemy.isAlive());
    const angleStep = (Math.PI * 2) / Math.max(liveEnemies.length, 1);

    liveEnemies.forEach((enemy, index) => {
      const deltaX = enemy.getX() - x;
      const deltaY = enemy.getY() - y;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance >= radius) {
        return;
      }

      // fan out chasers around spawn point
      const bearing = distance === 0 ? 
        -Math.PI / 2 : Math.atan2(deltaY, deltaX);

      const angle = bearing + index * angleStep;

      enemy.setPosition(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
      );
    });
  }
}