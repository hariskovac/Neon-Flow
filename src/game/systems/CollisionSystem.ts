import type { ProjectileSystem } from "./ProjectileSystem";
import type { Player } from "../entities/Player";
import type { EnemyType, PowerUpType } from "../../types/game";
import type { Enemy } from "../entities/enemies/Enemy";
import type { PowerUpSystem } from "./PowerUpSystem";
import { audio } from "../../audio/AudioSystem";

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

export interface EnemyKill {
  readonly type: EnemyType;
  readonly x: number;
  readonly y: number;
  readonly color: number;
}

export interface CollisionResult {
  readonly killed: EnemyKill[];
  readonly shotsHit: number;
  readonly playerHit: boolean;
  readonly collected: PowerUpType[]; 
}

export class CollisionSystem {
  private readonly playerProjectiles: ProjectileSystem;
  private readonly enemyProjectiles: ProjectileSystem;
  private readonly enemies: Enemy[];
  private readonly player: Player;
  private readonly powerUps: PowerUpSystem;

  public constructor(
    playerProjectiles: ProjectileSystem, 
    enemyProjectiles: ProjectileSystem, 
    enemies: Enemy[],
    player: Player,
    powerUps: PowerUpSystem, 
  ) {
    this.playerProjectiles = playerProjectiles;
    this.enemyProjectiles = enemyProjectiles;
    this.enemies = enemies;
    this.player = player;
    this.powerUps = powerUps; 
  }

  public update(): CollisionResult {
    const killed: EnemyKill[] = [];
    const collected: PowerUpType[] = [];
    let playerHit = false;
    let shotsHit = 0;

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
          audio.playSfx("enemyHit");
          projectile.deactivate();
          shotsHit += 1;

          const x = enemy.getX();
          const y = enemy.getY();
          const color = enemy.getColor();

          if (enemy.takeHit()) {
            killed.push({ type: enemy.getType(), x, y, color });
          }

          break;
        }
      }
    }

    const playerRadius = this.player.getRadius();

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

    for (const drop of this.powerUps.getDrops()) {
      if (!drop.isActive()) {
        continue;
      }

      const touched = circlesOverlap(
        this.player.getX(),
        this.player.getY(),
        playerRadius,
        drop.getX(),
        drop.getY(),
        drop.getRadius(),
      );

      if (touched) {
        collected.push(drop.getType());
        drop.despawn();
      }
    }

    return { killed, shotsHit, playerHit, collected };
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

    for (const projectile of this.enemyProjectiles.getActiveProjectiles()) {
      projectile.deactivate();
    }
  }
}