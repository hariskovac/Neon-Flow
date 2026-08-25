import Phaser from "phaser";

import { 
  SPAWN_CONFIG,
  PALETTE,
  CHASER_CONFIG,
  DODGER_CONFIG,
  DASHER_CONFIG,
  SPLITTER_CONFIG,
  WINDER_CONFIG,
  SHARD_CONFIG,
  SPAWN_EFFECT_CONFIG,
} from "../gameplayConfig";
import type { ArenaBounds, EnemyType, Vector2 } from "../../types/game";
import type { Enemy } from "../entities/enemies/Enemy";
import { Chaser } from "../entities/enemies/Chaser";
import { Dodger } from "../entities/enemies/Dodger";
import { Dasher } from "../entities/enemies/Dasher";
import type { ProjectileSystem } from "./ProjectileSystem";
import type { ActuatorValues } from "../../dda/difficultyConfig.ts";
import { resolveActuators } from "../../dda/difficultyConfig.ts";
import { audio } from "../../audio/AudioSystem";
import { SpawnEffect } from "../render/SpawnEffect";
import { Shard } from "../entities/enemies/Shard";
import { Splitter } from "../entities/enemies/Splitter";
import { Winder } from "../entities/enemies/Winder";
import {
  canSurround,
  clampToArena,
  resolveCornerAnchors,
  resolveIntensityValue,
  resolveSurroundPoints,
} from "./spawnPatterns";
import { PersistenceTracker } from "./PersistenceTracker";

interface QueuedSpawn {
  readonly type: EnemyType; 
  readonly x: number;
  readonly y: number;
  readonly startAt: number;
  readonly isGroupMember: boolean;
  effect: SpawnEffect | null;
  readyAt: number | null;
}

export const SPAWN_APPEARANCE: Record < EnemyType, { outline: readonly Vector2[]; color: number } > = {
  chaser: { outline: CHASER_CONFIG.hullOutline, color: PALETTE.chaser },
  dodger: { outline: DODGER_CONFIG.hullOutline, color: PALETTE.dodger },
  dasher: { outline: DASHER_CONFIG.hullOutline, color: PALETTE.dasher },
  splitter: { outline: SPLITTER_CONFIG.hullOutline, color: PALETTE.splitter },
  shard: { outline: SHARD_CONFIG.hullOutline, color: PALETTE.shard },
  winder: { outline: WINDER_CONFIG.headOutline, color: PALETTE.winderHead },
};

export class SpawnSystem {
  private readonly scene: Phaser.Scene;
  private readonly bounds: ArenaBounds;
  private readonly enemies: Enemy[] = [];
  private readonly queue: QueuedSpawn[] = [];
  private readonly effectPool: SpawnEffect[] = [];
  private readonly playerProjectiles: ProjectileSystem;
  private readonly persistence = new PersistenceTracker();

  private actuators: ActuatorValues = resolveActuators(1);
  private nextSpawnAt: number;
  private spawningEnabled = true;
  private spawnedThisWave = 0;
  private groupAvailableAt = 0;

  public constructor(
    scene: Phaser.Scene,
    bounds: ArenaBounds,
    playerProjectiles: ProjectileSystem,
    startingLevel: number,
  ) {
    this.scene = scene;
    this.bounds = bounds;
    this.playerProjectiles = playerProjectiles;
    this.actuators = resolveActuators(startingLevel);

    for (let index = 0; index < 12; index += 1) {
      this.effectPool.push(new SpawnEffect(scene));
    }

    this.nextSpawnAt = scene.time.now + this.actuators.spawnIntervalMs;
  }

  public update(time: number, playerX: number, playerY: number): void {
    this.removeDeadEnemies();
    this.processQueue(time, playerX, playerY);

    if (!this.spawningEnabled) {
      return;
    }

    if (time < this.nextSpawnAt) {
      return;
    }

    this.nextSpawnAt = time + this.actuators.spawnIntervalMs;

    this.planSpawnEvent(time, playerX, playerY);
  }

  private planSpawnEvent(
    time: number,
    playerX: number,
    playerY: number,
  ): void {
    const intensity = this.actuators.spawnIntensity;

    const groupsAllowed = time >= this.groupAvailableAt;

    const surroundChance = groupsAllowed
      ? resolveIntensityValue(
          SPAWN_CONFIG.intensity.surroundChance,
          intensity,
        )
      : 0;

    const swarmChance = groupsAllowed
      ? resolveIntensityValue(SPAWN_CONFIG.intensity.swarmChance, intensity)
      : 0;

    const roll = Phaser.Math.FloatBetween(0, 1);

    if (roll < surroundChance && canSurround(this.bounds, playerX, playerY)) {
      this.planSurround(time, playerX, playerY, intensity);
      this.startGroupCooldown(time, intensity);

      return;
    }

    if (roll < surroundChance + swarmChance) {
      this.planSwarms(time, playerX, playerY, intensity);
      this.startGroupCooldown(time, intensity);

      return;
    }

    const point = this.resolveSpawnPoint(playerX, playerY);

    this.enqueue(this.chooseEnemyType(), point.x, point.y, time, false);
  }

