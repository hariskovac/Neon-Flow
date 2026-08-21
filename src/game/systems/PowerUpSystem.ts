import Phaser from "phaser";

import type { PowerUpType } from "../../types/game";
import { PowerUp } from "../entities/PowerUp";
import { POWERUP_CONFIG } from "../gameplayConfig";

const POWERUP_TYPES: PowerUpType[] = ["shield", "speed", "fireRate"];

export class PowerUpSystem {
  private readonly scene: Phaser.Scene;
  private readonly drops: PowerUp[] = [];

  private dropChance: number;
  private spawnedThisWave = 0;

  public constructor(scene: Phaser.Scene, dropChance: number) {
    this.scene = scene;
    this.dropChance = dropChance;
  }

  public setDropChance(dropChance: number): void {
    this.dropChance = dropChance;
  }

  // rolls for a drop and returns true when one is dropped
  public rollForDrop(x: number, y: number, now: number): boolean {
    if (Phaser.Math.FloatBetween(0, 1) >= this.dropChance) {
      return false;
    }

    const available = POWERUP_TYPES.filter(
      (type) => !this.hasActiveType(type),
    );

    if (available.length === 0) {
      return false;
    }

    const type = available[Phaser.Math.Between(0, available.length - 1)];

    this.drops.push(
      new PowerUp(this.scene, x, y, type, now + POWERUP_CONFIG.lifetimeMs),
    );

    this.spawnedThisWave += 1;

    return true;
  }

  private hasActiveType(type: PowerUpType): boolean {
    return this.drops.some(
      (drop) => drop.isActive() && drop.getType() === type,
    );
  }

  public place(x: number, y: number, type: PowerUpType, now: number): void {
    this.drops.push(new PowerUp(this.scene, x, y, type, now));
  }

  public placePermanent(x: number, y: number, type: PowerUpType): void {
    this.drops.push(
      new PowerUp(this.scene, x, y, type, Number.POSITIVE_INFINITY),
    );
  }

  public update(time: number): void {
    for (let index = this.drops.length - 1; index >= 0; index -= 1) {
      this.drops[index].update(time);

      if (!this.drops[index].isActive()) {
        this.drops.splice(index, 1);
      }
    }
  }

  public getDrops(): PowerUp[] {
    return this.drops;
  }

  public getSpawnedThisWave(): number {
    return this.spawnedThisWave;
  }

  public resetWaveCounters(): void {
    this.spawnedThisWave = 0;
  }
}