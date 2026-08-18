import Phaser from "phaser";

import { BURST_CONFIG, PLAYER_BURST_CONFIG } from "../gameplayConfig";
import { DeathBurst } from "../render/DeathBurst";

export class EffectSystem {
  private readonly pool: DeathBurst[] = [];

  public constructor(scene: Phaser.Scene) {
    for (let index = 0; index < BURST_CONFIG.poolSize; index += 1) {
      this.pool.push(new DeathBurst(scene));
    }
  }

  public update(now: number): void {
    for (const burst of this.pool) {
      burst.update(now);
    }
  }

  public burst(x: number, y: number, color: number, now: number): void {
    const burst = this.claim();

    burst.start(x, y, color, now);
  }

  public playerBurst(x: number, y: number, color: number, now: number): void {
    this.claim().start(x, y, color, now, PLAYER_BURST_CONFIG, true);

    this.claim().start(x, y, color, now, {
      particleCount: PLAYER_BURST_CONFIG.innerParticleCount,
      travel: PLAYER_BURST_CONFIG.innerTravel,
      segmentLength: PLAYER_BURST_CONFIG.segmentLength,
      lineWidth: PLAYER_BURST_CONFIG.lineWidth,
      durationMs: PLAYER_BURST_CONFIG.innerDurationMs,
    });
  }

  public reset(): void {
    for (const burst of this.pool) {
      burst.stop();
    }
  }

  public claim(): DeathBurst {
    for (const burst of this.pool) {
      if (!burst.isActive()) {
        return burst;
      }
    }

    const oldest = this.pool[0];

    oldest.stop();

    return oldest;
  }
}