import Phaser from "phaser";

import { BURST_CONFIG } from "../gameplayConfig";
import { DeathBurst } from "../render/DeathBurst";

export class EffectSystem {
  private readonly pool: DeathBurst[] = [];

  public constructor(scene: Phaser.Scene) {
    for (let index = 0; index < BURST_CONFIG.poolSize; index += 1) {
      this.pool.push(new DeathBurst(scene));
    }
  }

  public burst(x: number, y: number, color: number, now: number): void {
    const burst = this.claim();

    burst.start(x, y, color, now);
  }

  public update(now: number): void {
    for (const burst of this.pool) {
      burst.update(now);
    }
  }

  public reset(): void {
    for (const burst of this.pool) {
      burst.stop();
    }
  }

  private claim(): DeathBurst {
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