import type { PowerUpType } from "../../types/game";
import { POWERUP_CONFIG } from "../gameplayConfig";

export class PowerUpEffects {
  private shieldHeld = false;
  private speedUntil = 0;
  private fireRateUntil = 0;

  public collect(type: PowerUpType, now: number): void {
    if (type === "shield") {
      this.shieldHeld = true;

      return;
    }

    if (type === "speed") {
      this.speedUntil = now + POWERUP_CONFIG.speedDurationMs;

      return;
    }

    this.fireRateUntil = now + POWERUP_CONFIG.fireRateDurationMs;
  }

  public hasShield(): boolean {
    return this.shieldHeld;
  }

  public consumeShield(): boolean {
    if (!this.shieldHeld) {
      return false;
    }

    this.shieldHeld = false;

    return true;
  }

  public isSpeedActive(now: number): boolean {
    return now < this.speedUntil;
  }

  public isFireRateActive(now: number): boolean {
    return now < this.fireRateUntil;
  }
}