  private startGroupCooldown(time: number, intensity: number): void {
    this.groupAvailableAt = time + resolveIntensityValue(SPAWN_CONFIG.groupCooldownMs, intensity);
  }

  private planSwarms(
    time: number,
    playerX: number,
    playerY: number,
    intensity: number,
  ): void {
    const swarmCount = Math.round(
      resolveIntensityValue(SPAWN_CONFIG.intensity.swarmCount, intensity),
    );

    const swarmSize = Math.round(
      resolveIntensityValue(SPAWN_CONFIG.intensity.swarmSize, intensity),
    );

    const sharedType = this.chooseEnemyType();
    const useSharedType =
      Phaser.Math.FloatBetween(0, 1) < SPAWN_CONFIG.sameTypeChance;

    const anchors = this.resolveSwarmAnchors(swarmCount, playerX, playerY);

    for (let swarm = 0; swarm < swarmCount; swarm += 1) {
      const type = useSharedType ? sharedType : this.chooseEnemyType();
      const anchor = anchors[swarm];

      for (let member = 0; member < swarmSize; member += 1) {
        const scattered = clampToArena(this.bounds, {
          x: anchor.x + Phaser.Math.FloatBetween(-1, 1) * SPAWN_CONFIG.swarmScatter,
          y: anchor.y + Phaser.Math.FloatBetween(-1, 1) * SPAWN_CONFIG.swarmScatter,
        });

        this.enqueue(
          type,
          scattered.x,
          scattered.y,
          time + swarm * SPAWN_CONFIG.swarmGroupDelayMs + member * SPAWN_CONFIG.swarmStaggerMs,
          true,
        );
      }
    }
  }

  private planSurround(
    time: number,
    playerX: number,
    playerY: number,
    intensity: number,
  ): void {
    const count = Math.round(
      resolveIntensityValue(SPAWN_CONFIG.intensity.surroundSize, intensity),
    );

    const type = this.chooseEnemyType();

    const points = resolveSurroundPoints(
      playerX,
      playerY,
      SPAWN_CONFIG.surroundRadius,
      count,
      Phaser.Math.FloatBetween(0, Math.PI * 2),
    );

    points.forEach((point, index) => {
      const clamped = clampToArena(this.bounds, point);

      this.enqueue(
        type,
        clamped.x,
        clamped.y,
        time + index * SPAWN_CONFIG.swarmStaggerMs,
        true,
      );
    });
  }

  private resolveSwarmAnchors(
    count: number,
    playerX: number,
    playerY: number,
  ): Vector2[] {
    const ranked = resolveCornerAnchors(this.bounds).sort((a, b) => {
      const distanceA = Math.hypot(a.x - playerX, a.y - playerY);
      const distanceB = Math.hypot(b.x - playerX, b.y - playerY);

      return distanceB - distanceA;
    });

    const anchors: Vector2[] = [];

    for (let index = 0; index < count; index += 1) {
      const useCorner =
        index < ranked.length &&
        Phaser.Math.FloatBetween(0, 1) < SPAWN_CONFIG.cornerChance;

      anchors.push(
        useCorner ? ranked[index] : this.resolveSpawnPoint(playerX, playerY),
      );
    }

    return anchors;
  }

  private enqueue(
    type: EnemyType,
    x: number,
    y: number,
    startAt: number,
    isGroupMember: boolean,
  ): void {
    this.queue.push({ type, x, y, startAt, isGroupMember, effect: null, readyAt: null });
  }

