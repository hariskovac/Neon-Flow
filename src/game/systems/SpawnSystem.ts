import Phaser from "phaser";

import { SPAWN_CONFIG } from "../gameplayConfig";
import type { ArenaBounds, EnemyType, Vector2 } from "../../types/game";
import type { Enemy } from "../entities/enemies/Enemy";
import { Chaser } from "../entities/enemies/Chaser";
import { Ranged } from "../entities/enemies/Ranged";
import { Dasher } from "../entities/enemies/Dasher";
import type { ProjectileSystem } from "./ProjectileSystem";

export class SpawnSystem {
  private readonly scene: Phaser.Scene;
  private readonly bounds: ArenaBounds;
  private readonly enemies: Enemy[] = [];
  private readonly playerProjectiles: ProjectileSystem;
  private readonly enemyProjectiles: ProjectileSystem;

  private intervalMs = SPAWN_CONFIG.initialIntervalMs;
  private nextSpawnAt: number;

  public constructor(
    scene: Phaser.Scene,
    bounds: ArenaBounds,
    playerProjectiles: ProjectileSystem,
    enemyProjectiles: ProjectileSystem,
  ) {
    this.scene = scene;
    this.bounds = bounds;
    this.playerProjectiles = playerProjectiles;
    this.enemyProjectiles = enemyProjectiles;

    this.nextSpawnAt = scene.time.now + this.intervalMs;
  }

  public update(time: number, playerX: number, playerY: number): void {
    this.removeDeadEnemies();

    if (time < this.nextSpawnAt) {
      return;
    }

    this.nextSpawnAt = time + this.intervalMs;

    if (this.enemies.length >= SPAWN_CONFIG.maxActiveEnemies) {
      return;
    }

    const point = this.resolveSpawnPoint(playerX, playerY);

    this.enemies.push(
      this.createEnemy(this.chooseEnemyType(), point.x, point.y),
    );
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  private removeDeadEnemies(): void {
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      if (!this.enemies[index].isAlive()) {
        this.enemies.splice(index, 1);
      }
    }
  }

  private resolveSpawnPoint(playerX: number, playerY: number): Vector2 {
    let candidate = this.randomArenaPoint();

    for (
      let attempt = 1;
      attempt < SPAWN_CONFIG.maxPlacementAttempts;
      attempt += 1
    ) {
      const distance = Math.hypot(
        candidate.x - playerX,
        candidate.y - playerY,
      );

      if (distance >= SPAWN_CONFIG.minDistanceFromPlayer) {
        return candidate;
      }

      candidate = this.randomArenaPoint();
    }

    return candidate;
  }

  private randomArenaPoint(): Vector2 {
    const inset = SPAWN_CONFIG.spawnInset;

    return {
      x: Phaser.Math.Between(
        this.bounds.x + inset,
        this.bounds.x + this.bounds.width - inset,
      ),
      y: Phaser.Math.Between(
        this.bounds.y + inset,
        this.bounds.y + this.bounds.height - inset,
      ),
    };
  }

  private chooseEnemyType(): EnemyType {
    const weights = SPAWN_CONFIG.weights;
    const total = weights.chaser + weights.ranged + weights.dasher;
    const roll = Phaser.Math.Between(1, total);

    if (roll <= weights.chaser) {
      return "chaser";
    }

    if (roll <= weights.chaser + weights.ranged) {
      return "ranged";
    }

    return "dasher";
  }

  private createEnemy(type: EnemyType, x: number, y: number): Enemy {
    if (type === "chaser") {
      return new Chaser(this.scene, x, y);
    }

    if (type === "ranged") {
      return new Ranged(
        this.scene,
        x,
        y,
        this.playerProjectiles,
        this.enemyProjectiles,
      );
    }

    return new Dasher(this.scene, x, y);
  }
}