  private processQueue(
    time: number,
    playerX: number,
    playerY: number,
  ): void {
    for (const effect of this.effectPool) {
      effect.update(time);
    }

    for (let index = this.queue.length - 1; index >= 0; index -= 1) {
      const spawn = this.queue[index];

      if (time < spawn.startAt) {
        continue;
      }

      if (spawn.effect === null) {
        if (this.enemies.length >= SPAWN_CONFIG.maxActiveEnemies) {
          this.queue.splice(index, 1);

          continue;
        }

        const appearance = SPAWN_APPEARANCE[spawn.type];

        spawn.effect = this.claimEffect();
        spawn.effect.start(
          spawn.x,
          spawn.y,
          appearance.outline,
          appearance.color,
          time,
        );

        spawn.readyAt = time + SPAWN_EFFECT_CONFIG.durationMs;

        audio.playSfx(spawn.isGroupMember ? "swarmSpawn" : "enemySpawn");

        continue;
      }

      if (spawn.readyAt === null || time < spawn.readyAt) {
        continue;
      }

      spawn.effect.stop();

      const enemy = this.createEnemy(
        spawn.type,
        spawn.x,
        spawn.y,
        playerX,
        playerY,
        time,
      );

      enemy.setPersistenceHandle(this.persistence.recordSpawn(time));

      this.enemies.push(enemy);
      this.spawnedThisWave += 1;

      this.queue.splice(index, 1);
    }
  }

  public spawnSplitChildren(x: number, y: number, time: number): void {
    if (this.enemies.length + 2 > SPAWN_CONFIG.maxActiveEnemies) {
      return;
    }

    const half = SPLITTER_CONFIG.shardSeparation / 2;
    const dropIndex = Phaser.Math.Between(0, 1);

    const first = new Shard(
      this.scene,
      x - half,
      y,
      this.actuators.enemySpeedMultiplier,
      dropIndex === 0,
    );

    const second = new Shard(
      this.scene,
      x + half,
      y,
      this.actuators.enemySpeedMultiplier,
      dropIndex === 1,
    );

    first.setPartner(second);
    second.setPartner(first);

    first.setPersistenceHandle(this.persistence.recordSpawn(time));
    second.setPersistenceHandle(this.persistence.recordSpawn(time));

    this.enemies.push(first, second);
    this.spawnedThisWave += 2;
  }

  private claimEffect(): SpawnEffect {
    for (const effect of this.effectPool) {
      if (!effect.isActive()) {
        return effect;
      }
    }

    const oldest = this.effectPool[0];

    oldest.stop();

    return oldest;
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public getPersistence(): PersistenceTracker {
    return this.persistence;
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
    const entries = Object.entries(SPAWN_CONFIG.weights) as Array <
      [EnemyType, number]
    >;

    let total = 0;

    for (const [, weight] of entries) {
      total += weight;
    }

    let roll = Phaser.Math.Between(1, total);

    for (const [type, weight] of entries) {
      roll -= weight;

      if (roll <= 0) {
        return type;
      }
    }

    return "chaser";
  }

  private createEnemy(
    type: EnemyType, 
    x: number, 
    y: number,
    playerX: number,
    playerY: number,
    now: number,
  ): Enemy {
    if (type === "chaser") {
      return new Chaser(this.scene, x, y, this.actuators.enemySpeedMultiplier);
    }

    if (type === "dodger") {
      return new Dodger(
        this.scene,
        x,
        y,
        this.playerProjectiles,
        this.actuators.enemySpeedMultiplier,
      );
    }

    if (type === "winder") {
      return new Winder(
        this.scene,
        x,
        y,
        this.actuators.enemySpeedMultiplier,
        Math.atan2(playerY - y, playerX - x),
      );
    }

    if (type === "splitter") {
      return new Splitter(this.scene, x, y, this.actuators.enemySpeedMultiplier);
    }

    return new Dasher(this.scene, x, y, this.actuators.enemySpeedMultiplier, now);
  }

  public setSpawningEnabled(enabled: boolean): void {
    this.spawningEnabled = enabled;
  }

  public clearAll(): void {
    for (const enemy of this.enemies) {
      enemy.despawn();
    }

    this.enemies.length = 0;

    for (const spawn of this.queue) {
      spawn.effect?.stop();
    }

    this.queue.length = 0;
  }

  public clearAllWithEffects(time: number): Array<{ x: number; y: number; color: number }> {
    const cleared = this.enemies
      .filter((enemy) => enemy.isAlive())
      .map((enemy) => {
        this.persistence.recordClearedByDeath(
          enemy.getPersistenceHandle(),
          time,
        );

        return {
          x: enemy.getX(),
          y: enemy.getY(),
          color: enemy.getColor(),
        };
      });

    this.clearAll();

    return cleared;
  }

  public getActiveCount(): number {
    return this.enemies.length;
  }

  public resetSpawnTimer(time: number): void {
    this.nextSpawnAt = time + this.actuators.spawnIntervalMs;
  }

  public getSpawnedThisWave(): number {
    return this.spawnedThisWave;
  }

  public resetWaveCounters(): void {
    this.spawnedThisWave = 0;
    this.groupAvailableAt = 0;
    this.persistence.reset()
  }

  // sets actuator values for new difficulty
  public setActuators(actuators: ActuatorValues): void {
    this.actuators = actuators;
  }
}